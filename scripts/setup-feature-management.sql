-- Create feature_management table for admin-controlled feature status
CREATE TABLE IF NOT EXISTS public.feature_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT NOT NULL UNIQUE, -- e.g., 'nft_collection_creation'
  feature_name TEXT NOT NULL, -- Display name
  description TEXT,
  icon TEXT, -- Emoji or icon identifier
  completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  access_level TEXT DEFAULT 'locked' CHECK (access_level IN ('locked', 'beta', 'public')),
  status TEXT DEFAULT 'development' CHECK (status IN ('development', 'testing', 'live', 'deprecated')),
  is_visible BOOLEAN DEFAULT true, -- Show all features by default
  details JSONB DEFAULT '[]'::jsonb, -- Array of feature details
  deployment_info JSONB DEFAULT '{}'::jsonb, -- Program IDs, deployment dates, etc.
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by TEXT -- Admin wallet that made the update
);

-- Add RLS policies
ALTER TABLE public.feature_management ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all features" ON public.feature_management
  FOR ALL USING (
    auth.uid() IN (
      SELECT wallet_address FROM public.admin_users 
      WHERE is_active = true
    )
  );

-- Public can only read visible features
CREATE POLICY "Public can view visible features" ON public.feature_management
  FOR SELECT USING (is_visible = true);

-- Insert default features (all locked initially)
INSERT INTO public.feature_management (
  feature_key, feature_name, description, icon, completion_percentage, 
  access_level, status, is_visible, details
) VALUES 
(
  'nft_collection_creation',
  'NFT Collection Creation',
  'Create and deploy your own NFT collections with custom traits, rarity systems, and metadata.',
  '🎨',
  0,
  'locked',
  'development',
  true,
  '["Custom trait layers and rarity weights", "Automated metadata generation", "On-chain collection deployment", "Royalty management", "Batch minting capabilities"]'::jsonb
),
(
  'advanced_marketplace',
  'Advanced Marketplace',
  'Trade NFTs with advanced features including auctions, offers, and OTC trading.',
  '🏪',
  0,
  'locked',
  'development',
  true,
  '["Auction and fixed-price listings", "Make offers and counter-offers", "OTC (Over-the-Counter) trading", "Collection-based trading", "Advanced filtering and search"]'::jsonb
),
(
  'token_swapping',
  'Token Swapping',
  'Swap between different tokens with our integrated DEX functionality.',
  '🔄',
  0,
  'locked',
  'development',
  true,
  '["Multi-token support", "Slippage protection", "Price impact warnings", "Liquidity pool integration", "Real-time price feeds"]'::jsonb
),
(
  'nft_staking',
  'NFT Staking',
  'Stake your NFTs to earn rewards and participate in governance.',
  '💰',
  0,
  'locked',
  'development',
  true,
  '["Flexible staking periods", "Reward calculation algorithms", "Governance participation", "Auto-compounding rewards", "Risk-free unstaking"]'::jsonb
),
(
  'token_vesting',
  'Token Vesting',
  'Manage token vesting schedules for team members and investors.',
  '⏰',
  0,
  'locked',
  'development',
  true,
  '["Custom vesting schedules", "Cliff periods and linear release", "Multi-recipient support", "Vesting contract deployment", "Real-time vesting tracking"]'::jsonb
),
(
  'token_locking',
  'Token Locking',
  'Lock tokens for security, governance, or liquidity provision.',
  '🔒',
  0,
  'locked',
  'development',
  true,
  '["Flexible lock periods", "Multi-token support", "Governance integration", "Liquidity lock features", "Emergency unlock mechanisms"]'::jsonb
),
(
  'evolving_nfts',
  'Evolving NFTs',
  'Create NFTs that evolve and change based on external data and user interactions.',
  '🧬',
  0,
  'locked',
  'development',
  true,
  '["Dynamic metadata updates", "External data integration", "User interaction triggers", "Evolutionary algorithms", "Real-time NFT transformation"]'::jsonb
),
(
  'living_portfolio',
  'Living Portfolio',
  'Track your NFT and token portfolio with real-time updates and analytics.',
  '📊',
  0,
  'locked',
  'development',
  true,
  '["Real-time portfolio tracking", "Performance analytics", "P&L calculations", "Historical data", "Portfolio optimization suggestions"]'::jsonb
),
(
  'airdrop_system',
  'Airdrop System',
  'Distribute tokens and NFTs to your community with our airdrop platform.',
  '🎁',
  0,
  'locked',
  'development',
  true,
  '["Whitelist management", "Batch distribution", "Conditional airdrops", "Community verification", "Distribution analytics"]'::jsonb
)
ON CONFLICT (feature_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feature_updated_at_trigger
  BEFORE UPDATE ON public.feature_management
  FOR EACH ROW EXECUTE FUNCTION public.update_feature_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feature_management_visible ON public.feature_management(is_visible);
CREATE INDEX IF NOT EXISTS idx_feature_management_access_level ON public.feature_management(access_level);
CREATE INDEX IF NOT EXISTS idx_feature_management_status ON public.feature_management(status);
