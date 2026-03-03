
-- Add monetization columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS scan_credits_remaining integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free_trial',
  ADD COLUMN IF NOT EXISTS high_intent_user boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS high_risk_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pregnancy_stage text,
  ADD COLUMN IF NOT EXISTS baby_age_months integer,
  ADD COLUMN IF NOT EXISTS total_scans_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scan_timestamp timestamptz;

-- Create scan_events table
CREATE TABLE public.scan_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  barcode text,
  product_name text,
  risk_level text DEFAULT 'low',
  scanned_at timestamptz NOT NULL DEFAULT now(),
  heavy_metals_avoid boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan events" ON public.scan_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan events" ON public.scan_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scan_events_user_id ON public.scan_events(user_id);
CREATE INDEX idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);

-- Create email_log table for deduplication
CREATE TABLE public.email_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs" ON public.email_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email logs" ON public.email_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can insert own email logs" ON public.email_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_email_log_user_type ON public.email_log(user_id, email_type);
CREATE INDEX idx_email_log_dedup ON public.email_log(user_id, email_type, sent_at DESC);

-- Update existing profiles to set defaults for existing users
UPDATE public.profiles 
SET 
  trial_status = CASE 
    WHEN subscription_tier IN ('premium', 'family', 'pro') THEN 'upgraded'
    WHEN subscription_tier = 'basic' THEN 'upgraded'
    ELSE 'active' 
  END,
  subscription_status = CASE
    WHEN subscription_tier = 'premium' THEN 'premium'
    WHEN subscription_tier = 'basic' THEN 'basic'
    ELSE 'free_trial'
  END,
  scan_credits_remaining = CASE
    WHEN subscription_tier IN ('premium', 'family', 'pro') THEN -1
    WHEN subscription_tier = 'basic' THEN 20
    ELSE GREATEST(3 - COALESCE((SELECT COUNT(*)::integer FROM public.scan_history sh WHERE sh.user_id = profiles.id), 0), 0)
  END,
  total_scans_used = COALESCE((SELECT COUNT(*)::integer FROM public.scan_history sh WHERE sh.user_id = profiles.id), 0)
WHERE trial_status IS NULL OR subscription_status IS NULL;
