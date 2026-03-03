import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    avatar_url: string | null;
  } | null;
  replies: PostComment[];
}

interface UsePostCommentsReturn {
  comments: PostComment[];
  loading: boolean;
  error: string | null;
  addComment: (content: string, parentId?: string | null) => Promise<boolean>;
  editComment: (commentId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
  refreshComments: () => Promise<void>;
  totalCount: number;
}

export const usePostComments = (postId: string): UsePostCommentsReturn => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const buildCommentTree = (flatComments: any[]): PostComment[] => {
    const commentMap = new Map<string, PostComment>();
    const rootComments: PostComment[] = [];

    // First pass: create all comment objects
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        author: comment.profiles,
        replies: [],
      });
    });

    // Second pass: build tree structure
    flatComments.forEach((comment) => {
      const commentObj = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    // Sort by created_at
    const sortByDate = (a: PostComment, b: PostComment) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    
    rootComments.sort(sortByDate);
    rootComments.forEach((comment) => {
      comment.replies.sort(sortByDate);
    });

    return rootComments;
  };

  const fetchComments = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            first_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const tree = buildCommentTree(data || []);
      setComments(tree);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time subscription
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`post_comments_${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const addComment = async (content: string, parentId?: string | null): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to comment.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      });

      if (error) throw error;

      toast({
        title: 'Comment added',
        description: 'Your comment has been posted.',
      });

      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const editComment = async (commentId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ content: content.trim(), is_edited: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Comment updated',
      });

      return true;
    } catch (err: any) {
      console.error('Error editing comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to edit comment.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Comment deleted',
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete comment.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const countComments = (commentList: PostComment[]): number => {
    return commentList.reduce((acc, comment) => {
      return acc + 1 + countComments(comment.replies);
    }, 0);
  };

  return {
    comments,
    loading,
    error,
    addComment,
    editComment,
    deleteComment,
    refreshComments: fetchComments,
    totalCount: countComments(comments),
  };
};
