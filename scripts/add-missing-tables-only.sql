-- =====================================================
-- ADD MISSING TABLES ONLY - SAFE APPROACH
-- =====================================================
-- This script only adds missing tables without dropping existing ones
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE MISSING TABLES (IF NOT EXISTS)
-- =====================================================

-- 1. SAVED COLLECTIONS TABLE (if missing)
CREATE TABLE IF NOT EXISTS public.saved_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_symbol TEXT,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  collection_metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. CREATOR REWARDS TABLE (if missing)
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
-- ENABLE ROW LEVEL SECURITY (IF NOT ALREADY ENABLED)
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

-- Show all tables
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Show saved collections count
SELECT 'Saved collections:' as info, COUNT(*) as count FROM public.saved_collections;

-- Show creator rewards count
SELECT 'Creator rewards:' as info, COUNT(*) as count FROM public.creator_rewards;

SELECT 'Missing tables added successfully! 🎉' as final_status;
