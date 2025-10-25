-- Check what los_bros_tier values exist in the database

SELECT 
    mint_address,
    username,
    los_bros_token_id,
    los_bros_tier,
    los_bros_rarity,
    los_bros_rarity_score,
    created_at,
    CASE 
        WHEN los_bros_tier IS NULL THEN '❌ NULL (will NOT show in Recently Minted)'
        WHEN los_bros_tier IS NOT NULL THEN '✅ NOT NULL (will show in Recently Minted)'
    END AS will_show_in_recently_minted
FROM profile_nfts
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
AND los_bros_token_id IS NOT NULL
ORDER BY created_at DESC;

-- Check the specific NFT
SELECT 
    mint_address,
    username,
    los_bros_token_id,
    los_bros_tier,
    los_bros_rarity,
    created_at
FROM profile_nfts
WHERE mint_address = 'EZUF94aRyEYTMFNX5qgBLXTj8NEuADxtZHBBcv1RqdXN';

