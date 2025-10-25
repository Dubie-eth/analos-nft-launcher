-- ============================================
-- Fix Team Wallet Los Bros Tiers
-- ============================================

-- This script corrects the tier for all Los Bros NFTs minted by team wallets
-- Team wallets should have TEAM tier with 100% discount (FREE)

-- Update all Los Bros minted by the admin/team wallet to TEAM tier
UPDATE profile_nfts
SET 
  los_bros_tier = 'TEAM',
  los_bros_discount_percent = 100,
  los_bros_final_price = 0,
  los_bros_platform_fee = 0
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
  AND los_bros_token_id IS NOT NULL
  AND los_bros_tier != 'TEAM'; -- Only update if not already TEAM

-- Verify the update
SELECT 
  los_bros_token_id,
  wallet_address,
  los_bros_tier,
  los_bros_discount_percent,
  los_bros_final_price,
  created_at
FROM profile_nfts
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
  AND los_bros_token_id IS NOT NULL
ORDER BY CAST(los_bros_token_id AS INTEGER);

-- Show updated tier counts
SELECT 
  los_bros_tier,
  COUNT(*) as count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY 
  CASE los_bros_tier
    WHEN 'TEAM' THEN 1
    WHEN 'COMMUNITY' THEN 2
    WHEN 'EARLY' THEN 3
    WHEN 'PUBLIC' THEN 4
  END;

-- Expected result after fix:
-- TEAM: 5 (all from your wallet except the test one)
-- COMMUNITY: 0
-- EARLY: 0  
-- PUBLIC: 4 (or however many non-team mints exist)

