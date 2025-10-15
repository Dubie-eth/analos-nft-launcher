-- SECURITY MONITORING DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_attempt',
    'admin_access',
    'rate_limit',
    'suspicious_activity',
    'database_access',
    'api_access'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  wallet_address TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_wallet ON security_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

-- RLS Policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read security logs
DROP POLICY IF EXISTS "Admins can read security logs" ON security_logs;
CREATE POLICY "Admins can read security logs"
  ON security_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      AND is_active = true
    )
  );

-- System can insert security logs (service role only)
DROP POLICY IF EXISTS "System can insert security logs" ON security_logs;
CREATE POLICY "System can insert security logs"
  ON security_logs
  FOR INSERT
  WITH CHECK (true);

-- Create function to clean up old logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get security statistics
CREATE OR REPLACE FUNCTION get_security_statistics(time_range_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  event_type TEXT,
  severity TEXT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.event_type,
    sl.severity,
    COUNT(*) as event_count
  FROM security_logs sl
  WHERE sl.created_at > NOW() - (time_range_hours || ' hours')::INTERVAL
  GROUP BY sl.event_type, sl.severity
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_security_logs() TO service_role;
GRANT EXECUTE ON FUNCTION get_security_statistics(INTEGER) TO service_role;

-- Create alert threshold tracking
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  time_window_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default alert thresholds
INSERT INTO security_alerts (alert_type, threshold, time_window_minutes) VALUES
  ('failed_auth_attempts', 5, 15),
  ('rate_limit_hits', 10, 5),
  ('suspicious_activity', 1, 1)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_security_alerts_updated_at ON security_alerts;
CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON security_logs TO service_role;
GRANT INSERT ON security_logs TO service_role;
GRANT SELECT, UPDATE ON security_alerts TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Security monitoring schema created successfully!';
  RAISE NOTICE '📊 Security logs table ready';
  RAISE NOTICE '🚨 Security alerts configured';
END $$;

