-- Create food_recalls table to store FDA recall data
CREATE TABLE public.food_recalls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fda_recall_id TEXT UNIQUE,
  product_description TEXT NOT NULL,
  brand_name TEXT,
  product_type TEXT,
  recalling_firm TEXT,
  reason_for_recall TEXT,
  classification TEXT, -- Class I, II, or III
  status TEXT DEFAULT 'Ongoing',
  recall_initiation_date DATE,
  report_date DATE,
  distribution_pattern TEXT,
  upc_codes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_recalls ENABLE ROW LEVEL SECURITY;

-- Everyone can read recalls (public information)
CREATE POLICY "Anyone can view food recalls" 
ON public.food_recalls 
FOR SELECT 
USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can manage recalls" 
ON public.food_recalls 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create user_recall_matches table to track which users were notified
CREATE TABLE public.user_recall_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recall_id UUID NOT NULL REFERENCES public.food_recalls(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.scan_history(id) ON DELETE SET NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  notification_type TEXT, -- 'push', 'email', 'sms'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recall_id)
);

-- Enable RLS
ALTER TABLE public.user_recall_matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own recall matches
CREATE POLICY "Users can view own recall matches" 
ON public.user_recall_matches 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can manage all matches
CREATE POLICY "Service role can manage recall matches" 
ON public.user_recall_matches 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add email preference to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_recall_alerts BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create trigger for updated_at on food_recalls
CREATE TRIGGER update_food_recalls_updated_at
BEFORE UPDATE ON public.food_recalls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();