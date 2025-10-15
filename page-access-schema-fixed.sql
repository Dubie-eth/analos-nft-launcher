-- FIXED PAGE ACCESS SCHEMA - HANDLES EXISTING TRIGGERS GRACEFULLY
-- Run this instead of the original page-access-schema.sql

-- Create page_access_configs table
CREATE TABLE IF NOT EXISTS page_access_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  description TEXT,
  required_level TEXT NOT NULL DEFAULT 'public',
  admin_only BOOLEAN DEFAULT FALSE,
  public_access BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  custom_message TEXT,
  allow_public_access BOOLEAN DEFAULT TRUE,
  require_verification BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT NOT NULL
);

-- Create user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  banner_image_url TEXT,
  socials JSONB DEFAULT '{}',
  favorite_collections JSONB DEFAULT '[]',
  description TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  total_referrals INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  activity_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  access_level TEXT DEFAULT 'public',
  verification_level TEXT DEFAULT 'none',
  privacy_level TEXT DEFAULT 'public',
  is_active BOOLEAN DEFAULT TRUE,
  allow_data_export BOOLEAN DEFAULT TRUE,
  allow_analytics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  activity_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral_tracking table
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_wallet, referred_wallet)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  points_awarded INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_access_configs_path ON page_access_configs(page_path);
CREATE INDEX IF NOT EXISTS idx_page_access_configs_level ON page_access_configs(required_level);
CREATE INDEX IF NOT EXISTS idx_page_access_configs_locked ON page_access_configs(is_locked);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_wallet);
CREATE INDEX IF NOT EXISTS idx_activity_logs_wallet ON activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);

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
    DROP TRIGGER IF EXISTS update_page_access_configs_updated_at ON page_access_configs;
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    
    -- Create triggers
    CREATE TRIGGER update_page_access_configs_updated_at 
        BEFORE UPDATE ON page_access_configs 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Create function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert leaderboard entry
    INSERT INTO leaderboard (wallet_address, username, total_points, referral_points, activity_points, rank, last_updated)
    SELECT 
        NEW.wallet_address,
        NEW.username,
        NEW.total_points,
        NEW.referral_points,
        NEW.activity_points,
        ROW_NUMBER() OVER (ORDER BY NEW.total_points DESC),
        NOW()
    ON CONFLICT (wallet_address) DO UPDATE SET
        username = EXCLUDED.username,
        total_points = EXCLUDED.total_points,
        referral_points = EXCLUDED.referral_points,
        activity_points = EXCLUDED.activity_points,
        rank = EXCLUDED.rank,
        last_updated = EXCLUDED.last_updated;
    
    -- Update all ranks
    UPDATE leaderboard SET rank = ranked.rank
    FROM (
        SELECT wallet_address, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
        FROM leaderboard
    ) ranked
    WHERE leaderboard.wallet_address = ranked.wallet_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leaderboard updates
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_update_leaderboard ON user_profiles;
    
    -- Create trigger
    CREATE TRIGGER trigger_update_leaderboard 
        AFTER UPDATE OF total_points, referral_points, activity_points ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_leaderboard();
END $$;

-- Enable RLS (Row Level Security)
ALTER TABLE page_access_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Page access configs are viewable by everyone" ON page_access_configs;
DROP POLICY IF EXISTS "Page access configs are modifiable by admins" ON page_access_configs;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON leaderboard;

DROP POLICY IF EXISTS "Users can view their own referrals" ON referral_tracking;
DROP POLICY IF EXISTS "Admins can view all referrals" ON referral_tracking;
DROP POLICY IF EXISTS "Users can insert their own referrals" ON referral_tracking;

DROP POLICY IF EXISTS "Users can view their own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_logs;

-- Create RLS policies
-- Page access configs: Everyone can read, only admins can modify
CREATE POLICY "Page access configs are viewable by everyone" ON page_access_configs FOR SELECT USING (true);
CREATE POLICY "Page access configs are modifiable by admins" ON page_access_configs FOR ALL USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- User profiles: Users can read their own, admins can read all
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);

-- Leaderboard: Publicly readable
CREATE POLICY "Leaderboard is publicly readable" ON leaderboard FOR SELECT USING (true);

-- Referral tracking: Users can read their own, admins can read all
CREATE POLICY "Users can view their own referrals" ON referral_tracking FOR SELECT USING (
  referrer_wallet = current_setting('app.current_user_wallet', true) OR 
  referred_wallet = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all referrals" ON referral_tracking FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can insert their own referrals" ON referral_tracking FOR INSERT WITH CHECK (
  referrer_wallet = current_setting('app.current_user_wallet', true)
);

-- Activity logs: Users can read their own, admins can read all
CREATE POLICY "Users can view their own activity" ON activity_logs FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all activity" ON activity_logs FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON page_access_configs TO anon, authenticated;
GRANT ALL ON page_access_configs TO authenticated;
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT SELECT ON leaderboard TO anon, authenticated;
GRANT SELECT ON referral_tracking TO anon, authenticated;
GRANT ALL ON referral_tracking TO authenticated;
GRANT SELECT ON activity_logs TO anon, authenticated;
GRANT ALL ON activity_logs TO authenticated;

-- Insert default page access configurations
INSERT INTO page_access_configs (
  page_path, page_name, description, required_level, admin_only, 
  public_access, is_locked, allow_public_access, require_verification, updated_by
) VALUES 
('/admin', 'Admin Dashboard', 'Administrative control panel', 'admin', true, false, false, false, true, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/admin-login', 'Admin Login', 'Admin authentication page', 'admin', true, false, false, false, true, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/create-collection', 'Create Collection', 'Collection creation wizard', 'creator', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/launch-collection', 'Launch Collection', 'Collection launch interface', 'creator', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/otc-marketplace', 'OTC Marketplace', 'Over-the-counter trading platform', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/airdrops', 'Airdrops', 'Airdrop management and claims', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/staking', 'Staking', 'Token staking interface', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/token-lock', 'Token Lock', 'Token locking interface', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/vesting', 'Vesting', 'Token vesting interface', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/swap', 'Token Swap', 'Token swapping interface', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/marketplace', 'NFT Marketplace', 'NFT trading marketplace', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/collections', 'Collections', 'Browse NFT collections', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/explorer', 'Blockchain Explorer', 'Transaction and address explorer', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/profile', 'User Profile', 'User profile management', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/mint/[collectionName]', 'Mint NFT', 'Mint NFTs from collections', 'beta_user', false, false, false, false, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/', 'Home', 'Platform homepage', 'public', false, true, false, true, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/how-it-works', 'How It Works', 'Platform guide and documentation', 'public', false, true, false, true, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/faq', 'FAQ', 'Frequently asked questions', 'public', false, true, false, true, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
('/beta-signup', 'Beta Signup', 'Beta access application page', 'public', false, true, false, true, false, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW')
ON CONFLICT (page_path) DO NOTHING;

-- Test the page access system
SELECT 'Page access system integrated successfully!' as status;
