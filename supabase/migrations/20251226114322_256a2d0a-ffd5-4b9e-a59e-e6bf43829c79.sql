-- Create saved_recipes table for storing favorite meals
CREATE TABLE public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  prep_time TEXT,
  cook_time TEXT,
  servings INTEGER DEFAULT 1,
  safety_score INTEGER,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  nutrition JSONB DEFAULT '{}'::jsonb,
  health_benefits JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved recipes"
ON public.saved_recipes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes"
ON public.saved_recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes"
ON public.saved_recipes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes"
ON public.saved_recipes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_recipes_updated_at
BEFORE UPDATE ON public.saved_recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();