-- Add mom/baby-specific columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS baby_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS baby_ages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parenting_concerns jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS feeding_stage text;

-- Add baby food lead columns to legal_leads table
ALTER TABLE public.legal_leads
ADD COLUMN IF NOT EXISTS lead_category text,
ADD COLUMN IF NOT EXISTS baby_food_concerns jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS feeding_method text;

-- Add index for lead category for faster filtering
CREATE INDEX IF NOT EXISTS idx_legal_leads_lead_category ON public.legal_leads(lead_category);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.feeding_stage IS 'Current feeding stage: pregnant, breastfeeding, formula, baby_food, toddler_food';
COMMENT ON COLUMN public.legal_leads.lead_category IS 'Lead category: prenatal, postnatal_0_6m, postnatal_6_12m, postnatal_toddler';