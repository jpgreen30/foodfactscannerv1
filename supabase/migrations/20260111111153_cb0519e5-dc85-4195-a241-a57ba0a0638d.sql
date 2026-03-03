-- Add social notification preference to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS social_notifications BOOLEAN NOT NULL DEFAULT true;

-- Create function to trigger push notification on social notification insert
CREATE OR REPLACE FUNCTION public.trigger_social_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Get the Supabase URL from environment (this will be set in production)
  -- For now, we'll use pg_net to call the edge function
  
  -- Use pg_net to make HTTP request to edge function
  -- This requires pg_net extension to be enabled
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-social-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'social_notifications',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'actor_id', NEW.actor_id,
        'notification_type', NEW.notification_type,
        'post_id', NEW.post_id,
        'comment_id', NEW.comment_id,
        'is_read', NEW.is_read,
        'created_at', NEW.created_at
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to trigger social push notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for social push notifications
DROP TRIGGER IF EXISTS on_social_notification_push ON public.social_notifications;
CREATE TRIGGER on_social_notification_push
AFTER INSERT ON public.social_notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_social_push_notification();