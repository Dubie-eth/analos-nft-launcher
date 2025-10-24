-- ============================================================================
-- MARKETPLACE SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- NFT Listings, Offers, Sales, and Fee Structure
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: NFT LISTINGS TABLE
-- ============================================================================
-- Tracks NFTs listed for sale in the marketplace

CREATE TABLE IF NOT EXISTS nft_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- NFT Details
  nft_mint VARCHAR(255) NOT NULL,
  nft_type VARCHAR(50) NOT NULL CHECK (nft_type IN ('profile_nft', 'los_bros', 'collection_nft')),
  
  -- Seller Details
  seller_wallet VARCHAR(255) NOT NULL,
  
  -- Pricing
  list_price DECIMAL(20, 9) NOT NULL CHECK (list_price > 0),
  currency VARCHAR(10) DEFAULT 'LOS',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  
  -- Metadata
  nft_name VARCHAR(255),
  nft_image TEXT,
  nft_metadata JSONB,
  
  -- Timestamps
  listed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  sold_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Transaction tracking
  listing_signature VARCHAR(255),
  sale_signature VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_nft_mint ON nft_listings(nft_mint);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON nft_listings(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_listings_status ON nft_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_active ON nft_listings(status, list_price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_nft_type ON nft_listings(nft_type);

-- Unique constraint: One active listing per NFT
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_unique_active 
ON nft_listings(nft_mint) WHERE status = 'active';

-- ============================================================================
-- PART 2: NFT OFFERS TABLE
-- ============================================================================
-- Tracks offers made on NFTs

CREATE TABLE IF NOT EXISTS nft_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- NFT Details
  nft_mint VARCHAR(255) NOT NULL,
  nft_type VARCHAR(50) NOT NULL,
  
  -- Offer Details
  buyer_wallet VARCHAR(255) NOT NULL,
  offer_price DECIMAL(20, 9) NOT NULL CHECK (offer_price > 0),
  currency VARCHAR(10) DEFAULT 'LOS',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
  
  -- Seller response
  seller_wallet VARCHAR(255), -- Set when offer is accepted/rejected
  
  -- Expiration
  expires_at TIMESTAMP,
  
  -- Timestamps
  offered_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  -- Transaction tracking
  offer_signature VARCHAR(255),
  acceptance_signature VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_nft_mint ON nft_offers(nft_mint);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON nft_offers(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON nft_offers(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_offers_status ON nft_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_pending ON nft_offers(nft_mint, status) WHERE status = 'pending';

-- ============================================================================
-- PART 3: NFT SALES TABLE
-- ============================================================================
-- Records all completed NFT sales for analytics

CREATE TABLE IF NOT EXISTS nft_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- NFT Details
  nft_mint VARCHAR(255) NOT NULL,
  nft_type VARCHAR(50) NOT NULL,
  nft_name VARCHAR(255),
  
  -- Transaction Details
  seller_wallet VARCHAR(255) NOT NULL,
  buyer_wallet VARCHAR(255) NOT NULL,
  sale_price DECIMAL(20, 9) NOT NULL,
  currency VARCHAR(10) DEFAULT 'LOS',
  
  -- Fee Structure (6.9% total platform fee)
  platform_fee DECIMAL(20, 9) NOT NULL, -- 6.9% of sale price
  creator_royalty DECIMAL(20, 9) DEFAULT 0, -- Future: creator royalties
  seller_receives DECIMAL(20, 9) NOT NULL, -- After fees
  
  -- Sale Type
  sale_type VARCHAR(20) CHECK (sale_type IN ('listing', 'offer', 'direct')),
  
  -- References
  listing_id UUID REFERENCES nft_listings(id),
  offer_id UUID REFERENCES nft_offers(id),
  
  -- Transaction
  transaction_signature VARCHAR(255) NOT NULL,
  
  -- Timestamps
  sold_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_nft_mint ON nft_sales(nft_mint);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON nft_sales(seller_wallet);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON nft_sales(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_sales_date ON nft_sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_type ON nft_sales(nft_type);

-- ============================================================================
-- PART 4: MARKETPLACE FEE STRUCTURE
-- ============================================================================
-- Store platform fee configuration

CREATE TABLE IF NOT EXISTS marketplace_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Fee Configuration
  platform_fee_percentage DECIMAL(5, 2) DEFAULT 6.9 CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100),
  creator_royalty_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (creator_royalty_percentage >= 0 AND creator_royalty_percentage <= 100),
  
  -- Fee Recipient Wallets
  platform_wallet VARCHAR(255) NOT NULL,
  
  -- Active/Inactive
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  effective_from TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default fee structure (6.9% platform fee)
INSERT INTO marketplace_fees (platform_fee_percentage, creator_royalty_percentage, platform_wallet, is_active)
VALUES (6.9, 0.0, '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all marketplace tables
ALTER TABLE nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_fees ENABLE ROW LEVEL SECURITY;

-- Listings Policies
DROP POLICY IF EXISTS "Anyone can view active listings" ON nft_listings;
DROP POLICY IF EXISTS "Sellers can manage their listings" ON nft_listings;
DROP POLICY IF EXISTS "Service role full access to listings" ON nft_listings;

CREATE POLICY "Anyone can view active listings"
  ON nft_listings FOR SELECT
  TO anon, authenticated
  USING (status = 'active' OR seller_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Sellers can manage their listings"
  ON nft_listings FOR ALL
  TO authenticated
  USING (seller_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (seller_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role full access to listings"
  ON nft_listings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Offers Policies
DROP POLICY IF EXISTS "Anyone can view offers on their NFTs" ON nft_offers;
DROP POLICY IF EXISTS "Buyers can manage their offers" ON nft_offers;
DROP POLICY IF EXISTS "Service role full access to offers" ON nft_offers;

CREATE POLICY "Anyone can view offers on their NFTs"
  ON nft_offers FOR SELECT
  TO authenticated
  USING (
    buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR
    seller_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

CREATE POLICY "Buyers can manage their offers"
  ON nft_offers FOR ALL
  TO authenticated
  USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address')
  WITH CHECK (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role full access to offers"
  ON nft_offers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Sales Policies (read-only for users)
DROP POLICY IF EXISTS "Anyone can view sales history" ON nft_sales;
DROP POLICY IF EXISTS "Service role full access to sales" ON nft_sales;

CREATE POLICY "Anyone can view sales history"
  ON nft_sales FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role full access to sales"
  ON nft_sales FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fees Policies (read-only for users)
DROP POLICY IF EXISTS "Anyone can view active fees" ON marketplace_fees;
DROP POLICY IF EXISTS "Service role full access to fees" ON marketplace_fees;

CREATE POLICY "Anyone can view active fees"
  ON marketplace_fees FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Service role full access to fees"
  ON marketplace_fees FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate fees for a sale
CREATE OR REPLACE FUNCTION calculate_marketplace_fees(sale_price DECIMAL)
RETURNS TABLE (
  platform_fee DECIMAL,
  creator_royalty DECIMAL,
  seller_receives DECIMAL
) AS $$
DECLARE
  v_platform_fee_pct DECIMAL;
  v_creator_royalty_pct DECIMAL;
  v_platform_fee DECIMAL;
  v_creator_royalty DECIMAL;
  v_seller_receives DECIMAL;
BEGIN
  -- Get active fee structure
  SELECT platform_fee_percentage, creator_royalty_percentage
  INTO v_platform_fee_pct, v_creator_royalty_pct
  FROM marketplace_fees
  WHERE is_active = true
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- Default to 6.9% if not configured
  v_platform_fee_pct := COALESCE(v_platform_fee_pct, 6.9);
  v_creator_royalty_pct := COALESCE(v_creator_royalty_pct, 0.0);
  
  -- Calculate fees
  v_platform_fee := sale_price * (v_platform_fee_pct / 100);
  v_creator_royalty := sale_price * (v_creator_royalty_pct / 100);
  v_seller_receives := sale_price - v_platform_fee - v_creator_royalty;
  
  RETURN QUERY SELECT v_platform_fee, v_creator_royalty, v_seller_receives;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get active listings for an NFT
CREATE OR REPLACE FUNCTION get_nft_active_listing(p_nft_mint VARCHAR)
RETURNS TABLE (
  listing_id UUID,
  seller_wallet VARCHAR,
  list_price DECIMAL,
  listed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, nft_listings.seller_wallet, nft_listings.list_price, nft_listings.listed_at
  FROM nft_listings
  WHERE nft_mint = p_nft_mint
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY listed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get pending offers for an NFT
CREATE OR REPLACE FUNCTION get_nft_pending_offers(p_nft_mint VARCHAR)
RETURNS TABLE (
  offer_id UUID,
  buyer_wallet VARCHAR,
  offer_price DECIMAL,
  offered_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, nft_offers.buyer_wallet, nft_offers.offer_price, nft_offers.offered_at
  FROM nft_offers
  WHERE nft_mint = p_nft_mint
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY offer_price DESC;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on listings
CREATE OR REPLACE FUNCTION update_nft_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nft_listings_updated_at ON nft_listings;
CREATE TRIGGER nft_listings_updated_at
  BEFORE UPDATE ON nft_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_listing_timestamp();

-- Update updated_at timestamp on offers
CREATE OR REPLACE FUNCTION update_nft_offer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nft_offers_updated_at ON nft_offers;
CREATE TRIGGER nft_offers_updated_at
  BEFORE UPDATE ON nft_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_offer_timestamp();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ MARKETPLACE DATABASE SCHEMA COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '  ✓ nft_listings - NFT listing management';
  RAISE NOTICE '  ✓ nft_offers - Offer system';
  RAISE NOTICE '  ✓ nft_sales - Sales history & analytics';
  RAISE NOTICE '  ✓ marketplace_fees - Fee structure (6.9%% platform fee)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Created:';
  RAISE NOTICE '  ✓ calculate_marketplace_fees(price) - Fee calculator';
  RAISE NOTICE '  ✓ get_nft_active_listing(mint) - Get listing';
  RAISE NOTICE '  ✓ get_nft_pending_offers(mint) - Get offers';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS Policies:';
  RAISE NOTICE '  ✓ Users can list/manage their own NFTs';
  RAISE NOTICE '  ✓ Users can make/manage their own offers';
  RAISE NOTICE '  ✓ Anyone can view active listings';
  RAISE NOTICE '  ✓ Anyone can view sales history';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Platform Fee: 6.9%%';
  RAISE NOTICE '👛 Fee Wallet: 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Marketplace ready for trading!';
  RAISE NOTICE '';
END $$;

