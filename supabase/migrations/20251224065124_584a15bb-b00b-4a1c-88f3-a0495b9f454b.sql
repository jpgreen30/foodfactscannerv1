-- Create scan_credits table for microtransaction system
CREATE TABLE public.scan_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  last_free_credits_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on scan_credits
ALTER TABLE public.scan_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.scan_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own credits
CREATE POLICY "Users can update their own credits"
ON public.scan_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own credits record
CREATE POLICY "Users can insert their own credits"
ON public.scan_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_scan_credits_updated_at
BEFORE UPDATE ON public.scan_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize credits for new users (called after profile creation)
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.scan_credits (user_id, credits_remaining, credits_purchased, last_free_credits_at)
  VALUES (NEW.id, 50, 0, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create credits when profile is created
CREATE TRIGGER on_profile_created_add_credits
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_credits();

-- Function to use a scan credit
CREATE OR REPLACE FUNCTION public.use_scan_credit()
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  user_tier TEXT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Premium and above have unlimited scans
  IF user_tier IN ('premium', 'family', 'pro') THEN
    RETURN TRUE;
  END IF;
  
  -- For free tier, check and decrement credits
  SELECT credits_remaining INTO current_credits
  FROM public.scan_credits
  WHERE user_id = auth.uid();
  
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.scan_credits
  SET credits_remaining = credits_remaining - 1,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION public.add_purchased_credits(amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE public.scan_credits
  SET credits_remaining = credits_remaining + amount,
      credits_purchased = credits_purchased + amount,
      updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING credits_remaining INTO new_total;
  
  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user credits info
CREATE OR REPLACE FUNCTION public.get_user_credits()
RETURNS TABLE(credits_remaining INTEGER, credits_purchased INTEGER, subscription_tier TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.credits_remaining, sc.credits_purchased, p.subscription_tier
  FROM public.scan_credits sc
  JOIN public.profiles p ON p.id = sc.user_id
  WHERE sc.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;