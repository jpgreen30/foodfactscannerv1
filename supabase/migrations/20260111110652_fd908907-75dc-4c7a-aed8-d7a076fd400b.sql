-- Create social_notifications table for in-app notifications
CREATE TABLE public.social_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('like', 'comment', 'reply')),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_social_notifications_user_id ON public.social_notifications(user_id);
CREATE INDEX idx_social_notifications_created_at ON public.social_notifications(created_at DESC);
CREATE INDEX idx_social_notifications_is_read ON public.social_notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.social_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.social_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.social_notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.social_notifications FOR INSERT
WITH CHECK (true);

-- Function to create notification on post like
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Get post author and create notification (don't notify self-likes)
  INSERT INTO public.social_notifications (user_id, actor_id, notification_type, post_id)
  SELECT cp.user_id, NEW.user_id, 'like', NEW.post_id
  FROM public.community_posts cp
  WHERE cp.id = NEW.post_id
    AND cp.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify post author about new comment (if not self-commenting)
  INSERT INTO public.social_notifications (user_id, actor_id, notification_type, post_id, comment_id)
  SELECT cp.user_id, NEW.user_id, 'comment', NEW.post_id, NEW.id
  FROM public.community_posts cp
  WHERE cp.id = NEW.post_id
    AND cp.user_id != NEW.user_id
    AND NEW.parent_id IS NULL;
  
  -- Notify parent comment author about reply (if not self-replying)
  INSERT INTO public.social_notifications (user_id, actor_id, notification_type, post_id, comment_id)
  SELECT pc.user_id, NEW.user_id, 'reply', NEW.post_id, NEW.id
  FROM public.post_comments pc
  WHERE pc.id = NEW.parent_id
    AND pc.user_id != NEW.user_id
    AND NEW.parent_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_post_like_notify
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_post_like();

CREATE TRIGGER on_post_comment_notify
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_post_comment();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;