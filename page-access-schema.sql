-- PAGE ACCESS CONFIGURATION SCHEMA
-- Secure database storage for page locking and access control

-- Create page_access_configs table
CREATE TABLE IF NOT EXISTS page_access_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  description TEXT,
  required_level TEXT NOT NULL DEFAULT 'public',
  admin_only BOOLEAN DEFAULT FALSE,
  public_access BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  custom_message TEXT,
  allow_public_access BOOLEAN DEFAULT FALSE,
  require_verification BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT NOT NULL -- Admin wallet address who made the change
);

-- Create user_profiles table (enhanced version)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_address_hash TEXT NOT NULL, -- For privacy
  username TEXT NOT NULL,
  bio TEXT,
  profile_picture_url TEXT,
  banner_image_url TEXT,
  socials JSONB DEFAULT '{}', -- Store social links as JSON
  favorite_collections JSONB DEFAULT '[]', -- Array of collection addresses
  description TEXT, -- Extended description/bio
  referral_code TEXT UNIQUE, -- Unique referral code
  referred_by TEXT, -- Wallet address of referrer
  total_referrals INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  activity_points INTEGER DEFAULT 0, -- Points for various activities
  total_points INTEGER DEFAULT 0, -- Sum of all points
  rank INTEGER DEFAULT 0, -- Leaderboard rank
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none',
  is_active BOOLEAN DEFAULT TRUE,
  privacy_level TEXT DEFAULT 'public',
  allow_data_export BOOLEAN DEFAULT TRUE,
  allow_analytics BOOLEAN DEFAULT TRUE
);

-- Create leaderboard table for caching
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  referral_points INTEGER NOT NULL DEFAULT 0,
  activity_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral_tracking table
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create activity_logs table for point tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'referral', 'collection_create', 'nft_mint', 'social_verify', etc.
  points_awarded INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default page configurations
INSERT INTO page_access_configs (page_path, page_name, description, required_level, admin_only, public_access, updated_by) VALUES
('/', 'Home', 'Main landing page', 'public', FALSE, TRUE, 'system'),
('/how-it-works', 'How It Works', 'Platform explanation and features', 'public', FALSE, TRUE, 'system'),
('/create-collection', 'Create Collection', 'NFT collection creation wizard', 'beta_user', FALSE, FALSE, 'system'),
('/collections', 'Collections', 'Browse and manage collections', 'beta_user', FALSE, FALSE, 'system'),
('/staking', 'NFT Staking', 'Stake NFTs for rewards', 'premium_user', FALSE, FALSE, 'system'),
('/referrals', 'Referral System', 'Manage referrals and rewards', 'premium_user', FALSE, FALSE, 'system'),
('/profile', 'User Profile', 'User account and settings', 'beta_user', FALSE, FALSE, 'system'),
('/admin', 'Admin Dashboard', 'Administrative controls and monitoring', 'admin', TRUE, FALSE, 'system'),
('/admin-login', 'Admin Login', 'Admin authentication page', 'public', FALSE, TRUE, 'system'),
('/marketplace', 'NFT Marketplace', 'Buy and sell NFTs', 'beta_user', FALSE, FALSE, 'system'),
('/launch-collection', 'Launch Collection', 'Launch new NFT collection', 'beta_user', FALSE, FALSE, 'system'),
('/explorer', 'Explorer', 'Explore collections and NFTs', 'beta_user', FALSE, FALSE, 'system'),
('/swap', 'Token Swap', 'Swap tokens', 'premium_user', FALSE, FALSE, 'system'),
('/vesting', 'Token Vesting', 'Manage token vesting', 'premium_user', FALSE, FALSE, 'system'),
('/token-lock', 'Token Lock', 'Lock tokens for security', 'premium_user', FALSE, FALSE, 'system'),
('/otc-marketplace', 'OTC Marketplace', 'Over-the-counter trading', 'premium_user', FALSE, FALSE, 'system'),
('/airdrops', 'Airdrops', 'Claim airdrops', 'beta_user', FALSE, FALSE, 'system'),
('/beta-signup', 'Beta Signup', 'Apply for beta access', 'public', FALSE, TRUE, 'system')
ON CONFLICT (page_path) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_hash ON user_profiles(wallet_address_hash);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_wallet);
CREATE INDEX IF NOT EXISTS idx_activity_logs_wallet ON activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_page_access_path ON page_access_configs(page_path);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_page_access_configs_updated_at BEFORE UPDATE ON page_access_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
$$ language 'plpgsql';

-- Apply leaderboard trigger
CREATE TRIGGER update_leaderboard_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_leaderboard();

-- Enable RLS (Row Level Security)
ALTER TABLE page_access_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Page access configs: Only admins can modify, everyone can read
CREATE POLICY "Page access configs are viewable by everyone" ON page_access_configs FOR SELECT USING (true);
CREATE POLICY "Page access configs are modifiable by admins" ON page_access_configs FOR ALL USING (
    updated_by IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
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

-- Leaderboard: Public read access
CREATE POLICY "Leaderboard is publicly readable" ON leaderboard FOR SELECT USING (true);

-- Referral tracking: Users can read their own referrals
CREATE POLICY "Users can view their referrals" ON referral_tracking FOR SELECT USING (
    referrer_wallet = current_setting('app.current_user_wallet', true) OR
    referred_wallet = current_setting('app.current_user_wallet', true)
);

-- Activity logs: Users can read their own logs
CREATE POLICY "Users can view their activity logs" ON activity_logs FOR SELECT USING (
    wallet_address = current_setting('app.current_user_wallet', true)
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
