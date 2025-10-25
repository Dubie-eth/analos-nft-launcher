-- ============================================
-- FIX ALL TRAIT VALUES TO MATCH ACTUAL FILES
-- ============================================
-- Updates ALL Los Bros NFTs to use trait values that match existing files

-- BACKGROUND FIXES
-- "Abstract" → needs a real file (keep as-is if abstract.png exists, otherwise pick one)
-- "Desert" → needs a real file  
-- "Neon City" → doesn't exist, pick a real one
UPDATE profile_nfts
SET los_bros_traits = jsonb_set(
  los_bros_traits,
  '{0,value}',
  '"analos"'
)
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits @> '[{"trait_type": "Background", "value": "Abstract"}]';

UPDATE profile_nfts
SET los_bros_traits = jsonb_set(
  los_bros_traits,
  '{0,value}',
  '"solid_blue"'
)
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits @> '[{"trait_type": "Background", "value": "Desert"}]';

UPDATE profile_nfts
SET los_bros_traits = jsonb_set(
  los_bros_traits,
  '{0,value}',
  '"baige"'
)
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits @> '[{"trait_type": "Background", "value": "Neon City"}]';

-- BODY FIXES
-- "Hoodie" → doesn't exist in Bodys folder, use a real body type
-- "Tank Top" → doesn't exist, use a real one
-- "Muscular" → doesn't exist, use a real one
-- "Slim" → doesn't exist, use a real one
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Body' AND elem->>'value' = 'Hoodie' THEN jsonb_build_object('trait_type', 'Body', 'value', 'analos')
      WHEN elem->>'trait_type' = 'Body' AND elem->>'value' = 'Tank Top' THEN jsonb_build_object('trait_type', 'Body', 'value', 'gold')
      WHEN elem->>'trait_type' = 'Body' AND elem->>'value' = 'Muscular' THEN jsonb_build_object('trait_type', 'Body', 'value', 'zombie')
      WHEN elem->>'trait_type' = 'Body' AND elem->>'value' = 'Slim' THEN jsonb_build_object('trait_type', 'Body', 'value', 'baige')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id IS NOT NULL
  AND (
    los_bros_traits @> '[{"trait_type": "Body", "value": "Hoodie"}]' OR
    los_bros_traits @> '[{"trait_type": "Body", "value": "Tank Top"}]' OR
    los_bros_traits @> '[{"trait_type": "Body", "value": "Muscular"}]' OR
    los_bros_traits @> '[{"trait_type": "Body", "value": "Slim"}]'
  );

-- EYES FIXES
-- "Eye Patch" → eye_patch doesn't exist, but we have eye patch variants
-- "Regular" → doesn't exist, use normal_black or similar
-- "Sunglasses" → doesn't exist, pick a real one
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Eyes' AND elem->>'value' = 'Eye Patch' THEN jsonb_build_object('trait_type', 'Eyes', 'value', 'angry_dark')
      WHEN elem->>'trait_type' = 'Eyes' AND elem->>'value' = 'Regular' THEN jsonb_build_object('trait_type', 'Eyes', 'value', 'normal_black')
      WHEN elem->>'trait_type' = 'Eyes' AND elem->>'value' = 'Sunglasses' THEN jsonb_build_object('trait_type', 'Eyes', 'value', 'glowing_cyan')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id IS NOT NULL
  AND (
    los_bros_traits @> '[{"trait_type": "Eyes", "value": "Eye Patch"}]' OR
    los_bros_traits @> '[{"trait_type": "Eyes", "value": "Regular"}]' OR
    los_bros_traits @> '[{"trait_type": "Eyes", "value": "Sunglasses"}]'
  );

-- HAT FIXES
-- "Bandana" → needs color, use bandana_black
-- "None" → skip, API handles this
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Hat' AND elem->>'value' = 'Bandana' THEN jsonb_build_object('trait_type', 'Hat', 'value', 'bandana_black')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_traits @> '[{"trait_type": "Hat", "value": "Bandana"}]';

-- MOUTH FIXES
-- "Mustache" → doesn't exist, use a real smile
-- "Neutral" → doesn't exist, use neutral_line (just renamed!)
-- "Smile" → doesn't exist, use smile_happy
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Mouth' AND elem->>'value' = 'Mustache' THEN jsonb_build_object('trait_type', 'Mouth', 'value', 'frown_sad')
      WHEN elem->>'trait_type' = 'Mouth' AND elem->>'value' = 'Neutral' THEN jsonb_build_object('trait_type', 'Mouth', 'value', 'neutral_line')
      WHEN elem->>'trait_type' = 'Mouth' AND elem->>'value' = 'Smile' THEN jsonb_build_object('trait_type', 'Mouth', 'value', 'smile_happy')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id IS NOT NULL
  AND (
    los_bros_traits @> '[{"trait_type": "Mouth", "value": "Mustache"}]' OR
    los_bros_traits @> '[{"trait_type": "Mouth", "value": "Neutral"}]' OR
    los_bros_traits @> '[{"trait_type": "Mouth", "value": "Smile"}]'
  );

-- ACCESSORY FIXES
-- "Gold Chain" → doesn't exist, skip or use None
-- "Bracelet" → doesn't exist
-- "Earring" → doesn't exist
-- For now, just set all Accessory to None (we don't have an Accessory folder)
UPDATE profile_nfts
SET los_bros_traits = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'trait_type' = 'Accessory' THEN jsonb_build_object('trait_type', 'Accessory', 'value', 'None')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(los_bros_traits) elem
)
WHERE los_bros_token_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(los_bros_traits) e 
    WHERE e->>'trait_type' = 'Accessory'
  );

-- Verify the fixes
SELECT 
  los_bros_token_id,
  jsonb_array_elements(los_bros_traits)->>'trait_type' as trait_type,
  jsonb_array_elements(los_bros_traits)->>'value' as trait_value
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY los_bros_token_id, trait_type;

