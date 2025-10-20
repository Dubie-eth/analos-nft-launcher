-- =====================================================
-- FIX MISSING COLUMNS IN EXISTING TABLES
-- =====================================================
-- This script adds missing columns to existing tables
-- Run this if you get "column does not exist" errors
-- =====================================================

-- Add missing columns to user_profiles table
DO $$ 
BEGIN
    -- Add twitter_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'twitter_verified') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN twitter_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added twitter_verified column to user_profiles';
    ELSE
        RAISE NOTICE 'twitter_verified column already exists in user_profiles';
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'website') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to user_profiles';
    ELSE
        RAISE NOTICE 'website column already exists in user_profiles';
    END IF;

    -- Add discord column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'discord') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN discord TEXT;
        RAISE NOTICE 'Added discord column to user_profiles';
    ELSE
        RAISE NOTICE 'discord column already exists in user_profiles';
    END IF;

    -- Add telegram column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'telegram') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN telegram TEXT;
        RAISE NOTICE 'Added telegram column to user_profiles';
    ELSE
        RAISE NOTICE 'telegram column already exists in user_profiles';
    END IF;

    -- Add github column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'github') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN github TEXT;
        RAISE NOTICE 'Added github column to user_profiles';
    ELSE
        RAISE NOTICE 'github column already exists in user_profiles';
    END IF;

    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'is_anonymous') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_anonymous column to user_profiles';
    ELSE
        RAISE NOTICE 'is_anonymous column already exists in user_profiles';
    END IF;

    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to user_profiles';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in user_profiles';
    END IF;

    -- Add banner_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'banner_url') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN banner_url TEXT;
        RAISE NOTICE 'Added banner_url column to user_profiles';
    ELSE
        RAISE NOTICE 'banner_url column already exists in user_profiles';
    END IF;

END $$;

-- Add missing columns to profile_nfts table if it exists
DO $$ 
BEGIN
    -- Check if profile_nfts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'profile_nfts') THEN
        
        -- Add mint_number column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'profile_nfts' 
                       AND column_name = 'mint_number') THEN
            ALTER TABLE public.profile_nfts 
            ADD COLUMN mint_number INTEGER;
            RAISE NOTICE 'Added mint_number column to profile_nfts';
        ELSE
            RAISE NOTICE 'mint_number column already exists in profile_nfts';
        END IF;

        -- Add other missing columns as needed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'profile_nfts' 
                       AND column_name = 'twitter_verified') THEN
            ALTER TABLE public.profile_nfts 
            ADD COLUMN twitter_verified BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added twitter_verified column to profile_nfts';
        ELSE
            RAISE NOTICE 'twitter_verified column already exists in profile_nfts';
        END IF;

    ELSE
        RAISE NOTICE 'profile_nfts table does not exist yet';
    END IF;
END $$;

-- Add missing columns to admin_users table if it exists
DO $$ 
BEGIN
    -- Check if admin_users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'admin_users') THEN
        
        -- Add username column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'admin_users' 
                       AND column_name = 'username') THEN
            ALTER TABLE public.admin_users 
            ADD COLUMN username TEXT UNIQUE;
            RAISE NOTICE 'Added username column to admin_users';
        ELSE
            RAISE NOTICE 'username column already exists in admin_users';
        END IF;

    ELSE
        RAISE NOTICE 'admin_users table does not exist yet';
    END IF;
END $$;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER DEFAULT 1 NOT NULL,
  total_minted INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  description TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.social_verification (
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

-- Insert initial data if not exists
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted) 
VALUES (1, 0) 
ON CONFLICT DO NOTHING;

-- Insert admin users with username field
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}')
ON CONFLICT (wallet_address) DO NOTHING;

INSERT INTO public.feature_flags (feature_name, is_enabled, description) VALUES
  ('profile_nft_minting', true, 'Enable profile NFT minting functionality'),
  ('social_verification', true, 'Enable social media verification'),
  ('collection_creation', false, 'Enable user collection creation'),
  ('marketplace', false, 'Enable marketplace functionality'),
  ('staking', false, 'Enable staking functionality')
ON CONFLICT (feature_name) DO NOTHING;

INSERT INTO public.page_access_config (page_path, requires_wallet, requires_admin, is_public, is_locked, description) VALUES
  ('/', false, false, true, false, 'Home page - public access'),
  ('/profile', true, false, true, false, 'Profile page - requires wallet connection'),
  ('/admin', true, true, false, false, 'Admin panel - requires admin access'),
  ('/create-collection', true, false, false, true, 'Collection creation - locked for launch'),
  ('/marketplace', false, false, false, true, 'Marketplace - locked for launch'),
  ('/staking', false, false, false, true, 'Staking - locked for launch'),
  ('/social-verification', true, false, true, false, 'Social verification - requires wallet')
ON CONFLICT (page_path) DO NOTHING;

SELECT 'Missing columns and tables fixed successfully! ✅' as status;
