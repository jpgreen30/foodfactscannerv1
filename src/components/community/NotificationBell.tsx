import { useState } from 'react';
import { Bell, Heart, MessageCircle, Reply, Check, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocialNotifications, SocialNotification } from '@/hooks/useSocialNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: SocialNotification['notification_type'] }) => {
  switch (type) {
    case 'like':
      return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-primary" />;
    case 'reply':
      return <Reply className="w-4 h-4 text-blue-500" />;
  }
};

const getNotificationText = (notification: SocialNotification): string => {
  const actorName = notification.actor?.display_name || notification.actor?.first_name || 'Someone';
  const postTitle = notification.post?.title ? `"${notification.post.title.slice(0, 30)}${notification.post.title.length > 30 ? '...' : ''}"` : 'your post';

  switch (notification.notification_type) {
    case 'like':
      return `${actorName} liked ${postTitle}`;
    case 'comment':
      return `${actorName} commented on ${postTitle}`;
    case 'reply':
      return `${actorName} replied to your comment`;
  }
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSocialNotifications();

  if (!user) return null;

  const handleNotificationClick = async (notification: SocialNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    if (notification.post_id) {
      navigate(`/community?post=${notification.post_id}`);
    } else {
      navigate('/community');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notification.is_read && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={notification.actor?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {notification.actor?.first_name?.[0] || notification.actor?.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      <NotificationIcon type={notification.notification_type} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                navigate('/community');
              }}
            >
              View all activity
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
