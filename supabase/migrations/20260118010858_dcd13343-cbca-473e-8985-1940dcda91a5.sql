-- Add new health condition columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_weight_loss_goal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_hypertension BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_high_cholesterol BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_kidney_disease BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_ibs BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_thyroid_condition BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_gout BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_autoimmune BOOLEAN DEFAULT FALSE;

-- Create user_symptoms table for standalone symptom tracking
CREATE TABLE IF NOT EXISTS public.user_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  category TEXT,
  severity TEXT DEFAULT 'mild',
  duration TEXT,
  who_affected TEXT,
  linked_products JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  reported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_symptoms
ALTER TABLE public.user_symptoms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_symptoms
CREATE POLICY "Users can view their own symptoms"
ON public.user_symptoms
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own symptoms"
ON public.user_symptoms
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms"
ON public.user_symptoms
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms"
ON public.user_symptoms
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_symptoms_updated_at
BEFORE UPDATE ON public.user_symptoms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();