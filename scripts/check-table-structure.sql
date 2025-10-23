-- =====================================================
-- TABLE STRUCTURE DIAGNOSTIC SCRIPT
-- =====================================================
-- This script checks the exact structure of existing tables
-- to identify missing columns or tables.
-- =====================================================

-- Check if user_profiles table exists and its structure
SELECT 
    'user_profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status;

-- If user_profiles exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if admin_users table exists and its structure
SELECT 
    'admin_users' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status;

-- If admin_users exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if free_mint_usage table exists and its structure
SELECT 
    'free_mint_usage' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mint_usage' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status;

-- If free_mint_usage exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'free_mint_usage' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if whitelist_registry table exists and its structure
SELECT 
    'whitelist_registry' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whitelist_registry' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status;

-- If whitelist_registry exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whitelist_registry' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- List ALL tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
