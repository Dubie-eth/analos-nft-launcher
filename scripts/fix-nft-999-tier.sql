-- Fix Los Bros #999 tier (should be TEAM, not PUBLIC)

UPDATE profile_nfts
SET 
  los_bros_tier = 'TEAM',
  los_bros_discount_percent = 100,
  los_bros_final_price = 0
WHERE los_bros_token_id = '999';

-- Verify the fix
SELECT 
  los_bros_token_id,
  los_bros_tier,
  los_bros_discount_percent,
  los_bros_final_price,
  mint_address
FROM profile_nfts
WHERE los_bros_token_id = '999';

