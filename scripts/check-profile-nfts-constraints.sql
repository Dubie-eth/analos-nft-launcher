-- Check all constraints on profile_nfts table

SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profile_nfts'
ORDER BY con.contype, con.conname;

-- Also check if mint_address already exists
SELECT 
    mint_address,
    username,
    los_bros_token_id,
    created_at
FROM profile_nfts
WHERE mint_address = 'EZUF94aRyEYTMFNX5qgBLXTj8NEuADxtZHBBcv1RqdXN';

-- Check all Los Bros NFTs for your wallet
SELECT 
    mint_address,
    username,
    los_bros_token_id,
    los_bros_rarity,
    created_at
FROM profile_nfts
WHERE wallet_address = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
AND los_bros_token_id IS NOT NULL
ORDER BY created_at DESC;

