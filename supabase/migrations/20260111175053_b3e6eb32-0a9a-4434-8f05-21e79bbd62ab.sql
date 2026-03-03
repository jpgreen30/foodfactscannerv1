-- Add cooking preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cooking_skill_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS max_prep_time_mins INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER,
ADD COLUMN IF NOT EXISTS daily_protein_target INTEGER,
ADD COLUMN IF NOT EXISTS budget_preference TEXT DEFAULT 'moderate';

-- Create meal_plans table for weekly planning
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  meals JSONB DEFAULT '{}'::jsonb,
  shopping_list JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();