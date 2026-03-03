import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'warning' | 'tip' | 'question' | 'experience';
  product_barcode: string | null;
  product_name: string | null;
  health_score: number | null;
  verdict: string | null;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    avatar_url: string | null;
  } | null;
  is_liked: boolean;
}

export type FeedFilter = 'recent' | 'trending' | 'harmful' | 'baby';
export type PostType = 'warning' | 'tip' | 'question' | 'experience';

interface UseCommunityFeedReturn {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
  filter: FeedFilter;
  setFilter: (filter: FeedFilter) => void;
  createPost: (data: {
    title: string;
    content: string;
    post_type: PostType;
    product_barcode?: string;
    product_name?: string;
    health_score?: number;
    verdict?: string;
  }) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  refreshFeed: () => Promise<void>;
}

export const useCommunityFeed = (): UseCommunityFeedReturn => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('recent');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('community_posts')
        .select('*');

      // Apply filters
      if (filter === 'harmful') {
        query = query.in('verdict', ['avoid', 'caution']);
      } else if (filter === 'baby') {
        query = query.or('product_name.ilike.%baby%,title.ilike.%baby%,content.ilike.%baby%');
      }

      // Apply ordering
      if (filter === 'trending') {
        query = query
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('like_count', { ascending: false })
          .order('comment_count', { ascending: false });
      } else {
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      query = query.limit(50);

      const { data: postsData, error: postsError } = await query;

      if (postsError) throw postsError;

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id))];
      
      // Fetch profiles for post authors
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, avatar_url')
          .in('id', userIds);
        
        profilesMap = (profilesData || []).reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      // Get user's likes if logged in
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        userLikes = likesData?.map(l => l.post_id) || [];
      }

      const formattedPosts: CommunityPost[] = (postsData || []).map((post: any) => ({
        ...post,
        post_type: post.post_type as PostType,
        author: profilesMap[post.user_id] || null,
        is_liked: userLikes.includes(post.id),
      }));

      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('Error fetching community posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('community_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const createPost = async (data: {
    title: string;
    content: string;
    post_type: PostType;
    product_barcode?: string;
    product_name?: string;
    health_score?: number;
    verdict?: string;
  }): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to create a post.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        title: data.title,
        content: data.content,
        post_type: data.post_type,
        product_barcode: data.product_barcode || null,
        product_name: data.product_name || null,
        health_score: data.health_score || null,
        verdict: data.verdict || null,
      });

      if (error) throw error;

      toast({
        title: 'Post created!',
        description: 'Your post has been shared with the community.',
      });

      return true;
    } catch (err: any) {
      console.error('Error creating post:', err);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleLike = async (postId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to like posts.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
      });

      if (error) throw error;

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: data,
                like_count: data ? post.like_count + 1 : post.like_count - 1,
              }
            : post
        )
      );

      return true;
    } catch (err: any) {
      console.error('Error toggling like:', err);
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPosts((prev) => prev.filter((post) => post.id !== postId));

      toast({
        title: 'Post deleted',
        description: 'Your post has been removed.',
      });

      return true;
    } catch (err: any) {
      console.error('Error deleting post:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete post.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    posts,
    loading,
    error,
    filter,
    setFilter,
    createPost,
    toggleLike,
    deletePost,
    refreshFeed: fetchPosts,
  };
};
