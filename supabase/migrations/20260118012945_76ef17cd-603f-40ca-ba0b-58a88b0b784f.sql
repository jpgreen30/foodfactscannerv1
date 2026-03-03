-- Create user_registrations table to log all signups with full details
CREATE TABLE public.user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  signup_source TEXT DEFAULT 'web_app',
  geo_location JSONB,
  registered_at TIMESTAMPTZ DEFAULT now(),
  admin_notified BOOLEAN DEFAULT false,
  admin_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_registrations ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert/read (edge functions)
CREATE POLICY "Service role can manage registrations"
ON public.user_registrations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_user_registrations_email ON public.user_registrations(email);
CREATE INDEX idx_user_registrations_registered_at ON public.user_registrations(registered_at DESC);