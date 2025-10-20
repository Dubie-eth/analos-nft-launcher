-- USER PROFILES TABLE SETUP
-- Stores user profile data for blockchain profiles

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

-- Add RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view all user profiles
CREATE POLICY "Public can view user profiles." ON public.user_profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile." ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile." ON public.user_profiles
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all user profiles." ON public.user_profiles
  FOR ALL USING (auth.uid() IN (SELECT wallet_address FROM public.admin_users WHERE role = 'admin')) 
  WITH CHECK (auth.uid() IN (SELECT wallet_address FROM public.admin_users WHERE role = 'admin'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Add trigger to update updated_at timestamp
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

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Stores user profile data for blockchain profiles';
COMMENT ON COLUMN public.user_profiles.wallet_address IS 'User wallet address (unique)';
COMMENT ON COLUMN public.user_profiles.username IS 'Unique username';
COMMENT ON COLUMN public.user_profiles.twitter_verified IS 'Whether Twitter account is verified';
COMMENT ON COLUMN public.user_profiles.is_anonymous IS 'Whether profile should be kept anonymous';
