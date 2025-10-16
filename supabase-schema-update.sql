-- Update Supabase schema to support saved collections and creator rewards

-- Create saved_collections table
CREATE TABLE IF NOT EXISTS saved_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT NOT NULL,
  description TEXT,
  total_supply INTEGER NOT NULL,
  mint_price DECIMAL(10,2) NOT NULL,
  reveal_type TEXT NOT NULL CHECK (reveal_type IN ('instant', 'delayed')),
  reveal_date TIMESTAMP WITH TIME ZONE,
  whitelist_enabled BOOLEAN DEFAULT FALSE,
  bonding_curve_enabled BOOLEAN DEFAULT FALSE,
  layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  collection_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'deployed', 'active', 'paused', 'completed')),
  deployed_at TIMESTAMP WITH TIME ZONE,
  collection_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creator_rewards table
CREATE TABLE IF NOT EXISTS creator_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  collection_id UUID REFERENCES saved_collections(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('creator_fee', 'royalty', 'referral', 'airdrop')),
  amount DECIMAL(18,8) NOT NULL DEFAULT 0,
  token_mint TEXT,
  token_symbol TEXT DEFAULT 'LOS',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimable', 'claimed')),
  claim_tx_signature TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_sales table for tracking sales and fees
CREATE TABLE IF NOT EXISTS collection_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES saved_collections(id) ON DELETE CASCADE,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT,
  nft_mint TEXT NOT NULL,
  sale_price DECIMAL(18,8) NOT NULL,
  creator_fee DECIMAL(18,8) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(18,8) NOT NULL DEFAULT 0,
  royalty_fee DECIMAL(18,8) NOT NULL DEFAULT 0,
  tx_signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_wallet ON saved_collections(user_wallet);
CREATE INDEX IF NOT EXISTS idx_saved_collections_status ON saved_collections(status);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_user_wallet ON creator_rewards(user_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_status ON creator_rewards(status);
CREATE INDEX IF NOT EXISTS idx_collection_sales_collection_id ON collection_sales(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_sales_buyer_wallet ON collection_sales(buyer_wallet);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_saved_collections_updated_at 
    BEFORE UPDATE ON saved_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_rewards_updated_at 
    BEFORE UPDATE ON creator_rewards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE saved_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_collections
CREATE POLICY "Users can view their own collections" ON saved_collections
    FOR SELECT USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own collections" ON saved_collections
    FOR INSERT WITH CHECK (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own collections" ON saved_collections
    FOR UPDATE USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can delete their own collections" ON saved_collections
    FOR DELETE USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create RLS policies for creator_rewards
CREATE POLICY "Users can view their own rewards" ON creator_rewards
    FOR SELECT USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own rewards" ON creator_rewards
    FOR UPDATE USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create RLS policies for collection_sales (read-only for users)
CREATE POLICY "Users can view sales for their collections" ON collection_sales
    FOR SELECT USING (
        collection_id IN (
            SELECT id FROM saved_collections 
            WHERE user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
    );

-- Create function to calculate total creator rewards
CREATE OR REPLACE FUNCTION get_user_total_rewards(user_wallet_param TEXT)
RETURNS TABLE (
    total_claimable DECIMAL(18,8),
    total_claimed DECIMAL(18,8),
    pending_rewards DECIMAL(18,8)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'claimable' THEN amount ELSE 0 END), 0) as total_claimable,
        COALESCE(SUM(CASE WHEN status = 'claimed' THEN amount ELSE 0 END), 0) as total_claimed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_rewards
    FROM creator_rewards 
    WHERE user_wallet = user_wallet_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get collection statistics
CREATE OR REPLACE FUNCTION get_collection_stats(collection_id_param UUID)
RETURNS TABLE (
    total_sales DECIMAL(18,8),
    total_creator_fees DECIMAL(18,8),
    total_volume DECIMAL(18,8),
    nft_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sale_price), 0) as total_sales,
        COALESCE(SUM(creator_fee), 0) as total_creator_fees,
        COALESCE(SUM(sale_price), 0) as total_volume,
        COUNT(*)::INTEGER as nft_count
    FROM collection_sales 
    WHERE collection_id = collection_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
