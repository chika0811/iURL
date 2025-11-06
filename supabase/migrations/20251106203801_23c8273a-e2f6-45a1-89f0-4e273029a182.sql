-- Add RLS policies for payments table to prevent unauthorized access
-- Payments should only be created and updated by the service (edge functions)

-- Policy to prevent direct user inserts (edge functions use service role and bypass RLS)
CREATE POLICY "Prevent direct payment inserts"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy to prevent direct user updates (edge functions use service role and bypass RLS)
CREATE POLICY "Prevent direct payment updates"
ON public.payments
FOR UPDATE
TO authenticated
USING (false);

-- Policy to prevent payment deletions
CREATE POLICY "Prevent payment deletions"
ON public.payments
FOR DELETE
TO authenticated
USING (false);