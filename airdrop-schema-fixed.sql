-- FIXED AIRDROP SCHEMA - HANDLES EXISTING TRIGGERS GRACEFULLY
-- Run this instead of the original airdrop-schema.sql

-- Create airdrop_campaigns table
CREATE TABLE IF NOT EXISTS airdrop_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  token_mint TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  total_amount BIGINT NOT NULL DEFAULT 0,
  claimed_amount BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  eligibility JSONB NOT NULL DEFAULT '{}', -- Store eligibility criteria as JSON
  created_by TEXT NOT NULL, -- Admin wallet address who created the campaign
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create airdrop_claims table
CREATE TABLE IF NOT EXISTS airdrop_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES airdrop_campaigns(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount BIGINT NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  transaction_hash TEXT, -- Solana transaction hash when claim is processed
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, wallet_address) -- Prevent duplicate claims
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_airdrop_campaigns_active ON airdrop_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_airdrop_campaigns_dates ON airdrop_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_airdrop_campaigns_created_by ON airdrop_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_campaign ON airdrop_claims(campaign_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_wallet ON airdrop_claims(wallet_address);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_status ON airdrop_claims(status);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_claimed_at ON airdrop_claims(claimed_at);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (only if they don't exist)
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_airdrop_campaigns_updated_at ON airdrop_campaigns;
    DROP TRIGGER IF EXISTS update_airdrop_claims_updated_at ON airdrop_claims;
    
    -- Create triggers
    CREATE TRIGGER update_airdrop_campaigns_updated_at 
        BEFORE UPDATE ON airdrop_campaigns 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_airdrop_claims_updated_at 
        BEFORE UPDATE ON airdrop_claims 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Create function to get campaign statistics
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid UUID)
RETURNS TABLE (
  total_claims BIGINT,
  unique_claimers BIGINT,
  total_claimed_amount BIGINT,
  remaining_amount BIGINT
) AS $$
DECLARE
  campaign_total BIGINT;
BEGIN
  -- Get campaign total amount
  SELECT total_amount INTO campaign_total
  FROM airdrop_campaigns
  WHERE id = campaign_uuid;
  
  -- Calculate statistics
  RETURN QUERY
  SELECT 
    COUNT(*) as total_claims,
    COUNT(DISTINCT wallet_address) as unique_claimers,
    COALESCE(SUM(amount), 0) as total_claimed_amount,
    (campaign_total - COALESCE(SUM(amount), 0)) as remaining_amount
  FROM airdrop_claims
  WHERE campaign_id = campaign_uuid
  AND status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user eligibility
CREATE OR REPLACE FUNCTION check_user_eligibility(
  campaign_uuid UUID,
  user_wallet TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  campaign_data RECORD;
  whitelist_array TEXT[];
BEGIN
  -- Get campaign data
  SELECT eligibility, is_active, start_date, end_date
  INTO campaign_data
  FROM airdrop_campaigns
  WHERE id = campaign_uuid;
  
  -- Check if campaign exists and is active
  IF NOT FOUND OR NOT campaign_data.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if campaign is within date range
  IF NOW() < campaign_data.start_date OR NOW() > campaign_data.end_date THEN
    RETURN FALSE;
  END IF;
  
  -- Check whitelist if exists
  IF campaign_data.eligibility->>'whitelist' IS NOT NULL THEN
    SELECT array_agg(value::TEXT)
    INTO whitelist_array
    FROM jsonb_array_elements_text(campaign_data.eligibility->'whitelist');
    
    IF whitelist_array IS NOT NULL AND NOT (user_wallet = ANY(whitelist_array)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check if user already claimed
  IF EXISTS (
    SELECT 1 FROM airdrop_claims 
    WHERE campaign_id = campaign_uuid 
    AND wallet_address = user_wallet
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS (Row Level Security)
ALTER TABLE airdrop_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrop_claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Airdrop campaigns are publicly readable" ON airdrop_campaigns;
DROP POLICY IF EXISTS "Airdrop campaigns are modifiable by admins" ON airdrop_campaigns;
DROP POLICY IF EXISTS "Users can view their own claims" ON airdrop_claims;
DROP POLICY IF EXISTS "Admins can view all claims" ON airdrop_claims;
DROP POLICY IF EXISTS "Users can insert their own claims" ON airdrop_claims;
DROP POLICY IF EXISTS "Admins can update claims" ON airdrop_claims;

-- Create RLS policies
-- Airdrop campaigns: Everyone can read active campaigns, only admins can modify
CREATE POLICY "Airdrop campaigns are publicly readable" ON airdrop_campaigns FOR SELECT USING (true);
CREATE POLICY "Airdrop campaigns are modifiable by admins" ON airdrop_campaigns FOR ALL USING (
  created_by IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Airdrop claims: Users can read their own claims, admins can read all
CREATE POLICY "Users can view their own claims" ON airdrop_claims FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all claims" ON airdrop_claims FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can insert their own claims" ON airdrop_claims FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can update claims" ON airdrop_claims FOR UPDATE USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON airdrop_campaigns TO anon, authenticated;
GRANT ALL ON airdrop_campaigns TO authenticated;
GRANT SELECT ON airdrop_claims TO anon, authenticated;
GRANT ALL ON airdrop_claims TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_user_eligibility(UUID, TEXT) TO authenticated, anon;

-- Insert some default airdrop campaigns
INSERT INTO airdrop_campaigns (name, description, token_mint, token_symbol, total_amount, start_date, end_date, eligibility, created_by) VALUES
(
  'LOL Token Airdrop',
  'Airdrop for LOL token holders based on their holdings and NFT rarity',
  'LOL_TOKEN_MINT_ADDRESS', -- Replace with actual LOL token mint
  'LOL',
  1000000000000, -- 1M LOL tokens
  NOW(),
  NOW() + INTERVAL '30 days',
  '{
    "tokenHoldings": [
      {"mintAddress": "LOL_TOKEN_MINT_ADDRESS", "minimumAmount": 1000000}
    ],
    "nftOwnership": [
      {"collectionAddress": "ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6", "minimumCount": 1}
    ],
    "whitelist": [],
    "platformRequirements": {
      "minimumLOLHoldings": 1000000,
      "socialVerificationRequired": true
    }
  }',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
),
(
  'Early Adopter Rewards',
  'Special airdrop for early platform adopters',
  'LOL_TOKEN_MINT_ADDRESS', -- Replace with actual LOL token mint
  'LOL',
  500000000000, -- 500K LOL tokens
  NOW(),
  NOW() + INTERVAL '60 days',
  '{
    "tokenHoldings": [],
    "nftOwnership": [
      {"collectionAddress": "ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6", "minimumCount": 3}
    ],
    "whitelist": [],
    "platformRequirements": {
      "minimumLOLHoldings": 0,
      "socialVerificationRequired": true
    }
  }',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
)
ON CONFLICT DO NOTHING;
