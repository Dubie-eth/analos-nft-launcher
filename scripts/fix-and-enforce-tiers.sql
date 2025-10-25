-- ============================================
-- FIX CURRENT TIERS & PREVENT FUTURE ISSUES
-- ============================================

-- STEP 1: Fix the 6 PUBLIC mints that should be COMMUNITY
-- =========================================================
UPDATE profile_nfts
SET 
    los_bros_tier = 'COMMUNITY',
    los_bros_discount_percent = 100,
    lol_balance_at_mint = 1140000, -- Set correct balance
    updated_at = NOW()
WHERE los_bros_token_id IN ('1883', '65', '1430', '1502', '1055', '2172')
  AND los_bros_tier = 'PUBLIC';

-- Verify the update
SELECT 'UPDATED MINTS:' as info;
SELECT 
    los_bros_token_id,
    wallet_address,
    los_bros_tier,
    lol_balance_at_mint,
    los_bros_discount_percent
FROM profile_nfts
WHERE los_bros_token_id IN ('1883', '65', '1430', '1502', '1055', '2172')
ORDER BY los_bros_token_id::int;

-- STEP 2: Resync allocation counters
-- ===================================
SELECT * FROM resync_los_bros_allocations();

-- STEP 3: Verify final allocation state
-- ======================================
SELECT 'FINAL ALLOCATION STATE:' as info;
SELECT 
    tier,
    total_allocated,
    minted_count,
    (total_allocated - minted_count) as remaining,
    ROUND(minted_count::numeric / total_allocated * 100, 2) as percent_minted
FROM los_bros_allocations
ORDER BY 
    CASE tier
        WHEN 'TEAM' THEN 1
        WHEN 'COMMUNITY' THEN 2
        WHEN 'EARLY' THEN 3
        WHEN 'PUBLIC' THEN 4
    END;

-- STEP 4: Show mints per wallet with limits
-- ==========================================
SELECT 'MINTS PER WALLET (WITH LIMITS):' as info;
SELECT 
    wallet_address,
    los_bros_tier as tier,
    COUNT(*) as mints,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids,
    CASE 
        WHEN los_bros_tier = 'TEAM' THEN 10
        WHEN los_bros_tier = 'EARLY' THEN 1
        WHEN los_bros_tier = 'COMMUNITY' THEN 3
        WHEN los_bros_tier = 'PUBLIC' THEN 2
        ELSE 1
    END as wallet_limit,
    CASE 
        WHEN los_bros_tier = 'TEAM' AND COUNT(*) > 10 THEN '❌ EXCEEDED'
        WHEN los_bros_tier = 'EARLY' AND COUNT(*) > 1 THEN '❌ EXCEEDED'
        WHEN los_bros_tier = 'COMMUNITY' AND COUNT(*) > 3 THEN '❌ EXCEEDED'
        WHEN los_bros_tier = 'PUBLIC' AND COUNT(*) > 2 THEN '❌ EXCEEDED'
        ELSE '✅ OK'
    END as status
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY wallet_address, los_bros_tier
ORDER BY COUNT(*) DESC;

-- EXPECTED RESULT:
-- ================
-- TEAM: 8/50 (16%)
-- COMMUNITY: 6/500 (1.2%)
-- EARLY: 0/150 (0%)
-- PUBLIC: 0/1522 (0%)

