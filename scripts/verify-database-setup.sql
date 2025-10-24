-- ================================================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- Run this after los-bros-database-migration.sql and marketplace-database-schema.sql
-- ================================================================

-- ================================================================
-- PART 1: VERIFY LOS BROS MIGRATION
-- ================================================================

SELECT '🔍 VERIFYING LOS BROS MIGRATION...' AS status;

-- Check profile_nfts columns
SELECT 
  '✅ profile_nfts columns' AS check_name,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS - All 4 new columns exist'
    ELSE '❌ FAIL - Missing columns: ' || (4 - COUNT(*))::text
  END AS result
FROM information_schema.columns
WHERE table_name = 'profile_nfts'
  AND column_name IN ('los_bros_token_id', 'los_bros_rarity', 'discord_handle', 'telegram_handle');

-- Check username unique constraint
SELECT 
  '✅ username unique constraint' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Unique constraint exists'
    ELSE '❌ FAIL - Unique constraint missing'
  END AS result
FROM information_schema.table_constraints
WHERE table_name = 'profile_nfts'
  AND constraint_name = 'profile_nfts_username_unique';

-- Check los_bros_nfts table
SELECT 
  '✅ los_bros_nfts table' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Table exists with ' || COUNT(*)::text || ' columns'
    ELSE '❌ FAIL - Table missing'
  END AS result
FROM information_schema.columns
WHERE table_name = 'los_bros_nfts';

-- Check RLS policies for los_bros_nfts
SELECT 
  '✅ los_bros_nfts RLS policies' AS check_name,
  COUNT(*)::text || ' policies configured' AS result
FROM pg_policies
WHERE tablename = 'los_bros_nfts';

-- ================================================================
-- PART 2: VERIFY MARKETPLACE SCHEMA
-- ================================================================

SELECT '🔍 VERIFYING MARKETPLACE SCHEMA...' AS status;

-- Check nft_listings table
SELECT 
  '✅ nft_listings' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Table exists with ' || COUNT(*)::text || ' columns'
    ELSE '❌ FAIL - Table missing'
  END AS result
FROM information_schema.columns
WHERE table_name = 'nft_listings';

-- Check nft_offers table
SELECT 
  '✅ nft_offers' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Table exists with ' || COUNT(*)::text || ' columns'
    ELSE '❌ FAIL - Table missing'
  END AS result
FROM information_schema.columns
WHERE table_name = 'nft_offers';

-- Check nft_sales table
SELECT 
  '✅ nft_sales' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Table exists with ' || COUNT(*)::text || ' columns'
    ELSE '❌ FAIL - Table missing'
  END AS result
FROM information_schema.columns
WHERE table_name = 'nft_sales';

-- Check platform_fees table
SELECT 
  '✅ platform_fees' AS check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Table exists with ' || COUNT(*)::text || ' columns'
    ELSE '❌ FAIL - Table missing'
  END AS result
FROM information_schema.columns
WHERE table_name = 'platform_fees';

-- Check marketplace RLS policies
SELECT 
  '✅ Marketplace RLS policies' AS check_name,
  COUNT(*)::text || ' policies configured' AS result
FROM pg_policies
WHERE tablename IN ('nft_listings', 'nft_offers', 'nft_sales', 'platform_fees');

-- Check marketplace indexes
SELECT 
  '✅ Marketplace indexes' AS check_name,
  COUNT(*)::text || ' indexes created' AS result
FROM pg_indexes
WHERE tablename IN ('nft_listings', 'nft_offers', 'nft_sales');

-- ================================================================
-- PART 3: DETAILED TABLE INFO
-- ================================================================

SELECT '📊 DETAILED TABLE INFORMATION' AS status;

-- Profile NFTs count
SELECT 
  '📦 profile_nfts' AS table_name,
  COUNT(*)::text || ' records' AS count,
  COUNT(DISTINCT username)::text || ' unique usernames' AS unique_usernames,
  COUNT(CASE WHEN los_bros_token_id IS NOT NULL THEN 1 END)::text || ' with Los Bros' AS with_los_bros
FROM profile_nfts;

-- Los Bros NFTs count
SELECT 
  '🎨 los_bros_nfts' AS table_name,
  COALESCE(COUNT(*)::text, '0') || ' records' AS count,
  COALESCE(COUNT(CASE WHEN rarity_tier = 'LEGENDARY' THEN 1 END)::text, '0') || ' LEGENDARY' AS legendary,
  COALESCE(COUNT(CASE WHEN rarity_tier = 'EPIC' THEN 1 END)::text, '0') || ' EPIC' AS epic,
  COALESCE(COUNT(CASE WHEN rarity_tier = 'RARE' THEN 1 END)::text, '0') || ' RARE' AS rare,
  COALESCE(COUNT(CASE WHEN rarity_tier = 'COMMON' THEN 1 END)::text, '0') || ' COMMON' AS common
FROM los_bros_nfts;

-- NFT listings count
SELECT 
  '🏪 nft_listings' AS table_name,
  COALESCE(COUNT(*)::text, '0') || ' total' AS total,
  COALESCE(COUNT(CASE WHEN status = 'active' THEN 1 END)::text, '0') || ' active' AS active,
  COALESCE(COUNT(CASE WHEN status = 'sold' THEN 1 END)::text, '0') || ' sold' AS sold,
  COALESCE(COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::text, '0') || ' cancelled' AS cancelled
FROM nft_listings;

-- NFT offers count
SELECT 
  '💰 nft_offers' AS table_name,
  COALESCE(COUNT(*)::text, '0') || ' total' AS total,
  COALESCE(COUNT(CASE WHEN status = 'pending' THEN 1 END)::text, '0') || ' pending' AS pending,
  COALESCE(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::text, '0') || ' accepted' AS accepted,
  COALESCE(COUNT(CASE WHEN status = 'rejected' THEN 1 END)::text, '0') || ' rejected' AS rejected
FROM nft_offers;

-- NFT sales count
SELECT 
  '💸 nft_sales' AS table_name,
  COALESCE(COUNT(*)::text, '0') || ' sales' AS count,
  COALESCE(ROUND(SUM(sale_price), 2)::text, '0') || ' LOS total volume' AS total_volume,
  COALESCE(ROUND(SUM(platform_fee), 2)::text, '0') || ' LOS platform fees (6.9%)' AS platform_fees
FROM nft_sales;

-- ================================================================
-- FINAL STATUS
-- ================================================================

SELECT '✅ VERIFICATION COMPLETE!' AS status,
       'All systems ready for NFT marketplace launch' AS message;

-- Show any missing tables or issues
SELECT 
  '⚠️  MISSING TABLES' AS alert,
  string_agg(table_name, ', ') AS missing
FROM (
  SELECT 'profile_nfts' AS table_name WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_nfts')
  UNION ALL
  SELECT 'los_bros_nfts' WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'los_bros_nfts')
  UNION ALL
  SELECT 'nft_listings' WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nft_listings')
  UNION ALL
  SELECT 'nft_offers' WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nft_offers')
  UNION ALL
  SELECT 'nft_sales' WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nft_sales')
  UNION ALL
  SELECT 'platform_fees' WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_fees')
) t
WHERE table_name IS NOT NULL;

