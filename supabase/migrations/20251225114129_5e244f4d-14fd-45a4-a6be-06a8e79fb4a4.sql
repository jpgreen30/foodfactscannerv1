-- Add phone number field to profiles for recall alerts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wants_recall_sms BOOLEAN DEFAULT FALSE;

-- Add Zapier webhook URL setting for admin
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings (admin only - will restrict via application logic)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read settings (we'll check admin in app)
CREATE POLICY "Authenticated users can read settings"
ON public.app_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create analytics view for admin dashboard
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '24 hours') as users_today,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days') as users_this_week,
  (SELECT COUNT(*) FROM public.scan_history) as total_scans,
  (SELECT COUNT(*) FROM public.scan_history WHERE created_at > now() - interval '24 hours') as scans_today,
  (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier IN ('premium', 'family', 'pro')) as paid_subscribers,
  (SELECT COUNT(*) FROM public.profiles WHERE phone_number IS NOT NULL AND wants_recall_sms = TRUE) as sms_subscribers;