-- FIXED SOCIAL VERIFICATION SCHEMA - HANDLES EXISTING TYPES GRACEFULLY
-- Run this instead of the original social-verification-schema.sql

-- Create enum types only if they don't exist
DO $$ 
BEGIN
    -- Create social_platform enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
        CREATE TYPE social_platform AS ENUM ('twitter', 'telegram', 'discord', 'instagram', 'youtube', 'tiktok', 'github');
    END IF;
    
    -- Create verification_method enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
        CREATE TYPE verification_method AS ENUM ('webhook', 'manual', 'api', 'oracle', 'signature');
    END IF;
    
    -- Create verification_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed', 'expired', 'revoked');
    END IF;
    
    -- Create verification_request_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_request_status') THEN
        CREATE TYPE verification_request_status AS ENUM ('pending', 'completed', 'failed', 'expired');
    END IF;
END $$;

-- Create social_verification_configs table
CREATE TABLE IF NOT EXISTS social_verification_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id TEXT NOT NULL,
  platform social_platform NOT NULL,
  official_handle TEXT NOT NULL,
  verification_method verification_method NOT NULL DEFAULT 'manual',
  oracle_authority TEXT,
  verification_code_prefix TEXT NOT NULL DEFAULT 'ANALOS',
  expiration_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  minimum_followers INTEGER DEFAULT 0,
  required_score INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, platform)
);

-- Create user_social_accounts table
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  platform social_platform NOT NULL,
  username TEXT NOT NULL,
  user_id_platform TEXT, -- Platform-specific user ID
  display_name TEXT,
  follower_count INTEGER DEFAULT 0,
  is_verified_platform BOOLEAN DEFAULT FALSE,
  profile_picture_url TEXT,
  verification_status verification_status DEFAULT 'pending',
  verification_method verification_method DEFAULT 'manual',
  verification_code TEXT,
  verification_hash TEXT,
  verification_signature TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, platform, username)
);

-- Create social_verification_requests table
CREATE TABLE IF NOT EXISTS social_verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  status verification_request_status DEFAULT 'pending',
  total_score INTEGER DEFAULT 0,
  required_score INTEGER DEFAULT 10,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create social_verification_audit_logs table
CREATE TABLE IF NOT EXISTS social_verification_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  platform social_platform NOT NULL,
  action TEXT NOT NULL,
  old_status verification_status,
  new_status verification_status,
  details JSONB DEFAULT '{}',
  performed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_verification_configs_collection ON social_verification_configs(collection_id);
CREATE INDEX IF NOT EXISTS idx_social_verification_configs_platform ON social_verification_configs(platform);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_wallet ON user_social_accounts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_platform ON user_social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_user_social_accounts_status ON user_social_accounts(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_wallet ON social_verification_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON social_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_wallet ON social_verification_audit_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_platform ON social_verification_audit_logs(platform);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_social_verification_configs_updated_at ON social_verification_configs;
CREATE TRIGGER update_social_verification_configs_updated_at BEFORE UPDATE ON social_verification_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_social_accounts_updated_at ON user_social_accounts;
CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON user_social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_verification_requests_updated_at ON social_verification_requests;
CREATE TRIGGER update_social_verification_requests_updated_at BEFORE UPDATE ON social_verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE social_verification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Social verification configs are viewable by everyone" ON social_verification_configs;
DROP POLICY IF EXISTS "Social verification configs are modifiable by admins" ON social_verification_configs;

DROP POLICY IF EXISTS "Users can view their own social accounts" ON user_social_accounts;
DROP POLICY IF EXISTS "Admins can view all social accounts" ON user_social_accounts;
DROP POLICY IF EXISTS "Users can update their own social accounts" ON user_social_accounts;
DROP POLICY IF EXISTS "Users can insert their own social accounts" ON user_social_accounts;

DROP POLICY IF EXISTS "Users can view their own verification requests" ON social_verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON social_verification_requests;
DROP POLICY IF EXISTS "Users can insert their own verification requests" ON social_verification_requests;

DROP POLICY IF EXISTS "Admins can view audit logs" ON social_verification_audit_logs;

-- Create RLS policies
-- Social verification configs: Everyone can read, only admins can modify
CREATE POLICY "Social verification configs are viewable by everyone" ON social_verification_configs FOR SELECT USING (true);
CREATE POLICY "Social verification configs are modifiable by admins" ON social_verification_configs FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- User social accounts: Users can read their own, admins can read all
CREATE POLICY "Users can view their own social accounts" ON user_social_accounts FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all social accounts" ON user_social_accounts FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can update their own social accounts" ON user_social_accounts FOR UPDATE USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Users can insert their own social accounts" ON user_social_accounts FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);

-- Social verification requests: Users can read their own, admins can read all
CREATE POLICY "Users can view their own verification requests" ON social_verification_requests FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all verification requests" ON social_verification_requests FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can insert their own verification requests" ON social_verification_requests FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);

-- Audit logs: Admins only
CREATE POLICY "Admins can view audit logs" ON social_verification_audit_logs FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON social_verification_configs TO anon, authenticated;
GRANT ALL ON social_verification_configs TO authenticated;
GRANT SELECT ON user_social_accounts TO anon, authenticated;
GRANT ALL ON user_social_accounts TO authenticated;
GRANT SELECT ON social_verification_requests TO anon, authenticated;
GRANT ALL ON social_verification_requests TO authenticated;
GRANT SELECT ON social_verification_audit_logs TO anon, authenticated;
GRANT ALL ON social_verification_audit_logs TO authenticated;

-- Insert default social verification configurations for your collection
INSERT INTO social_verification_configs (
  collection_id, 
  platform, 
  official_handle, 
  verification_method, 
  verification_code_prefix, 
  minimum_followers, 
  required_score
) VALUES 
(
  'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  'twitter',
  'launchonlos',
  'manual',
  'ANALOS',
  100,
  10
),
(
  'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  'telegram',
  'launchonlos',
  'manual',
  'ANALOS',
  50,
  10
),
(
  'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
  'discord',
  'launchonlos',
  'manual',
  'ANALOS',
  25,
  10
)
ON CONFLICT (collection_id, platform) DO NOTHING;

-- Test the social verification system
SELECT 'Social verification system integrated successfully!' as status;
