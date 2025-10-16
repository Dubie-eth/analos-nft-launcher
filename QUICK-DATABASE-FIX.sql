-- QUICK DATABASE FIX
-- Run this in Supabase SQL Editor to fix the user_profiles table issue

-- First, let's check if we need to rename the table
DO $$ 
BEGIN
    -- If profiles table exists but user_profiles doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE profiles RENAME TO user_profiles;
        RAISE NOTICE 'Renamed profiles table to user_profiles';
    END IF;
    
    -- If neither exists, create user_profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
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
        RAISE NOTICE 'Created user_profiles table';
    END IF;
END $$;

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create RLS policies for user_profiles
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database fix completed successfully! user_profiles table is ready.' as status;
