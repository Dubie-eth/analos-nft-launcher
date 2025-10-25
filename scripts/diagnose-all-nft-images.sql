-- ============================================
-- DIAGNOSE ALL NFT IMAGE ISSUES
-- ============================================
-- This checks ALL Los Bros NFTs to see why images aren't loading

-- 1. Count NFTs by trait status
SELECT 
  CASE 
    WHEN los_bros_traits IS NULL THEN '❌ NULL Traits'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN '❌ Empty Traits'
    WHEN jsonb_array_length(los_bros_traits) < 6 THEN '⚠️ Missing Traits (< 6)'
    ELSE '✅ Has All Traits'
  END as status,
  COUNT(*) as nft_count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY 
  CASE 
    WHEN los_bros_traits IS NULL THEN '❌ NULL Traits'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN '❌ Empty Traits'
    WHEN jsonb_array_length(los_bros_traits) < 6 THEN '⚠️ Missing Traits (< 6)'
    ELSE '✅ Has All Traits'
  END
ORDER BY status;

-- 2. Show ALL Los Bros NFTs with their trait count
SELECT 
  los_bros_token_id,
  los_bros_rarity,
  COALESCE(jsonb_array_length(los_bros_traits), 0) as trait_count,
  CASE 
    WHEN los_bros_traits IS NULL THEN 'NULL'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 'EMPTY'
    WHEN jsonb_array_length(los_bros_traits) < 6 THEN 'INCOMPLETE'
    ELSE 'COMPLETE'
  END as trait_status
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY trait_count DESC, CAST(los_bros_token_id AS INTEGER);

-- 3. Show sample NFTs that SHOULD have images (have 6 traits)
SELECT 
  los_bros_token_id,
  jsonb_array_length(los_bros_traits) as trait_count,
  los_bros_traits
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND jsonb_array_length(los_bros_traits) >= 6
LIMIT 3;

