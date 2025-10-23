-- Create whitelist_registry table for tracking LOL token holder whitelist positions
CREATE TABLE IF NOT EXISTS whitelist_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_registry_wallet ON whitelist_registry(wallet_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_registry_position ON whitelist_registry(position);
CREATE INDEX IF NOT EXISTS idx_whitelist_registry_added_at ON whitelist_registry(added_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE whitelist_registry ENABLE ROW LEVEL SECURITY;

-- Policy for admin access (service role)
CREATE POLICY "Admin can manage whitelist registry" ON whitelist_registry
    FOR ALL USING (true);

-- Policy for public read access (for checking whitelist status)
CREATE POLICY "Public can read whitelist registry" ON whitelist_registry
    FOR SELECT USING (true);

COMMENT ON TABLE whitelist_registry IS 'Table for tracking LOL token holder whitelist positions (first 100 wallets with 1M+ LOL tokens)';
COMMENT ON COLUMN whitelist_registry.wallet_address IS 'Solana wallet address of LOL token holder';
COMMENT ON COLUMN whitelist_registry.position IS 'Whitelist position number (1-100)';
COMMENT ON COLUMN whitelist_registry.added_at IS 'Timestamp when the wallet was added to whitelist';
COMMENT ON COLUMN whitelist_registry.created_at IS 'Timestamp when the record was created';
