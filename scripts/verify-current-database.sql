-- =====================================================
-- DATABASE VERIFICATION SCRIPT
-- =====================================================
-- Run this to see EXACTLY what's in your current database
-- =====================================================

-- 1. List ALL tables
SELECT 
  '=== ALL TABLES ===' as info;

SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Profile NFTs Structure
SELECT 
  '=== PROFILE_NFTS COLUMNS ===' as info;

SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_nfts'
ORDER BY ordinal_position;

-- 3. Los Bros Allocations Data
SELECT 
  '=== LOS BROS ALLOCATIONS ===' as info;

SELECT 
  tier,
  total_allocated,
  minted_count,
  (total_allocated - minted_count) as remaining,
  requires_lol,
  is_active
FROM los_bros_allocations
ORDER BY 
  CASE tier
    WHEN 'TEAM' THEN 1
    WHEN 'COMMUNITY' THEN 2
    WHEN 'EARLY' THEN 3
    WHEN 'PUBLIC' THEN 4
  END;

-- 4. Count of Profile NFTs minted
SELECT 
  '=== PROFILE NFT COUNTS ===' as info;

SELECT 
  COUNT(*) as total_profile_nfts,
  COUNT(*) FILTER (WHERE los_bros_tier IS NOT NULL) as with_los_bros,
  COUNT(*) FILTER (WHERE los_bros_tier IS NULL) as without_los_bros
FROM profile_nfts;

-- 5. Database Functions
SELECT 
  '=== DATABASE FUNCTIONS ===' as info;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%los_bros%'
ORDER BY routine_name;

-- 6. RLS Policies
SELECT 
  '=== RLS POLICIES ===' as info;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ VERIFICATION COMPLETE
-- =====================================================
-- Review the results above to see your current database state

