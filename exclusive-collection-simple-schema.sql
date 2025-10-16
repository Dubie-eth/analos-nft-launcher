-- SIMPLIFIED EXCLUSIVE NFT COLLECTION SCHEMA
-- No snapshot needed - real-time ANAL token balance checking!

-- Collection configuration table
CREATE TABLE IF NOT EXISTS nft_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_name TEXT NOT NULL DEFAULT 'Exclusive Collection',
  total_supply INTEGER DEFAULT 2222,
  whitelist_supply INTEGER DEFAULT 100,
  public_supply INTEGER DEFAULT 1900,
  platform_reserve INTEGER DEFAULT 222,
  minted_count INTEGER DEFAULT 0,
  whitelist_minted INTEGER DEFAULT 0,
  public_minted INTEGER DEFAULT 0,
  whitelist_phase_active BOOLEAN DEFAULT TRUE,
  revealed BOOLEAN DEFAULT FALSE,
  reveal_threshold INTEGER DEFAULT 1900,
  pre_reveal_image_url TEXT DEFAULT 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
  bonding_curve_start_price DECIMAL(10,4) DEFAULT 0.1,
  bonding_curve_end_price DECIMAL(10,4) DEFAULT 1.0,
  anal_token_mint TEXT DEFAULT 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  min_anal_balance BIGINT DEFAULT 1000000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual NFT tokens table
CREATE TABLE IF NOT EXISTS nft_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL UNIQUE,
  owner_wallet TEXT NOT NULL,
  mint_order INTEGER NOT NULL,
  rarity_tier TEXT NOT NULL CHECK (rarity_tier IN ('LEGENDARY', 'EPIC', 'RARE', 'COMMON')),
  token_allocation INTEGER NOT NULL, -- LOS tokens allocated
  mint_price DECIMAL(10,4) NOT NULL,
  was_whitelist_mint BOOLEAN DEFAULT FALSE,
  anal_balance_at_mint BIGINT, -- Record their ANAL balance at mint time
  mint_timestamp TIMESTAMPTZ DEFAULT NOW(),
  revealed BOOLEAN DEFAULT FALSE,
  revealed_at TIMESTAMPTZ,
  metadata_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rarity tier configuration
CREATE TABLE IF NOT EXISTS rarity_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  tier_order INTEGER NOT NULL,
  count INTEGER NOT NULL,
  token_allocation INTEGER NOT NULL,
  traits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert rarity tier data
INSERT INTO rarity_tiers (tier_name, tier_order, count, token_allocation, traits) VALUES
('LEGENDARY', 1, 100, 1000, '{"effects": ["Golden Aura", "Exclusive Background", "Rare Effects"], "rarity": "1/22", "description": "First 100 mints - Whitelist holders"}'),
('EPIC', 2, 500, 500, '{"effects": ["Silver Border", "Premium Background", "Special Effects"], "rarity": "1/4", "description": "Early public mints"}'),
('RARE', 3, 800, 250, '{"effects": ["Bronze Accent", "Standard Background", "Basic Effects"], "rarity": "1/3", "description": "Mid-tier public mints"}'),
('COMMON', 4, 500, 100, '{"effects": ["Standard Design", "Basic Background", "No Effects"], "rarity": "1/2", "description": "Late public mints"}')
ON CONFLICT (tier_name) DO UPDATE SET
  count = EXCLUDED.count,
  token_allocation = EXCLUDED.token_allocation,
  traits = EXCLUDED.traits;

-- Minting transactions log
CREATE TABLE IF NOT EXISTS minting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_signature TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  token_id TEXT,
  mint_price DECIMAL(10,4) NOT NULL,
  mint_order INTEGER,
  rarity_tier TEXT,
  token_allocation INTEGER,
  was_whitelist_mint BOOLEAN DEFAULT FALSE,
  anal_balance_at_mint BIGINT, -- Record ANAL balance for verification
  transaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform reserve tracking
CREATE TABLE IF NOT EXISTS platform_reserve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT UNIQUE,
  purpose TEXT NOT NULL, -- 'marketing', 'collaboration', 'team', etc.
  allocated_to TEXT, -- Who it's allocated to
  allocated_at TIMESTAMPTZ,
  minted BOOLEAN DEFAULT FALSE,
  minted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whitelist claims tracking (optional - for tracking who minted during whitelist)
CREATE TABLE IF NOT EXISTS whitelist_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  anal_balance_at_claim BIGINT NOT NULL,
  token_id TEXT,
  claim_order INTEGER,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nft_tokens_owner ON nft_tokens(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_mint_order ON nft_tokens(mint_order);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_rarity ON nft_tokens(rarity_tier);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_whitelist ON nft_tokens(was_whitelist_mint);
CREATE INDEX IF NOT EXISTS idx_minting_transactions_wallet ON minting_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_minting_transactions_timestamp ON minting_transactions(transaction_timestamp);
CREATE INDEX IF NOT EXISTS idx_whitelist_claims_wallet ON whitelist_claims(wallet_address);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_nft_collection_updated_at ON nft_collection;
CREATE TRIGGER update_nft_collection_updated_at BEFORE UPDATE ON nft_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nft_tokens_updated_at ON nft_tokens;
CREATE TRIGGER update_nft_tokens_updated_at BEFORE UPDATE ON nft_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_reserve_updated_at ON platform_reserve;
CREATE TRIGGER update_platform_reserve_updated_at BEFORE UPDATE ON platform_reserve FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE nft_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE minting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reserve ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelist_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view collection config" ON nft_collection;
CREATE POLICY "Public can view collection config" ON nft_collection FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage collection" ON nft_collection;
CREATE POLICY "Admins can manage collection" ON nft_collection FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

DROP POLICY IF EXISTS "Public can view NFT tokens" ON nft_tokens;
CREATE POLICY "Public can view NFT tokens" ON nft_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their NFTs" ON nft_tokens;
CREATE POLICY "Users can view their NFTs" ON nft_tokens FOR SELECT USING (
  owner_wallet = current_setting('app.current_user_wallet', true)
);

DROP POLICY IF EXISTS "Admins can manage NFTs" ON nft_tokens;
CREATE POLICY "Admins can manage NFTs" ON nft_tokens FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

DROP POLICY IF EXISTS "Public can view minting transactions" ON minting_transactions;
CREATE POLICY "Public can view minting transactions" ON minting_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage transactions" ON minting_transactions;
CREATE POLICY "Admins can manage transactions" ON minting_transactions FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

DROP POLICY IF EXISTS "Admins can manage platform reserve" ON platform_reserve;
CREATE POLICY "Admins can manage platform reserve" ON platform_reserve FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

DROP POLICY IF EXISTS "Public can view whitelist claims" ON whitelist_claims;
CREATE POLICY "Public can view whitelist claims" ON whitelist_claims FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage whitelist claims" ON whitelist_claims;
CREATE POLICY "Admins can manage whitelist claims" ON whitelist_claims FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Insert initial collection configuration
INSERT INTO nft_collection (
  collection_name, 
  total_supply, 
  whitelist_supply, 
  public_supply, 
  platform_reserve,
  anal_token_mint,
  min_anal_balance
)
VALUES (
  'Exclusive Collection', 
  2222, 
  100, 
  1900, 
  222,
  'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  1000000
)
ON CONFLICT DO NOTHING;

-- Pre-allocate platform reserve purposes
INSERT INTO platform_reserve (purpose, notes) VALUES
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions'),
('marketing', 'Marketing campaigns and promotions')
ON CONFLICT DO NOTHING;

-- (Repeat for other purposes as needed)

-- Comments for documentation
COMMENT ON TABLE nft_collection IS 'Main collection configuration and tracking - NO SNAPSHOT NEEDED!';
COMMENT ON TABLE nft_tokens IS 'Individual NFT tokens with rarity and allocation data';
COMMENT ON TABLE rarity_tiers IS 'Rarity tier configuration and token allocations';
COMMENT ON TABLE minting_transactions IS 'Log of all minting transactions with ANAL balance recorded';
COMMENT ON TABLE platform_reserve IS 'Platform reserve NFTs for marketing and collaborations';
COMMENT ON TABLE whitelist_claims IS 'Track whitelist mints - balance checked in real-time at mint!';
