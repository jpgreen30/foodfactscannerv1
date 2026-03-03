-- Drop the SECURITY DEFINER view and replace with a function for security
DROP VIEW IF EXISTS public.admin_analytics;

-- Create a secure function to get admin analytics (security definer so it can access all tables)
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_users BIGINT,
  users_today BIGINT,
  users_this_week BIGINT,
  total_scans BIGINT,
  scans_today BIGINT,
  paid_subscribers BIGINT,
  sms_subscribers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '24 hours')::BIGINT as users_today,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days')::BIGINT as users_this_week,
    (SELECT COUNT(*) FROM public.scan_history)::BIGINT as total_scans,
    (SELECT COUNT(*) FROM public.scan_history WHERE created_at > now() - interval '24 hours')::BIGINT as scans_today,
    (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier IN ('premium', 'family', 'pro'))::BIGINT as paid_subscribers,
    (SELECT COUNT(*) FROM public.profiles WHERE phone_number IS NOT NULL AND wants_recall_sms = TRUE)::BIGINT as sms_subscribers;
END;
$$;