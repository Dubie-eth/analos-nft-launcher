-- =====================================================
-- COMPLETE DATABASE SETUP FOR ANALOS NFT LAUNCHPAD
-- =====================================================
-- This script sets up all necessary tables, policies, and indexes
-- for the Analos NFT Launchpad application.
-- 
-- Run this script to set up your entire database schema.
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Stores user profile information including social links and verification status

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  twitter_handle TEXT,
  twitter_verified BOOLEAN DEFAULT false,
  website TEXT,
  discord TEXT,
  telegram TEXT,
  github TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- 2. PROFILE NFTS TABLE
-- =====================================================
-- Stores minted profile NFT data with mint number tracking

CREATE TABLE IF NOT EXISTS public.profile_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  mint_address TEXT UNIQUE NOT NULL,
  mint_number INTEGER, -- Track which # in the collection this NFT is
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  referral_code TEXT NOT NULL,
  twitter_handle TEXT,
  twitter_verified BOOLEAN DEFAULT false,
  nft_metadata JSONB NOT NULL,
  mint_price DECIMAL(10,2) DEFAULT 4.20,
  explorer_url TEXT,
  transaction_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- 3. PROFILE NFT MINT COUNTER TABLE
-- =====================================================
-- Tracks the current mint number for the open edition collection

CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER DEFAULT 1 NOT NULL,
  total_minted INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- 4. ADMIN USERS TABLE
-- =====================================================
-- Manages admin access and permissions

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add missing columns to existing admin_users table if needed
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'username') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'Added username column to admin_users';
    END IF;
END $$;

-- =====================================================
-- 5. FEATURE FLAGS TABLE
-- =====================================================
-- Controls feature access and page visibility

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- 6. PAGE ACCESS CONFIGURATION TABLE
-- =====================================================
-- Controls which pages are accessible to which user types

CREATE TABLE IF NOT EXISTS public.page_access_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT UNIQUE NOT NULL,
  requires_wallet BOOLEAN DEFAULT false,
  requires_admin BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- 7. SOCIAL VERIFICATION TABLE
-- =====================================================
-- Tracks social media verification status

CREATE TABLE IF NOT EXISTS public.social_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'twitter', 'discord', etc.
  platform_user_id TEXT,
  platform_username TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(wallet_address, platform)
);

-- =====================================================
-- 8. SAVED COLLECTIONS TABLE
-- =====================================================
-- Stores user-created NFT collections

CREATE TABLE IF NOT EXISTS public.saved_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  collection_metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nft_mint_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_access_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Public can view profile NFTs" ON public.profile_nfts;
DROP POLICY IF EXISTS "Users can create profile NFTs" ON public.profile_nfts;
DROP POLICY IF EXISTS "Allow all operations on profile_nfts" ON public.profile_nfts;

DROP POLICY IF EXISTS "Public can view mint counter" ON public.profile_nft_mint_counter;
DROP POLICY IF EXISTS "Public can update mint counter" ON public.profile_nft_mint_counter;
DROP POLICY IF EXISTS "Allow all operations on profile_nft_mint_counter" ON public.profile_nft_mint_counter;

DROP POLICY IF EXISTS "Public can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON public.admin_users;

DROP POLICY IF EXISTS "Public can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Allow all operations on feature_flags" ON public.feature_flags;

DROP POLICY IF EXISTS "Public can view page access config" ON public.page_access_config;
DROP POLICY IF EXISTS "Admins can manage page access config" ON public.page_access_config;
DROP POLICY IF EXISTS "Allow all operations on page_access_config" ON public.page_access_config;

DROP POLICY IF EXISTS "Users can view their own social verification" ON public.social_verification;
DROP POLICY IF EXISTS "Users can create their own social verification" ON public.social_verification;
DROP POLICY IF EXISTS "Users can update their own social verification" ON public.social_verification;
DROP POLICY IF EXISTS "Allow all operations on social_verification" ON public.social_verification;

DROP POLICY IF EXISTS "Users can view their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Users can create their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Public can view public collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Allow all operations on saved_collections" ON public.saved_collections;

-- Create new permissive policies for development/testing
-- NOTE: These are permissive policies for development. 
-- For production, you should implement more restrictive policies.

-- User Profiles Policies
CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Profile NFTs Policies
CREATE POLICY "Allow all operations on profile_nfts" ON public.profile_nfts
  FOR ALL USING (true) WITH CHECK (true);

-- Mint Counter Policies
CREATE POLICY "Allow all operations on profile_nft_mint_counter" ON public.profile_nft_mint_counter
  FOR ALL USING (true) WITH CHECK (true);

-- Admin Users Policies
CREATE POLICY "Allow all operations on admin_users" ON public.admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Feature Flags Policies
CREATE POLICY "Allow all operations on feature_flags" ON public.feature_flags
  FOR ALL USING (true) WITH CHECK (true);

-- Page Access Config Policies
CREATE POLICY "Allow all operations on page_access_config" ON public.page_access_config
  FOR ALL USING (true) WITH CHECK (true);

-- Social Verification Policies
CREATE POLICY "Allow all operations on social_verification" ON public.social_verification
  FOR ALL USING (true) WITH CHECK (true);

-- Saved Collections Policies
CREATE POLICY "Allow all operations on saved_collections" ON public.saved_collections
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_twitter_verified ON public.user_profiles(twitter_verified);

-- Profile NFTs Indexes
CREATE INDEX IF NOT EXISTS idx_profile_nfts_wallet_address ON public.profile_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint_address ON public.profile_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_username ON public.profile_nfts(username);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint_number ON public.profile_nfts(mint_number);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_created_at ON public.profile_nfts(created_at);

-- Admin Users Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_wallet_address ON public.admin_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Feature Flags Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature_name ON public.feature_flags(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);

-- Page Access Config Indexes
CREATE INDEX IF NOT EXISTS idx_page_access_config_page_path ON public.page_access_config(page_path);
CREATE INDEX IF NOT EXISTS idx_page_access_config_is_public ON public.page_access_config(is_public);
CREATE INDEX IF NOT EXISTS idx_page_access_config_is_locked ON public.page_access_config(is_locked);

-- Social Verification Indexes
CREATE INDEX IF NOT EXISTS idx_social_verification_wallet_address ON public.social_verification(wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_verification_platform ON public.social_verification(platform);
CREATE INDEX IF NOT EXISTS idx_social_verification_status ON public.social_verification(verification_status);

-- Saved Collections Indexes
CREATE INDEX IF NOT EXISTS idx_saved_collections_wallet_address ON public.saved_collections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_saved_collections_is_public ON public.saved_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_collections_created_at ON public.saved_collections(created_at);

-- =====================================================
-- CREATE UPDATE TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_profile_nfts_updated_at ON public.profile_nfts;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON public.feature_flags;
DROP TRIGGER IF EXISTS update_page_access_config_updated_at ON public.page_access_config;
DROP TRIGGER IF EXISTS update_social_verification_updated_at ON public.social_verification;
DROP TRIGGER IF EXISTS update_saved_collections_updated_at ON public.saved_collections;

-- Create update triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_nfts_updated_at
  BEFORE UPDATE ON public.profile_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_access_config_updated_at
  BEFORE UPDATE ON public.page_access_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_verification_updated_at
  BEFORE UPDATE ON public.social_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_collections_updated_at
  BEFORE UPDATE ON public.saved_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Initialize mint counter
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted) 
VALUES (1, 0) 
ON CONFLICT DO NOTHING;

-- Insert default admin users (replace with your actual admin wallet addresses)
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}')
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert default feature flags
INSERT INTO public.feature_flags (feature_name, is_enabled, description) VALUES
  ('profile_nft_minting', true, 'Enable profile NFT minting functionality'),
  ('social_verification', true, 'Enable social media verification'),
  ('collection_creation', false, 'Enable user collection creation'),
  ('marketplace', false, 'Enable marketplace functionality'),
  ('staking', false, 'Enable staking functionality')
ON CONFLICT (feature_name) DO NOTHING;

-- Insert default page access configuration
INSERT INTO public.page_access_config (page_path, requires_wallet, requires_admin, is_public, is_locked, description) VALUES
  ('/', false, false, true, false, 'Home page - public access'),
  ('/profile', true, false, true, false, 'Profile page - requires wallet connection'),
  ('/admin', true, true, false, false, 'Admin panel - requires admin access'),
  ('/create-collection', true, false, false, true, 'Collection creation - locked for launch'),
  ('/marketplace', false, false, false, true, 'Marketplace - locked for launch'),
  ('/staking', false, false, false, true, 'Staking - locked for launch'),
  ('/social-verification', true, false, true, false, 'Social verification - requires wallet')
ON CONFLICT (page_path) DO NOTHING;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Stores user profile data including social links and verification status';
COMMENT ON TABLE public.profile_nfts IS 'Stores minted profile NFT data with mint number tracking for the open edition collection';
COMMENT ON TABLE public.profile_nft_mint_counter IS 'Tracks the current mint number for the profile NFT open edition collection';
COMMENT ON TABLE public.admin_users IS 'Manages admin access and permissions for the platform';
COMMENT ON TABLE public.feature_flags IS 'Controls feature access and functionality toggles';
COMMENT ON TABLE public.page_access_config IS 'Controls which pages are accessible to which user types';
COMMENT ON TABLE public.social_verification IS 'Tracks social media verification status for users';
COMMENT ON TABLE public.saved_collections IS 'Stores user-created NFT collections';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This script has successfully set up:
-- ✅ 8 database tables with proper structure
-- ✅ Row Level Security (RLS) enabled on all tables
-- ✅ Permissive policies for development (update for production)
-- ✅ Performance indexes on key columns
-- ✅ Update triggers for timestamp management
-- ✅ Initial data for mint counter, admin users, feature flags, and page access
-- ✅ Comprehensive documentation

-- Next steps:
-- 1. Test the database connection from your application
-- 2. Update RLS policies for production security
-- 3. Add any additional admin users as needed
-- 4. Configure feature flags for your launch strategy
-- 5. Test profile NFT minting functionality

SELECT 'Database setup completed successfully! 🎉' as status;
