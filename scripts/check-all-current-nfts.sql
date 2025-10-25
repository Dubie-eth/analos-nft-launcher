-- ============================================
-- CHECK ALL CURRENT LOS BROS NFTS
-- ============================================
-- See what we're working with

-- 1. List ALL Los Bros NFTs with their traits
SELECT 
  los_bros_token_id,
  wallet_address,
  los_bros_tier,
  los_bros_rarity,
  jsonb_array_length(los_bros_traits) as trait_count,
  los_bros_traits,
  created_at
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- 2. Count by trait status
SELECT 
  CASE 
    WHEN los_bros_traits IS NULL THEN 'Missing Traits'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 'Empty Array'
    WHEN jsonb_array_length(los_bros_traits) > 0 THEN 'Has Traits'
  END as status,
  COUNT(*) as count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- 3. Extract all unique trait values being used
SELECT DISTINCT
  jsonb_array_elements(los_bros_traits)->>'trait_type' as trait_type,
  jsonb_array_elements(los_bros_traits)->>'value' as trait_value
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits IS NOT NULL
  AND jsonb_array_length(los_bros_traits) > 0
ORDER BY trait_type, trait_value;

