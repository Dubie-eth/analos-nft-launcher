/**
 * $LOL Token Configuration
 * Governance and utility token for the Analos NFT Launchpad ecosystem
 */

import { PublicKey } from '@solana/web3.js';

/**
 * $LOL Token Configuration
 */
export const LOL_TOKEN = {
  // Token mint address (placeholder - replace with actual LOL token mint)
  MINT_ADDRESS: new PublicKey('11111111111111111111111111111111'), // PLACEHOLDER
  
  // Token decimals
  DECIMALS: 9,
  
  // Token symbol
  SYMBOL: 'LOL',
  
  // Token name
  NAME: 'Analos Launchpad Token',
  
  // Total supply
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion tokens
  
  // Airdrop configuration
  AIRDROP: {
    // 1% of total supply for airdrops
    TOTAL_AIRDROP_AMOUNT: 10_000_000, // 10 million tokens (1%)
    
    // Distribution methods
    DISTRIBUTION_METHODS: {
      HOLDINGS_BASED: 'holdings_based', // Based on LOL token holdings
      EQUAL_SHARE: 'equal_share',       // Equal share for all eligible
      WHITELIST: 'whitelist',           // Whitelist-based distribution
      NFT_BASED: 'nft_based',           // Based on NFT holdings
    },
    
    // Minimum holding requirements
    MIN_HOLDING: 1000, // Minimum LOL tokens required
    
    // Maximum claim per wallet
    MAX_CLAIM_PER_WALLET: 100_000, // 100k tokens max per wallet
    
    // Campaign duration (in days)
    CAMPAIGN_DURATION: 30,
  },
  
  // Whitelist configuration
  WHITELIST: {
    // Enable whitelist for airdrops
    ENABLED: true,
    
    // Whitelist types
    TYPES: {
      EARLY_SUPPORTERS: 'early_supporters',
      NFT_HOLDERS: 'nft_holders',
      COMMUNITY_CONTRIBUTORS: 'community_contributors',
      PARTNERS: 'partners',
    },
    
    // Admin wallets that can manage whitelists
    ADMIN_WALLETS: [
      '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
      '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
    ],
  },
} as const;

/**
 * Airdrop Campaign Types
 */
export interface AirdropCampaign {
  id: string;
  name: string;
  description: string;
  type: 'holdings_based' | 'equal_share' | 'whitelist' | 'nft_based';
  totalAmount: number;
  claimedAmount: number;
  eligibleWallets: string[];
  whitelist?: string[];
  requirements: {
    minHolding?: number;
    nftCollections?: string[];
    whitelistType?: string;
  };
  startDate: Date;
  endDate: Date;
  merkleRoot?: string;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * User Airdrop Eligibility
 */
export interface UserEligibility {
  walletAddress: string;
  isEligible: boolean;
  eligibleAmount: number;
  claimedAmount: number;
  remainingAmount: number;
  requirements: {
    holdingAmount: number;
    hasRequiredNFTs: boolean;
    isWhitelisted: boolean;
  };
  campaignIds: string[];
}

/**
 * Default Airdrop Campaigns
 */
export const DEFAULT_CAMPAIGNS: AirdropCampaign[] = [
  {
    id: 'lol-holders-1',
    name: '$LOL Holders Airdrop #1',
    description: '1% of total LOL supply distributed to LOL token holders',
    type: 'holdings_based',
    totalAmount: 5_000_000, // 5M tokens
    claimedAmount: 0,
    eligibleWallets: [],
    requirements: {
      minHolding: 1000, // Minimum 1000 LOL tokens
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    createdAt: new Date(),
    createdBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  },
  {
    id: 'early-supporters',
    name: 'Early Supporters Reward',
    description: 'Rewards for early platform supporters and community contributors',
    type: 'whitelist',
    totalAmount: 2_000_000, // 2M tokens
    claimedAmount: 0,
    eligibleWallets: [],
    whitelist: [
      // Add whitelisted addresses here
    ],
    requirements: {
      whitelistType: 'early_supporters',
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    isActive: true,
    createdAt: new Date(),
    createdBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  },
  {
    id: 'nft-holders',
    name: 'NFT Holders Bonus',
    description: 'Bonus rewards for users holding NFTs from platform collections',
    type: 'nft_based',
    totalAmount: 3_000_000, // 3M tokens
    claimedAmount: 0,
    eligibleWallets: [],
    requirements: {
      nftCollections: [
        // Add collection addresses here
      ],
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    isActive: true,
    createdAt: new Date(),
    createdBy: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  },
];

/**
 * Helper functions
 */
export function calculateAirdropAmount(
  holdingAmount: number,
  campaignType: string,
  totalEligibleHoldings?: number,
  campaignTotalAmount?: number
): number {
  switch (campaignType) {
    case 'holdings_based':
      if (!totalEligibleHoldings || !campaignTotalAmount) return 0;
      // Proportional to holdings
      return Math.floor((holdingAmount / totalEligibleHoldings) * campaignTotalAmount);
    
    case 'equal_share':
      if (!campaignTotalAmount) return 0;
      // Equal share for all eligible (would need total eligible wallets)
      return Math.floor(campaignTotalAmount / 1000); // Placeholder calculation
    
    case 'whitelist':
      // Fixed amount for whitelisted users
      return 50_000; // 50k tokens for whitelisted users
    
    case 'nft_based':
      // Fixed amount per NFT held
      return 10_000; // 10k tokens per NFT
    
    default:
      return 0;
  }
}

export function isWalletEligible(
  walletAddress: string,
  campaign: AirdropCampaign,
  userHolding?: number,
  userNFTs?: string[]
): boolean {
  // Check if campaign is active
  if (!campaign.isActive || new Date() > campaign.endDate) {
    return false;
  }
  
  // Check whitelist
  if (campaign.type === 'whitelist' && campaign.whitelist) {
    return campaign.whitelist.includes(walletAddress);
  }
  
  // Check minimum holding
  if (campaign.requirements.minHolding && userHolding) {
    return userHolding >= campaign.requirements.minHolding;
  }
  
  // Check NFT requirements
  if (campaign.requirements.nftCollections && userNFTs) {
    return campaign.requirements.nftCollections.some(collection => 
      userNFTs.includes(collection)
    );
  }
  
  return true;
}

export function formatTokenAmount(amount: number, decimals: number = 9): string {
  return (amount / Math.pow(10, decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function parseTokenAmount(amount: string, decimals: number = 9): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}
