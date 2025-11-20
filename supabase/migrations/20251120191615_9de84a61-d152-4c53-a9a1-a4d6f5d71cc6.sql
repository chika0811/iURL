-- Create scan_history table
CREATE TABLE public.scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  score integer NOT NULL,
  verdict text NOT NULL,
  safe boolean NOT NULL,
  reasons text[],
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  scan_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create daily_stats table
CREATE TABLE public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  links_checked integer NOT NULL DEFAULT 0,
  threats_blocked integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create allowlist table
CREATE TABLE public.allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_history
CREATE POLICY "Users can view their own scan history"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan history"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan history"
ON public.scan_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan history"
ON public.scan_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for daily_stats
CREATE POLICY "Users can view their own daily stats"
ON public.daily_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats"
ON public.daily_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
ON public.daily_stats FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for allowlist
CREATE POLICY "Users can view their own allowlist"
ON public.allowlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their own allowlist"
ON public.allowlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own allowlist"
ON public.allowlist FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_timestamp ON public.scan_history(timestamp DESC);
CREATE INDEX idx_daily_stats_user_date ON public.daily_stats(user_id, date DESC);
CREATE INDEX idx_allowlist_user_id ON public.allowlist(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_scan_history_updated_at
  BEFORE UPDATE ON public.scan_history
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();