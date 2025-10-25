import { PublicKey } from '@solana/web3.js';

// Los Bros Collection Pricing & Whitelist Configuration
// ======================================================

export const LOS_BROS_PRICING = {
  // Dynamic pricing - starts low, increases with each mint
  STARTING_PRICE: 4200.69, // LOS
  MAX_PRICE: 42000.69, // LOS
  PRICE_INCREMENT_PERCENT: 6.9, // Increases by 6.9% with each mint
  CURRENCY: 'LOS',
  
  // Platform fee (covers storage, IPFS, infrastructure)
  PLATFORM_FEE_PERCENT: 6.9,
  
  // Total supply
  TOTAL_SUPPLY: 2222,
  
  // Anti-bot: Minimum holding period for free/discounted mints
  MIN_HOLDING_PERIOD_HOURS: 72, // Must hold $LOL for 72 hours
  
  // Whitelist allocations
  ALLOCATIONS: {
    TEAM: 50,           // Team wallets - FREE
    EARLY: 150,         // 100k+ $LOL holders - 50% OFF
    COMMUNITY: 500,     // 1M+ $LOL holders - FREE (only platform fee)
    PUBLIC: 1522,       // Everyone else - Full price
  },
  
  // Mint limits per wallet per phase
  MINT_LIMITS_PER_WALLET: {
    TEAM: 10,           // Team can mint up to 10 each
    EARLY: 1,           // Early supporters limited to 1 (100k+ $LOL)
    COMMUNITY: 3,       // Community holders limited to 3 (1M+ $LOL)
    PUBLIC: 2,          // Public limited to 2 per wallet
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

// Calculate dynamic price based on mints
export function calculateDynamicPrice(mintedCount: number): number {
  const { STARTING_PRICE, MAX_PRICE, PRICE_INCREMENT_PERCENT } = LOS_BROS_PRICING;
  
  // Price increases by 6.9% with each mint
  const incrementMultiplier = Math.pow(1 + (PRICE_INCREMENT_PERCENT / 100), mintedCount);
  const dynamicPrice = STARTING_PRICE * incrementMultiplier;
  
  // Cap at max price
  return Math.min(dynamicPrice, MAX_PRICE);
}

// Calculate pricing based on user's $LOL holdings
export interface LosBrosPricing {
  tier: 'TEAM' | 'EARLY' | 'COMMUNITY' | 'PUBLIC';
  basePrice: number;
  discount: number;
  finalPrice: number;
  platformFee: number;
  isFree: boolean;
  tokenBalance: number;
  holdingPeriodMet: boolean;
  holdingPeriodHours: number;
  message: string;
}

export function calculateLosBrosPricing(
  walletAddress: string,
  lolBalance: number,
  holdingPeriodHours: number = 0,
  currentMintCount: number = 0
): LosBrosPricing {
  const basePrice = calculateDynamicPrice(currentMintCount);
  const platformFeePercent = LOS_BROS_PRICING.PLATFORM_FEE_PERCENT;
  const holdingPeriodMet = holdingPeriodHours >= LOS_BROS_PRICING.MIN_HOLDING_PERIOD_HOURS;
  
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
      holdingPeriodMet: true, // Team always passes
      holdingPeriodHours,
      message: '🎖️ Team Allocation - FREE Mint!',
    };
  }
  
  // Check if 1M+ $LOL holder (Community tier) - MUST meet holding period
  if (lolBalance >= LOS_BROS_PRICING.LOL_TOKEN.COMMUNITY_THRESHOLD) {
    const platformFee = basePrice * (platformFeePercent / 100);
    
    // Anti-bot: Check holding period
    if (!holdingPeriodMet) {
      return {
        tier: 'COMMUNITY',
        basePrice: basePrice,
        discount: 0,
        finalPrice: basePrice,
        platformFee: basePrice * (platformFeePercent / 100),
        isFree: false,
        tokenBalance: lolBalance,
        holdingPeriodMet: false,
        holdingPeriodHours,
        message: `⏰ Hold $LOL for ${LOS_BROS_PRICING.MIN_HOLDING_PERIOD_HOURS}h to unlock free mint (${holdingPeriodHours.toFixed(1)}h so far)`,
      };
    }
    
    return {
      tier: 'COMMUNITY',
      basePrice: basePrice,
      discount: 100,
      finalPrice: platformFee,
      platformFee: platformFee,
      isFree: false, // Not completely free, pays platform fee
      tokenBalance: lolBalance,
      holdingPeriodMet: true,
      holdingPeriodHours,
      message: `🎁 Community Holder (${lolBalance.toLocaleString()} $LOL) - FREE Mint! Only pay ${platformFee.toFixed(2)} LOS platform fee`,
    };
  }
  
  // Check if 100k+ $LOL holder (Early Supporter tier) - MUST meet holding period
  if (lolBalance >= LOS_BROS_PRICING.LOL_TOKEN.EARLY_SUPPORTER_THRESHOLD) {
    const discountedPrice = basePrice * 0.5; // 50% off
    const platformFee = discountedPrice * (platformFeePercent / 100);
    
    // Anti-bot: Check holding period for discount
    if (!holdingPeriodMet) {
      return {
        tier: 'EARLY',
        basePrice: basePrice,
        discount: 0,
        finalPrice: basePrice,
        platformFee: basePrice * (platformFeePercent / 100),
        isFree: false,
        tokenBalance: lolBalance,
        holdingPeriodMet: false,
        holdingPeriodHours,
        message: `⏰ Hold $LOL for ${LOS_BROS_PRICING.MIN_HOLDING_PERIOD_HOURS}h to unlock 50% discount (${holdingPeriodHours.toFixed(1)}h so far)`,
      };
    }
    
    return {
      tier: 'EARLY',
      basePrice: basePrice,
      discount: 50,
      finalPrice: discountedPrice,
      platformFee: platformFee,
      isFree: false,
      tokenBalance: lolBalance,
      holdingPeriodMet: true,
      holdingPeriodHours,
      message: `💎 Early Supporter (${lolBalance.toLocaleString()} $LOL) - 50% OFF!`,
    };
  }
  
  // Public sale (no discount) - Dynamic pricing
  const platformFee = basePrice * (platformFeePercent / 100);
  
  return {
    tier: 'PUBLIC',
    basePrice: basePrice,
    discount: 0,
    finalPrice: basePrice,
    platformFee: platformFee,
    isFree: false,
    tokenBalance: lolBalance,
    holdingPeriodMet: true, // Not required for public sale
    holdingPeriodHours,
    message: `🌍 Public Sale - ${basePrice.toFixed(2)} LOS (Price increases with each mint)`,
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

