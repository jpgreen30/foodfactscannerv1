import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id: string;
  notification_type: 'like' | 'comment' | 'reply';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    display_name: string | null;
    first_name: string | null;
    avatar_url: string | null;
  } | null;
  post: {
    id: string;
    title: string;
  } | null;
}

interface UseSocialNotificationsReturn {
  notifications: SocialNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useSocialNotifications = (): UseSocialNotificationsReturn => {
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch notifications
      const { data: notifData, error: notifError } = await supabase
        .from('social_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      if (!notifData || notifData.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get unique actor IDs and post IDs
      const actorIds = [...new Set(notifData.map(n => n.actor_id))];
      const postIds = [...new Set(notifData.map(n => n.post_id).filter(Boolean))] as string[];

      // Fetch actors and posts in parallel
      const [actorsResult, postsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, first_name, avatar_url')
          .in('id', actorIds),
        postIds.length > 0
          ? supabase
              .from('community_posts')
              .select('id, title')
              .in('id', postIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const actorsMap: Record<string, any> = (actorsResult.data || []).reduce(
        (acc: Record<string, any>, actor: any) => {
          acc[actor.id] = actor;
          return acc;
        },
        {}
      );

      const postsMap: Record<string, any> = (postsResult.data || []).reduce(
        (acc: Record<string, any>, post: any) => {
          acc[post.id] = post;
          return acc;
        },
        {}
      );

      const formattedNotifications: SocialNotification[] = notifData.map((notif: any) => ({
        ...notif,
        notification_type: notif.notification_type as 'like' | 'comment' | 'reply',
        actor: actorsMap[notif.actor_id] || null,
        post: notif.post_id ? postsMap[notif.post_id] || null : null,
      }));

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('social_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('social_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
};
