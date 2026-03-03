
-- Add new columns to profiles for lifecycle tracking and marketing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baby_dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trimester text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter_optin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_location jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lifecycle_stage text;
