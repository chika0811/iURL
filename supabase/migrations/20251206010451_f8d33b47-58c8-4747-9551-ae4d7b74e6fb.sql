-- Add explicit DELETE policy that denies all deletions on subscriptions table
CREATE POLICY "Prevent subscription deletions" 
ON public.subscriptions 
FOR DELETE 
USING (false);