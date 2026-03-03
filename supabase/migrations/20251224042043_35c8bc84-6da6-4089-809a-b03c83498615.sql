-- Add enhanced profile columns for health tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_conditions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allergies_detailed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS medications jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dietary_goals text,
ADD COLUMN IF NOT EXISTS diet_type text,
ADD COLUMN IF NOT EXISTS age_group text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Create daily_scans table for usage tracking
CREATE TABLE IF NOT EXISTS public.daily_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_date date NOT NULL DEFAULT CURRENT_DATE,
  scan_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, scan_date)
);

-- Enable RLS on daily_scans
ALTER TABLE public.daily_scans ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_scans
CREATE POLICY "Users can view their own scan counts"
ON public.daily_scans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan counts"
ON public.daily_scans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan counts"
ON public.daily_scans
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to increment daily scan count
CREATE OR REPLACE FUNCTION public.increment_daily_scan()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  INSERT INTO public.daily_scans (user_id, scan_date, scan_count)
  VALUES (auth.uid(), CURRENT_DATE, 1)
  ON CONFLICT (user_id, scan_date)
  DO UPDATE SET scan_count = daily_scans.scan_count + 1
  RETURNING scan_count INTO current_count;
  
  RETURN current_count;
END;
$$;

-- Function to get today's scan count
CREATE OR REPLACE FUNCTION public.get_daily_scan_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT scan_count INTO current_count
  FROM public.daily_scans
  WHERE user_id = auth.uid() AND scan_date = CURRENT_DATE;
  
  RETURN COALESCE(current_count, 0);
END;
$$;