
-- Add scan_reset_date and trial_expired to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS scan_reset_date timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_expired boolean DEFAULT false;

-- Update existing free trial users who have exhausted scans
UPDATE public.profiles 
SET trial_expired = true 
WHERE (subscription_tier IS NULL OR subscription_tier = 'free') 
  AND scan_credits_remaining IS NOT NULL 
  AND scan_credits_remaining <= 0;
