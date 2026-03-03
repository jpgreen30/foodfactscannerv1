-- Daily Challenges System
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  reward_type TEXT NOT NULL DEFAULT 'points',
  reward_amount INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Challenge Progress
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, challenge_date)
);

-- Weekly Leaderboard
CREATE TABLE public.weekly_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_scans INTEGER NOT NULL DEFAULT 0,
  dangers_avoided INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Referral System
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  reward_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Daily challenges are readable by everyone
CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT USING (is_active = true);

-- User challenge progress - users see their own
CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard - everyone can view, users update their own
CREATE POLICY "Anyone can view leaderboard" ON public.weekly_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own leaderboard entry" ON public.weekly_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry" ON public.weekly_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- Referral codes - users see their own
CREATE POLICY "Users can view own referral code" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a code to validate it
CREATE POLICY "Anyone can lookup referral codes" ON public.referral_codes
  FOR SELECT USING (true);

-- Referrals - users see referrals they made
CREATE POLICY "Users can view referrals they made" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Seed daily challenges
INSERT INTO public.daily_challenges (challenge_type, title, description, target_count, reward_type, reward_amount, icon) VALUES
('scan_count', 'Quick Scanner', 'Scan 3 products today', 3, 'points', 15, 'Scan'),
('scan_count', 'Product Explorer', 'Scan 5 products today', 5, 'points', 25, 'Search'),
('high_score', 'Health Hunter', 'Find a product with score above 80', 1, 'points', 20, 'Heart'),
('low_score', 'Danger Detector', 'Identify a harmful product (score below 40)', 1, 'points', 20, 'AlertTriangle'),
('community', 'Community Contributor', 'Share a product review', 1, 'points', 15, 'Users'),
('streak', 'Streak Keeper', 'Maintain your scanning streak', 1, 'points', 10, 'Flame');

-- Function to get today's challenges for a user
CREATE OR REPLACE FUNCTION public.get_daily_challenges()
RETURNS TABLE (
  challenge_id UUID,
  challenge_type TEXT,
  title TEXT,
  description TEXT,
  target_count INTEGER,
  reward_amount INTEGER,
  icon TEXT,
  current_progress INTEGER,
  is_completed BOOLEAN,
  reward_claimed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id as challenge_id,
    dc.challenge_type,
    dc.title,
    dc.description,
    dc.target_count,
    dc.reward_amount,
    dc.icon,
    COALESCE(ucp.current_progress, 0) as current_progress,
    COALESCE(ucp.is_completed, false) as is_completed,
    COALESCE(ucp.reward_claimed, false) as reward_claimed
  FROM public.daily_challenges dc
  LEFT JOIN public.user_challenge_progress ucp 
    ON dc.id = ucp.challenge_id 
    AND ucp.user_id = auth.uid() 
    AND ucp.challenge_date = CURRENT_DATE
  WHERE dc.is_active = true
  ORDER BY dc.reward_amount DESC;
END;
$$;

-- Function to update challenge progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_challenge_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenge RECORD;
  v_new_progress INTEGER;
  v_completed BOOLEAN;
  v_results JSONB := '[]'::JSONB;
BEGIN
  FOR v_challenge IN 
    SELECT id, target_count, reward_amount 
    FROM public.daily_challenges 
    WHERE challenge_type = p_challenge_type AND is_active = true
  LOOP
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, challenge_date, current_progress)
    VALUES (auth.uid(), v_challenge.id, CURRENT_DATE, p_increment)
    ON CONFLICT (user_id, challenge_id, challenge_date)
    DO UPDATE SET current_progress = user_challenge_progress.current_progress + p_increment
    RETURNING current_progress, current_progress >= v_challenge.target_count
    INTO v_new_progress, v_completed;
    
    IF v_completed THEN
      UPDATE public.user_challenge_progress
      SET is_completed = true, completed_at = now()
      WHERE user_id = auth.uid() 
        AND challenge_id = v_challenge.id 
        AND challenge_date = CURRENT_DATE
        AND is_completed = false;
    END IF;
    
    v_results := v_results || jsonb_build_object(
      'challenge_id', v_challenge.id,
      'new_progress', v_new_progress,
      'target', v_challenge.target_count,
      'just_completed', v_completed AND v_new_progress = v_challenge.target_count + p_increment - 1
    );
  END LOOP;
  
  RETURN v_results;
END;
$$;

-- Function to get weekly leaderboard
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  points INTEGER,
  total_scans INTEGER,
  streak_days INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY wl.points DESC, wl.total_scans DESC) as rank,
      wl.user_id,
      COALESCE(p.display_name, p.first_name, 'Anonymous') as display_name,
      wl.points,
      wl.total_scans,
      wl.streak_days,
      wl.user_id = auth.uid() as is_current_user
    FROM public.weekly_leaderboard wl
    JOIN public.profiles p ON p.id = wl.user_id
    WHERE wl.week_start = v_week_start
  )
  SELECT * FROM ranked
  WHERE ranked.rank <= p_limit OR ranked.is_current_user
  ORDER BY ranked.rank;
END;
$$;

-- Function to update leaderboard on scan
CREATE OR REPLACE FUNCTION public.update_leaderboard_on_scan(p_health_score INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_points INTEGER := 10;
  v_danger_avoided INTEGER := 0;
BEGIN
  -- Bonus points for finding dangerous products
  IF p_health_score < 40 THEN
    v_points := v_points + 5;
    v_danger_avoided := 1;
  END IF;
  
  INSERT INTO public.weekly_leaderboard (user_id, week_start, total_scans, dangers_avoided, points)
  VALUES (auth.uid(), v_week_start, 1, v_danger_avoided, v_points)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET 
    total_scans = weekly_leaderboard.total_scans + 1,
    dangers_avoided = weekly_leaderboard.dangers_avoided + v_danger_avoided,
    points = weekly_leaderboard.points + v_points,
    updated_at = now();
END;
$$;

-- Generate referral code for user
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT code INTO v_code FROM public.referral_codes WHERE user_id = auth.uid();
  
  IF v_code IS NULL THEN
    v_code := upper(substr(md5(random()::text || auth.uid()::text), 1, 8));
    INSERT INTO public.referral_codes (user_id, code) VALUES (auth.uid(), v_code);
  END IF;
  
  RETURN v_code;
END;
$$;