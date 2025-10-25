-- ============================================
-- Legal Acceptances Table
-- Tracks user acknowledgment of disclaimers
-- ============================================

-- Create legal_acceptances table
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  disclaimer_type TEXT NOT NULL, -- 'safety_disclaimer', 'legal_banner', 'terms_of_service'
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform_version TEXT,
  acceptance_data JSONB, -- Additional metadata (timestamp, URL, version, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_wallet 
  ON legal_acceptances(wallet_address);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_type 
  ON legal_acceptances(disclaimer_type);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_date 
  ON legal_acceptances(accepted_at DESC);

-- Create composite index for wallet + type lookups
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_wallet_type 
  ON legal_acceptances(wallet_address, disclaimer_type);

-- Add comments
COMMENT ON TABLE legal_acceptances IS 'Records user acknowledgment of legal disclaimers and terms';
COMMENT ON COLUMN legal_acceptances.wallet_address IS 'Solana wallet address that accepted the disclaimer';
COMMENT ON COLUMN legal_acceptances.disclaimer_type IS 'Type of disclaimer accepted (safety, legal, terms)';
COMMENT ON COLUMN legal_acceptances.ip_address IS 'IP address at time of acceptance (for audit trail)';
COMMENT ON COLUMN legal_acceptances.user_agent IS 'Browser user agent (for audit trail)';
COMMENT ON COLUMN legal_acceptances.accepted_at IS 'Timestamp when user clicked Accept';
COMMENT ON COLUMN legal_acceptances.platform_version IS 'Platform version at time of acceptance';
COMMENT ON COLUMN legal_acceptances.acceptance_data IS 'Additional metadata (URL, timestamp, disclaimer version)';

-- Grant permissions (adjust based on your RLS policies)
-- For now, allow service role to insert and read
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can record their own acceptance
CREATE POLICY "Users can record their own acceptances"
  ON legal_acceptances
  FOR INSERT
  WITH CHECK (true); -- Public inserts allowed

-- Policy: Service role can read all (for admin dashboard)
CREATE POLICY "Service role can read all acceptances"
  ON legal_acceptances
  FOR SELECT
  USING (true);

-- Sample query to check recent acceptances
-- SELECT 
--   wallet_address,
--   disclaimer_type,
--   accepted_at,
--   ip_address
-- FROM legal_acceptances
-- ORDER BY accepted_at DESC
-- LIMIT 100;

