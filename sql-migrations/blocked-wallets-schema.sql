-- Create blocked_wallets table for managing malicious wallets
CREATE TABLE IF NOT EXISTS blocked_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by VARCHAR(255) NOT NULL DEFAULT 'admin',
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_wallets_address ON blocked_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_blocked_wallets_active ON blocked_wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_wallets_severity ON blocked_wallets(severity);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blocked_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blocked_wallets_updated_at
    BEFORE UPDATE ON blocked_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_blocked_wallets_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE blocked_wallets ENABLE ROW LEVEL SECURITY;

-- Policy for admin access (service role)
CREATE POLICY "Admin can manage blocked wallets" ON blocked_wallets
    FOR ALL USING (true);

-- Policy for public read access (for checking if wallet is blocked)
CREATE POLICY "Public can read blocked wallets" ON blocked_wallets
    FOR SELECT USING (is_active = true);

-- Insert some example blocked wallets (optional - for testing)
-- INSERT INTO blocked_wallets (wallet_address, reason, severity, notes) VALUES
-- ('11111111111111111111111111111111111111111111', 'Spam and phishing attempts', 'high', 'Multiple reports of malicious behavior'),
-- ('22222222222222222222222222222222222222222222', 'Scam attempts', 'critical', 'Confirmed scammer targeting users');

COMMENT ON TABLE blocked_wallets IS 'Table for managing blocked wallets to prevent malicious users from accessing the platform';
COMMENT ON COLUMN blocked_wallets.wallet_address IS 'Solana wallet address (base58 encoded, 44 characters)';
COMMENT ON COLUMN blocked_wallets.reason IS 'Reason for blocking the wallet';
COMMENT ON COLUMN blocked_wallets.blocked_by IS 'Admin or system that blocked the wallet';
COMMENT ON COLUMN blocked_wallets.blocked_at IS 'Timestamp when the wallet was blocked';
COMMENT ON COLUMN blocked_wallets.is_active IS 'Whether the block is currently active';
COMMENT ON COLUMN blocked_wallets.notes IS 'Additional notes about the block';
COMMENT ON COLUMN blocked_wallets.severity IS 'Severity level of the block (low, medium, high, critical)';
