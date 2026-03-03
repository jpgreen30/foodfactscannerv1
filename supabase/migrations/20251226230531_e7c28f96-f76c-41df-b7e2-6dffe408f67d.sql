-- Create user_streaks table for gamification
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_scan_date DATE,
  total_scans INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read/update their own streak data
CREATE POLICY "Users can view own streak" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to initialize streaks for new users
CREATE OR REPLACE FUNCTION public.initialize_user_streaks()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_streaks (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_init_streaks
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_streaks();

-- Database function to update streak after scan
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last_scan_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_scans INTEGER;
  v_today DATE := CURRENT_DATE;
  v_badges JSONB;
  v_result JSONB;
BEGIN
  -- Get current streak data
  SELECT last_scan_date, current_streak, longest_streak, total_scans, badges
  INTO v_last_scan_date, v_current_streak, v_longest_streak, v_total_scans, v_badges
  FROM public.user_streaks WHERE user_id = auth.uid();
  
  -- Initialize if no record
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, total_scans, last_scan_date, badges)
    VALUES (auth.uid(), 1, 1, v_today, '[]'::jsonb)
    RETURNING current_streak, longest_streak, total_scans, badges
    INTO v_current_streak, v_longest_streak, v_total_scans, v_badges;
    
    RETURN jsonb_build_object(
      'current_streak', v_current_streak,
      'longest_streak', COALESCE(v_longest_streak, v_current_streak),
      'total_scans', v_total_scans,
      'last_scan_date', v_today,
      'is_new_streak', true
    );
  END IF;
  
  -- Calculate new streak
  IF v_last_scan_date IS NULL OR v_last_scan_date < v_today - 1 THEN
    -- Streak broken, reset to 1
    v_current_streak := 1;
  ELSIF v_last_scan_date = v_today - 1 THEN
    -- Consecutive day, increment streak
    v_current_streak := v_current_streak + 1;
  END IF;
  -- Same day = no streak change
  
  v_total_scans := v_total_scans + 1;
  v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);
  
  UPDATE public.user_streaks SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    total_scans = v_total_scans,
    last_scan_date = v_today,
    updated_at = NOW()
  WHERE user_id = auth.uid();
  
  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'total_scans', v_total_scans,
    'last_scan_date', v_today,
    'is_new_streak', v_last_scan_date IS NULL OR v_last_scan_date < v_today - 1
  );
END;
$$;

-- Function to get user streak data
CREATE OR REPLACE FUNCTION public.get_user_streak()
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  total_scans INTEGER,
  last_scan_date DATE,
  badges JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT us.current_streak, us.longest_streak, us.total_scans, us.last_scan_date, us.badges
  FROM public.user_streaks us
  WHERE us.user_id = auth.uid();
END;
$$;