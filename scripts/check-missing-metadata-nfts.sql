-- ============================================
-- Check NFTs Missing Trait Metadata
-- ============================================

-- Check specific NFTs that need metadata
SELECT 
  los_bros_token_id,
  wallet_address,
  los_bros_tier,
  los_bros_rarity,
  los_bros_rarity_score,
  los_bros_traits,
  nft_metadata,
  metadata_uri,
  created_at
FROM profile_nfts
WHERE los_bros_token_id IN ('1327', '917', '53')
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- Check all NFTs with missing or empty traits
SELECT 
  los_bros_token_id,
  wallet_address,
  los_bros_tier,
  CASE 
    WHEN los_bros_traits IS NULL THEN 'NULL'
    WHEN los_bros_traits = '[]'::jsonb THEN 'EMPTY ARRAY'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 'ZERO LENGTH'
    ELSE 'HAS TRAITS'
  END as traits_status,
  jsonb_array_length(los_bros_traits) as trait_count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY 
  CASE 
    WHEN los_bros_traits IS NULL THEN 1
    WHEN los_bros_traits = '[]'::jsonb THEN 2
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 3
    ELSE 4
  END,
  CAST(los_bros_token_id AS INTEGER);

-- Count NFTs by trait status
SELECT 
  CASE 
    WHEN los_bros_traits IS NULL THEN 'Missing (NULL)'
    WHEN los_bros_traits = '[]'::jsonb THEN 'Empty Array'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 'Zero Traits'
    ELSE 'Has Traits'
  END as status,
  COUNT(*) as count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY 
  CASE 
    WHEN los_bros_traits IS NULL THEN 'Missing (NULL)'
    WHEN los_bros_traits = '[]'::jsonb THEN 'Empty Array'
    WHEN jsonb_array_length(los_bros_traits) = 0 THEN 'Zero Traits'
    ELSE 'Has Traits'
  END
ORDER BY count DESC;

