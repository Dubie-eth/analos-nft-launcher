-- Create free_mint_usage table for tracking LOL token holder free mints
CREATE TABLE IF NOT EXISTS free_mint_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_free_mint_usage_wallet ON free_mint_usage(wallet_address);
CREATE INDEX IF NOT EXISTS idx_free_mint_usage_used_at ON free_mint_usage(used_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE free_mint_usage ENABLE ROW LEVEL SECURITY;

-- Policy for admin access (service role)
CREATE POLICY "Admin can manage free mint usage" ON free_mint_usage
    FOR ALL USING (true);

-- Policy for public read access (for checking usage)
CREATE POLICY "Public can read free mint usage" ON free_mint_usage
    FOR SELECT USING (true);

COMMENT ON TABLE free_mint_usage IS 'Table for tracking free mint usage by LOL token holders (1 free mint per wallet)';
COMMENT ON COLUMN free_mint_usage.wallet_address IS 'Solana wallet address that used their free mint';
COMMENT ON COLUMN free_mint_usage.used_at IS 'Timestamp when the free mint was used';
COMMENT ON COLUMN free_mint_usage.created_at IS 'Timestamp when the record was created';
