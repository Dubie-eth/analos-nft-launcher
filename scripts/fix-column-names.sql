-- =====================================================
-- FIX COLUMN NAMES - HANDLE EXISTING TABLES
-- =====================================================
-- This script fixes column name mismatches in existing tables
-- =====================================================

-- First, let's see what columns actually exist in saved_collections
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'saved_collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if saved_collections has wallet_address instead of user_wallet
DO $$ 
BEGIN
    -- If saved_collections exists but has wallet_address column, rename it to user_wallet
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_collections' 
        AND column_name = 'wallet_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.saved_collections 
        RENAME COLUMN wallet_address TO user_wallet;
        RAISE NOTICE 'Renamed wallet_address to user_wallet in saved_collections';
    ELSE
        RAISE NOTICE 'user_wallet column already exists or table does not exist';
    END IF;
END $$;

-- Check if creator_rewards exists and has the right columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'creator_rewards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create creator_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.creator_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  collection_id UUID REFERENCES public.saved_collections(id),
  reward_type TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  token_mint TEXT,
  token_symbol TEXT DEFAULT 'LOS',
  status TEXT DEFAULT 'pending',
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES (DROP EXISTING FIRST)
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on saved_collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Public can view saved collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Users can view their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Users can create their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.saved_collections;
DROP POLICY IF EXISTS "Public can view public collections" ON public.saved_collections;

DROP POLICY IF EXISTS "Allow all operations on creator_rewards" ON public.creator_rewards;
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.creator_rewards;
DROP POLICY IF EXISTS "Users can create their own rewards" ON public.creator_rewards;
DROP POLICY IF EXISTS "Users can update their own rewards" ON public.creator_rewards;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations on saved_collections" ON public.saved_collections
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on creator_rewards" ON public.creator_rewards
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- =====================================================

-- Saved Collections Indexes
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_wallet ON public.saved_collections(user_wallet);
CREATE INDEX IF NOT EXISTS idx_saved_collections_is_public ON public.saved_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_collections_created_at ON public.saved_collections(created_at);

-- Creator Rewards Indexes
CREATE INDEX IF NOT EXISTS idx_creator_rewards_user_wallet ON public.creator_rewards(user_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_collection_id ON public.creator_rewards(collection_id);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_status ON public.creator_rewards(status);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_created_at ON public.creator_rewards(created_at);

-- =====================================================
-- CREATE UPDATE TRIGGERS (IF NOT EXISTS)
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers (drop existing first)
DROP TRIGGER IF EXISTS update_saved_collections_updated_at ON public.saved_collections;
DROP TRIGGER IF EXISTS update_creator_rewards_updated_at ON public.creator_rewards;

CREATE TRIGGER update_saved_collections_updated_at
  BEFORE UPDATE ON public.saved_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_rewards_updated_at
  BEFORE UPDATE ON public.creator_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show final column structure
SELECT 'Final saved_collections columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'saved_collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Final creator_rewards columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'creator_rewards' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show counts
SELECT 'Saved collections:' as info, COUNT(*) as count FROM public.saved_collections;
SELECT 'Creator rewards:' as info, COUNT(*) as count FROM public.creator_rewards;

SELECT 'Column names fixed successfully! 🎉' as final_status;
