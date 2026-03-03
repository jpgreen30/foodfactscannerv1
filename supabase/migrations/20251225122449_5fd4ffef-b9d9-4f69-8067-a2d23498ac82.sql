-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can insert roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Only admins can update roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Only admins can delete roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Create admin-only function to get all users with details
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  phone_number text,
  subscription_tier text,
  created_at timestamptz,
  scan_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.first_name,
    p.last_name,
    p.phone_number,
    p.subscription_tier,
    p.created_at,
    COALESCE((SELECT COUNT(*) FROM public.scan_history sh WHERE sh.user_id = p.id), 0)::BIGINT as scan_count
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Create admin-only function to get all scans with user info
CREATE OR REPLACE FUNCTION public.get_admin_scans(
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_email text,
  user_name text,
  product_name text,
  brand text,
  health_score integer,
  verdict text,
  scan_type text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    sh.id,
    p.email as user_email,
    COALESCE(p.display_name, p.first_name, 'Unknown') as user_name,
    sh.product_name,
    sh.brand,
    sh.health_score,
    sh.verdict,
    sh.scan_type,
    sh.created_at
  FROM public.scan_history sh
  LEFT JOIN public.profiles p ON p.id = sh.user_id
  ORDER BY sh.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;

-- Create function to get daily signups for charts (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_daily_signups(_days integer DEFAULT 30)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    DATE(p.created_at) as date,
    COUNT(*)::BIGINT as count
  FROM public.profiles p
  WHERE p.created_at >= CURRENT_DATE - (_days || ' days')::interval
  GROUP BY DATE(p.created_at)
  ORDER BY date;
END;
$$;

-- Create function to get daily scans for charts (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_daily_scans(_days integer DEFAULT 30)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    DATE(sh.created_at) as date,
    COUNT(*)::BIGINT as count
  FROM public.scan_history sh
  WHERE sh.created_at >= CURRENT_DATE - (_days || ' days')::interval
  GROUP BY DATE(sh.created_at)
  ORDER BY date;
END;
$$;

-- Create function to get subscription distribution (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_subscription_distribution()
RETURNS TABLE (
  tier text,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(p.subscription_tier, 'free') as tier,
    COUNT(*)::BIGINT as count
  FROM public.profiles p
  GROUP BY p.subscription_tier
  ORDER BY count DESC;
END;
$$;