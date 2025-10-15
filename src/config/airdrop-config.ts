/**
 * Airdrop Configuration
 * Comprehensive airdrop system supporting both platform and creator-defined campaigns
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Token Metadata Interface
 */
export interface TokenMetadata {
  mintAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  supply?: number;
  verified?: boolean;
}

/**
 * NFT Collection Metadata Interface
 */
export interface NFTCollectionMetadata {
  collectionAddress: string;
  name: string;
  verified?: boolean;
  totalSupply?: number;
}

/**
 * $LOL Token Configuration (Platform Token)
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
 * Creator Airdrop Configuration
 */
export const CREATOR_AIRDROP_CONFIG = {
  // Maximum number of campaigns per creator
  MAX_CAMPAIGNS_PER_CREATOR: 10,
  
  // Maximum campaign duration (in days)
  MAX_CAMPAIGN_DURATION: 365,
  
  // Minimum campaign duration (in days)
  MIN_CAMPAIGN_DURATION: 1,
  
  // Maximum airdrop amount per campaign (to prevent spam)
  MAX_AIRDROP_AMOUNT: 1_000_000_000, // 1 billion tokens
  
  // Minimum airdrop amount per campaign
  MIN_AIRDROP_AMOUNT: 1000,
  
  // Platform fee for creator airdrops (percentage)
  PLATFORM_FEE_PERCENTAGE: 2.5, // 2.5% of airdrop amount
  
  // Required token deposit before campaign activation
  REQUIRE_TOKEN_DEPOSIT: true,
} as const;

/**
 * Eligibility Criteria Types
 */
export interface EligibilityCriteria {
  // Token holding requirements
  tokenHoldings?: {
    mintAddress: string;
    minAmount: number;
    symbol?: string;
    name?: string;
  }[];
  
  // NFT ownership requirements
  nftOwnership?: {
    collectionAddress: string;
    minCount: number;
    collectionName?: string;
  }[];
  
  // Manual whitelist
  whitelist?: string[];
  
  // Platform-specific requirements
  platformRequirements?: {
    minLOLHolding?: number;
    hasCreatedCollection?: boolean;
    hasStakedNFTs?: boolean;
  };
}

/**
 * Airdrop Campaign Types
 */
export interface AirdropCampaign {
  id: string;
  name: string;
  description: string;
  type: 'holdings_based' | 'equal_share' | 'whitelist' | 'nft_based' | 'creator_defined';
  
  // Token to be airdropped
  airdropToken: {
    mintAddress: string;
    symbol: string;
    name: string;
    decimals: number;
    totalAmount: number;
    claimedAmount: number;
  };
  
  // Campaign creator info
  creator: {
    walletAddress: string;
    name?: string;
    verified?: boolean;
  };
  
  // Eligibility criteria
  eligibility: EligibilityCriteria;
  
  // Campaign settings
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  requiresDeposit: boolean;
  depositedAmount?: number;
  
  // Platform settings
  platformFee?: number;
  merkleRoot?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
  
  // Stats
  eligibleWallets: string[];
  totalClaims: number;
  uniqueClaimers: number;
}

/**
 * User Airdrop Eligibility
 */
export interface UserEligibility {
  walletAddress: string;
  campaignId: string;
  isEligible: boolean;
  eligibleAmount: number;
  claimedAmount: number;
  remainingAmount: number;
  requirements: {
    tokenHoldings: {
      mintAddress: string;
      amount: number;
      meetsRequirement: boolean;
    }[];
    nftOwnership: {
      collectionAddress: string;
      count: number;
      meetsRequirement: boolean;
    }[];
    isWhitelisted: boolean;
    platformRequirements: {
      hasMinLOLHolding: boolean;
      hasCreatedCollection: boolean;
      hasStakedNFTs: boolean;
    };
  };
  eligibilityDetails: {
    passedChecks: string[];
    failedChecks: string[];
    reason?: string;
  };
}

/**
 * Default Airdrop Campaigns (Platform Campaigns)
 */
export const DEFAULT_CAMPAIGNS: AirdropCampaign[] = [
  {
    id: 'lol-holders-1',
    name: '$LOL Holders Airdrop #1',
    description: '1% of total LOL supply distributed to LOL token holders',
    type: 'holdings_based',
    airdropToken: {
      mintAddress: LOL_TOKEN.MINT_ADDRESS.toString(),
      symbol: LOL_TOKEN.SYMBOL,
      name: LOL_TOKEN.NAME,
      decimals: LOL_TOKEN.DECIMALS,
      totalAmount: 5_000_000, // 5M tokens
      claimedAmount: 0,
    },
    creator: {
      walletAddress: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
      name: 'Analos Platform',
      verified: true,
    },
    eligibility: {
      tokenHoldings: [{
        mintAddress: LOL_TOKEN.MINT_ADDRESS.toString(),
        minAmount: 1000, // Minimum 1000 LOL tokens
        symbol: LOL_TOKEN.SYMBOL,
        name: LOL_TOKEN.NAME,
      }],
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    requiresDeposit: false,
    eligibleWallets: [],
    totalClaims: 0,
    uniqueClaimers: 0,
    createdAt: new Date(),
  },
  {
    id: 'early-supporters',
    name: 'Early Supporters Reward',
    description: 'Rewards for early platform supporters and community contributors',
    type: 'whitelist',
    airdropToken: {
      mintAddress: LOL_TOKEN.MINT_ADDRESS.toString(),
      symbol: LOL_TOKEN.SYMBOL,
      name: LOL_TOKEN.NAME,
      decimals: LOL_TOKEN.DECIMALS,
      totalAmount: 2_000_000, // 2M tokens
      claimedAmount: 0,
    },
    creator: {
      walletAddress: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
      name: 'Analos Platform',
      verified: true,
    },
    eligibility: {
      whitelist: [
        // Add whitelisted addresses here
      ],
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    isActive: true,
    requiresDeposit: false,
    eligibleWallets: [],
    totalClaims: 0,
    uniqueClaimers: 0,
    createdAt: new Date(),
  },
  {
    id: 'nft-holders',
    name: 'NFT Holders Bonus',
    description: 'Bonus rewards for users holding NFTs from platform collections',
    type: 'nft_based',
    airdropToken: {
      mintAddress: LOL_TOKEN.MINT_ADDRESS.toString(),
      symbol: LOL_TOKEN.SYMBOL,
      name: LOL_TOKEN.NAME,
      decimals: LOL_TOKEN.DECIMALS,
      totalAmount: 3_000_000, // 3M tokens
      claimedAmount: 0,
    },
    creator: {
      walletAddress: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
      name: 'Analos Platform',
      verified: true,
    },
    eligibility: {
      nftOwnership: [
        // Add collection addresses here
        // {
        //   collectionAddress: 'collection_address_here',
        //   minCount: 1,
        //   collectionName: 'Collection Name',
        // }
      ],
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    isActive: true,
    requiresDeposit: false,
    eligibleWallets: [],
    totalClaims: 0,
    uniqueClaimers: 0,
    createdAt: new Date(),
  },
];

/**
 * Helper functions
 */
export function calculateAirdropAmount(
  campaign: AirdropCampaign,
  userTokenHoldings: { [mintAddress: string]: number },
  userNFTHoldings: { [collectionAddress: string]: number }
): number {
  const { type, airdropToken, eligibility } = campaign;
  
  switch (type) {
    case 'holdings_based':
      // Proportional to holdings of the required token
      if (eligibility.tokenHoldings && eligibility.tokenHoldings.length > 0) {
        const requiredToken = eligibility.tokenHoldings[0];
        const userHolding = userTokenHoldings[requiredToken.mintAddress] || 0;
        if (userHolding >= requiredToken.minAmount) {
          // Calculate proportional amount (simplified)
          return Math.floor((userHolding / requiredToken.minAmount) * (airdropToken.totalAmount / 100));
        }
      }
      return 0;
    
    case 'equal_share':
      // Equal share for all eligible users
      return Math.floor(airdropToken.totalAmount / 1000); // Placeholder calculation
    
    case 'whitelist':
      // Fixed amount for whitelisted users
      return 50_000; // 50k tokens for whitelisted users
    
    case 'nft_based':
      // Fixed amount per NFT held
      if (eligibility.nftOwnership && eligibility.nftOwnership.length > 0) {
        const totalNFTCount = eligibility.nftOwnership.reduce((total, requirement) => {
          const userCount = userNFTHoldings[requirement.collectionAddress] || 0;
          return total + Math.min(userCount, requirement.minCount);
        }, 0);
        return totalNFTCount * 10_000; // 10k tokens per NFT
      }
      return 0;
    
    case 'creator_defined':
      // Creator-defined amount (could be any of the above methods)
      return 100_000; // Default creator amount
    
    default:
      return 0;
  }
}

export function isWalletEligible(
  walletAddress: string,
  campaign: AirdropCampaign,
  userTokenHoldings: { [mintAddress: string]: number },
  userNFTHoldings: { [collectionAddress: string]: number }
): boolean {
  // Check if campaign is active
  if (!campaign.isActive || new Date() > campaign.endDate) {
    return false;
  }
  
  const { eligibility } = campaign;
  
  // Check whitelist
  if (eligibility.whitelist && eligibility.whitelist.includes(walletAddress)) {
    return true;
  }
  
  // Check token holding requirements
  if (eligibility.tokenHoldings) {
    const meetsTokenRequirements = eligibility.tokenHoldings.every(requirement => {
      const userHolding = userTokenHoldings[requirement.mintAddress] || 0;
      return userHolding >= requirement.minAmount;
    });
    if (meetsTokenRequirements) return true;
  }
  
  // Check NFT ownership requirements
  if (eligibility.nftOwnership) {
    const meetsNFTRequirements = eligibility.nftOwnership.every(requirement => {
      const userCount = userNFTHoldings[requirement.collectionAddress] || 0;
      return userCount >= requirement.minCount;
    });
    if (meetsNFTRequirements) return true;
  }
  
  // Check platform requirements
  if (eligibility.platformRequirements) {
    const { minLOLHolding, hasCreatedCollection, hasStakedNFTs } = eligibility.platformRequirements;
    
    if (minLOLHolding) {
      const lolHolding = userTokenHoldings[LOL_TOKEN.MINT_ADDRESS.toString()] || 0;
      if (lolHolding < minLOLHolding) return false;
    }
    
    // Additional platform requirement checks would go here
    // hasCreatedCollection, hasStakedNFTs would need to be checked against platform data
  }
  
  return false;
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
