-- ============================================
-- FIX TIER ALLOCATION MISMATCH
-- ============================================
-- Problem: Community WL mints showing in PUBLIC, not in COMMUNITY
-- Solution: Resync all mints to correct tiers based on wallet & balance

-- 1. Check current allocation table vs actual mints
-- ==================================================
SELECT 'CURRENT ALLOCATION TABLE:' as info;
SELECT * FROM los_bros_allocations ORDER BY tier;

SELECT 'ACTUAL MINTS BY TIER IN DATABASE:' as info;
SELECT 
    los_bros_tier as tier,
    COUNT(*) as actual_count,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY los_bros_tier;

-- 2. Identify team wallet mints
-- ==================================================
SELECT 'TEAM WALLET MINTS:' as info;
SELECT 
    wallet_address,
    los_bros_token_id,
    los_bros_tier,
    CASE 
        WHEN wallet_address IN (
            '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
            '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
        ) THEN '✅ Correct (TEAM wallet)'
        ELSE '❌ Not a team wallet'
    END as validation
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
  AND wallet_address IN (
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
  )
ORDER BY los_bros_token_id::int;

-- 3. Fix any non-TEAM wallets that shouldn't be TEAM
-- ==================================================
-- UPDATE profile_nfts
-- SET 
--     los_bros_tier = 'PUBLIC',
--     los_bros_discount_percent = 0,
--     los_bros_final_price = 4200.69,
--     updated_at = NOW()
-- WHERE los_bros_tier = 'TEAM'
--   AND wallet_address NOT IN (
--     '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
--     '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
--   );

-- 4. Resync allocation counters from actual data
-- ==================================================
-- This function recalculates minted_count from profile_nfts table
CREATE OR REPLACE FUNCTION resync_los_bros_allocations()
RETURNS TABLE(
    tier TEXT,
    old_count INT,
    new_count INT,
    difference INT
) AS $$
BEGIN
    RETURN QUERY
    WITH actual_counts AS (
        SELECT 
            los_bros_tier as tier,
            COUNT(*)::INT as actual_count
        FROM profile_nfts
        WHERE los_bros_token_id IS NOT NULL
        GROUP BY los_bros_tier
    ),
    old_counts AS (
        SELECT 
            a.tier,
            a.minted_count as old_count
        FROM los_bros_allocations a
    )
    SELECT 
        COALESCE(o.tier, a.tier) as tier,
        COALESCE(o.old_count, 0) as old_count,
        COALESCE(a.actual_count, 0) as new_count,
        COALESCE(a.actual_count, 0) - COALESCE(o.old_count, 0) as difference
    FROM old_counts o
    FULL OUTER JOIN actual_counts a ON o.tier = a.tier
    ORDER BY tier;
    
    -- Update the allocation table
    UPDATE los_bros_allocations a
    SET 
        minted_count = COALESCE(ac.actual_count, 0),
        updated_at = NOW()
    FROM (
        SELECT 
            los_bros_tier as tier,
            COUNT(*)::INT as actual_count
        FROM profile_nfts
        WHERE los_bros_token_id IS NOT NULL
        GROUP BY los_bros_tier
    ) ac
    WHERE a.tier = ac.tier;
    
    -- Set to 0 for tiers with no mints
    UPDATE los_bros_allocations
    SET minted_count = 0
    WHERE tier NOT IN (
        SELECT DISTINCT los_bros_tier
        FROM profile_nfts
        WHERE los_bros_token_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Run the resync
SELECT 'RESYNCING ALLOCATIONS:' as info;
SELECT * FROM resync_los_bros_allocations();

-- 5. Verify after resync
-- ==================================================
SELECT 'AFTER RESYNC - ALLOCATION TABLE:' as info;
SELECT * FROM los_bros_allocations ORDER BY tier;

SELECT 'AFTER RESYNC - COMPARISON:' as info;
SELECT 
    a.tier,
    a.total_allocated,
    a.minted_count as stored_count,
    COALESCE(m.actual_count, 0) as actual_count,
    a.total_allocated - COALESCE(m.actual_count, 0) as remaining,
    CASE 
        WHEN a.minted_count = COALESCE(m.actual_count, 0) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as validation
FROM los_bros_allocations a
LEFT JOIN (
    SELECT 
        los_bros_tier as tier,
        COUNT(*) as actual_count
    FROM profile_nfts
    WHERE los_bros_token_id IS NOT NULL
    GROUP BY los_bros_tier
) m ON a.tier = m.tier
ORDER BY a.tier;

-- 6. Add per-wallet mint limit tracking
-- ==================================================
SELECT 'MINTS PER WALLET:' as info;
SELECT 
    wallet_address,
    los_bros_tier as tier,
    COUNT(*) as mints_by_wallet,
    array_agg(los_bros_token_id ORDER BY los_bros_token_id::int) as token_ids,
    CASE 
        WHEN los_bros_tier = 'TEAM' AND COUNT(*) > 10 THEN '⚠️ Exceeds TEAM limit (10)'
        WHEN los_bros_tier = 'EARLY' AND COUNT(*) > 1 THEN '⚠️ Exceeds EARLY limit (1)'
        WHEN los_bros_tier = 'COMMUNITY' AND COUNT(*) > 3 THEN '⚠️ Exceeds COMMUNITY limit (3)'
        WHEN los_bros_tier = 'PUBLIC' AND COUNT(*) > 2 THEN '⚠️ Exceeds PUBLIC limit (2)'
        ELSE '✅ Within limit'
    END as limit_check
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY wallet_address, los_bros_tier
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 7. Summary Report
-- ==================================================
SELECT 'FINAL SUMMARY:' as info;
SELECT 
    '📊 Total Supply' as metric,
    2222 as target,
    SUM(total_allocated) as allocated,
    SUM(minted_count) as minted,
    2222 - SUM(minted_count) as remaining
FROM los_bros_allocations
UNION ALL
SELECT 
    '🎖️ TEAM' as metric,
    50 as target,
    total_allocated,
    minted_count,
    total_allocated - minted_count
FROM los_bros_allocations WHERE tier = 'TEAM'
UNION ALL
SELECT 
    '💎 EARLY' as metric,
    150 as target,
    total_allocated,
    minted_count,
    total_allocated - minted_count
FROM los_bros_allocations WHERE tier = 'EARLY'
UNION ALL
SELECT 
    '🎁 COMMUNITY' as metric,
    500 as target,
    total_allocated,
    minted_count,
    total_allocated - minted_count
FROM los_bros_allocations WHERE tier = 'COMMUNITY'
UNION ALL
SELECT 
    '🌍 PUBLIC' as metric,
    1522 as target,
    total_allocated,
    minted_count,
    total_allocated - minted_count
FROM los_bros_allocations WHERE tier = 'PUBLIC';

