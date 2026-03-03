-- Create webhook_endpoints table for law firm distribution configuration
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  endpoint_type TEXT NOT NULL DEFAULT 'webhook', -- 'webhook', 'email', 'zapier', 'api'
  url TEXT, -- For webhook/api/zapier endpoints
  email TEXT, -- For email distribution
  api_key TEXT, -- Optional API key for authenticated endpoints
  is_active BOOLEAN NOT NULL DEFAULT true,
  filters JSONB DEFAULT '{}', -- e.g. {"min_quality_score": 50, "toxic_ingredients": true}
  headers JSONB DEFAULT '{}', -- Custom headers for API calls
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for active endpoints
CREATE INDEX idx_webhook_endpoints_active ON public.webhook_endpoints(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for webhook_endpoints
CREATE POLICY "Admins can view all webhook endpoints"
  ON public.webhook_endpoints
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert webhook endpoints"
  ON public.webhook_endpoints
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update webhook endpoints"
  ON public.webhook_endpoints
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete webhook endpoints"
  ON public.webhook_endpoints
  FOR DELETE
  USING (public.is_admin());

-- Create lead_distribution_logs table to track all lead deliveries
CREATE TABLE public.lead_distribution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.legal_leads(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_lead_distribution_logs_lead ON public.lead_distribution_logs(lead_id);
CREATE INDEX idx_lead_distribution_logs_endpoint ON public.lead_distribution_logs(endpoint_id);

-- Enable RLS
ALTER TABLE public.lead_distribution_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for lead_distribution_logs
CREATE POLICY "Admins can view all distribution logs"
  ON public.lead_distribution_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Service role can insert distribution logs"
  ON public.lead_distribution_logs
  FOR INSERT
  WITH CHECK (true);

-- Add toxic_exposure column to legal_leads for tracking toxic products
ALTER TABLE public.legal_leads ADD COLUMN IF NOT EXISTS injury_description TEXT;
ALTER TABLE public.legal_leads ADD COLUMN IF NOT EXISTS toxic_products_exposure JSONB DEFAULT '[]';
ALTER TABLE public.legal_leads ADD COLUMN IF NOT EXISTS consultation_requested BOOLEAN DEFAULT false;
ALTER TABLE public.legal_leads ADD COLUMN IF NOT EXISTS consultation_requested_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to update updated_at
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();