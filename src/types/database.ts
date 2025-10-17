// Database type definitions for Supabase
export interface SavedCollection {
  id: string;
  user_wallet: string;
  collection_name: string;
  collection_symbol: string;
  description?: string;
  total_supply: number;
  mint_price: number;
  reveal_type: 'instant' | 'delayed';
  reveal_date?: string;
  whitelist_enabled: boolean;
  bonding_curve_enabled: boolean;
  layers: any[];
  collection_config: any;
  status: 'draft' | 'deployed' | 'active' | 'paused' | 'completed';
  deployed_at?: string;
  collection_address?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorReward {
  id: string;
  user_wallet: string;
  collection_id?: string;
  reward_type: 'creator_fee' | 'royalty' | 'referral' | 'airdrop';
  amount: number;
  token_mint?: string;
  token_symbol: string;
  status: 'pending' | 'claimable' | 'claimed';
  claim_tx_signature?: string;
  claimed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionSale {
  id: string;
  collection_id: string;
  buyer_wallet: string;
  seller_wallet?: string;
  nft_mint: string;
  sale_price: number;
  creator_fee: number;
  platform_fee: number;
  token_mint: string;
  transaction_signature: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  wallet_address: string;
  wallet_address_hash: string;
  username: string;
  bio?: string;
  profile_picture_url?: string;
  banner_image_url?: string;
  socials?: any;
  privacy_level: string;
  allow_data_export: boolean;
  allow_analytics: boolean;
  is_verified: boolean;
  verification_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
