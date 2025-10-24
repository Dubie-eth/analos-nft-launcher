-- ============================================================================
-- PLATFORM FEES TABLE (OPTIONAL)
-- ============================================================================
-- Tracks accumulated platform fees from NFT sales
-- This is optional - fees are already tracked in nft_sales table

CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Time period for fee collection
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Fee totals
  total_sales_volume DECIMAL(20, 9) DEFAULT 0,
  total_platform_fees DECIMAL(20, 9) DEFAULT 0,
  total_creator_royalties DECIMAL(20, 9) DEFAULT 0,
  
  -- Transaction counts
  total_transactions INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'distributed')),
  
  -- Currency
  currency VARCHAR(10) DEFAULT 'LOS',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying by period
CREATE INDEX IF NOT EXISTS idx_platform_fees_period ON platform_fees(period_start, period_end);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_platform_fees_status ON platform_fees(status);

-- Enable RLS
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view platform fees" ON platform_fees;
CREATE POLICY "Anyone can view platform fees"
  ON platform_fees
  FOR SELECT
  TO public
  USING (true);

-- Only service role can insert/update
DROP POLICY IF EXISTS "Service role can manage platform fees" ON platform_fees;
CREATE POLICY "Service role can manage platform fees"
  ON platform_fees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_platform_fees_updated_at ON platform_fees;
CREATE TRIGGER update_platform_fees_updated_at
  BEFORE UPDATE ON platform_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial record (current period)
INSERT INTO platform_fees (period_start, period_end, status)
VALUES (
  DATE_TRUNC('day', NOW()),
  DATE_TRUNC('day', NOW() + INTERVAL '1 day'),
  'pending'
)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Platform fees table created successfully';
END $$;

