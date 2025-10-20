-- COMPLETE DATABASE SETUP FOR ANALOS NFT LAUNCHPAD
-- This script sets up all necessary tables for the application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_profiles table
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

-- Create profile_nfts table
CREATE TABLE IF NOT EXISTS public.profile_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  mint_address TEXT UNIQUE NOT NULL,
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

-- Create profile_nft_mint_counter table
CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER NOT NULL DEFAULT 0,
  total_minted INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert initial counter if it doesn't exist
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted)
SELECT 1, 0
WHERE NOT EXISTS (SELECT 1 FROM public.profile_nft_mint_counter);

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nft_mint_counter ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Public can view admin users." ON public.admin_users
  FOR SELECT USING (true);

-- Create RLS policies for user_profiles
CREATE POLICY "Public can view user profiles." ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile." ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own profile." ON public.user_profiles
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Create RLS policies for profile_nfts
CREATE POLICY "Public can view profile NFTs." ON public.profile_nfts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile NFTs." ON public.profile_nfts
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

CREATE POLICY "Users can update their own profile NFTs." ON public.profile_nfts
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Create RLS policies for profile_nft_mint_counter
CREATE POLICY "Public can view mint counter." ON public.profile_nft_mint_counter
  FOR SELECT USING (true);

CREATE POLICY "Public can update mint counter." ON public.profile_nft_mint_counter
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_profile_nfts_wallet_address ON public.profile_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint_address ON public.profile_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_username ON public.profile_nfts(username);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_referral_code ON public.profile_nfts(referral_code);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_created_at ON public.profile_nfts(created_at);

-- Add triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

CREATE OR REPLACE FUNCTION update_profile_nfts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_nfts_updated_at
  BEFORE UPDATE ON public.profile_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_nfts_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Stores user profile data for blockchain profiles';
COMMENT ON TABLE public.profile_nfts IS 'Stores compressed NFT profile cards for users';
COMMENT ON TABLE public.profile_nft_mint_counter IS 'Tracks the current mint number for profile NFTs';
