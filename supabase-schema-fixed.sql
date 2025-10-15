-- FIXED SUPABASE SCHEMA - HANDLES EXISTING TYPES GRACEFULLY
-- Run this instead of the original supabase-schema.sql

-- Create enum types only if they don't exist
DO $$ 
BEGIN
    -- Create access_level enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level') THEN
        CREATE TYPE access_level AS ENUM ('public', 'beta_user', 'premium_user', 'creator', 'admin');
    END IF;
    
    -- Create verification_level enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_level') THEN
        CREATE TYPE verification_level AS ENUM ('none', 'basic', 'verified', 'premium');
    END IF;
    
    -- Create privacy_level enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'privacy_level') THEN
        CREATE TYPE privacy_level AS ENUM ('public', 'friends', 'private');
    END IF;
    
    -- Create activity_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('login', 'profile_update', 'access_grant', 'access_revoke', 'data_export', 'admin_action');
    END IF;
    
    -- Create backup_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_type') THEN
        CREATE TYPE backup_type AS ENUM ('full', 'incremental', 'schema_only', 'data_only');
    END IF;
    
    -- Create admin_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'support');
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_address_hash TEXT NOT NULL,
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
  rank INTEGER DEFAULT 0,
  access_level access_level DEFAULT 'public',
  verification_level verification_level DEFAULT 'none',
  privacy_level privacy_level DEFAULT 'public',
  is_active BOOLEAN DEFAULT TRUE,
  allow_data_export BOOLEAN DEFAULT TRUE,
  allow_analytics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Create beta_applications table
CREATE TABLE IF NOT EXISTS beta_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  username TEXT NOT NULL,
  bio TEXT,
  profile_picture_url TEXT,
  banner_image_url TEXT,
  socials JSONB DEFAULT '{}',
  access_level access_level DEFAULT 'beta_user',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by TEXT,
  review_notes TEXT,
  rejection_reason TEXT,
  custom_message TEXT,
  locked_page_requested TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create access_grants table
CREATE TABLE IF NOT EXISTS access_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  access_level access_level NOT NULL,
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  conditions JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  activity_type activity_type NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data_access_logs table
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_by TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL,
  data_accessed JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backup_records table
CREATE TABLE IF NOT EXISTS backup_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type backup_type NOT NULL,
  backup_size BIGINT,
  backup_path TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT,
  role admin_role NOT NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_hash ON profiles(wallet_address_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_access_level ON profiles(access_level);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_wallet ON beta_applications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_access_grants_wallet ON access_grants(wallet_address);
CREATE INDEX IF NOT EXISTS idx_access_grants_active ON access_grants(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_logs_wallet ON activity_logs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_accessed_by ON data_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_admin_users_wallet ON admin_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_beta_applications_updated_at ON beta_applications;
CREATE TRIGGER update_beta_applications_updated_at BEFORE UPDATE ON beta_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_grants_updated_at ON access_grants;
CREATE TRIGGER update_access_grants_updated_at BEFORE UPDATE ON access_grants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view their own applications" ON beta_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON beta_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON beta_applications;

DROP POLICY IF EXISTS "Users can view their own grants" ON access_grants;
DROP POLICY IF EXISTS "Admins can view all grants" ON access_grants;

DROP POLICY IF EXISTS "Users can view their own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_logs;

DROP POLICY IF EXISTS "Admins can view data access logs" ON data_access_logs;

DROP POLICY IF EXISTS "Admins can view backup records" ON backup_records;

DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create RLS policies
-- Profiles: Users can read their own, admins can read all
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);

-- Beta applications: Users can read their own, admins can read all
CREATE POLICY "Users can view their own applications" ON beta_applications FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all applications" ON beta_applications FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);
CREATE POLICY "Users can insert their own applications" ON beta_applications FOR INSERT WITH CHECK (
  wallet_address = current_setting('app.current_user_wallet', true)
);

-- Access grants: Users can read their own, admins can read all
CREATE POLICY "Users can view their own grants" ON access_grants FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all grants" ON access_grants FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Activity logs: Users can read their own, admins can read all
CREATE POLICY "Users can view their own activity" ON activity_logs FOR SELECT USING (
  wallet_address = current_setting('app.current_user_wallet', true)
);
CREATE POLICY "Admins can view all activity" ON activity_logs FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Data access logs: Admins only
CREATE POLICY "Admins can view data access logs" ON data_access_logs FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Backup records: Admins only
CREATE POLICY "Admins can view backup records" ON backup_records FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Admin users: Admins only
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (
  current_setting('app.current_user_wallet', true) IN ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m')
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'Encrypted user profiles with privacy controls';
COMMENT ON TABLE beta_applications IS 'Beta access applications with review workflow';
COMMENT ON TABLE access_grants IS 'User access permissions and grants';
COMMENT ON TABLE activity_logs IS 'Audit trail of user actions';
COMMENT ON TABLE data_access_logs IS 'Privacy audit trail for data access';
COMMENT ON TABLE backup_records IS 'Automated backup tracking';
COMMENT ON TABLE admin_users IS 'Admin user management with role-based permissions';
