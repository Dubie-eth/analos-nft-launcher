-- ============================================
-- FIX COMMUNITY WL MINTS SHOWING AS PUBLIC
-- ============================================
-- Problem: All non-TEAM mints are showing as PUBLIC instead of COMMUNITY
-- This means the tier check is failing or not being passed correctly

-- 1. Check current situation
-- ==========================
SELECT 'CURRENT MINTS BY TIER:' as info;
SELECT 
    los_bros_tier,
    COUNT(*) as count,
    array_agg(DISTINCT wallet_address) as wallets,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY los_bros_tier;

-- 2. Check $LOL balance at mint for PUBLIC tier mints
-- ====================================================
SELECT 'PUBLIC TIER MINTS - $LOL BALANCE CHECK:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier,
    lol_balance_at_mint,
    los_bros_final_price,
    los_bros_discount_percent,
    CASE 
        WHEN lol_balance_at_mint >= 1000000 THEN '❌ Should be COMMUNITY (1M+ $LOL)'
        WHEN lol_balance_at_mint >= 100000 THEN '❌ Should be EARLY (100k+ $LOL)'
        WHEN lol_balance_at_mint < 100000 THEN '✅ Correctly PUBLIC'
        ELSE '⚠️ Unknown $LOL balance'
    END as tier_check
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_tier = 'PUBLIC'
ORDER BY lol_balance_at_mint DESC;

-- 3. Identify mints that should be COMMUNITY
-- ===========================================
SELECT 'MINTS THAT SHOULD BE COMMUNITY:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier as current_tier,
    lol_balance_at_mint,
    '🎁 COMMUNITY' as correct_tier
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_tier != 'COMMUNITY'
  AND lol_balance_at_mint >= 1000000
ORDER BY los_bros_token_id::int;

-- 4. Identify mints that should be EARLY
-- =======================================
SELECT 'MINTS THAT SHOULD BE EARLY:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier as current_tier,
    lol_balance_at_mint,
    '💎 EARLY' as correct_tier
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND los_bros_tier NOT IN ('EARLY', 'TEAM')
  AND lol_balance_at_mint >= 100000
  AND lol_balance_at_mint < 1000000
ORDER BY los_bros_token_id::int;

-- 5. FIX: Reclassify PUBLIC mints to COMMUNITY (1M+ $LOL)
-- ========================================================
-- UNCOMMENT TO RUN:
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'COMMUNITY',
--     updated_at = NOW()
-- WHERE los_bros_token_id IS NOT NULL
--   AND los_bros_tier = 'PUBLIC'
--   AND lol_balance_at_mint >= 1000000;

-- 6. FIX: Reclassify PUBLIC mints to EARLY (100k-999k $LOL)
-- ==========================================================
-- UNCOMMENT TO RUN:
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'EARLY',
--     updated_at = NOW()
-- WHERE los_bros_token_id IS NOT NULL
--   AND los_bros_tier = 'PUBLIC'
--   AND lol_balance_at_mint >= 100000
--   AND lol_balance_at_mint < 1000000;

-- 7. Resync allocation counters after fix
-- ========================================
SELECT 'RESYNCING ALLOCATIONS AFTER FIX:' as info;
SELECT * FROM resync_los_bros_allocations();

-- 8. Verify the fix
-- ==================
SELECT 'AFTER FIX - MINTS BY TIER:' as info;
SELECT 
    los_bros_tier,
    COUNT(*) as count,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids,
    MIN(lol_balance_at_mint) as min_lol_balance,
    MAX(lol_balance_at_mint) as max_lol_balance
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY los_bros_tier;

-- 9. Final allocation summary
-- ============================
SELECT 'FINAL ALLOCATION STATUS:' as info;
SELECT 
    tier,
    total_allocated,
    minted_count,
    (total_allocated - minted_count) as remaining,
    ROUND(minted_count::numeric / total_allocated * 100, 2) as percent_minted
FROM los_bros_allocations
ORDER BY tier;

