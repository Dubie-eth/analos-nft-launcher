-- =====================================================
-- FIX ADMIN_USERS TABLE STRUCTURE
-- =====================================================
-- This script fixes the admin_users table structure issues
-- =====================================================

-- First, let's see what columns actually exist in admin_users
DO $$ 
DECLARE
    column_list TEXT;
BEGIN
    -- Get list of existing columns
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO column_list
    FROM information_schema.columns 
    WHERE table_name = 'admin_users' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Existing columns in admin_users: %', COALESCE(column_list, 'Table does not exist');
END $$;

-- Drop and recreate admin_users table with correct structure
DROP TABLE IF EXISTS public.admin_users CASCADE;

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

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Public can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Create permissive policy for development
CREATE POLICY "Allow all operations on admin_users" ON public.admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_wallet_address ON public.admin_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert admin users
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}')
ON CONFLICT (wallet_address) DO NOTHING;

SELECT 'Admin users table fixed successfully! ✅' as status;
