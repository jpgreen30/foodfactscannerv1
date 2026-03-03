-- Add 5 new health condition columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_celiac_disease BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_gerd BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_osteoporosis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_liver_disease BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_cancer_survivor BOOLEAN DEFAULT false;