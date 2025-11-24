-- Create login_activity table to track user login events
CREATE TABLE IF NOT EXISTS public.login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  login_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  login_method TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own login activity
CREATE POLICY "Users can view their own login activity"
ON public.login_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for system to insert login activity (will be done via edge function with service role)
CREATE POLICY "System can insert login activity"
ON public.login_activity
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_timestamp ON public.login_activity(login_timestamp DESC);