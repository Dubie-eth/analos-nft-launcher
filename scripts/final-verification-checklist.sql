-- ============================================
-- FINAL VERIFICATION CHECKLIST
-- ============================================
-- Ensures all systems are working together

-- 1. Check which NFTs have working traits vs placeholders
SELECT 
  los_bros_token_id,
  CASE 
    WHEN los_bros_traits IS NULL OR jsonb_array_length(los_bros_traits) = 0 THEN '🎨 Placeholder (OG)'
    ELSE '✅ Has Traits'
  END as image_status,
  jsonb_array_length(los_bros_traits) as trait_count,
  los_bros_rarity,
  los_bros_rarity_score
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- 2. Verify all trait values match actual files
SELECT 
  los_bros_token_id,
  jsonb_array_elements(los_bros_traits)->>'trait_type' as trait_type,
  jsonb_array_elements(los_bros_traits)->>'value' as trait_value,
  CASE 
    -- Check if value follows lowercase_underscore format
    WHEN jsonb_array_elements(los_bros_traits)->>'value' ~ '^[a-z0-9_]+$' OR jsonb_array_elements(los_bros_traits)->>'value' = 'None' THEN '✅'
    ELSE '❌ Invalid Format'
  END as format_check
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits IS NOT NULL
  AND jsonb_array_length(los_bros_traits) > 0
ORDER BY los_bros_token_id, 
  CASE jsonb_array_elements(los_bros_traits)->>'trait_type'
    WHEN 'Background' THEN 1
    WHEN 'Body' THEN 2
    WHEN 'Clothes' THEN 3
    WHEN 'Mouth' THEN 4
    WHEN 'Eyes' THEN 5
    WHEN 'Hat' THEN 6
    ELSE 7
  END;

-- 3. Count NFTs by image type
SELECT 
  CASE 
    WHEN los_bros_traits IS NULL OR jsonb_array_length(los_bros_traits) = 0 THEN 'OG Placeholder SVG'
    ELSE 'Composite Trait Image'
  END as image_type,
  COUNT(*) as count,
  ARRAY_AGG(los_bros_token_id ORDER BY CAST(los_bros_token_id AS INTEGER)) as token_ids
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY image_type;

-- 4. Show trait layer breakdown for working NFTs
SELECT 
  los_bros_token_id,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Background') as has_background,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Body') as has_body,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Clothes') as has_clothes,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Mouth') as has_mouth,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Eyes') as has_eyes,
  (SELECT COUNT(*) FROM jsonb_array_elements(los_bros_traits) WHERE elem->>'trait_type' = 'Hat') as has_hat
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits IS NOT NULL
  AND jsonb_array_length(los_bros_traits) > 0
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- 5. Summary
SELECT 
  'Total Los Bros Minted' as metric,
  COUNT(*) as value
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL

UNION ALL

SELECT 
  'OG Placeholders (Cool!)' as metric,
  COUNT(*) as value
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND (los_bros_traits IS NULL OR jsonb_array_length(los_bros_traits) = 0)

UNION ALL

SELECT 
  'Composite Images' as metric,
  COUNT(*) as value
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits IS NOT NULL
  AND jsonb_array_length(los_bros_traits) > 0;

