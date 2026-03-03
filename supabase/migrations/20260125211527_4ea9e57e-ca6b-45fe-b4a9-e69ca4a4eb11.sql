-- Create food_drug_interactions table to store food-medication interaction warnings
CREATE TABLE public.food_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.scan_history(id),
  food_ingredient TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  effect TEXT,
  recommendation TEXT,
  alternative_foods TEXT[],
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.food_drug_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for user access
CREATE POLICY "Users can view their own food drug interactions" 
  ON public.food_drug_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food drug interactions" 
  ON public.food_drug_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food drug interactions" 
  ON public.food_drug_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);