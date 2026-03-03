-- Create legal_leads table for attorney firm data sales
CREATE TABLE public.legal_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_text TEXT DEFAULT 'I agree to receive emergency recall alerts via SMS and understand my information may be shared with legal representatives for product liability cases.',
  lead_source TEXT DEFAULT 'recall_signup',
  products_scanned JSONB DEFAULT '[]'::jsonb,
  health_conditions JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  recalled_products_exposure JSONB DEFAULT '[]'::jsonb,
  lead_status TEXT DEFAULT 'new', -- new, qualified, contacted, sold, rejected
  lead_quality_score INTEGER DEFAULT 0,
  sold_to_firm TEXT,
  sold_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_leads ENABLE ROW LEVEL SECURITY;

-- Users can view their own lead record
CREATE POLICY "Users can view their own lead"
  ON public.legal_leads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own lead
CREATE POLICY "Users can insert their own lead"
  ON public.legal_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own lead
CREATE POLICY "Users can update their own lead"
  ON public.legal_leads FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
  ON public.legal_leads FOR SELECT
  USING (public.is_admin());

-- Admins can update all leads (for marking as sold, etc.)
CREATE POLICY "Admins can update all leads"
  ON public.legal_leads FOR UPDATE
  USING (public.is_admin());

-- Create index for faster queries
CREATE INDEX idx_legal_leads_user_id ON public.legal_leads(user_id);
CREATE INDEX idx_legal_leads_status ON public.legal_leads(lead_status);
CREATE INDEX idx_legal_leads_created ON public.legal_leads(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_legal_leads_updated_at
  BEFORE UPDATE ON public.legal_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin function to get all leads
CREATE OR REPLACE FUNCTION public.get_admin_leads(_limit INTEGER DEFAULT 100, _offset INTEGER DEFAULT 0)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  phone_number TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  consent_given BOOLEAN,
  consent_timestamp TIMESTAMPTZ,
  lead_source TEXT,
  products_scanned JSONB,
  health_conditions JSONB,
  allergies JSONB,
  recalled_products_exposure JSONB,
  lead_status TEXT,
  lead_quality_score INTEGER,
  sold_to_firm TEXT,
  sold_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ
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
    ll.id,
    ll.user_id,
    ll.phone_number,
    ll.email,
    ll.first_name,
    ll.last_name,
    ll.consent_given,
    ll.consent_timestamp,
    ll.lead_source,
    ll.products_scanned,
    ll.health_conditions,
    ll.allergies,
    ll.recalled_products_exposure,
    ll.lead_status,
    ll.lead_quality_score,
    ll.sold_to_firm,
    ll.sold_at,
    ll.notes,
    ll.created_at
  FROM public.legal_leads ll
  ORDER BY ll.created_at DESC
  LIMIT _limit
  OFFSET _offset;
END;
$$;