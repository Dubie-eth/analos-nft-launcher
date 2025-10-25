-- Backfill Los Bros NFTs that were minted but not recorded
-- Run this in Supabase SQL Editor

-- Insert all 3 Los Bros in one query
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
  created_at
) VALUES 
-- Los Bros #917
(
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
  NOW()
),
-- Los Bros #53
(
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
  NOW()
),
-- Los Bros #1327
(
  '91Ypgh19Qf2rzm9ekGxNaTZYVsbnJGuW6D8ehGZWpcKg',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  'losbros_1327',
  'Los Bros #1327',
  'Los Bros #1327 - COMMON rarity',
  '1327',
  'COMMON',
  7.4,
  'TEAM',
  0,
  100,
  1140000,
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

