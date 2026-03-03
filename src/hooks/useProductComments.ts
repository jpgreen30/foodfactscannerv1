import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  user_id: string;
  product_barcode: string;
  product_name: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string;
  like_count: number;
  is_liked: boolean;
  replies: Comment[];
}

interface UseProductCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (content: string, parentId?: string | null) => Promise<boolean>;
  editComment: (commentId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  toggleLike: (commentId: string) => Promise<boolean>;
  refreshComments: () => Promise<void>;
  commentCount: number;
}

export function useProductComments(
  productBarcode: string,
  productName: string
): UseProductCommentsReturn {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!productBarcode) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch comments with author info
      const { data: commentsData, error: commentsError } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_barcode', productBarcode)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch like counts
      const commentIds = commentsData.map(c => c.id);
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds);

      const likeCounts = new Map<string, number>();
      likesData?.forEach(like => {
        likeCounts.set(like.comment_id, (likeCounts.get(like.comment_id) || 0) + 1);
      });

      // Fetch user's likes
      const userLikes = new Set<string>();
      if (user) {
        const { data: userLikesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);
        
        userLikesData?.forEach(like => userLikes.add(like.comment_id));
      }

      // Build comment tree
      const commentsWithDetails: Comment[] = commentsData.map(comment => {
        const profile = profileMap.get(comment.user_id);
        const authorName = profile?.display_name || 
          `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
          'Anonymous';

        return {
          ...comment,
          author_name: authorName,
          like_count: likeCounts.get(comment.id) || 0,
          is_liked: userLikes.has(comment.id),
          replies: [],
        };
      });

      // Separate top-level comments and replies
      const topLevel = commentsWithDetails.filter(c => !c.parent_id);
      const replies = commentsWithDetails.filter(c => c.parent_id);

      // Attach replies to parent comments
      topLevel.forEach(comment => {
        comment.replies = replies
          .filter(r => r.parent_id === comment.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });

      setComments(topLevel);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [productBarcode, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Set up realtime subscription
  useEffect(() => {
    if (!productBarcode) return;

    const channel = supabase
      .channel(`comments-${productBarcode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_comments',
          filter: `product_barcode=eq.${productBarcode}`,
        },
        () => {
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes',
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productBarcode, fetchComments]);

  const addComment = async (content: string, parentId?: string | null): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to comment');
      return false;
    }

    try {
      const { error } = await supabase
        .from('product_comments')
        .insert({
          user_id: user.id,
          product_barcode: productBarcode,
          product_name: productName,
          content,
          parent_id: parentId || null,
        });

      if (error) throw error;

      toast.success(parentId ? 'Reply added' : 'Comment added');
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
      return false;
    }
  };

  const editComment = async (commentId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('product_comments')
        .update({ content, is_edited: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Comment updated');
      return true;
    } catch (err) {
      console.error('Error editing comment:', err);
      toast.error('Failed to update comment');
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('product_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Comment deleted');
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
      return false;
    }
  };

  const toggleLike = async (commentId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('toggle_comment_like', {
        p_comment_id: commentId,
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like');
      return false;
    }
  };

  const commentCount = comments.reduce(
    (count, comment) => count + 1 + comment.replies.length,
    0
  );

  return {
    comments,
    loading,
    error,
    addComment,
    editComment,
    deleteComment,
    toggleLike,
    refreshComments: fetchComments,
    commentCount,
  };
}
