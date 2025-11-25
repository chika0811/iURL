-- Update existing 'pro' plan types to 'premium' in user_scan_usage table
UPDATE user_scan_usage 
SET plan_type = 'premium' 
WHERE plan_type = 'pro';

-- Update existing 'pro' plan types to 'premium' in subscriptions table
UPDATE subscriptions 
SET plan_type = 'premium' 
WHERE plan_type = 'pro';

-- Add comment to document valid plan types
COMMENT ON COLUMN user_scan_usage.plan_type IS 'Valid values: free, premium, business';
COMMENT ON COLUMN subscriptions.plan_type IS 'Valid values: free, premium, business';