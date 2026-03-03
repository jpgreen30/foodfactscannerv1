-- Add pricing, billing, and distribution fields to webhook_endpoints table
ALTER TABLE public.webhook_endpoints 
ADD COLUMN IF NOT EXISTS price_per_lead DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_cap INTEGER,
ADD COLUMN IF NOT EXISTS current_month_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS distribution_priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS exclusive_leads BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0;

-- Create function to get law firm analytics
CREATE OR REPLACE FUNCTION public.get_law_firm_analytics()
RETURNS TABLE (
  id UUID,
  name TEXT,
  endpoint_type TEXT,
  price_per_lead DECIMAL(10,2),
  monthly_cap INTEGER,
  current_month_count INTEGER,
  success_count INTEGER,
  failure_count INTEGER,
  total_revenue DECIMAL(12,2),
  is_active BOOLEAN,
  contract_end_date DATE,
  last_triggered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    we.id,
    we.name,
    we.endpoint_type,
    we.price_per_lead,
    we.monthly_cap,
    we.current_month_count,
    we.success_count,
    we.failure_count,
    we.total_revenue,
    we.is_active,
    we.contract_end_date,
    we.last_triggered_at
  FROM public.webhook_endpoints we
  ORDER BY we.total_revenue DESC NULLS LAST;
END;
$$;

-- Create function to get lead distribution summary
CREATE OR REPLACE FUNCTION public.get_lead_distribution_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_leads_distributed BIGINT,
  total_revenue DECIMAL(12,2),
  successful_distributions BIGINT,
  failed_distributions BIGINT,
  active_law_firms BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT lead_id) FROM public.lead_distribution_logs WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval)::BIGINT as total_leads_distributed,
    COALESCE((SELECT SUM(we.price_per_lead) FROM public.lead_distribution_logs ldl JOIN public.webhook_endpoints we ON ldl.endpoint_id = we.id WHERE ldl.status = 'success' AND ldl.created_at >= CURRENT_DATE - (days_back || ' days')::interval), 0)::DECIMAL(12,2) as total_revenue,
    (SELECT COUNT(*) FROM public.lead_distribution_logs WHERE status = 'success' AND created_at >= CURRENT_DATE - (days_back || ' days')::interval)::BIGINT as successful_distributions,
    (SELECT COUNT(*) FROM public.lead_distribution_logs WHERE status = 'failed' AND created_at >= CURRENT_DATE - (days_back || ' days')::interval)::BIGINT as failed_distributions,
    (SELECT COUNT(*) FROM public.webhook_endpoints WHERE is_active = true)::BIGINT as active_law_firms;
END;
$$;

-- Create function to get daily distribution stats
CREATE OR REPLACE FUNCTION public.get_daily_distribution_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  leads_distributed BIGINT,
  revenue DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    DATE(ldl.created_at) as date,
    COUNT(DISTINCT ldl.lead_id)::BIGINT as leads_distributed,
    COALESCE(SUM(we.price_per_lead), 0)::DECIMAL(12,2) as revenue
  FROM public.lead_distribution_logs ldl
  LEFT JOIN public.webhook_endpoints we ON ldl.endpoint_id = we.id
  WHERE ldl.status = 'success' 
    AND ldl.created_at >= CURRENT_DATE - (days_back || ' days')::interval
  GROUP BY DATE(ldl.created_at)
  ORDER BY date;
END;
$$;

-- Create function to reset monthly lead counts (run on 1st of month)
CREATE OR REPLACE FUNCTION public.reset_monthly_lead_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.webhook_endpoints
  SET current_month_count = 0,
      updated_at = now();
END;
$$;

-- Create function to increment lead count and update revenue when distributing
CREATE OR REPLACE FUNCTION public.record_lead_distribution(
  p_endpoint_id UUID,
  p_success BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_price DECIMAL(10,2);
BEGIN
  IF p_success THEN
    SELECT price_per_lead INTO v_price FROM public.webhook_endpoints WHERE id = p_endpoint_id;
    
    UPDATE public.webhook_endpoints
    SET current_month_count = COALESCE(current_month_count, 0) + 1,
        success_count = COALESCE(success_count, 0) + 1,
        total_revenue = COALESCE(total_revenue, 0) + COALESCE(v_price, 0),
        last_triggered_at = now(),
        updated_at = now()
    WHERE id = p_endpoint_id;
  ELSE
    UPDATE public.webhook_endpoints
    SET failure_count = COALESCE(failure_count, 0) + 1,
        updated_at = now()
    WHERE id = p_endpoint_id;
  END IF;
END;
$$;