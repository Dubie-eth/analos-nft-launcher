/**
 * Tier System Service - Social-based tier system with contract verification
 * Similar to daos.fun with whitelist tiers based on social profiles and token/NFT holdings
 */

export interface SocialProfile {
  walletAddress: string;
  socialAccounts: {
    twitter?: {
      username: string;
      followers: number;
      verified: boolean;
      connected: boolean;
    };
    discord?: {
      username: string;
      serverMemberships: number;
      connected: boolean;
    };
    telegram?: {
      username: string;
      channelSubscribers: number;
      connected: boolean;
    };
    instagram?: {
      username: string;
      followers: number;
      connected: boolean;
    };
    youtube?: {
      channelName: string;
      subscribers: number;
      connected: boolean;
    };
  };
  totalSocialScore: number;
  verifiedAt: string;
  lastUpdated: string;
}

export interface TokenRequirement {
  tokenMint: string;
  tokenSymbol: string;
  minimumBalance: number;
  contractType: 'token' | 'nft';
  verificationMethod: 'balance' | 'holder' | 'specific_nft';
}

export interface TierConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  
  // Pricing
  mintPrice: number; // $LOS
  maxMints: number;
  
  // Social requirements
  socialRequirements: {
    minFollowers?: number;
    minSocialScore?: number;
    requiredPlatforms?: string[];
    verifiedOnly?: boolean;
  };
  
  // Token/NFT requirements
  tokenRequirements: TokenRequirement[];
  
  // Tier benefits
  benefits: string[];
  
  // Availability
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants: number;
}

export interface BondingCurveTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommendedFor: string;
  
  // Curve parameters
  virtualLOSReserves: number;
  virtualNFTSupply: number;
  bondingCap: number;
  
  // Fee structure
  feePercentage: number;
  creatorFeePercentage: number;
  platformFeePercentage: number;
  
  // Tier integration
  supportsTiers: boolean;
  maxTiers: number;
  
  // Pricing range
  minPrice: number;
  maxPrice: number;
  
  // Features
  features: string[];
}

export interface WhitelistTier {
  tierId: string;
  tierName: string;
  tierColor: string;
  participants: string[];
  requirements: {
    social?: SocialProfile['socialAccounts'];
    tokens?: TokenRequirement[];
  };
  mintPrice: number;
  maxMints: number;
  remainingMints: number;
  isActive: boolean;
}

export class TierSystemService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';
  }

  /**
   * Get default tier configurations
   */
  getDefaultTiers(): TierConfig[] {
    return [
      {
        id: 'free',
        name: 'Free Tier',
        description: 'Free minting tier',
        color: '#10B981',
        icon: '🆓',
        mintPrice: 0,
        maxMints: 1,
        socialRequirements: {
          minSocialScore: 0
        },
        tokenRequirements: [],
        benefits: ['Free NFT mint'],
        isActive: true,
        currentParticipants: 0
      },
      {
        id: 'bronze',
        name: 'Bronze Tier',
        description: 'Basic social verification required',
        color: '#CD7F32',
        icon: '🥉',
        mintPrice: 100, // $LOS
        maxMints: 2,
        socialRequirements: {
          minFollowers: 100,
          minSocialScore: 50,
          requiredPlatforms: ['twitter']
        },
        tokenRequirements: [],
        benefits: ['2 NFTs at reduced price', 'Early access'],
        isActive: true,
        currentParticipants: 0
      },
      {
        id: 'silver',
        name: 'Silver Tier',
        description: 'Active community member',
        color: '#C0C0C0',
        icon: '🥈',
        mintPrice: 250, // $LOS
        maxMints: 3,
        socialRequirements: {
          minFollowers: 500,
          minSocialScore: 100,
          requiredPlatforms: ['twitter', 'discord']
        },
        tokenRequirements: [],
        benefits: ['3 NFTs at reduced price', 'Priority support', 'Community access'],
        isActive: true,
        currentParticipants: 0
      },
      {
        id: 'gold',
        name: 'Gold Tier',
        description: 'Influencer or token holder',
        color: '#FFD700',
        icon: '🥇',
        mintPrice: 500, // $LOS
        maxMints: 5,
        socialRequirements: {
          minFollowers: 1000,
          minSocialScore: 200,
          requiredPlatforms: ['twitter']
        },
        tokenRequirements: [
          {
            tokenMint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // LOL token
            tokenSymbol: 'LOL',
            minimumBalance: 1000000, // 1M LOL tokens
            contractType: 'token',
            verificationMethod: 'balance'
          }
        ],
        benefits: ['5 NFTs at reduced price', 'VIP access', 'Creator perks'],
        isActive: true,
        currentParticipants: 0
      },
      {
        id: 'diamond',
        name: 'Diamond Tier',
        description: 'High-value holder or influencer',
        color: '#B9F2FF',
        icon: '💎',
        mintPrice: 1000, // $LOS
        maxMints: 10,
        socialRequirements: {
          minFollowers: 5000,
          minSocialScore: 500,
          requiredPlatforms: ['twitter'],
          verifiedOnly: true
        },
        tokenRequirements: [
          {
            tokenMint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // LOL token
            tokenSymbol: 'LOL',
            minimumBalance: 10000000, // 10M LOL tokens
            contractType: 'token',
            verificationMethod: 'balance'
          }
        ],
        benefits: ['10 NFTs at reduced price', 'Exclusive access', 'Premium perks', 'Creator collaboration'],
        isActive: true,
        maxParticipants: 100,
        currentParticipants: 0
      },
      {
        id: 'whale',
        name: 'Whale Tier',
        description: 'Ultra-high value holder',
        color: '#8B4513',
        icon: '🐋',
        mintPrice: 2000, // $LOS
        maxMints: 25,
        socialRequirements: {
          minSocialScore: 1000
        },
        tokenRequirements: [
          {
            tokenMint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // LOL token
            tokenSymbol: 'LOL',
            minimumBalance: 100000000, // 100M LOL tokens
            contractType: 'token',
            verificationMethod: 'balance'
          }
        ],
        benefits: ['25 NFTs at reduced price', 'Whale status', 'Exclusive events', 'Direct creator access'],
        isActive: true,
        maxParticipants: 20,
        currentParticipants: 0
      }
    ];
  }

  /**
   * Get bonding curve templates based on collection size
   */
  getBondingCurveTemplates(): BondingCurveTemplate[] {
    return [
      {
        id: 'starter',
        name: 'Starter Curve',
        description: 'Perfect for small collections (100-1K NFTs)',
        icon: '🌱',
        recommendedFor: 'Small collections, test launches',
        virtualLOSReserves: 5000000, // 5M $LOS
        virtualNFTSupply: 100000000, // 100M virtual NFTs
        bondingCap: 500000, // 500K $LOS cap
        feePercentage: 1.5,
        creatorFeePercentage: 0.5,
        platformFeePercentage: 1.0,
        supportsTiers: true,
        maxTiers: 3,
        minPrice: 0,
        maxPrice: 1000,
        features: ['Basic tier system', 'Social verification', 'Simple pricing']
      },
      {
        id: 'standard',
        name: 'Standard Curve',
        description: 'Ideal for medium collections (1K-10K NFTs)',
        icon: '🚀',
        recommendedFor: 'Medium collections, community projects',
        virtualLOSReserves: 30000000, // 30M $LOS
        virtualNFTSupply: 1000000000, // 1B virtual NFTs
        bondingCap: 3000000, // 3M $LOS cap
        feePercentage: 1.0,
        creatorFeePercentage: 0.5,
        platformFeePercentage: 0.5,
        supportsTiers: true,
        maxTiers: 5,
        minPrice: 0,
        maxPrice: 5000,
        features: ['Full tier system', 'Token verification', 'Advanced social scoring', 'Multi-platform support']
      },
      {
        id: 'premium',
        name: 'Premium Curve',
        description: 'For large collections (10K+ NFTs)',
        icon: '💎',
        recommendedFor: 'Large collections, established projects',
        virtualLOSReserves: 100000000, // 100M $LOS
        virtualNFTSupply: 10000000000, // 10B virtual NFTs
        bondingCap: 10000000, // 10M $LOS cap
        feePercentage: 0.8,
        creatorFeePercentage: 0.4,
        platformFeePercentage: 0.4,
        supportsTiers: true,
        maxTiers: 6,
        minPrice: 0,
        maxPrice: 10000,
        features: ['Full tier system', 'NFT verification', 'Influencer tiers', 'Whale detection', 'Advanced analytics']
      },
      {
        id: 'enterprise',
        name: 'Enterprise Curve',
        description: 'For massive collections (100K+ NFTs)',
        icon: '🏢',
        recommendedFor: 'Enterprise projects, major brands',
        virtualLOSReserves: 500000000, // 500M $LOS
        virtualNFTSupply: 100000000000, // 100B virtual NFTs
        bondingCap: 50000000, // 50M $LOS cap
        feePercentage: 0.5,
        creatorFeePercentage: 0.25,
        platformFeePercentage: 0.25,
        supportsTiers: true,
        maxTiers: 8,
        minPrice: 0,
        maxPrice: 50000,
        features: ['Full tier system', 'Custom verification', 'White-label options', 'API access', 'Priority support']
      }
    ];
  }

  /**
   * Calculate social score based on social accounts
   */
  calculateSocialScore(socialAccounts: SocialProfile['socialAccounts']): number {
    let score = 0;

    // Twitter scoring
    if (socialAccounts.twitter?.connected) {
      score += Math.min(socialAccounts.twitter.followers / 100, 1000); // Max 1000 points
      if (socialAccounts.twitter.verified) {
        score += 500; // Bonus for verification
      }
    }

    // Discord scoring
    if (socialAccounts.discord?.connected) {
      score += Math.min(socialAccounts.discord.serverMemberships * 10, 500); // Max 500 points
    }

    // Telegram scoring
    if (socialAccounts.telegram?.connected) {
      score += Math.min(socialAccounts.telegram.channelSubscribers / 50, 300); // Max 300 points
    }

    // Instagram scoring
    if (socialAccounts.instagram?.connected) {
      score += Math.min(socialAccounts.instagram.followers / 200, 400); // Max 400 points
    }

    // YouTube scoring
    if (socialAccounts.youtube?.connected) {
      score += Math.min(socialAccounts.youtube.subscribers / 100, 600); // Max 600 points
    }

    return Math.round(score);
  }

  /**
   * Verify token/NFT holdings
   */
  async verifyTokenHoldings(
    walletAddress: string,
    requirements: TokenRequirement[]
  ): Promise<{
    verified: boolean;
    verifiedRequirements: TokenRequirement[];
    failedRequirements: TokenRequirement[];
  }> {
    const verifiedRequirements: TokenRequirement[] = [];
    const failedRequirements: TokenRequirement[] = [];

    for (const requirement of requirements) {
      try {
        let isVerified = false;

        switch (requirement.verificationMethod) {
          case 'balance':
            // TODO: Implement actual token balance checking
            // This would check if user has minimum balance of the token
            isVerified = await this.checkTokenBalance(walletAddress, requirement);
            break;
          
          case 'holder':
            // TODO: Implement holder verification (any amount > 0)
            isVerified = await this.checkTokenHolder(walletAddress, requirement);
            break;
          
          case 'specific_nft':
            // TODO: Implement specific NFT verification
            isVerified = await this.checkSpecificNFT(walletAddress, requirement);
            break;
        }

        if (isVerified) {
          verifiedRequirements.push(requirement);
        } else {
          failedRequirements.push(requirement);
        }
      } catch (error) {
        console.error('Error verifying requirement:', error);
        failedRequirements.push(requirement);
      }
    }

    return {
      verified: verifiedRequirements.length === requirements.length,
      verifiedRequirements,
      failedRequirements
    };
  }

  /**
   * Check token balance
   */
  private async checkTokenBalance(walletAddress: string, requirement: TokenRequirement): Promise<boolean> {
    // TODO: Implement actual token balance checking
    // This would use Solana RPC to check token account balance
    console.log('Checking token balance:', { walletAddress, requirement });
    return Math.random() > 0.5; // Mock implementation
  }

  /**
   * Check if user holds any amount of token
   */
  private async checkTokenHolder(walletAddress: string, requirement: TokenRequirement): Promise<boolean> {
    // TODO: Implement holder verification
    console.log('Checking token holder:', { walletAddress, requirement });
    return Math.random() > 0.3; // Mock implementation
  }

  /**
   * Check specific NFT ownership
   */
  private async checkSpecificNFT(walletAddress: string, requirement: TokenRequirement): Promise<boolean> {
    // TODO: Implement specific NFT verification
    console.log('Checking specific NFT:', { walletAddress, requirement });
    return Math.random() > 0.7; // Mock implementation
  }

  /**
   * Determine user's tier eligibility
   */
  async determineTierEligibility(
    socialProfile: SocialProfile,
    walletAddress: string
  ): Promise<{
    eligibleTiers: TierConfig[];
    highestTier: TierConfig | null;
    verificationResults: Record<string, any>;
  }> {
    const allTiers = this.getDefaultTiers();
    const eligibleTiers: TierConfig[] = [];
    
    for (const tier of allTiers) {
      if (!tier.isActive) continue;

      // Check social requirements
      const socialEligible = this.checkSocialRequirements(socialProfile, tier.socialRequirements);
      
      // Check token requirements
      const tokenVerification = await this.verifyTokenHoldings(walletAddress, tier.tokenRequirements);
      
      if (socialEligible && tokenVerification.verified) {
        eligibleTiers.push(tier);
      }
    }

    // Sort by tier level (higher tiers first)
    eligibleTiers.sort((a, b) => {
      const tierOrder = ['whale', 'diamond', 'gold', 'silver', 'bronze', 'free'];
      return tierOrder.indexOf(a.id) - tierOrder.indexOf(b.id);
    });

    return {
      eligibleTiers,
      highestTier: eligibleTiers[0] || null,
      verificationResults: {
        socialProfile,
        tokenVerification: await this.verifyTokenHoldings(walletAddress, allTiers.flatMap(t => t.tokenRequirements))
      }
    };
  }

  /**
   * Check social requirements
   */
  private checkSocialRequirements(
    socialProfile: SocialProfile,
    requirements: TierConfig['socialRequirements']
  ): boolean {
    // Check minimum social score
    if (requirements.minSocialScore && socialProfile.totalSocialScore < requirements.minSocialScore) {
      return false;
    }

    // Check required platforms
    if (requirements.requiredPlatforms) {
      for (const platform of requirements.requiredPlatforms) {
        if (!socialProfile.socialAccounts[platform as keyof typeof socialProfile.socialAccounts]?.connected) {
          return false;
        }
      }
    }

    // Check verification requirement
    if (requirements.verifiedOnly) {
      const hasVerifiedAccount = Object.values(socialProfile.socialAccounts).some(
        account => account && 'verified' in account && account.verified
      );
      if (!hasVerifiedAccount) return false;
    }

    return true;
  }

  /**
   * Generate whitelist based on tier system
   */
  async generateWhitelist(
    tiers: TierConfig[],
    participants: SocialProfile[]
  ): Promise<WhitelistTier[]> {
    const whitelistTiers: WhitelistTier[] = [];

    for (const tier of tiers) {
      const tierParticipants: string[] = [];

      for (const participant of participants) {
        const eligibility = await this.determineTierEligibility(participant, participant.walletAddress);
        
        if (eligibility.eligibleTiers.some(t => t.id === tier.id)) {
          tierParticipants.push(participant.walletAddress);
        }
      }

      whitelistTiers.push({
        tierId: tier.id,
        tierName: tier.name,
        tierColor: tier.color,
        participants: tierParticipants,
        requirements: {
          social: tier.socialRequirements,
          tokens: tier.tokenRequirements
        },
        mintPrice: tier.mintPrice,
        maxMints: tier.maxMints,
        remainingMints: tier.maxMints,
        isActive: tier.isActive
      });
    }

    return whitelistTiers;
  }

  /**
   * Get tier pricing range
   */
  getTierPricingRange(tiers: TierConfig[]): {
    minPrice: number;
    maxPrice: number;
    priceRange: number;
  } {
    const prices = tiers.map(t => t.mintPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      minPrice,
      maxPrice,
      priceRange: maxPrice - minPrice
    };
  }
}

export const tierSystemService = new TierSystemService();
