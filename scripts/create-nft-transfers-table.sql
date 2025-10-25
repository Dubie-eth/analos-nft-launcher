-- ============================================
-- CREATE NFT TRANSFERS TABLE
-- ============================================
-- Tracks all NFT transfers for provenance and history
-- On-chain data is the source of truth, this is for easy querying

-- Create nft_transfers table
CREATE TABLE IF NOT EXISTS nft_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- NFT Information
  nft_mint TEXT NOT NULL,
  token_id TEXT,                        -- Los Bros token ID if applicable
  collection_type TEXT,                 -- 'losbros' or 'profile'
  
  -- Transfer Details
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  transaction_signature TEXT NOT NULL UNIQUE,
  
  -- Metadata
  transfer_type TEXT DEFAULT 'p2p',     -- 'p2p', 'sale', 'mint', 'burn'
  sale_price DECIMAL(10,2),             -- If sold, the price
  platform_fee DECIMAL(10,2),           -- Platform fee if applicable
  
  -- Timestamps
  transferred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_nft_transfers_mint ON nft_transfers(nft_mint);
CREATE INDEX IF NOT EXISTS idx_nft_transfers_from ON nft_transfers(from_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_transfers_to ON nft_transfers(to_wallet);
CREATE INDEX IF NOT EXISTS idx_nft_transfers_sig ON nft_transfers(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_nft_transfers_token_id ON nft_transfers(token_id);
CREATE INDEX IF NOT EXISTS idx_nft_transfers_date ON nft_transfers(transferred_at DESC);

-- Composite index for NFT history queries
CREATE INDEX IF NOT EXISTS idx_nft_transfers_history 
  ON nft_transfers(nft_mint, transferred_at DESC);

-- Enable Row Level Security
ALTER TABLE nft_transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view transfer history" ON nft_transfers;
DROP POLICY IF EXISTS "Service role can insert transfers" ON nft_transfers;

-- Public read access (anyone can see transfer history)
CREATE POLICY "Anyone can view transfer history"
  ON nft_transfers
  FOR SELECT
  USING (true);

-- Only service role can insert transfers
CREATE POLICY "Service role can insert transfers"
  ON nft_transfers
  FOR INSERT
  WITH CHECK (true);

-- Grant access
GRANT SELECT ON nft_transfers TO anon, authenticated;
GRANT INSERT ON nft_transfers TO service_role;

-- Sample query: Get transfer history for an NFT
-- SELECT 
--   from_wallet,
--   to_wallet,
--   transferred_at,
--   transaction_signature,
--   transfer_type,
--   sale_price
-- FROM nft_transfers
-- WHERE nft_mint = 'YOUR_MINT_ADDRESS'
-- ORDER BY transferred_at DESC;

-- Sample query: Get all transfers for a wallet (sent or received)
-- SELECT 
--   nft_mint,
--   token_id,
--   CASE 
--     WHEN from_wallet = 'YOUR_WALLET' THEN 'SENT'
--     ELSE 'RECEIVED'
--   END as direction,
--   CASE 
--     WHEN from_wallet = 'YOUR_WALLET' THEN to_wallet
--     ELSE from_wallet
--   END as counterparty,
--   transferred_at,
--   transaction_signature
-- FROM nft_transfers
-- WHERE from_wallet = 'YOUR_WALLET' OR to_wallet = 'YOUR_WALLET'
-- ORDER BY transferred_at DESC;

-- Sample query: Get provenance chain for an NFT
-- SELECT 
--   ROW_NUMBER() OVER (ORDER BY transferred_at) as hop,
--   from_wallet,
--   to_wallet,
--   transferred_at,
--   transaction_signature
-- FROM nft_transfers
-- WHERE nft_mint = 'YOUR_MINT_ADDRESS'
-- ORDER BY transferred_at ASC;

