-- =====================================================
-- FINAL DATABASE FIX - COMPREHENSIVE SOLUTION
-- =====================================================
-- This script will completely rebuild your database with the correct structure
-- =====================================================

-- First, let's see what tables actually exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'admin_users', 'profile_nfts', 'profile_nft_mint_counter', 'feature_flags', 'page_access_config', 'social_verification', 'saved_collections')
ORDER BY table_name;

-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS public.saved_collections CASCADE;
DROP TABLE IF EXISTS public.social_verification CASCADE;
DROP TABLE IF EXISTS public.page_access_config CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;
DROP TABLE IF EXISTS public.profile_nft_mint_counter CASCADE;
DROP TABLE IF EXISTS public.profile_nfts CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE ALL TABLES WITH CORRECT STRUCTURE
-- =====================================================

-- 1. USER PROFILES TABLE
CREATE TABLE public.user_profiles (
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

-- 2. ADMIN USERS TABLE
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. PROFILE NFTS TABLE
CREATE TABLE public.profile_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  mint_address TEXT UNIQUE NOT NULL,
  mint_number INTEGER,
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

-- 4. PROFILE NFT MINT COUNTER TABLE
CREATE TABLE public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER DEFAULT 1 NOT NULL,
  total_minted INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. FEATURE FLAGS TABLE
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. PAGE ACCESS CONFIG TABLE
CREATE TABLE public.page_access_config (
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

-- 7. SOCIAL VERIFICATION TABLE
CREATE TABLE public.social_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT,
  platform_username TEXT,
  verification_status TEXT DEFAULT 'pending',
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(wallet_address, platform)
);

-- 8. SAVED COLLECTIONS TABLE
CREATE TABLE public.saved_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL, -- Changed from wallet_address to user_wallet to match API
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

-- 9. CREATOR REWARDS TABLE
CREATE TABLE public.creator_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  collection_id UUID REFERENCES public.saved_collections(id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  token_mint TEXT,
  token_symbol TEXT DEFAULT 'LOS',
  status TEXT DEFAULT 'pending',
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nft_mint_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_access_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- User Profiles Policies
CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Admin Users Policies
CREATE POLICY "Allow all operations on admin_users" ON public.admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Profile NFTs Policies
CREATE POLICY "Allow all operations on profile_nfts" ON public.profile_nfts
  FOR ALL USING (true) WITH CHECK (true);

-- Mint Counter Policies
CREATE POLICY "Allow all operations on profile_nft_mint_counter" ON public.profile_nft_mint_counter
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

-- Creator Rewards Policies
CREATE POLICY "Allow all operations on creator_rewards" ON public.creator_rewards
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- User Profiles Indexes
CREATE INDEX idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX idx_user_profiles_twitter_verified ON public.user_profiles(twitter_verified);

-- Admin Users Indexes
CREATE INDEX idx_admin_users_wallet_address ON public.admin_users(wallet_address);
CREATE INDEX idx_admin_users_username ON public.admin_users(username);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);
CREATE INDEX idx_admin_users_is_active ON public.admin_users(is_active);

-- Profile NFTs Indexes
CREATE INDEX idx_profile_nfts_wallet_address ON public.profile_nfts(wallet_address);
CREATE INDEX idx_profile_nfts_mint_address ON public.profile_nfts(mint_address);
CREATE INDEX idx_profile_nfts_username ON public.profile_nfts(username);
CREATE INDEX idx_profile_nfts_mint_number ON public.profile_nfts(mint_number);
CREATE INDEX idx_profile_nfts_created_at ON public.profile_nfts(created_at);

-- Feature Flags Indexes
CREATE INDEX idx_feature_flags_feature_name ON public.feature_flags(feature_name);
CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags(is_enabled);

-- Page Access Config Indexes
CREATE INDEX idx_page_access_config_page_path ON public.page_access_config(page_path);
CREATE INDEX idx_page_access_config_is_public ON public.page_access_config(is_public);
CREATE INDEX idx_page_access_config_is_locked ON public.page_access_config(is_locked);

-- Social Verification Indexes
CREATE INDEX idx_social_verification_wallet_address ON public.social_verification(wallet_address);
CREATE INDEX idx_social_verification_platform ON public.social_verification(platform);
CREATE INDEX idx_social_verification_status ON public.social_verification(verification_status);

-- Saved Collections Indexes
CREATE INDEX idx_saved_collections_user_wallet ON public.saved_collections(user_wallet);
CREATE INDEX idx_saved_collections_is_public ON public.saved_collections(is_public);
CREATE INDEX idx_saved_collections_created_at ON public.saved_collections(created_at);

-- Creator Rewards Indexes
CREATE INDEX idx_creator_rewards_user_wallet ON public.creator_rewards(user_wallet);
CREATE INDEX idx_creator_rewards_collection_id ON public.creator_rewards(collection_id);
CREATE INDEX idx_creator_rewards_status ON public.creator_rewards(status);
CREATE INDEX idx_creator_rewards_created_at ON public.creator_rewards(created_at);

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

-- Create update triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_nfts_updated_at
  BEFORE UPDATE ON public.profile_nfts
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

CREATE TRIGGER update_creator_rewards_updated_at
  BEFORE UPDATE ON public.creator_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Initialize mint counter
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted) 
VALUES (1, 0);

-- Insert admin users
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}');

-- Insert feature flags
INSERT INTO public.feature_flags (feature_name, is_enabled, description) VALUES
  ('profile_nft_minting', true, 'Enable profile NFT minting functionality'),
  ('social_verification', true, 'Enable social media verification'),
  ('collection_creation', false, 'Enable user collection creation'),
  ('marketplace', false, 'Enable marketplace functionality'),
  ('staking', false, 'Enable staking functionality');

-- Insert page access configuration
INSERT INTO public.page_access_config (page_path, requires_wallet, requires_admin, is_public, is_locked, description) VALUES
  ('/', false, false, true, false, 'Home page - public access'),
  ('/profile', true, false, true, false, 'Profile page - requires wallet connection'),
  ('/admin', true, true, false, false, 'Admin panel - requires admin access'),
  ('/create-collection', true, false, false, true, 'Collection creation - locked for launch'),
  ('/marketplace', false, false, false, true, 'Marketplace - locked for launch'),
  ('/staking', false, false, false, true, 'Staking - locked for launch'),
  ('/social-verification', true, false, true, false, 'Social verification - requires wallet');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show all created tables
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Show admin users count
SELECT 'Admin users:' as info, COUNT(*) as count FROM public.admin_users;

-- Show feature flags count
SELECT 'Feature flags:' as info, COUNT(*) as count FROM public.feature_flags;

-- Show page access config count
SELECT 'Page access configs:' as info, COUNT(*) as count FROM public.page_access_config;

-- Show saved collections count
SELECT 'Saved collections:' as info, COUNT(*) as count FROM public.saved_collections;

-- Show creator rewards count
SELECT 'Creator rewards:' as info, COUNT(*) as count FROM public.creator_rewards;

SELECT 'Database setup completed successfully! 🎉' as final_status;
