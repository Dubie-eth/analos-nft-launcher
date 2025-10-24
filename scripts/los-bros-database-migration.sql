-- ============================================================================
-- LOS BROS + SOCIAL LINKS DATABASE MIGRATION
-- ============================================================================
-- Adds support for Los Bros NFT integration and social links to Profile NFTs
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add new columns to profile_nfts table
ALTER TABLE profile_nfts 
ADD COLUMN IF NOT EXISTS los_bros_token_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS los_bros_rarity VARCHAR(20),
ADD COLUMN IF NOT EXISTS discord_handle VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_handle VARCHAR(255);

-- Add unique constraint on username (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profile_nfts_username_unique'
  ) THEN
    ALTER TABLE profile_nfts 
    ADD CONSTRAINT profile_nfts_username_unique UNIQUE (username);
    RAISE NOTICE '✓ Added unique constraint on username';
  ELSE
    RAISE NOTICE '⊘ Unique constraint already exists on username';
  END IF;
END $$;

-- Add index for Los Bros queries
CREATE INDEX IF NOT EXISTS idx_profile_nfts_los_bros 
ON profile_nfts(los_bros_token_id) 
WHERE los_bros_token_id IS NOT NULL;

-- Create los_bros_nfts table
CREATE TABLE IF NOT EXISTS los_bros_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  token_id INTEGER NOT NULL,
  traits JSONB NOT NULL,
  rarity_score DECIMAL(5,2) NOT NULL,
  rarity_tier VARCHAR(20) NOT NULL CHECK (rarity_tier IN ('LEGENDARY', 'EPIC', 'RARE', 'COMMON')),
  metadata_uri TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for los_bros_nfts
CREATE INDEX IF NOT EXISTS idx_los_bros_wallet ON los_bros_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_los_bros_rarity ON los_bros_nfts(rarity_tier);
CREATE INDEX IF NOT EXISTS idx_los_bros_token_id ON los_bros_nfts(token_id);

-- Enable RLS on los_bros_nfts
ALTER TABLE los_bros_nfts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for los_bros_nfts (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own Los Bros" ON los_bros_nfts;
DROP POLICY IF EXISTS "Service role full access to Los Bros" ON los_bros_nfts;
DROP POLICY IF EXISTS "Anyone can view Los Bros (public)" ON los_bros_nfts;

CREATE POLICY "Users can view their own Los Bros"
  ON los_bros_nfts FOR SELECT
  TO authenticated
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role full access to Los Bros"
  ON los_bros_nfts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view Los Bros (public)"
  ON los_bros_nfts FOR SELECT
  TO anon
  USING (true);

-- Create updated_at trigger for los_bros_nfts
CREATE OR REPLACE FUNCTION update_los_bros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS los_bros_updated_at ON los_bros_nfts;

CREATE TRIGGER los_bros_updated_at
  BEFORE UPDATE ON los_bros_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_los_bros_updated_at();

-- Verification queries
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ LOS BROS DATABASE MIGRATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  ✓ Added los_bros_token_id column to profile_nfts';
  RAISE NOTICE '  ✓ Added los_bros_rarity column to profile_nfts';
  RAISE NOTICE '  ✓ Added discord_handle column to profile_nfts';
  RAISE NOTICE '  ✓ Added telegram_handle column to profile_nfts';
  RAISE NOTICE '  ✓ Created los_bros_nfts table with RLS';
  RAISE NOTICE '  ✓ Added indexes for performance';
  RAISE NOTICE '  ✓ Added RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Los Bros integration ready!';
  RAISE NOTICE '🔗 Social links ready!';
  RAISE NOTICE '';
END $$;

