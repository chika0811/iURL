-- Create table to track user scan usage
CREATE TABLE IF NOT EXISTS public.user_scan_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.user_scan_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scan usage"
ON public.user_scan_usage
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan usage"
ON public.user_scan_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan usage"
ON public.user_scan_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_scan_usage_updated_at
BEFORE UPDATE ON public.user_scan_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- Add plan_type to subscriptions table if not exists
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'pro';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_scan_usage_user_month 
ON public.user_scan_usage(user_id, month_year);