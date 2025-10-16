-- 🔍 Supabase Schema Analysis Query
-- Run this in Supabase SQL Editor to see what tables and functions you currently have

-- Check all tables in public schema
SELECT 
    'TABLE' as object_type,
    table_name as object_name,
    'public' as schema_name
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL

-- Check all functions in public schema
SELECT 
    'FUNCTION' as object_type,
    routine_name as object_name,
    'public' as schema_name
FROM information_schema.routines 
WHERE routine_schema = 'public'
UNION ALL

-- Check all views in public schema
SELECT 
    'VIEW' as object_type,
    table_name as object_name,
    'public' as schema_name
FROM information_schema.views 
WHERE table_schema = 'public'

ORDER BY object_type, object_name;

-- 🎯 Expected Results After Cleanup:
-- You should see these tables:
-- - saved_collections
-- - creator_rewards  
-- - collection_sales
-- - user_profiles (if exists)
-- - user_points (if exists)

-- And these functions:
-- - get_collection_stats
-- - calculate_creator_rewards
-- - update_collection_sales
-- - get_user_rewards_summary
