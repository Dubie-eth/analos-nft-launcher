import { PublicKey } from '@solana/web3.js';

// Los Bros Collection Pricing & Whitelist Configuration
// ======================================================

export const LOS_BROS_PRICING = {
  // Base price for public sale
  BASE_PRICE: 4200.69, // LOS
  CURRENCY: 'LOS',
  
  // Platform fee (covers storage, IPFS, infrastructure)
  PLATFORM_FEE_PERCENT: 6.9,
  
  // Total supply
  TOTAL_SUPPLY: 2222,
  
  // Whitelist allocations
  ALLOCATIONS: {
    TEAM: 50,           // Team wallets - FREE
    EARLY: 150,         // 100k+ $LOL holders - 50% OFF
    COMMUNITY: 500,     // 1M+ $LOL holders - FREE (only platform fee)
    PUBLIC: 1522,       // Everyone else - Full price
  },
  
  // $LOL Token for whitelist verification
  LOL_TOKEN: {
    MINT: new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6'),
    DECIMALS: 9,
    
    // Thresholds for tiers
    EARLY_SUPPORTER_THRESHOLD: 100_000,    // 100k $LOL = 50% off
    COMMUNITY_THRESHOLD: 1_000_000,         // 1M $LOL = FREE
  },
};

// Team wallets (hardcoded for security)
export const TEAM_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Platform wallet
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet
  // Add more team wallets here
];

// Calculate pricing based on user's $LOL holdings
export interface LosBrosPricing {
  tier: 'TEAM' | 'EARLY' | 'COMMUNITY' | 'PUBLIC';
  basePrice: number;
  discount: number;
  finalPrice: number;
  platformFee: number;
  isFree: boolean;
  tokenBalance: number;
  message: string;
}

export function calculateLosBrosPricing(
  walletAddress: string,
  lolBalance: number
): LosBrosPricing {
  const basePrice = LOS_BROS_PRICING.BASE_PRICE;
  const platformFeePercent = LOS_BROS_PRICING.PLATFORM_FEE_PERCENT;
  
  // Check if team wallet
  if (TEAM_WALLETS.includes(walletAddress)) {
    return {
      tier: 'TEAM',
      basePrice: 0,
      discount: 100,
      finalPrice: 0,
      platformFee: 0,
      isFree: true,
      tokenBalance: lolBalance,
      message: '🎖️ Team Allocation - FREE Mint!',
    };
  }
  
  // Check if 1M+ $LOL holder (Community tier)
  if (lolBalance >= LOS_BROS_PRICING.LOL_TOKEN.COMMUNITY_THRESHOLD) {
    const platformFee = basePrice * (platformFeePercent / 100);
    return {
      tier: 'COMMUNITY',
      basePrice: basePrice,
      discount: 100,
      finalPrice: platformFee,
      platformFee: platformFee,
      isFree: false, // Not completely free, pays platform fee
      tokenBalance: lolBalance,
      message: `🎁 Community Holder (${lolBalance.toLocaleString()} $LOL) - FREE Mint! Only pay ${platformFee.toFixed(2)} LOS platform fee`,
    };
  }
  
  // Check if 100k+ $LOL holder (Early Supporter tier)
  if (lolBalance >= LOS_BROS_PRICING.LOL_TOKEN.EARLY_SUPPORTER_THRESHOLD) {
    const discountedPrice = basePrice * 0.5; // 50% off
    const platformFee = discountedPrice * (platformFeePercent / 100);
    const finalPrice = discountedPrice + platformFee;
    
    return {
      tier: 'EARLY',
      basePrice: basePrice,
      discount: 50,
      finalPrice: discountedPrice,
      platformFee: platformFee,
      isFree: false,
      tokenBalance: lolBalance,
      message: `💎 Early Supporter (${lolBalance.toLocaleString()} $LOL) - 50% OFF!`,
    };
  }
  
  // Public sale (no discount)
  const platformFee = basePrice * (platformFeePercent / 100);
  const finalPrice = basePrice + platformFee;
  
  return {
    tier: 'PUBLIC',
    basePrice: basePrice,
    discount: 0,
    finalPrice: basePrice,
    platformFee: platformFee,
    isFree: false,
    tokenBalance: lolBalance,
    message: '🌍 Public Sale - Full Price',
  };
}

// Mint allocation tracking
export interface MintAllocation {
  tier: string;
  allocated: number;
  minted: number;
  remaining: number;
}

export function getMintAllocationStatus(
  teamMinted: number,
  earlyMinted: number,
  communityMinted: number,
  publicMinted: number
): MintAllocation[] {
  return [
    {
      tier: 'TEAM',
      allocated: LOS_BROS_PRICING.ALLOCATIONS.TEAM,
      minted: teamMinted,
      remaining: LOS_BROS_PRICING.ALLOCATIONS.TEAM - teamMinted,
    },
    {
      tier: 'EARLY SUPPORTERS',
      allocated: LOS_BROS_PRICING.ALLOCATIONS.EARLY,
      minted: earlyMinted,
      remaining: LOS_BROS_PRICING.ALLOCATIONS.EARLY - earlyMinted,
    },
    {
      tier: 'COMMUNITY',
      allocated: LOS_BROS_PRICING.ALLOCATIONS.COMMUNITY,
      minted: communityMinted,
      remaining: LOS_BROS_PRICING.ALLOCATIONS.COMMUNITY - communityMinted,
    },
    {
      tier: 'PUBLIC',
      allocated: LOS_BROS_PRICING.ALLOCATIONS.PUBLIC,
      minted: publicMinted,
      remaining: LOS_BROS_PRICING.ALLOCATIONS.PUBLIC - publicMinted,
    },
  ];
}

