-- Check current allocation table structure and counts

SELECT * FROM los_bros_allocations;

-- Check actual minted counts per tier from profile_nfts
SELECT 
    los_bros_tier as tier,
    COUNT(*) as actual_minted_count
FROM profile_nfts
WHERE los_bros_token_id IS NOT NULL
GROUP BY los_bros_tier
ORDER BY los_bros_tier;

-- Compare allocations with actual mints
SELECT 
    a.tier,
    a.total_allocated,
    a.minted_count as stored_count,
    COALESCE(m.actual_count, 0) as actual_count,
    a.total_allocated - COALESCE(m.actual_count, 0) as remaining
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

