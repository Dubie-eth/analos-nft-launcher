-- Add metadata_uri column to profile_nfts table

ALTER TABLE profile_nfts
ADD COLUMN IF NOT EXISTS metadata_uri TEXT;

-- Add comment
COMMENT ON COLUMN profile_nfts.metadata_uri IS 'IPFS or Arweave URI for NFT metadata JSON';

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profile_nfts'
AND column_name = 'metadata_uri';

