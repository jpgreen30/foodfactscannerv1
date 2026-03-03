-- Add DELETE policies for GDPR compliance
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification history" 
ON public.notification_history 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily scans" 
ON public.daily_scans 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan credits" 
ON public.scan_credits 
FOR DELETE 
USING (auth.uid() = user_id);