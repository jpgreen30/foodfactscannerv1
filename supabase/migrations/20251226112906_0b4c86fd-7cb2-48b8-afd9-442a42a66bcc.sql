-- Create health_reports table to store weekly AI health reports
CREATE TABLE public.health_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  title TEXT NOT NULL,
  summary TEXT,
  health_grade TEXT,
  total_scans INTEGER DEFAULT 0,
  safe_products INTEGER DEFAULT 0,
  caution_products INTEGER DEFAULT 0,
  avoid_products INTEGER DEFAULT 0,
  average_score NUMERIC(4,1),
  top_concerns JSONB,
  improvements JSONB,
  recommendations JSONB,
  scanned_products JSONB,
  report_html TEXT,
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view their own health reports"
ON public.health_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can create their own health reports"
ON public.health_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update their own health reports"
ON public.health_reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_health_reports_user_date ON public.health_reports(user_id, report_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_health_reports_updated_at
BEFORE UPDATE ON public.health_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();