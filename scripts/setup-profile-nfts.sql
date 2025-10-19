-- PROFILE NFTS TABLE SETUP
-- Stores compressed NFT profile cards for users

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

-- Add RLS policies
ALTER TABLE public.profile_nfts ENABLE ROW LEVEL SECURITY;

-- Public can view all profile NFTs
CREATE POLICY "Public can view profile NFTs." ON public.profile_nfts
  FOR SELECT USING (true);

-- Users can insert their own profile NFTs
CREATE POLICY "Users can create their own profile NFTs." ON public.profile_nfts
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- Users can update their own profile NFTs
CREATE POLICY "Users can update their own profile NFTs." ON public.profile_nfts
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Admins can manage all profile NFTs
CREATE POLICY "Admins can manage all profile NFTs." ON public.profile_nfts
  FOR ALL USING (auth.uid() IN (SELECT wallet_address FROM public.admin_users WHERE role = 'admin')) 
  WITH CHECK (auth.uid() IN (SELECT wallet_address FROM public.admin_users WHERE role = 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_nfts_wallet_address ON public.profile_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_mint_address ON public.profile_nfts(mint_address);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_username ON public.profile_nfts(username);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_referral_code ON public.profile_nfts(referral_code);
CREATE INDEX IF NOT EXISTS idx_profile_nfts_created_at ON public.profile_nfts(created_at);

-- Add trigger to update updated_at timestamp
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
COMMENT ON TABLE public.profile_nfts IS 'Stores compressed NFT profile cards for users';
COMMENT ON COLUMN public.profile_nfts.wallet_address IS 'User wallet address (primary key)';
COMMENT ON COLUMN public.profile_nfts.mint_address IS 'NFT mint address on blockchain';
COMMENT ON COLUMN public.profile_nfts.username IS 'Unique username';
COMMENT ON COLUMN public.profile_nfts.referral_code IS 'User referral code';
COMMENT ON COLUMN public.profile_nfts.nft_metadata IS 'Complete NFT metadata JSON';
COMMENT ON COLUMN public.profile_nfts.mint_price IS 'Price paid to mint (default 4.20 LOS)';
COMMENT ON COLUMN public.profile_nfts.twitter_verified IS 'Whether Twitter account is verified';
