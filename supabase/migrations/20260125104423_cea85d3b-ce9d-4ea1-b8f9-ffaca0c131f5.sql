-- Create function to get total lifetime scan count (for free trial limit)
CREATE OR REPLACE FUNCTION public.get_total_scan_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT COUNT(*)::integer 
     FROM public.scan_history 
     WHERE user_id = auth.uid()),
    0
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_total_scan_count() TO authenticated;