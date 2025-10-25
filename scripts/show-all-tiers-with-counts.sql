-- ============================================
-- Show All Tiers with Counts (Including 0s)
-- ============================================

-- This query shows ALL tiers even if they have 0 mints
-- Uses a LEFT JOIN with a CTE to ensure all tiers appear

WITH all_tiers AS (
  SELECT 'TEAM' as tier, 1 as sort_order
  UNION ALL
  SELECT 'COMMUNITY', 2
  UNION ALL
  SELECT 'EARLY', 3
  UNION ALL
  SELECT 'PUBLIC', 4
),
mint_counts AS (
  SELECT 
    los_bros_tier,
    COUNT(*) as count
  FROM profile_nfts
  WHERE los_bros_token_id IS NOT NULL
  GROUP BY los_bros_tier
)
SELECT 
  all_tiers.tier as los_bros_tier,
  COALESCE(mint_counts.count, 0) as count,
  CASE 
    WHEN all_tiers.tier = 'TEAM' THEN 50
    WHEN all_tiers.tier = 'COMMUNITY' THEN 500
    WHEN all_tiers.tier = 'EARLY' THEN 150
    WHEN all_tiers.tier = 'PUBLIC' THEN 1522
  END as total_allocated,
  CASE 
    WHEN all_tiers.tier = 'TEAM' THEN 50 - COALESCE(mint_counts.count, 0)
    WHEN all_tiers.tier = 'COMMUNITY' THEN 500 - COALESCE(mint_counts.count, 0)
    WHEN all_tiers.tier = 'EARLY' THEN 150 - COALESCE(mint_counts.count, 0)
    WHEN all_tiers.tier = 'PUBLIC' THEN 1522 - COALESCE(mint_counts.count, 0)
  END as remaining
FROM all_tiers
LEFT JOIN mint_counts ON all_tiers.tier = mint_counts.los_bros_tier
ORDER BY all_tiers.sort_order;

-- Expected output (all 4 tiers):
-- ┌───────────────┬───────┬────────────────┬───────────┐
-- │ los_bros_tier │ count │ total_allocated│ remaining │
-- ├───────────────┼───────┼────────────────┼───────────┤
-- │ TEAM          │   8   │      50        │    42     │
-- │ COMMUNITY     │   0   │     500        │   500     │
-- │ EARLY         │   0   │     150        │   150     │
-- │ PUBLIC        │   1   │    1522        │  1521     │
-- └───────────────┴───────┴────────────────┴───────────┘

