-- Find Los Bros collection in saved_collections table
-- Run this in Supabase SQL Editor

-- Search for Los Bros collection
SELECT 
  id,
  collection_name,
  collection_symbol,
  user_wallet,
  total_supply,
  status,
  created_at,
  updated_at,
  -- Check if layers data exists
  CASE 
    WHEN layers IS NOT NULL THEN jsonb_array_length(layers)
    ELSE 0
  END as layer_count
FROM saved_collections
WHERE 
  collection_name ILIKE '%los%bros%'
  OR collection_name ILIKE '%losbros%'
  OR collection_symbol ILIKE '%losbros%'
ORDER BY created_at DESC;

-- Also check for collections by your admin wallet
SELECT 
  id,
  collection_name,
  collection_symbol,
  status,
  created_at,
  CASE 
    WHEN layers IS NOT NULL THEN jsonb_array_length(layers)
    ELSE 0
  END as layer_count
FROM saved_collections
WHERE user_wallet = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
ORDER BY created_at DESC;

-- Get ALL collections to see what's there
SELECT 
  id,
  collection_name,
  collection_symbol,
  user_wallet,
  status,
  created_at
FROM saved_collections
ORDER BY created_at DESC
LIMIT 20;

