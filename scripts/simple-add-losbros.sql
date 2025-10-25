-- Simpler INSERT without ON CONFLICT (to see the actual error)

BEGIN;

INSERT INTO profile_nfts (
  mint_address,
  wallet_address,
  username,
  display_name,
  bio,
  referral_code,
  nft_metadata,
  los_bros_token_id,
  los_bros_rarity,
  los_bros_rarity_score,
  los_bros_tier,
  los_bros_final_price,
  los_bros_discount_percent,
  lol_balance_at_mint,
  transaction_signature
) VALUES (
  'EZUF94aRyEYTMFNX5qgBLXTj8NEuADxtZHBBcv1RqdXN',
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  'losbros_EZUF',
  'Los Bros #EZUF',
  'Los Bros - COMMON rarity',
  'LOSBROSE',
  '{}',
  'EZUF94aRyEYTMFNX5qgBLXTj8NEuADxtZHBBcv1RqdXN',
  'COMMON',
  5.0,
  'TEAM',
  0,
  100,
  1140000,
  '4FTvu7EcGr5tdAfpxvB4ZzMUQjbqdub2YC6XXLJe1uUfoDccLmmphKotFDr67j6XcRJ42rZEQVi5qJqF1xkKwChx'
);

-- Verify it was added
SELECT 
  mint_address,
  username,
  los_bros_token_id,
  los_bros_rarity,
  created_at
FROM profile_nfts
WHERE mint_address = 'EZUF94aRyEYTMFNX5qgBLXTj8NEuADxtZHBBcv1RqdXN';

COMMIT;

