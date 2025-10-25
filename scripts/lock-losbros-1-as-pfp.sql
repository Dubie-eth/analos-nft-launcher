-- ============================================
-- Lock Los Bros #1 as Official Collection PFP
-- ============================================

-- This script marks Los Bros #1 as the official PFP for the collection
-- and prevents it from being listed/sold on the marketplace

-- Update Los Bros #1 to be the official PFP
UPDATE profile_nfts
SET 
  nft_metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(nft_metadata, '{}'::jsonb),
        '{is_official_pfp}',
        'true'::jsonb
      ),
      '{locked}',
      'true'::jsonb
    ),
    '{locked_reason}',
    '"Official Collection PFP"'::jsonb
  )
WHERE los_bros_token_id = '1';

-- Verify the update
SELECT 
  los_bros_token_id,
  wallet_address,
  nft_metadata->>'is_official_pfp' as is_official_pfp,
  nft_metadata->>'locked' as locked,
  nft_metadata->>'locked_reason' as locked_reason
FROM profile_nfts
WHERE los_bros_token_id = '1';

-- Optional: Remove any existing marketplace listings for Los Bros #1
-- (if you want to delist it immediately)
-- UPDATE marketplace_listings
-- SET status = 'cancelled'
-- WHERE nft_mint = (SELECT mint_address FROM profile_nfts WHERE los_bros_token_id = '1')
--   AND status = 'active';

-- Sample query to check all official PFPs
-- SELECT 
--   los_bros_token_id,
--   wallet_address,
--   nft_metadata->>'is_official_pfp' as is_official_pfp,
--   nft_metadata->>'locked_reason' as locked_reason
-- FROM profile_nfts
-- WHERE (nft_metadata->>'is_official_pfp')::boolean = true;

