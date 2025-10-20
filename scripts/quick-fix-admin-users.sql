-- =====================================================
-- QUICK FIX FOR ADMIN_USERS TABLE
-- =====================================================
-- This script adds missing columns to admin_users table
-- =====================================================

-- Add wallet_address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'wallet_address') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN wallet_address TEXT UNIQUE;
        RAISE NOTICE 'Added wallet_address column to admin_users';
    ELSE
        RAISE NOTICE 'wallet_address column already exists in admin_users';
    END IF;
END $$;

-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'username') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'Added username column to admin_users';
    ELSE
        RAISE NOTICE 'username column already exists in admin_users';
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN role TEXT DEFAULT 'admin';
        RAISE NOTICE 'Added role column to admin_users';
    ELSE
        RAISE NOTICE 'role column already exists in admin_users';
    END IF;
END $$;

-- Add permissions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'permissions') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN permissions JSONB DEFAULT '{}';
        RAISE NOTICE 'Added permissions column to admin_users';
    ELSE
        RAISE NOTICE 'permissions column already exists in admin_users';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to admin_users';
    ELSE
        RAISE NOTICE 'is_active column already exists in admin_users';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Added created_at column to admin_users';
    ELSE
        RAISE NOTICE 'created_at column already exists in admin_users';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.admin_users 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        RAISE NOTICE 'Added updated_at column to admin_users';
    ELSE
        RAISE NOTICE 'updated_at column already exists in admin_users';
    END IF;
END $$;

-- Now try to insert admin users (only if they don't exist)
INSERT INTO public.admin_users (wallet_address, username, role, permissions) VALUES
  ('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', 'admin1', 'admin', '{"all": true}'),
  ('89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', 'admin2', 'admin', '{"all": true}')
ON CONFLICT (wallet_address) DO NOTHING;

SELECT 'Admin users table columns added successfully! ✅' as status;
