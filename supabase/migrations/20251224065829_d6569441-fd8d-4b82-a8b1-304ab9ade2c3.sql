-- Create family_profiles table
CREATE TABLE public.family_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  age_group TEXT,
  avatar_color TEXT DEFAULT 'hsl(0, 70%, 50%)',
  is_default BOOLEAN DEFAULT false,
  
  -- Health conditions (same as main profile)
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  is_diabetic BOOLEAN DEFAULT false,
  is_pregnant BOOLEAN DEFAULT false,
  is_heart_healthy BOOLEAN DEFAULT false,
  health_conditions JSONB DEFAULT '[]'::jsonb,
  allergies_detailed JSONB DEFAULT '[]'::jsonb,
  allergy_notes TEXT,
  diet_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own family profiles"
ON public.family_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family profiles"
ON public.family_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family profiles"
ON public.family_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family profiles"
ON public.family_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_family_profiles_updated_at
BEFORE UPDATE ON public.family_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to count family profiles (for tier limits)
CREATE OR REPLACE FUNCTION public.get_family_profile_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.family_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can add more family profiles based on tier
CREATE OR REPLACE FUNCTION public.can_add_family_profile()
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  profile_count INTEGER;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = auth.uid();
  
  SELECT COUNT(*)::INTEGER INTO profile_count
  FROM public.family_profiles
  WHERE user_id = auth.uid();
  
  -- Free/Premium: 0 family profiles allowed
  -- Family: up to 5 profiles
  -- Pro: unlimited
  IF user_tier = 'pro' THEN
    RETURN TRUE;
  ELSIF user_tier = 'family' AND profile_count < 5 THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;