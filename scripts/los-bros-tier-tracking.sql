-- =====================================================
-- Los Bros NFT Collection - Tier Tracking & Allocation
-- =====================================================
-- This migration adds tier tracking, allocation limits,
-- and mint counting for the Los Bros whitelist system.
-- =====================================================

-- 1. Add tier tracking columns to profile_nfts table
-- ====================================================
ALTER TABLE profile_nfts 
ADD COLUMN IF NOT EXISTS los_bros_tier TEXT CHECK (los_bros_tier IN ('TEAM', 'EARLY', 'COMMUNITY', 'PUBLIC')),
ADD COLUMN IF NOT EXISTS los_bros_discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_final_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_platform_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS lol_balance_at_mint DECIMAL(20, 2) DEFAULT 0;

-- Add index for tier queries
CREATE INDEX IF NOT EXISTS idx_profile_nfts_los_bros_tier 
ON profile_nfts(los_bros_tier) 
WHERE los_bros_tier IS NOT NULL;

-- Add index for Los Bros token ID queries
CREATE INDEX IF NOT EXISTS idx_profile_nfts_los_bros_token 
ON profile_nfts(los_bros_token_id) 
WHERE los_bros_token_id IS NOT NULL;

COMMENT ON COLUMN profile_nfts.los_bros_tier IS 'Whitelist tier at time of mint: TEAM, EARLY, COMMUNITY, or PUBLIC';
COMMENT ON COLUMN profile_nfts.los_bros_discount_percent IS 'Discount percentage applied (0-100)';
COMMENT ON COLUMN profile_nfts.los_bros_final_price IS 'Final price paid in LOS tokens';
COMMENT ON COLUMN profile_nfts.los_bros_platform_fee IS 'Platform fee paid in LOS tokens';
COMMENT ON COLUMN profile_nfts.lol_balance_at_mint IS '$LOL token balance at time of mint';

-- 2. Create tier allocation tracking table
-- =========================================
CREATE TABLE IF NOT EXISTS los_bros_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('TEAM', 'EARLY', 'COMMUNITY', 'PUBLIC')),
  
  -- Allocation limits
  total_allocated INTEGER NOT NULL,
  minted_count INTEGER DEFAULT 0,
  remaining INTEGER GENERATED ALWAYS AS (total_allocated - minted_count) STORED,
  
  -- Pricing info
  base_price DECIMAL(10, 2) NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  platform_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 6.9,
  
  -- Requirements
  lol_token_requirement BIGINT DEFAULT 0,
  lol_token_mint TEXT DEFAULT 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique tier
  UNIQUE(tier)
);

-- Add RLS policies
ALTER TABLE los_bros_allocations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view allocations"
  ON los_bros_allocations FOR SELECT
  USING (true);

-- Only admins can modify (service role only)
CREATE POLICY "Service role can modify allocations"
  ON los_bros_allocations FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE los_bros_allocations IS 'Tracks mint allocations and limits for each Los Bros whitelist tier';

-- 3. Insert initial allocation data
-- ==================================
INSERT INTO los_bros_allocations (tier, total_allocated, minted_count, base_price, discount_percent, final_price, lol_token_requirement, sale_start_date)
VALUES 
  ('TEAM', 50, 0, 4200.69, 100, 0, 0, NOW()),
  ('COMMUNITY', 500, 0, 4200.69, 100, 290.05, 1000000, NOW()),
  ('EARLY', 150, 0, 4200.69, 50, 2100.35, 100000, NOW()),
  ('PUBLIC', 1522, 0, 4200.69, 0, 4200.69, 0, NOW() + INTERVAL '7 days')
ON CONFLICT (tier) DO UPDATE SET
  total_allocated = EXCLUDED.total_allocated,
  base_price = EXCLUDED.base_price,
  discount_percent = EXCLUDED.discount_percent,
  final_price = EXCLUDED.final_price,
  lol_token_requirement = EXCLUDED.lol_token_requirement,
  updated_at = NOW();

-- 4. Create function to check allocation availability
-- ====================================================
CREATE OR REPLACE FUNCTION check_los_bros_allocation(
  p_tier TEXT,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  tier TEXT,
  allocated INTEGER,
  minted INTEGER,
  remaining INTEGER,
  is_available BOOLEAN,
  requires_lol BIGINT,
  final_price DECIMAL,
  discount INTEGER,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.tier,
    a.total_allocated,
    a.minted_count,
    a.remaining,
    (a.remaining > 0 AND a.is_active) as is_available,
    a.lol_token_requirement,
    a.final_price,
    a.discount_percent,
    CASE 
      WHEN NOT a.is_active THEN 'Tier not active'
      WHEN a.remaining <= 0 THEN 'Allocation sold out'
      WHEN a.sale_start_date > NOW() THEN 'Sale not started yet'
      WHEN a.sale_end_date IS NOT NULL AND a.sale_end_date < NOW() THEN 'Sale ended'
      ELSE 'Available'
    END as message
  FROM los_bros_allocations a
  WHERE a.tier = p_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_los_bros_allocation IS 'Check if allocation is available for a specific tier';

-- 5. Create function to record Los Bros mint
-- ===========================================
CREATE OR REPLACE FUNCTION record_los_bros_mint(
  p_wallet_address TEXT,
  p_mint_address TEXT,
  p_tier TEXT,
  p_lol_balance DECIMAL,
  p_final_price DECIMAL,
  p_discount INTEGER,
  p_platform_fee DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_allocation_available BOOLEAN;
  v_remaining INTEGER;
BEGIN
  -- Check if allocation is available
  SELECT remaining > 0 AND is_active INTO v_allocation_available
  FROM los_bros_allocations
  WHERE tier = p_tier
  FOR UPDATE; -- Lock the row
  
  IF NOT v_allocation_available THEN
    RAISE EXCEPTION 'Allocation not available for tier: %', p_tier;
  END IF;
  
  -- Update allocation count
  UPDATE los_bros_allocations
  SET 
    minted_count = minted_count + 1,
    updated_at = NOW()
  WHERE tier = p_tier;
  
  -- Update profile_nfts record with tier info
  UPDATE profile_nfts
  SET
    los_bros_tier = p_tier,
    los_bros_discount_percent = p_discount,
    los_bros_final_price = p_final_price,
    los_bros_platform_fee = p_platform_fee,
    lol_balance_at_mint = p_lol_balance,
    updated_at = NOW()
  WHERE mint_address = p_mint_address;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error recording Los Bros mint: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_los_bros_mint IS 'Records a Los Bros mint and updates allocation count atomically';

-- 6. Create trigger to update allocation updated_at
-- ==================================================
CREATE OR REPLACE FUNCTION update_los_bros_allocation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_los_bros_allocation_timestamp ON los_bros_allocations;
CREATE TRIGGER trigger_update_los_bros_allocation_timestamp
  BEFORE UPDATE ON los_bros_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_los_bros_allocation_timestamp();

-- 7. Create view for allocation status summary
-- =============================================
CREATE OR REPLACE VIEW los_bros_allocation_status AS
SELECT 
  tier,
  total_allocated,
  minted_count,
  remaining,
  (minted_count::FLOAT / total_allocated::FLOAT * 100)::DECIMAL(5,2) as percent_minted,
  base_price,
  discount_percent,
  final_price,
  platform_fee_percent,
  lol_token_requirement,
  is_active,
  sale_start_date,
  sale_end_date,
  CASE 
    WHEN NOT is_active THEN 'INACTIVE'
    WHEN remaining <= 0 THEN 'SOLD OUT'
    WHEN sale_start_date > NOW() THEN 'UPCOMING'
    WHEN sale_end_date IS NOT NULL AND sale_end_date < NOW() THEN 'ENDED'
    ELSE 'ACTIVE'
  END as status
FROM los_bros_allocations
ORDER BY 
  CASE tier
    WHEN 'TEAM' THEN 1
    WHEN 'COMMUNITY' THEN 2
    WHEN 'EARLY' THEN 3
    WHEN 'PUBLIC' THEN 4
  END;

COMMENT ON VIEW los_bros_allocation_status IS 'Summary view of all Los Bros allocation tiers';

-- 8. Grant permissions
-- ====================
GRANT SELECT ON los_bros_allocations TO anon, authenticated;
GRANT SELECT ON los_bros_allocation_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_los_bros_allocation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_los_bros_mint TO authenticated, service_role;

-- 9. Verification queries
-- ========================
-- Run these to verify the migration worked:

-- View all allocations
SELECT * FROM los_bros_allocation_status;

-- Check specific tier
SELECT * FROM check_los_bros_allocation('COMMUNITY');

-- View recent Los Bros mints with tier info
SELECT 
  wallet_address,
  username,
  los_bros_tier,
  los_bros_discount_percent,
  los_bros_final_price,
  lol_balance_at_mint,
  mint_date
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY mint_date DESC
LIMIT 10;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- ✅ Tier tracking columns added to profile_nfts
-- ✅ Allocation limits table created
-- ✅ RLS policies configured
-- ✅ Helper functions created
-- ✅ Initial allocations inserted
-- ✅ Permissions granted
-- =====================================================

