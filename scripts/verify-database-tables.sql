-- =====================================================
-- DATABASE VERIFICATION SCRIPT
-- =====================================================
-- This script checks if all required tables exist in the database
-- and provides a comprehensive status report.
-- =====================================================

-- Check if all required tables exist
SELECT 
    'user_profiles' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.user_profiles) as row_count
UNION ALL
SELECT 
    'profile_nfts' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_nfts' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.profile_nfts) as row_count
UNION ALL
SELECT 
    'profile_nft_mint_counter' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_nft_mint_counter' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.profile_nft_mint_counter) as row_count
UNION ALL
SELECT 
    'admin_users' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.admin_users) as row_count
UNION ALL
SELECT 
    'feature_flags' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.feature_flags) as row_count
UNION ALL
SELECT 
    'page_access_config' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_access_config' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.page_access_config) as row_count
UNION ALL
SELECT 
    'social_verification' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_verification' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.social_verification) as row_count
UNION ALL
SELECT 
    'saved_collections' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_collections' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.saved_collections) as row_count
UNION ALL
SELECT 
    'free_mint_usage' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'free_mint_usage' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.free_mint_usage) as row_count
UNION ALL
SELECT 
    'whitelist_registry' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whitelist_registry' AND table_schema = 'public') 
         THEN '✅ EXISTS' 
         ELSE '❌ MISSING' 
    END as status,
    (SELECT COUNT(*) FROM public.whitelist_registry) as row_count;

-- Check RLS (Row Level Security) status
SELECT 
    'RLS Status Check' as check_type,
    table_name,
    CASE WHEN row_security = 'YES' 
         THEN '✅ ENABLED' 
         ELSE '❌ DISABLED' 
    END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_name IN (
    'user_profiles', 'profile_nfts', 'profile_nft_mint_counter', 
    'admin_users', 'feature_flags', 'page_access_config', 
    'social_verification', 'saved_collections', 'free_mint_usage', 'whitelist_registry'
  )
ORDER BY t.table_name;

-- Check if admin users exist
SELECT 
    'Admin Users Check' as check_type,
    COUNT(*) as admin_count,
    CASE WHEN COUNT(*) > 0 
         THEN '✅ ADMIN USERS EXIST' 
         ELSE '❌ NO ADMIN USERS' 
    END as status
FROM public.admin_users;

-- Check if feature flags are configured
SELECT 
    'Feature Flags Check' as check_type,
    COUNT(*) as flag_count,
    CASE WHEN COUNT(*) > 0 
         THEN '✅ FEATURE FLAGS CONFIGURED' 
         ELSE '❌ NO FEATURE FLAGS' 
    END as status
FROM public.feature_flags;

-- Check if page access config exists
SELECT 
    'Page Access Check' as check_type,
    COUNT(*) as page_count,
    CASE WHEN COUNT(*) > 0 
         THEN '✅ PAGE ACCESS CONFIGURED' 
         ELSE '❌ NO PAGE ACCESS CONFIG' 
    END as status
FROM public.page_access_config;

-- Check mint counter initialization
SELECT 
    'Mint Counter Check' as check_type,
    current_mint_number,
    total_minted,
    CASE WHEN current_mint_number > 0 
         THEN '✅ MINT COUNTER INITIALIZED' 
         ELSE '❌ MINT COUNTER NOT INITIALIZED' 
    END as status
FROM public.profile_nft_mint_counter
LIMIT 1;

-- Summary
SELECT 'DATABASE VERIFICATION COMPLETE' as summary;
