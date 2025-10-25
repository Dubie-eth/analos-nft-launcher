-- =====================================================
-- ANALOS NFT LAUNCHPAD - MASTER DATABASE SETUP
-- =====================================================
-- Complete database schema in correct dependency order
-- Run this script ONCE to set up everything
-- =====================================================
-- Created: October 25, 2025
-- Version: 1.0 (MASTER)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 1: CORE USER & ADMIN TABLES
-- =====================================================

-- 1.1 Admin Users Table
-- Manages admin access and permissions
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_users_wallet ON public.admin_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- 1.2 User Profiles Table
-- Stores user profile information and social links
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_address_hash TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  profile_picture_url TEXT,
  banner_image_url TEXT,
  
  -- Social links
  twitter_handle TEXT,
  twitter_verified BOOLEAN DEFAULT FALSE,
  website TEXT,
  discord TEXT,
  telegram TEXT,
  github TEXT,
  socials JSONB DEFAULT '{}',
  
  -- Privacy and settings
  is_anonymous BOOLEAN DEFAULT FALSE,
  privacy_level TEXT DEFAULT 'public',
  allow_data_export BOOLEAN DEFAULT TRUE,
  allow_analytics BOOLEAN DEFAULT TRUE,
  
  -- Profile stats
  favorite_collections TEXT[] DEFAULT '{}',
  description TEXT,
  referral_code TEXT,
  referred_by TEXT,
  total_referrals INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  activity_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'none',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral ON public.user_profiles(referral_code);

-- =====================================================
-- SECTION 2: PROFILE NFT TABLES
-- =====================================================

-- 2.1 Profile NFTs Table
-- Stores minted Profile NFT data
CREATE TABLE IF NOT EXISTS public.profile_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  mint_address TEXT UNIQUE NOT NULL,
  mint_number INTEGER,
  
  -- Profile data
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  referral_code TEXT NOT NULL,
  
  -- Social links
  twitter_handle TEXT,
  twitter_verified BOOLEAN DEFAULT FALSE,
  discord_handle TEXT,
  telegram_handle TEXT,
  
  -- NFT metadata
  nft_metadata JSONB NOT NULL,
  image_url TEXT,
  metadata_uri TEXT,
  
  -- Pricing and tier
  mint_price DECIMAL(10,2) DEFAULT 4.20,
  tier TEXT DEFAULT 'basic',
  is_free BOOLEAN DEFAULT FALSE,
  
  -- Los Bros integration
  los_bros_token_id TEXT,
  los_bros_rarity TEXT,
  los_bros_tier TEXT,
  los_bros_discount_percent INTEGER DEFAULT 0,
  los_bros_final_price DECIMAL(10, 2) DEFAULT 0,
  los_bros_platform_fee DECIMAL(10, 2) DEFAULT 0,
  lol_balance_at_mint DECIMAL(20, 2) DEFAULT 0,
  los_bros_rarity_score DECIMAL(10, 2) DEFAULT 0,
  los_bros_traits JSONB,
  
  -- Transaction data
  explorer_url TEXT,
  transaction_signature TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_nfts_wallet ON public.profile_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint ON public.profile_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_username ON public.profile_nfts(username);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_tier ON public.profile_nfts(tier);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_los_bros_tier ON public.profile_nfts(los_bros_tier);

-- 2.2 Profile NFT Mint Counter
-- Tracks sequential mint numbers
CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER DEFAULT 1 NOT NULL,
  total_minted INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert initial counter if not exists
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted)
VALUES (1, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 3: LOS BROS NFT TABLES
-- =====================================================

-- 3.1 Los Bros Allocations
-- Tracks tier allocations and minting progress
CREATE TABLE IF NOT EXISTS public.los_bros_allocations (
  tier TEXT PRIMARY KEY,
  total_allocated INTEGER NOT NULL,
  minted_count INTEGER DEFAULT 0,
  requires_lol BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial allocations
INSERT INTO public.los_bros_allocations (tier, total_allocated, requires_lol, is_active)
VALUES 
  ('TEAM', 50, 0, TRUE),
  ('COMMUNITY', 500, 1000000, TRUE),
  ('EARLY', 150, 100000, TRUE),
  ('PUBLIC', 1522, 0, TRUE)
ON CONFLICT (tier) DO UPDATE SET
  total_allocated = EXCLUDED.total_allocated,
  requires_lol = EXCLUDED.requires_lol,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- SECTION 4: WHITELIST & ACCESS CONTROL
-- =====================================================

-- 4.1 Whitelist Registry
-- Stores whitelisted wallets for free mints
CREATE TABLE IF NOT EXISTS public.whitelist_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  position INTEGER,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON public.whitelist_registry(wallet_address);

-- 4.2 Free Mint Usage Tracking
-- Prevents duplicate free mints
CREATE TABLE IF NOT EXISTS public.free_mint_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_free_mint_wallet ON public.free_mint_usage(wallet_address);

-- 4.3 Page Access Configurations
-- Controls page locking and access levels
CREATE TABLE IF NOT EXISTS public.page_access_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  description TEXT,
  required_level TEXT DEFAULT 'public',
  admin_only BOOLEAN DEFAULT FALSE,
  public_access BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  custom_message TEXT,
  allow_public_access BOOLEAN DEFAULT TRUE,
  require_verification BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_access_path ON public.page_access_configs(page_path);

-- =====================================================
-- SECTION 5: MARKETPLACE TABLES
-- =====================================================

-- 5.1 NFT Listings
-- Active marketplace listings
CREATE TABLE IF NOT EXISTS public.nft_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  price DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'LOS',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_listings_mint ON public.nft_listings(mint_address);
CREATE INDEX IF NOT EXISTS idx_nft_listings_seller ON public.nft_listings(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_listings_active ON public.nft_listings(is_active);

-- 5.2 NFT Offers
-- Offers made on NFTs
CREATE TABLE IF NOT EXISTS public.nft_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  offer_price DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'LOS',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_offers_mint ON public.nft_offers(mint_address);
CREATE INDEX IF NOT EXISTS idx_nft_offers_buyer ON public.nft_offers(buyer_wallet);

-- 5.3 NFT Sales History
-- Record of completed sales
CREATE TABLE IF NOT EXISTS public.nft_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  sale_price DECIMAL(20, 2) NOT NULL,
  platform_fee DECIMAL(20, 2) NOT NULL,
  seller_proceeds DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'LOS',
  transaction_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_sales_mint ON public.nft_sales(mint_address);
CREATE INDEX IF NOT EXISTS idx_nft_sales_seller ON public.nft_sales(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_sales_buyer ON public.nft_sales(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_sales_date ON public.nft_sales(created_at);

-- =====================================================
-- SECTION 6: FEATURE FLAGS & SYSTEM TABLES
-- =====================================================

-- 6.1 Feature Flags
-- Control feature availability
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Social Verification
-- Track social media verification status
CREATE TABLE IF NOT EXISTS public.social_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_verification_wallet ON public.social_verification(wallet_address);

-- =====================================================
-- SECTION 7: SAVED COLLECTIONS & CREATOR REWARDS
-- =====================================================

-- 7.1 Saved Collections
-- Collections created by users
CREATE TABLE IF NOT EXISTS public.saved_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_wallet TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT NOT NULL,
  collection_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  collection_data JSONB NOT NULL,
  is_deployed BOOLEAN DEFAULT FALSE,
  deployment_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_collections_creator ON public.saved_collections(creator_wallet);

-- 7.2 Creator Rewards
-- Track creator earnings and rewards
CREATE TABLE IF NOT EXISTS public.creator_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_wallet TEXT NOT NULL,
  collection_address TEXT,
  reward_type TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'LOS',
  transaction_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_rewards_wallet ON public.creator_rewards(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_collection ON public.creator_rewards(collection_address);

-- =====================================================
-- SECTION 8: DATABASE FUNCTIONS
-- =====================================================

-- 8.1 Check Los Bros Allocation
DROP FUNCTION IF EXISTS check_los_bros_allocation(TEXT, TEXT);
DROP FUNCTION IF EXISTS check_los_bros_allocation(TEXT);

CREATE OR REPLACE FUNCTION check_los_bros_allocation(
  p_tier TEXT,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  tier TEXT,
  allocated INTEGER,
  minted INTEGER,
  remaining INTEGER,
  is_available BOOLEAN,
  requires_lol BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.tier,
    a.total_allocated,
    a.minted_count,
    (a.total_allocated - a.minted_count) as remaining,
    ((a.total_allocated - a.minted_count) > 0 AND a.is_active) as is_available,
    a.requires_lol
  FROM los_bros_allocations a
  WHERE a.tier = p_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2 Record Los Bros Mint
DROP FUNCTION IF EXISTS record_los_bros_mint(TEXT, TEXT, TEXT, DECIMAL, DECIMAL, INTEGER, DECIMAL);

CREATE OR REPLACE FUNCTION record_los_bros_mint(
  p_wallet_address TEXT,
  p_mint_address TEXT,
  p_tier TEXT,
  p_lol_balance DECIMAL,
  p_final_price DECIMAL,
  p_discount INTEGER,
  p_platform_fee DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update allocation count
  UPDATE los_bros_allocations
  SET 
    minted_count = minted_count + 1,
    updated_at = NOW()
  WHERE tier = p_tier AND minted_count < total_allocated;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.los_bros_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelist_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_mint_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_access_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view profile NFTs" ON public.profile_nfts;
DROP POLICY IF EXISTS "Anyone can view allocations" ON public.los_bros_allocations;
DROP POLICY IF EXISTS "Public can view whitelist" ON public.whitelist_registry;
DROP POLICY IF EXISTS "Public can view page access" ON public.page_access_configs;
DROP POLICY IF EXISTS "Public can view listings" ON public.nft_listings;
DROP POLICY IF EXISTS "Public can view offers" ON public.nft_offers;
DROP POLICY IF EXISTS "Public can view sales" ON public.nft_sales;
DROP POLICY IF EXISTS "Public can view features" ON public.feature_flags;

-- Create RLS Policies

-- Admin Users: Public read
CREATE POLICY "Public can view admin users"
  ON public.admin_users FOR SELECT
  USING (TRUE);

-- User Profiles: Public read, users can update their own
CREATE POLICY "Public can view user profiles"
  ON public.user_profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', TRUE)::json->>'wallet_address');

-- Profile NFTs: Public read
CREATE POLICY "Public can view profile NFTs"
  ON public.profile_nfts FOR SELECT
  USING (TRUE);

-- Los Bros Allocations: Public read
CREATE POLICY "Anyone can view allocations"
  ON public.los_bros_allocations FOR SELECT
  USING (TRUE);

-- Whitelist: Public read
CREATE POLICY "Public can view whitelist"
  ON public.whitelist_registry FOR SELECT
  USING (TRUE);

-- Page Access: Public read
CREATE POLICY "Public can view page access"
  ON public.page_access_configs FOR SELECT
  USING (TRUE);

-- Marketplace Listings: Public read
CREATE POLICY "Public can view listings"
  ON public.nft_listings FOR SELECT
  USING (TRUE);

-- Marketplace Offers: Public read
CREATE POLICY "Public can view offers"
  ON public.nft_offers FOR SELECT
  USING (TRUE);

-- Marketplace Sales: Public read
CREATE POLICY "Public can view sales"
  ON public.nft_sales FOR SELECT
  USING (TRUE);

-- Feature Flags: Public read
CREATE POLICY "Public can view features"
  ON public.feature_flags FOR SELECT
  USING (TRUE);

-- =====================================================
-- SECTION 10: PERMISSIONS & GRANTS
-- =====================================================

-- Grant SELECT to anonymous and authenticated users
GRANT SELECT ON public.admin_users TO anon, authenticated;
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT SELECT ON public.profile_nfts TO anon, authenticated;
GRANT SELECT ON public.los_bros_allocations TO anon, authenticated;
GRANT SELECT ON public.whitelist_registry TO anon, authenticated;
GRANT SELECT ON public.free_mint_usage TO anon, authenticated;
GRANT SELECT ON public.page_access_configs TO anon, authenticated;
GRANT SELECT ON public.nft_listings TO anon, authenticated;
GRANT SELECT ON public.nft_offers TO anon, authenticated;
GRANT SELECT ON public.nft_sales TO anon, authenticated;
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT SELECT ON public.social_verification TO anon, authenticated;
GRANT SELECT ON public.saved_collections TO anon, authenticated;
GRANT SELECT ON public.creator_rewards TO anon, authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION check_los_bros_allocation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_los_bros_mint TO authenticated, service_role;

-- =====================================================
-- SECTION 11: VERIFICATION QUERY
-- =====================================================

-- Verify all tables were created
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify Los Bros allocations
SELECT 
  tier,
  total_allocated,
  minted_count,
  (total_allocated - minted_count) as remaining,
  requires_lol,
  is_active
FROM los_bros_allocations
ORDER BY 
  CASE tier
    WHEN 'TEAM' THEN 1
    WHEN 'COMMUNITY' THEN 2
    WHEN 'EARLY' THEN 3
    WHEN 'PUBLIC' THEN 4
  END;

-- ✅ MASTER SETUP COMPLETE!
-- Your database is now fully configured and ready for production.

