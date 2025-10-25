-- ============================================
-- MANUALLY RECLASSIFY NON-TEAM MINTS
-- ============================================
-- Since lol_balance_at_mint might not be populated,
-- let's check the actual data and manually reclassify

-- 1. Show ALL current Los Bros mints with details
-- ================================================
SELECT 'ALL CURRENT LOS BROS MINTS:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier,
    lol_balance_at_mint,
    los_bros_final_price,
    los_bros_discount_percent,
    created_at
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
ORDER BY created_at;

-- 2. Show which wallets minted (excluding TEAM)
-- ==============================================
SELECT 'NON-TEAM WALLET MINTS:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier,
    lol_balance_at_mint,
    CASE 
        WHEN wallet_address IN (
            '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
            '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
        ) THEN '✅ TEAM Wallet'
        ELSE '⚠️ Non-TEAM Wallet'
    END as wallet_type
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND wallet_address NOT IN (
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
  )
ORDER BY los_bros_token_id::int;

-- 3. Count mints per wallet
-- ==========================
SELECT 'MINTS PER WALLET:' as info;
SELECT 
    wallet_address,
    COUNT(*) as mint_count,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids,
    MIN(los_bros_tier) as tier,
    MIN(lol_balance_at_mint) as lol_balance
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY wallet_address
ORDER BY mint_count DESC;

-- 4. OPTION A: Reclassify by wallet (if you know which wallets are community)
-- ============================================================================
-- If you know the community wallet addresses, uncomment and replace:
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'COMMUNITY',
--     los_bros_discount_percent = 100,
--     updated_at = NOW()
-- WHERE los_bros_token_id IS NOT NULL
--   AND los_bros_tier = 'PUBLIC'
--   AND wallet_address IN (
--     'COMMUNITY_WALLET_1_HERE',
--     'COMMUNITY_WALLET_2_HERE',
--     'COMMUNITY_WALLET_3_HERE'
--   );

-- 5. OPTION B: Reclassify specific token IDs
-- ===========================================
-- If you know which specific Los Bros should be COMMUNITY, uncomment and update:
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'COMMUNITY',
--     los_bros_discount_percent = 100,
--     updated_at = NOW()
-- WHERE los_bros_token_id IN ('TOKEN_ID_1', 'TOKEN_ID_2', 'TOKEN_ID_3');

-- 6. OPTION C: Reclassify all PUBLIC to COMMUNITY (if ALL non-team are community)
-- ================================================================================
-- If all 6 PUBLIC mints are actually COMMUNITY mints, uncomment:
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'COMMUNITY',
--     los_bros_discount_percent = 100,
--     updated_at = NOW()
-- WHERE los_bros_token_id IS NOT NULL
--   AND los_bros_tier = 'PUBLIC';

-- 7. Resync after manual reclassification
-- ========================================
-- Run this after doing the UPDATE:
-- SELECT * FROM resync_los_bros_allocations();

-- 8. Verify the fix
-- ==================
-- SELECT 'AFTER FIX:' as info;
-- SELECT 
--     tier,
--     total_allocated,
--     minted_count,
--     (total_allocated - minted_count) as remaining
-- FROM los_bros_allocations
-- ORDER BY tier;

