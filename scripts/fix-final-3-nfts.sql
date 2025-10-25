-- ============================================
-- FIX FINAL 3 NFTS WITH INCORRECT HAT VALUES
-- ============================================

-- Fix #1327: cap_red → cap_snapback
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Hat' AND elem->>'value' = 'cap_red' 
        THEN jsonb_build_object('trait_type', 'Hat', 'value', 'cap_snapback')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id = '1327';

-- Fix #917: beanie_blue → beanie_striped
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Hat' AND elem->>'value' = 'beanie_blue' 
        THEN jsonb_build_object('trait_type', 'Hat', 'value', 'beanie_striped')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id = '917';

-- Fix #53: cap_black → cap_baseball
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Hat' AND elem->>'value' = 'cap_black' 
        THEN jsonb_build_object('trait_type', 'Hat', 'value', 'cap_baseball')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id = '53';

-- Verify all 3 are fixed
SELECT 
  los_bros_token_id,
  jsonb_array_elements(los_bros_traits)->>'trait_type' as trait_type,
  jsonb_array_elements(los_bros_traits)->>'value' as trait_value
FROM profile_nfts
WHERE los_bros_token_id IN ('1327', '917', '53')
ORDER BY los_bros_token_id, trait_type;

