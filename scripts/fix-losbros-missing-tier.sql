-- Fix Los Bros NFTs that have NULL los_bros_tier (prevents them from showing in Recently Minted)

-- First, check which NFTs have NULL tier
SELECT 
    mint_address,
    username,
    los_bros_token_id,
    los_bros_tier,
    los_bros_rarity,
    created_at
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
AND los_bros_tier IS NULL;

-- Update all Los Bros NFTs with NULL tier to have 'TEAM' tier
-- (since you're the admin and minting for free)
UPDATE profile_nfts
SET 
    los_bros_tier = 'TEAM',
    los_bros_discount_percent = 100,
    los_bros_final_price = 0,
    lol_balance_at_mint = COALESCE(lol_balance_at_mint, 1140000)
WHERE los_bros_token_id IS NOT NULL
AND los_bros_tier IS NULL;

-- Verify the update
SELECT 
    mint_address,
    username,
    los_bros_token_id,
    los_bros_tier,
    los_bros_rarity,
    created_at
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY created_at DESC;

