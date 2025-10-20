-- =====================================================
-- DIAGNOSE ADMIN_USERS TABLE STRUCTURE
-- =====================================================
-- This script shows us what's actually in your admin_users table
-- =====================================================

-- Check if admin_users table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public')
        THEN 'admin_users table EXISTS'
        ELSE 'admin_users table does NOT exist'
    END as table_status;

-- If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show any existing data in admin_users table
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public')
        THEN (SELECT COUNT(*)::text || ' rows in admin_users table' FROM public.admin_users)
        ELSE 'Cannot count - table does not exist'
    END as row_count;

-- Show sample data if table exists and has data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
            RAISE NOTICE 'Sample data from admin_users:';
            -- This will show the first row's structure
            PERFORM * FROM public.admin_users LIMIT 1;
        ELSE
            RAISE NOTICE 'admin_users table exists but is empty';
        END IF;
    ELSE
        RAISE NOTICE 'admin_users table does not exist';
    END IF;
END $$;
