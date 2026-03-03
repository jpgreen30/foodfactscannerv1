-- Add INSERT policy for notification_history (used by edge functions via service role)
-- This allows the system to insert notification records
CREATE POLICY "Service role can insert notification history" 
ON public.notification_history 
FOR INSERT 
WITH CHECK (true);