-- Fix initialize_user_credits to use 3 instead of 50
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.scan_credits (user_id, credits_remaining, credits_purchased, last_free_credits_at)
  VALUES (NEW.id, 3, 0, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update existing free trial users to have correct credits based on actual scan history
UPDATE public.scan_credits 
SET credits_remaining = GREATEST(3 - (
  SELECT COUNT(*) FROM public.scan_history WHERE scan_history.user_id = scan_credits.user_id
), 0)
WHERE credits_purchased = 0;