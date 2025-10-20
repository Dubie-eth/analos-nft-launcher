-- =====================================================
-- SIMPLE ADMIN_USERS FIX
-- =====================================================
-- This script creates a clean admin_users table
-- =====================================================

-- Drop the problematic admin_users table completely
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create a fresh admin_users table with correct structure
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

-- Create a simple permissive policy
CREATE POLICY "Allow all operations on admin_users" ON public.admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Insert the admin users
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}');

-- Verify the table was created correctly
SELECT 'admin_users table created successfully!' as status;
SELECT COUNT(*) as admin_count FROM public.admin_users;
