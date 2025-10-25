-- ============================================
-- Check Team Wallet Mints and Their Tiers
-- ============================================

-- Check all Los Bros mints and their tiers
SELECT 
  los_bros_token_id,
  wallet_address,
  los_bros_tier,
  los_bros_discount_percent,
  los_bros_final_price,
  created_at
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- Count by tier
SELECT 
  los_bros_tier,
  COUNT(*) as count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY los_bros_tier;

-- Check which wallet minted which NFTs
SELECT 
  wallet_address,
  COUNT(*) as mint_count,
  array_agg(los_bros_token_id ORDER BY CAST(los_bros_token_id AS INTEGER)) as token_ids,
  array_agg(DISTINCT los_bros_tier) as tiers
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY wallet_address;

-- Specific check for your admin wallet
SELECT 
  los_bros_token_id,
  los_bros_tier,
  los_bros_discount_percent,
  los_bros_final_price,
  created_at
FROM profile_nfts
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
  AND los_bros_token_id IS NOT NULL
ORDER BY CAST(los_bros_token_id AS INTEGER);

