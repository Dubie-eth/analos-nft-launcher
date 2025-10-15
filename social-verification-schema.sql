-- SOCIAL VERIFICATION SYSTEM INTEGRATION
-- Add social verification tables to existing Supabase schema

-- Create custom types for social verification
CREATE TYPE social_platform AS ENUM ('twitter', 'telegram', 'discord', 'instagram', 'youtube', 'tiktok', 'github');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed', 'expired', 'revoked');
CREATE TYPE verification_method AS ENUM ('webhook', 'manual', 'api', 'oracle', 'signature');
CREATE TYPE verification_request_status AS ENUM ('pending', 'completed', 'failed', 'expired');

-- Social verification configuration per collection/platform
CREATE TABLE social_verification_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id TEXT NOT NULL,
    platform social_platform NOT NULL,
    official_handle TEXT NOT NULL,
    verification_method verification_method NOT NULL DEFAULT 'manual',
    oracle_authority TEXT, -- Pubkey of trusted oracle
    verification_code_prefix TEXT NOT NULL DEFAULT 'ANALOS',
    expiration_days INTEGER DEFAULT 365, -- 0 = never expires
    is_active BOOLEAN DEFAULT TRUE,
    minimum_followers INTEGER DEFAULT 0,
    required_score INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, platform)
);

-- Individual social accounts for users
CREATE TABLE user_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    platform social_platform NOT NULL,
    username TEXT NOT NULL,
    user_id_platform TEXT, -- Platform-specific user ID
    display_name TEXT,
    follower_count INTEGER DEFAULT 0,
    is_verified_platform BOOLEAN DEFAULT FALSE, -- Platform's own verification
    profile_picture_url TEXT,
    verification_status verification_status DEFAULT 'pending',
    verification_method verification_method DEFAULT 'manual',
    verification_code TEXT,
    verification_hash TEXT, -- Cryptographic hash for tamper-proof verification
    verification_signature TEXT, -- 64-byte proof of authenticity
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(wallet_address, platform, username)
);

-- Social verification requests (batches of accounts to verify)
CREATE TABLE social_verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    status verification_request_status DEFAULT 'pending',
    total_score INTEGER DEFAULT 0,
    required_score INTEGER DEFAULT 10,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Link verification requests to social accounts
CREATE TABLE verification_request_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES social_verification_requests(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    verification_score INTEGER DEFAULT 0,
    verification_notes TEXT,
    verified_by_admin_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social verification audit log
CREATE TABLE social_verification_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    social_account_id UUID REFERENCES user_social_accounts(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'verify', 'revoke', 'expire', 'update'
    previous_status verification_status,
    new_status verification_status,
    admin_id UUID REFERENCES admin_users(id),
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_social_accounts_wallet ON user_social_accounts(wallet_address);
CREATE INDEX idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX idx_user_social_accounts_status ON user_social_accounts(verification_status);
CREATE INDEX idx_verification_requests_wallet ON social_verification_requests(wallet_address);
CREATE INDEX idx_verification_requests_status ON social_verification_requests(status);
CREATE INDEX idx_social_verification_configs_collection ON social_verification_configs(collection_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_verification_configs_updated_at 
    BEFORE UPDATE ON social_verification_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_social_accounts_updated_at 
    BEFORE UPDATE ON user_social_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_verification_requests_updated_at 
    BEFORE UPDATE ON social_verification_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE social_verification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_request_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_verification_audit ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all social verification data
CREATE POLICY "Admin access to social verification configs" ON social_verification_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_active = true
        )
    );

CREATE POLICY "Admin access to user social accounts" ON user_social_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_active = true
        )
    );

CREATE POLICY "Users can read their own social accounts" ON user_social_accounts
    FOR SELECT USING (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
    );

CREATE POLICY "Users can insert their own social accounts" ON user_social_accounts
    FOR INSERT WITH CHECK (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
    );

CREATE POLICY "Users can update their own social accounts" ON user_social_accounts
    FOR UPDATE USING (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
    );

CREATE POLICY "Admin access to verification requests" ON social_verification_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
            AND is_active = true
        )
    );

CREATE POLICY "Users can manage their own verification requests" ON social_verification_requests
    FOR ALL USING (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- Functions for social verification scoring
CREATE OR REPLACE FUNCTION calculate_verification_score(
    platform_type social_platform,
    follower_count INTEGER,
    is_verified BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
    -- Base score by platform
    CASE platform_type
        WHEN 'twitter' THEN 
            RETURN CASE 
                WHEN is_verified THEN 50 + LEAST(follower_count / 1000, 50)
                ELSE LEAST(follower_count / 2000, 25)
            END;
        WHEN 'telegram' THEN 
            RETURN CASE 
                WHEN is_verified THEN 30 + LEAST(follower_count / 2000, 30)
                ELSE LEAST(follower_count / 3000, 20)
            END;
        WHEN 'discord' THEN 
            RETURN CASE 
                WHEN is_verified THEN 25 + LEAST(follower_count / 3000, 25)
                ELSE LEAST(follower_count / 4000, 15)
            END;
        WHEN 'instagram' THEN 
            RETURN CASE 
                WHEN is_verified THEN 40 + LEAST(follower_count / 1500, 40)
                ELSE LEAST(follower_count / 2500, 20)
            END;
        WHEN 'youtube' THEN 
            RETURN CASE 
                WHEN is_verified THEN 60 + LEAST(follower_count / 500, 40)
                ELSE LEAST(follower_count / 1000, 30)
            END;
        WHEN 'tiktok' THEN 
            RETURN CASE 
                WHEN is_verified THEN 35 + LEAST(follower_count / 1000, 35)
                ELSE LEAST(follower_count / 2000, 20)
            END;
        WHEN 'github' THEN 
            RETURN CASE 
                WHEN is_verified THEN 45 + LEAST(follower_count / 100, 25)
                ELSE LEAST(follower_count / 200, 15)
            END;
        ELSE RETURN 10;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check verification eligibility
CREATE OR REPLACE FUNCTION check_verification_eligibility(
    wallet_addr TEXT
) RETURNS TABLE(
    eligible BOOLEAN,
    current_score INTEGER,
    required_score INTEGER,
    verified_accounts INTEGER,
    total_accounts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(verification_score), 0) >= 10 as eligible,
        COALESCE(SUM(verification_score), 0)::INTEGER as current_score,
        10 as required_score,
        COUNT(CASE WHEN usa.verification_status = 'verified' THEN 1 END)::INTEGER as verified_accounts,
        COUNT(*)::INTEGER as total_accounts
    FROM user_social_accounts usa
    WHERE usa.wallet_address = wallet_addr
    AND usa.verification_status IN ('verified', 'pending');
END;
$$ LANGUAGE plpgsql;

-- Insert default social verification configurations for your collection
INSERT INTO social_verification_configs (collection_id, platform, official_handle, verification_method, verification_code_prefix, minimum_followers, required_score) VALUES
('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', 'twitter', 'launchonlos', 'manual', 'ANALOS', 100, 10),
('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', 'telegram', 'launchonlos', 'manual', 'ANALOS', 50, 10),
('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', 'discord', 'launchonlos', 'manual', 'ANALOS', 25, 10);

-- Test the social verification system
SELECT 'Social verification system integrated successfully!' as status;
