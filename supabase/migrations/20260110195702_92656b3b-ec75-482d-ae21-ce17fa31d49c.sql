-- Create health_metrics table to store imported health data from smartwatches
CREATE TABLE public.health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('heart_rate', 'blood_pressure', 'steps', 'sleep', 'calories_burned', 'activity_minutes')),
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  secondary_value NUMERIC, -- For diastolic BP or other secondary measurements
  source TEXT NOT NULL CHECK (source IN ('apple_health', 'health_connect', 'manual')),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add health_sync_enabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS health_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_health_sync_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own health metrics"
  ON public.health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
  ON public.health_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
  ON public.health_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics"
  ON public.health_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_health_metrics_user_id ON public.health_metrics(user_id);
CREATE INDEX idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX idx_health_metrics_type ON public.health_metrics(metric_type);