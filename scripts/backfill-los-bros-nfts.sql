-- Backfill Los Bros NFTs that were minted but not recorded
-- Run this in Supabase SQL Editor

-- Los Bros #917
INSERT INTO profile_nfts (
  mint_address,
  wallet_address,
  username,
  display_name,
  bio,
  los_bros_token_id,
  los_bros_rarity,
  los_bros_rarity_score,
  los_bros_tier,
  los_bros_final_price,
  los_bros_discount_percent,
  lol_balance_at_mint,
  image_url,
  created_at
) VALUES (
  '6KzfgpHcv6VUewc1gpz4XYLNgns2iTbzUJDzoqmPvK4k',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  'losbros_917',
  'Los Bros #917',
  'Los Bros #917 - COMMON rarity',
  '917',
  'COMMON',
  4.5,
  'TEAM',
  0,
  100,
  1140000,
  '/api/los-bros/generate-image?tokenId=917',
  NOW()
)
ON CONFLICT (mint_address) DO NOTHING;

-- Los Bros #53
INSERT INTO profile_nfts (
  mint_address,
  wallet_address,
  username,
  display_name,
  bio,
  los_bros_token_id,
  los_bros_rarity,
  los_bros_rarity_score,
  los_bros_tier,
  los_bros_final_price,
  los_bros_discount_percent,
  lol_balance_at_mint,
  image_url,
  created_at
) VALUES (
  '2YcXRwznszVihzB43p6qgYvEaCybTsTHq9afXuMSd3Tc',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  'losbros_53',
  'Los Bros #53',
  'Los Bros #53 - COMMON rarity',
  '53',
  'COMMON',
  7.1,
  'TEAM',
  0,
  100,
  1140000,
  '/api/los-bros/generate-image?tokenId=53',
  NOW()
)
ON CONFLICT (mint_address) DO NOTHING;

-- Verify the inserts
SELECT 
  mint_address,
  los_bros_token_id,
  los_bros_rarity,
  los_bros_rarity_score,
  created_at
FROM profile_nfts
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
  AND los_bros_token_id IS NOT NULL
ORDER BY created_at DESC;

