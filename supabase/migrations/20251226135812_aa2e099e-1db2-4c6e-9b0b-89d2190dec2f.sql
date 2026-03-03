-- Admin Sessions table for PIN-based verification
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '4 hours'),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add admin PIN hash to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS admin_pin_hash text,
ADD COLUMN IF NOT EXISTS pin_set_at timestamp with time zone;

-- Analytics Events table for conversion tracking
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_category text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  scan_id uuid,
  product_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster querying
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_admin_sessions_user ON public.admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_sessions
CREATE POLICY "Admins can view own sessions"
ON public.admin_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create own sessions"
ON public.admin_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete own sessions"
ON public.admin_sessions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for analytics_events
CREATE POLICY "Users can insert own events"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all events"
ON public.analytics_events FOR SELECT
USING (is_admin());

-- Function to verify admin PIN
CREATE OR REPLACE FUNCTION public.verify_admin_pin(pin_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT admin_pin_hash INTO stored_hash
  FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin';
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Simple hash comparison (in production use bcrypt)
  RETURN stored_hash = encode(sha256(pin_input::bytea), 'hex');
END;
$$;

-- Function to set admin PIN
CREATE OR REPLACE FUNCTION public.set_admin_pin(new_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles
  SET 
    admin_pin_hash = encode(sha256(new_pin::bytea), 'hex'),
    pin_set_at = now()
  WHERE user_id = auth.uid() AND role = 'admin';
  
  RETURN FOUND;
END;
$$;

-- Function to check if admin has PIN set
CREATE OR REPLACE FUNCTION public.admin_has_pin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND admin_pin_hash IS NOT NULL
  );
$$;

-- Function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate a random session token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Delete expired sessions for this user
  DELETE FROM public.admin_sessions
  WHERE user_id = auth.uid() AND expires_at < now();
  
  -- Create new session
  INSERT INTO public.admin_sessions (user_id, session_token, expires_at)
  VALUES (auth.uid(), new_token, now() + interval '4 hours');
  
  RETURN new_token;
END;
$$;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_sessions
    WHERE user_id = auth.uid()
    AND admin_sessions.session_token = validate_admin_session.session_token
    AND expires_at > now()
  );
$$;

-- Function to get conversion funnel stats
CREATE OR REPLACE FUNCTION public.get_conversion_funnel_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  total_scans bigint,
  toxic_cta_views bigint,
  toxic_cta_clicks bigint,
  form_opens bigint,
  form_submits bigint,
  leads_created bigint,
  leads_distributed bigint,
  cta_view_rate numeric,
  cta_click_rate numeric,
  form_open_rate numeric,
  form_completion_rate numeric,
  overall_conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_scans bigint;
  v_toxic_cta_views bigint;
  v_toxic_cta_clicks bigint;
  v_form_opens bigint;
  v_form_submits bigint;
  v_leads_created bigint;
  v_leads_distributed bigint;
BEGIN
  -- Get total scans in period
  SELECT COUNT(*) INTO v_total_scans
  FROM public.scan_history
  WHERE created_at >= now() - (days_back || ' days')::interval;
  
  -- Get event counts
  SELECT 
    COALESCE(SUM(CASE WHEN event_type = 'toxic_cta_view' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'toxic_cta_click' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'form_open' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'lead_created' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'lead_distributed' THEN 1 ELSE 0 END), 0)
  INTO v_toxic_cta_views, v_toxic_cta_clicks, v_form_opens, v_form_submits, v_leads_created, v_leads_distributed
  FROM public.analytics_events
  WHERE created_at >= now() - (days_back || ' days')::interval
  AND event_category = 'legal_consultation';
  
  RETURN QUERY SELECT 
    v_total_scans,
    v_toxic_cta_views,
    v_toxic_cta_clicks,
    v_form_opens,
    v_form_submits,
    v_leads_created,
    v_leads_distributed,
    CASE WHEN v_total_scans > 0 THEN ROUND((v_toxic_cta_views::numeric / v_total_scans) * 100, 2) ELSE 0 END,
    CASE WHEN v_toxic_cta_views > 0 THEN ROUND((v_toxic_cta_clicks::numeric / v_toxic_cta_views) * 100, 2) ELSE 0 END,
    CASE WHEN v_toxic_cta_clicks > 0 THEN ROUND((v_form_opens::numeric / v_toxic_cta_clicks) * 100, 2) ELSE 0 END,
    CASE WHEN v_form_opens > 0 THEN ROUND((v_form_submits::numeric / v_form_opens) * 100, 2) ELSE 0 END,
    CASE WHEN v_total_scans > 0 THEN ROUND((v_leads_created::numeric / v_total_scans) * 100, 2) ELSE 0 END;
END;
$$;

-- Function to get daily conversion stats
CREATE OR REPLACE FUNCTION public.get_daily_conversion_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  date date,
  scans bigint,
  cta_views bigint,
  cta_clicks bigint,
  form_submits bigint,
  leads bigint,
  click_rate numeric,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      (now() - (days_back || ' days')::interval)::date,
      now()::date,
      '1 day'::interval
    )::date AS day
  ),
  daily_scans AS (
    SELECT created_at::date as scan_date, COUNT(*) as cnt
    FROM public.scan_history
    WHERE created_at >= now() - (days_back || ' days')::interval
    GROUP BY created_at::date
  ),
  daily_events AS (
    SELECT 
      created_at::date as event_date,
      SUM(CASE WHEN event_type = 'toxic_cta_view' THEN 1 ELSE 0 END) as views,
      SUM(CASE WHEN event_type = 'toxic_cta_click' THEN 1 ELSE 0 END) as clicks,
      SUM(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as submits,
      SUM(CASE WHEN event_type = 'lead_created' THEN 1 ELSE 0 END) as leads
    FROM public.analytics_events
    WHERE event_category = 'legal_consultation'
    AND created_at >= now() - (days_back || ' days')::interval
    GROUP BY created_at::date
  )
  SELECT 
    ds.day,
    COALESCE(dsc.cnt, 0)::bigint,
    COALESCE(de.views, 0)::bigint,
    COALESCE(de.clicks, 0)::bigint,
    COALESCE(de.submits, 0)::bigint,
    COALESCE(de.leads, 0)::bigint,
    CASE WHEN COALESCE(de.views, 0) > 0 
      THEN ROUND((COALESCE(de.clicks, 0)::numeric / de.views) * 100, 2) 
      ELSE 0 
    END,
    CASE WHEN COALESCE(dsc.cnt, 0) > 0 
      THEN ROUND((COALESCE(de.leads, 0)::numeric / dsc.cnt) * 100, 2) 
      ELSE 0 
    END
  FROM date_series ds
  LEFT JOIN daily_scans dsc ON ds.day = dsc.scan_date
  LEFT JOIN daily_events de ON ds.day = de.event_date
  ORDER BY ds.day;
END;
$$;