/**
 * EXCLUSIVE NFT COLLECTION CONFIGURATION
 * Configuration for your 2,222 NFT collection with LOL whitelist and bonding curve
 */

export const EXCLUSIVE_COLLECTION_CONFIG = {
  // Collection Details
  name: "Exclusive Collection",
  symbol: "EXCL",
  description: "Exclusive NFT collection with LOL token whitelist and rarity-based token allocation",
  
  // Supply Breakdown
  totalSupply: 2222,
  whitelistSupply: 100,
  publicSupply: 1900,
  platformReserve: 222,
  
  // Pricing Configuration
  whitelistPrice: 0, // FREE for first mint (1M+ ANAL holders)
  additionalMintPrice: 4200.69, // LOS tokens for additional mints
  bondingCurveStart: 4200.69, // LOS tokens
  bondingCurveEnd: 42000.69, // LOS tokens
  
  // Reveal Configuration
  preRevealImage: "https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm",
  revealThreshold: 1900, // Reveal after public sale completes
  delayedReveal: true,
  
  // LOL Token Configuration
  lolTokenMint: process.env.LOL_TOKEN_MINT || "ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6",
  minLolBalance: 1000000, // 1M LOL tokens required
  whitelistSpots: 100,
  
  // Rarity Tiers Configuration
  rarityTiers: {
    LEGENDARY: {
      count: 100,
      tokenAllocation: 1000, // LOS tokens
      traits: ["Golden Aura", "Exclusive Background", "Rare Effects"],
      rarity: "1/22"
    },
    EPIC: {
      count: 500,
      tokenAllocation: 500, // LOS tokens
      traits: ["Silver Border", "Premium Background", "Special Effects"],
      rarity: "1/4"
    },
    RARE: {
      count: 800,
      tokenAllocation: 250, // LOS tokens
      traits: ["Bronze Accent", "Standard Background", "Basic Effects"],
      rarity: "1/3"
    },
    COMMON: {
      count: 500,
      tokenAllocation: 100, // LOS tokens
      traits: ["Standard Design", "Basic Background", "No Effects"],
      rarity: "1/2"
    }
  },
  
  // Bonding Curve Configuration
  bondingCurve: {
    enabled: true,
    token: "LOS", // All prices in LOS tokens
    phases: [
      {
        name: "Whitelist",
        startMint: 0,
        endMint: 100,
        price: 0, // FREE for first mint if 1M+ ANAL holders
        additionalPrice: 4200.69, // LOS for additional mints
        description: "First mint FREE for 1M+ ANAL holders, 4,200.69 LOS for additional"
      },
      {
        name: "Early Public",
        startMint: 100,
        endMint: 600,
        priceStart: 4200.69,
        priceEnd: 14000,
        description: "Early bird pricing in LOS tokens"
      },
      {
        name: "Mid Public",
        startMint: 600,
        endMint: 1400,
        priceStart: 14000,
        priceEnd: 28000,
        description: "Mid-tier pricing in LOS tokens"
      },
      {
        name: "Late Public",
        startMint: 1400,
        endMint: 2000,
        priceStart: 28000,
        priceEnd: 42000.69,
        description: "Premium pricing in LOS tokens"
      }
    ]
  },
  
  // Platform Reserve Configuration
  platformReserveConfig: {
    enabled: true,
    count: 222,
    purposes: [
      { name: "Marketing", count: 50, description: "Marketing campaigns and promotions" },
      { name: "Collaborations", count: 50, description: "Partnership and collaboration NFTs" },
      { name: "Team", count: 50, description: "Team allocation and rewards" },
      { name: "Future Development", count: 72, description: "Future platform development" }
    ]
  },
  
  // Token Allocation Configuration
  tokenAllocation: {
    enabled: true,
    tokenMint: process.env.LOS_TOKEN_MINT || "", // LOS token mint
    allocationSchedule: {
      LEGENDARY: 1000, // 1,000 LOS tokens
      EPIC: 500,       // 500 LOS tokens
      RARE: 250,       // 250 LOS tokens
      COMMON: 100      // 100 LOS tokens
    },
    vestingPeriod: 30, // 30 days vesting period
    cliffPeriod: 7     // 7 days cliff period
  },
  
  // Launch Schedule
  launchSchedule: {
    snapshotDate: null as Date | null, // Will be set when LOL snapshot is taken
    whitelistStart: null as Date | null, // 24-hour whitelist window
    whitelistEnd: null as Date | null,
    publicSaleStart: null as Date | null, // Public sale begins after whitelist
    revealDate: null as Date | null, // Reveal after 1,900 NFTs minted
    platformReserveMint: null as Date | null // After public sale completes
  },
  
  // Metadata Configuration
  metadata: {
    baseUri: "https://your-metadata-api.com/api/metadata/",
    collectionUri: "https://your-collection-api.com/api/collection/",
    externalUrl: "https://your-website.com",
    sellerFeeBasisPoints: 690, // 6.9% royalty
    creators: [
      {
        address: process.env.CREATOR_WALLET || "",
        verified: true,
        share: 100
      }
    ]
  },
  
  // Security Configuration
  security: {
    maxMintsPerWallet: 5, // Maximum 5 NFTs per wallet
    whitelistMaxMints: 1, // 1 NFT per whitelist wallet
    publicMaxMints: 5,    // 5 NFTs per public wallet
    pauseEnabled: true,   // Can pause minting if needed
    adminWallets: [
      process.env.ADMIN_WALLET_1 || "",
      process.env.ADMIN_WALLET_2 || ""
    ]
  }
};

// Helper functions
export function calculateBondingCurvePrice(mintedCount: number): number {
  const config = EXCLUSIVE_COLLECTION_CONFIG;
  
  if (mintedCount < config.whitelistSupply) {
    return config.whitelistPrice; // FREE
  }
  
  if (mintedCount >= config.publicSupply) {
    return config.bondingCurveEnd; // Max price
  }
  
  // Calculate price based on bonding curve
  const publicMinted = mintedCount - config.whitelistSupply;
  const publicSupply = config.publicSupply - config.whitelistSupply;
  const progress = publicMinted / publicSupply;
  
  // Exponential curve from start to end price
  const price = config.bondingCurveStart + 
    (config.bondingCurveEnd - config.bondingCurveStart) * Math.pow(progress, 2);
  
  return Math.round(price * 10000) / 10000; // Round to 4 decimal places
}

export function getRarityTier(mintOrder: number): string {
  const config = EXCLUSIVE_COLLECTION_CONFIG;
  
  if (mintOrder <= 100) return "LEGENDARY";
  if (mintOrder <= 600) return "EPIC";
  if (mintOrder <= 1400) return "RARE";
  return "COMMON";
}

export function getTokenAllocation(mintOrder: number): number {
  const rarityTier = getRarityTier(mintOrder);
  return EXCLUSIVE_COLLECTION_CONFIG.rarityTiers[rarityTier as keyof typeof EXCLUSIVE_COLLECTION_CONFIG.rarityTiers].tokenAllocation;
}

export function isWhitelistEligible(mintOrder: number): boolean {
  return mintOrder <= EXCLUSIVE_COLLECTION_CONFIG.whitelistSupply;
}

export function canMint(walletAddress: string, mintedCount: number, userMintedCount: number): { canMint: boolean; reason?: string } {
  const config = EXCLUSIVE_COLLECTION_CONFIG;
  
  // Check if collection is sold out
  if (mintedCount >= config.publicSupply) {
    return { canMint: false, reason: "Collection sold out" };
  }
  
  // Check max mints per wallet
  if (userMintedCount >= config.security.publicMaxMints) {
    return { canMint: false, reason: "Maximum mints per wallet reached" };
  }
  
  return { canMint: true };
}

export default EXCLUSIVE_COLLECTION_CONFIG;
