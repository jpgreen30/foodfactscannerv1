-- Add new columns to profiles for new/expecting moms
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_new_mom boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_nursing boolean DEFAULT false;

-- Add symptoms tracking columns to legal_leads
ALTER TABLE public.legal_leads
ADD COLUMN IF NOT EXISTS symptoms jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS symptom_severity text,
ADD COLUMN IF NOT EXISTS symptom_duration text,
ADD COLUMN IF NOT EXISTS family_affected jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_new_mom IS 'User has baby/toddler under 2 years old';
COMMENT ON COLUMN public.profiles.is_nursing IS 'User is currently nursing/breastfeeding';
COMMENT ON COLUMN public.legal_leads.symptoms IS 'Structured array of symptoms with severity and duration';
COMMENT ON COLUMN public.legal_leads.symptom_severity IS 'Overall severity: mild, moderate, severe';
COMMENT ON COLUMN public.legal_leads.symptom_duration IS 'How long symptoms have been present';
COMMENT ON COLUMN public.legal_leads.family_affected IS 'Family members affected (especially children)';