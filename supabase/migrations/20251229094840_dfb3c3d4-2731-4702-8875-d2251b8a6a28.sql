-- Create medication reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  reminder_times JSONB NOT NULL DEFAULT '["08:00"]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  scan_id UUID REFERENCES public.scan_history(id) ON DELETE SET NULL,
  refill_reminder_days INTEGER DEFAULT 7,
  pills_remaining INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own reminders
CREATE POLICY "Users can view their own medication reminders"
  ON public.medication_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication reminders"
  ON public.medication_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication reminders"
  ON public.medication_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication reminders"
  ON public.medication_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_medication_reminders_updated_at
  BEFORE UPDATE ON public.medication_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create medication_logs table to track when medications are taken
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_id UUID NOT NULL REFERENCES public.medication_reminders(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own medication logs"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication logs"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication logs"
  ON public.medication_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs"
  ON public.medication_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_medication_reminders_user_id ON public.medication_reminders(user_id);
CREATE INDEX idx_medication_reminders_is_active ON public.medication_reminders(is_active);
CREATE INDEX idx_medication_logs_reminder_id ON public.medication_logs(reminder_id);
CREATE INDEX idx_medication_logs_scheduled_time ON public.medication_logs(scheduled_time);