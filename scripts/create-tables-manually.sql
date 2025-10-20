-- MANUAL DATABASE TABLE CREATION
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create profile_nft_mint_counter table
CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_mint_number INTEGER NOT NULL DEFAULT 0,
  total_minted INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert initial counter
INSERT INTO public.profile_nft_mint_counter (current_mint_number, total_minted)
VALUES (1, 0)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_nft_mint_counter ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles (drop existing first)
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Public can view user profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (true);

-- Create policies for profile_nfts (drop existing first)
DROP POLICY IF EXISTS "Public can view profile NFTs" ON public.profile_nfts;
DROP POLICY IF EXISTS "Users can create profile NFTs" ON public.profile_nfts;

CREATE POLICY "Public can view profile NFTs" ON public.profile_nfts
  FOR SELECT USING (true);

CREATE POLICY "Users can create profile NFTs" ON public.profile_nfts
  FOR INSERT WITH CHECK (true);

-- Create policies for profile_nft_mint_counter (drop existing first)
DROP POLICY IF EXISTS "Public can view mint counter" ON public.profile_nft_mint_counter;
DROP POLICY IF EXISTS "Public can update mint counter" ON public.profile_nft_mint_counter;

CREATE POLICY "Public can view mint counter" ON public.profile_nft_mint_counter
  FOR SELECT USING (true);

CREATE POLICY "Public can update mint counter" ON public.profile_nft_mint_counter
  FOR UPDATE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_wallet_address ON public.profile_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint_address ON public.profile_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_username ON public.profile_nfts(username);

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_profile_nfts_updated_at ON public.profile_nfts;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_nfts_updated_at
  BEFORE UPDATE ON public.profile_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
