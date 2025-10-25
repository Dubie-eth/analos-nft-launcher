-- =====================================================
-- Los Bros NFT - Essential Database Setup
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add Los Bros columns to profile_nfts
-- ========================================
ALTER TABLE profile_nfts 
ADD COLUMN IF NOT EXISTS los_bros_tier TEXT,
ADD COLUMN IF NOT EXISTS los_bros_discount_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_final_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_platform_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS lol_balance_at_mint DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_rarity TEXT,
ADD COLUMN IF NOT EXISTS los_bros_rarity_score DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS los_bros_traits JSONB;

-- 2. Create allocation tracking table
-- ====================================
DROP TABLE IF EXISTS los_bros_allocations CASCADE;

CREATE TABLE los_bros_allocations (
  tier TEXT PRIMARY KEY,
  total_allocated INTEGER NOT NULL,
  minted_count INTEGER DEFAULT 0,
  requires_lol BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert initial allocations
-- ==============================
INSERT INTO los_bros_allocations (tier, total_allocated, requires_lol, is_active)
VALUES 
  ('TEAM', 50, 0, TRUE),
  ('COMMUNITY', 500, 1000000, TRUE),
  ('EARLY', 150, 100000, TRUE),
  ('PUBLIC', 1522, 0, TRUE)
ON CONFLICT (tier) DO UPDATE SET
  total_allocated = EXCLUDED.total_allocated,
  requires_lol = EXCLUDED.requires_lol,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. Enable RLS
-- =============
ALTER TABLE los_bros_allocations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view allocations" ON los_bros_allocations;

-- Public read access
CREATE POLICY "Anyone can view allocations"
  ON los_bros_allocations FOR SELECT
  USING (true);

-- 5. Create function to check allocation
-- =======================================
DROP FUNCTION IF EXISTS check_los_bros_allocation(TEXT, TEXT);
DROP FUNCTION IF EXISTS check_los_bros_allocation(TEXT);

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
  requires_lol BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.tier,
    a.total_allocated,
    a.minted_count,
    (a.total_allocated - a.minted_count) as remaining,
    ((a.total_allocated - a.minted_count) > 0 AND a.is_active) as is_available,
    a.requires_lol
  FROM los_bros_allocations a
  WHERE a.tier = p_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to record mint
-- ==================================
DROP FUNCTION IF EXISTS record_los_bros_mint(TEXT, TEXT, TEXT, DECIMAL, DECIMAL, INTEGER, DECIMAL);

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
BEGIN
  -- Update allocation count
  UPDATE los_bros_allocations
  SET 
    minted_count = minted_count + 1,
    updated_at = NOW()
  WHERE tier = p_tier AND minted_count < total_allocated;
  
  -- Note: profile_nfts update happens in the API route
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
-- ====================
GRANT SELECT ON los_bros_allocations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_los_bros_allocation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_los_bros_mint TO authenticated, service_role;

-- 8. Verify setup
-- ===============
SELECT 
  tier,
  total_allocated,
  minted_count,
  (total_allocated - minted_count) as remaining,
  requires_lol,
  is_active
FROM los_bros_allocations
ORDER BY 
  CASE tier
    WHEN 'TEAM' THEN 1
    WHEN 'COMMUNITY' THEN 2
    WHEN 'EARLY' THEN 3
    WHEN 'PUBLIC' THEN 4
  END;

-- ✅ Migration Complete!

