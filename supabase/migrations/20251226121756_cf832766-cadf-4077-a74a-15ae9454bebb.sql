-- Add columns for tracking push notification engagement
ALTER TABLE public.notification_history 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_history_opened 
ON public.notification_history(opened_at) WHERE opened_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_history_status 
ON public.notification_history(status);

-- Update the notification_history table to add the user_id foreign key reference if missing
-- (Note: the existing table already has user_id but let's ensure it has proper index)
CREATE INDEX IF NOT EXISTS idx_notification_history_user_type 
ON public.notification_history(user_id, notification_type);