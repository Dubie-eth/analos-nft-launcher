-- EXCLUSIVE NFT COLLECTION DATABASE SCHEMA
-- For your 2,222 NFT collection with LOL whitelist and bonding curve

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
  revealed BOOLEAN DEFAULT FALSE,
  reveal_threshold INTEGER DEFAULT 1900,
  pre_reveal_image_url TEXT DEFAULT 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
  bonding_curve_start_price DECIMAL(10,4) DEFAULT 0.1,
  bonding_curve_end_price DECIMAL(10,4) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOL token whitelist table
CREATE TABLE IF NOT EXISTS lol_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  lol_balance BIGINT NOT NULL,
  eligible BOOLEAN DEFAULT TRUE,
  claim_order INTEGER,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  token_allocation INTEGER DEFAULT 1000, -- LOS tokens for whitelist holders
  snapshot_date TIMESTAMPTZ DEFAULT NOW(),
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
('LEGENDARY', 1, 100, 1000, '{"effects": ["Golden Aura", "Exclusive Background", "Rare Effects"], "rarity": "1/22"}'),
('EPIC', 2, 500, 500, '{"effects": ["Silver Border", "Premium Background", "Special Effects"], "rarity": "1/4"}'),
('RARE', 3, 800, 250, '{"effects": ["Bronze Accent", "Standard Background", "Basic Effects"], "rarity": "1/3"}'),
('COMMON', 4, 500, 100, '{"effects": ["Standard Design", "Basic Background", "No Effects"], "rarity": "1/2"}')
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
  transaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform reserve tracking
CREATE TABLE IF NOT EXISTS platform_reserve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL, -- 'marketing', 'collaboration', 'team', etc.
  allocated_to TEXT, -- Who it's allocated to
  allocated_at TIMESTAMPTZ,
  minted BOOLEAN DEFAULT FALSE,
  minted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lol_whitelist_wallet ON lol_whitelist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_lol_whitelist_eligible ON lol_whitelist(eligible) WHERE eligible = TRUE;
CREATE INDEX IF NOT EXISTS idx_lol_whitelist_claim_order ON lol_whitelist(claim_order);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_owner ON nft_tokens(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_mint_order ON nft_tokens(mint_order);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_rarity ON nft_tokens(rarity_tier);
CREATE INDEX IF NOT EXISTS idx_minting_transactions_wallet ON minting_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_minting_transactions_timestamp ON minting_transactions(transaction_timestamp);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nft_collection_updated_at BEFORE UPDATE ON nft_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lol_whitelist_updated_at BEFORE UPDATE ON lol_whitelist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nft_tokens_updated_at BEFORE UPDATE ON nft_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_reserve_updated_at BEFORE UPDATE ON platform_reserve FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE nft_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE lol_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE minting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reserve ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view collection config" ON nft_collection FOR SELECT USING (true);
CREATE POLICY "Admins can manage collection" ON nft_collection FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

CREATE POLICY "Public can view whitelist" ON lol_whitelist FOR SELECT USING (true);
CREATE POLICY "Users can view their whitelist status" ON lol_whitelist FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can manage whitelist" ON lol_whitelist FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

CREATE POLICY "Public can view NFT tokens" ON nft_tokens FOR SELECT USING (true);
CREATE POLICY "Users can view their NFTs" ON nft_tokens FOR SELECT USING (
  owner_wallet = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can manage NFTs" ON nft_tokens FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

CREATE POLICY "Public can view minting transactions" ON minting_transactions FOR SELECT USING (true);
CREATE POLICY "Users can view their transactions" ON minting_transactions FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can manage transactions" ON minting_transactions FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

CREATE POLICY "Admins can manage platform reserve" ON platform_reserve FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Insert initial collection configuration
INSERT INTO nft_collection (collection_name, total_supply, whitelist_supply, public_supply, platform_reserve)
VALUES ('Exclusive Collection', 2222, 100, 1900, 222)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE nft_collection IS 'Main collection configuration and tracking';
COMMENT ON TABLE lol_whitelist IS 'LOL token holders eligible for free whitelist minting';
COMMENT ON TABLE nft_tokens IS 'Individual NFT tokens with rarity and allocation data';
COMMENT ON TABLE rarity_tiers IS 'Rarity tier configuration and token allocations';
COMMENT ON TABLE minting_transactions IS 'Log of all minting transactions';
COMMENT ON TABLE platform_reserve IS 'Platform reserve NFTs for marketing and collaborations';
