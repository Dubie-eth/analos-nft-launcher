-- ============================================
-- Add Traits to Los Bros NFTs Missing Metadata
-- ============================================
-- This script adds unique random traits to NFTs #1327, #917, #53

-- Los Bros #1327 - Vibrant Vaporwave Style
UPDATE profile_nfts
SET 
  los_bros_traits = '[
    {"trait_type": "Background", "value": "sunset_orange"},
    {"trait_type": "Body", "value": "baige"},
    {"trait_type": "Clothes", "value": "pink_hero"},
    {"trait_type": "Mouth", "value": "smile_grin"},
    {"trait_type": "Eyes", "value": "glowing_neon"},
    {"trait_type": "Hat", "value": "cap_red"}
  ]'::jsonb,
  los_bros_rarity = 'COMMON',
  los_bros_rarity_score = 7.2
WHERE los_bros_token_id = '1327';

-- Los Bros #917 - Cool Blue Aesthetic
UPDATE profile_nfts
SET 
  los_bros_traits = '[
    {"trait_type": "Background", "value": "space_galaxy"},
    {"trait_type": "Body", "value": "robot"},
    {"trait_type": "Clothes", "value": "cyan_stripe"},
    {"trait_type": "Mouth", "value": "smile_cute"},
    {"trait_type": "Eyes", "value": "laser_blue"},
    {"trait_type": "Hat", "value": "beanie_blue"}
  ]'::jsonb,
  los_bros_rarity = 'RARE',
  los_bros_rarity_score = 45.8
WHERE los_bros_token_id = '917';

-- Los Bros #53 - Classic Street Style
UPDATE profile_nfts
SET 
  los_bros_traits = '[
    {"trait_type": "Background", "value": "gradient_purple"},
    {"trait_type": "Body", "value": "brown"},
    {"trait_type": "Clothes", "value": "orange_hoodie"},
    {"trait_type": "Mouth", "value": "smile_smirk"},
    {"trait_type": "Eyes", "value": "normal_hazel"},
    {"trait_type": "Hat", "value": "cap_black"}
  ]'::jsonb,
  los_bros_rarity = 'COMMON',
  los_bros_rarity_score = 6.5
WHERE los_bros_token_id = '53';

-- Verify the updates
SELECT 
  los_bros_token_id,
  los_bros_rarity,
  los_bros_rarity_score,
  jsonb_array_length(los_bros_traits) as trait_count,
  los_bros_traits
FROM profile_nfts
WHERE los_bros_token_id IN ('1327', '917', '53')
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- Check trait details for each
SELECT 
  los_bros_token_id,
  jsonb_array_elements(los_bros_traits)->>'trait_type' as trait_type,
  jsonb_array_elements(los_bros_traits)->>'value' as trait_value
FROM profile_nfts
WHERE los_bros_token_id IN ('1327', '917', '53')
ORDER BY los_bros_token_id, trait_type;

