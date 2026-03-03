
-- 1. Subscriptions table (dedicated Stripe subscription tracking)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  stripe_price_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- 2. Products table (global product catalog)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE,
  name text NOT NULL,
  brand text,
  category text,
  ingredients jsonb DEFAULT '[]'::jsonb,
  nutrition jsonb DEFAULT '{}'::jsonb,
  health_score integer,
  heavy_metals_data jsonb,
  image_url text,
  scan_count integer DEFAULT 0,
  last_scanned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_name ON public.products USING gin(to_tsvector('english', name));

-- 3. Admin metrics table (daily KPI snapshots)
CREATE TABLE public.admin_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_users integer DEFAULT 0,
  active_users_7d integer DEFAULT 0,
  new_signups integer DEFAULT 0,
  total_paid integer DEFAULT 0,
  basic_subscribers integer DEFAULT 0,
  premium_subscribers integer DEFAULT 0,
  annual_subscribers integer DEFAULT 0,
  churned integer DEFAULT 0,
  mrr numeric(12,2) DEFAULT 0,
  arr numeric(12,2) DEFAULT 0,
  total_scans integer DEFAULT 0,
  high_risk_scans integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  churn_rate numeric(5,2) DEFAULT 0,
  leads_generated integer DEFAULT 0,
  failed_payments integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE public.admin_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics" ON public.admin_metrics
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Service role can manage metrics" ON public.admin_metrics
  FOR ALL USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_admin_metrics_date ON public.admin_metrics(metric_date DESC);

-- Triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
