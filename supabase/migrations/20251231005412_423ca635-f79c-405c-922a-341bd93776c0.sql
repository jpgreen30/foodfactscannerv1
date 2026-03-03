-- Create drug_interactions table for tracking medication interaction warnings
CREATE TABLE public.drug_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scanned_medication TEXT NOT NULL,
  interacting_medication TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'contraindicated')),
  description TEXT NOT NULL,
  recommendations TEXT,
  mechanism TEXT,
  source TEXT DEFAULT 'ai_analysis',
  scan_id UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drug_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own drug interactions" 
ON public.drug_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drug interactions" 
ON public.drug_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drug interactions" 
ON public.drug_interactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Note: No DELETE policy - keep audit trail for safety

-- Create index for faster lookups
CREATE INDEX idx_drug_interactions_user_id ON public.drug_interactions(user_id);
CREATE INDEX idx_drug_interactions_created_at ON public.drug_interactions(created_at DESC);