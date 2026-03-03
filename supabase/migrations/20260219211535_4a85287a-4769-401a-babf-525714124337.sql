
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  source text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated) to subscribe
CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers FOR INSERT
  WITH CHECK (true);

-- Service role can manage all subscribers (read, update, delete)
CREATE POLICY "Service role can manage subscribers"
  ON public.email_subscribers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all subscribers
CREATE POLICY "Admins can view subscribers"
  ON public.email_subscribers FOR SELECT
  USING (public.is_admin());
