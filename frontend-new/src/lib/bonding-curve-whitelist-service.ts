/**
 * Bonding Curve Whitelist Service
 * Manages whitelist phases for bonding curve collections
 * Supports token holder benefits, early access tiers, and social verification
 */

import { socialVerificationService } from './social-verification-service';

export interface BondingCurveWhitelistPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  
  // Token holder requirements
  tokenRequirements: {
    tokenAddress: string; // Token contract address (e.g., $LOL)
    minimumBalance: number; // Minimum token balance required
    tokenSymbol: string; // Token symbol for display
    tokenDecimals: number; // Token decimals
  };
  
  // Social verification requirements
  socialRequirements: {
    required: boolean; // Whether social verification is required
    minimumScore: number; // Minimum social verification score
    requiredPlatforms: string[]; // Required social platforms (twitter, telegram, discord)
    bonusMultiplier: number; // Bonus multiplier for social verification
  };
  
  // Bonding curve benefits
  bondingCurveBenefits: {
    priceMultiplier: number; // Price multiplier (0.5 = 50% off, 1.0 = full price)
    maxMints: number; // Maximum NFTs that can be minted in this phase
    maxMintsPerWallet: number; // Maximum mints per wallet
    priorityAccess: boolean; // Gets priority over public phase
    skipQueue: boolean; // Skip any queue system
  };
  
  // Phase statistics
  statistics: {
    totalEligibleWallets: number;
    totalMinted: number;
    remainingMints: number;
    totalVolume: number;
    averageMintSize: number;
  };
}

export interface BondingCurveWhitelistConfig {
  collectionId: string;
  collectionName: string;
  phases: BondingCurveWhitelistPhase[];
  globalSettings: {
    allowPublicPhase: boolean; // Allow public phase after whitelist phases
    publicPhasePriceMultiplier: number; // Public phase price (1.0 = full price)
    maxPublicMints: number; // Maximum public phase mints
    bondingCurveCap: number; // Total bonding curve cap
  };
}

export class BondingCurveWhitelistService {
  private whitelistConfigs: Map<string, BondingCurveWhitelistConfig> = new Map();
  private walletBalances: Map<string, Map<string, number>> = new Map(); // wallet -> tokenAddress -> balance

  constructor() {
    this.initializeDefaultConfigs();
    console.log('🎯 Bonding Curve Whitelist Service initialized');
  }

  /**
   * Initialize default whitelist configurations
   */
  private initializeDefaultConfigs(): void {
    // The LosBros bonding curve whitelist configuration
    const losBrosConfig: BondingCurveWhitelistConfig = {
      collectionId: 'collection_the_losbros',
      collectionName: 'The LosBros',
      phases: [
        {
          id: 'whale_phase',
          name: '🐋 Whale Phase',
          description: 'Ultra-early access for 10M+ $LOL holders',
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
          isActive: true,
          isUpcoming: false,
          isCompleted: false,
          tokenRequirements: {
            tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // $LOL token
            minimumBalance: 10000000, // 10M $LOL
            tokenSymbol: '$LOL',
            tokenDecimals: 9
          },
          socialRequirements: {
            required: true, // Social verification required for whale phase
            minimumScore: 1000, // High social score required
            requiredPlatforms: ['twitter'], // Must have verified Twitter
            bonusMultiplier: 1.5 // 50% bonus for social verification
          },
          bondingCurveBenefits: {
            priceMultiplier: 0.3, // 70% off - super early pricing
            maxMints: 200, // Only 200 NFTs for whales
            maxMintsPerWallet: 5, // Max 5 per whale wallet
            priorityAccess: true,
            skipQueue: true
          },
          statistics: {
            totalEligibleWallets: 8,
            totalMinted: 23,
            remainingMints: 177,
            totalVolume: 12500,
            averageMintSize: 2.8
          }
        },
        {
          id: 'diamond_phase',
          name: '💎 Diamond Phase',
          description: 'Early access for 5M+ $LOL holders',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Starts in 3 days
          endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          tokenRequirements: {
            tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
            minimumBalance: 5000000, // 5M $LOL
            tokenSymbol: '$LOL',
            tokenDecimals: 9
          },
          socialRequirements: {
            required: true,
            minimumScore: 500,
            requiredPlatforms: ['twitter'],
            bonusMultiplier: 1.3
          },
          bondingCurveBenefits: {
            priceMultiplier: 0.5, // 50% off - early pricing
            maxMints: 400, // 400 NFTs for diamond holders
            maxMintsPerWallet: 3, // Max 3 per diamond wallet
            priorityAccess: true,
            skipQueue: false
          },
          statistics: {
            totalEligibleWallets: 0,
            totalMinted: 0,
            remainingMints: 400,
            totalVolume: 0,
            averageMintSize: 0
          }
        },
        {
          id: 'gold_phase',
          name: '🥇 Gold Phase',
          description: 'Priority access for 1M+ $LOL holders',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 7 days
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Ends in 10 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          tokenRequirements: {
            tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
            minimumBalance: 1000000, // 1M $LOL
            tokenSymbol: '$LOL',
            tokenDecimals: 9
          },
          socialRequirements: {
            required: true,
            minimumScore: 200,
            requiredPlatforms: ['twitter', 'telegram'],
            bonusMultiplier: 1.2
          },
          bondingCurveBenefits: {
            priceMultiplier: 0.7, // 30% off - good pricing
            maxMints: 600, // 600 NFTs for gold holders
            maxMintsPerWallet: 2, // Max 2 per gold wallet
            priorityAccess: false,
            skipQueue: false
          },
          statistics: {
            totalEligibleWallets: 0,
            totalMinted: 0,
            remainingMints: 600,
            totalVolume: 0,
            averageMintSize: 0
          }
        },
        {
          id: 'silver_phase',
          name: '🥈 Silver Phase',
          description: 'Early access for 100K+ $LOL holders',
          startDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // Starts in 11 days
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Ends in 14 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          tokenRequirements: {
            tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
            minimumBalance: 100000, // 100K $LOL
            tokenSymbol: '$LOL',
            tokenDecimals: 9
          },
          socialRequirements: {
            required: false, // Optional for silver phase
            minimumScore: 100,
            requiredPlatforms: [],
            bonusMultiplier: 1.1
          },
          bondingCurveBenefits: {
            priceMultiplier: 0.85, // 15% off - decent pricing
            maxMints: 800, // 800 NFTs for silver holders
            maxMintsPerWallet: 1, // Max 1 per silver wallet
            priorityAccess: false,
            skipQueue: false
          },
          statistics: {
            totalEligibleWallets: 0,
            totalMinted: 0,
            remainingMints: 800,
            totalVolume: 0,
            averageMintSize: 0
          }
        }
      ],
      globalSettings: {
        allowPublicPhase: true,
        publicPhasePriceMultiplier: 1.0, // Full price for public
        maxPublicMints: 222, // Remaining NFTs for public
        bondingCurveCap: 50000 // 50K $LOS bonding curve cap
      }
    };

    this.whitelistConfigs.set('collection_the_losbros', losBrosConfig);
    console.log('✅ Default bonding curve whitelist configs initialized');
  }

  /**
   * Get whitelist configuration for a collection
   */
  getWhitelistConfig(collectionId: string): BondingCurveWhitelistConfig | null {
    return this.whitelistConfigs.get(collectionId) || null;
  }

  /**
   * Check if wallet is eligible for bonding curve whitelist phase
   */
  async checkWalletEligibility(
    collectionId: string,
    walletAddress: string,
    phaseId?: string
  ): Promise<{
    eligible: boolean;
    eligiblePhases: BondingCurveWhitelistPhase[];
    currentPhase: BondingCurveWhitelistPhase | null;
    reason?: string;
    socialVerification?: {
      score: number;
      required: boolean;
      platforms: string[];
      bonus: number;
    };
  }> {
    const config = this.whitelistConfigs.get(collectionId);
    if (!config) {
      return {
        eligible: false,
        eligiblePhases: [],
        currentPhase: null,
        reason: 'Collection not found'
      };
    }

    const eligiblePhases: BondingCurveWhitelistPhase[] = [];
    let currentPhase: BondingCurveWhitelistPhase | null = null;
    const now = Date.now();

    for (const phase of config.phases) {
      const phaseStart = phase.startDate.getTime();
      const phaseEnd = phase.endDate.getTime();

      // Check if phase is currently active
      if (now >= phaseStart && now <= phaseEnd) {
        currentPhase = phase;
      }

      // Check token balance eligibility
      const balance = await this.getTokenBalance(walletAddress, phase.tokenRequirements.tokenAddress);
      const requiredBalance = phase.tokenRequirements.minimumBalance;

      // Check social verification eligibility
      const socialEligibility = socialVerificationService.checkWhitelistEligibility(
        walletAddress, 
        phase.socialRequirements.minimumScore
      );

      if (balance >= requiredBalance) {
        // Check social requirements
        if (phase.socialRequirements.required && !socialEligibility.eligible) {
          continue; // Skip this phase if social verification required but not met
        }
        
        eligiblePhases.push(phase);
      }
    }

    // If specific phase requested, check only that phase
    if (phaseId) {
      const phase = config.phases.find(p => p.id === phaseId);
      if (!phase) {
        return {
          eligible: false,
          eligiblePhases: [],
          currentPhase: null,
          reason: 'Phase not found'
        };
      }

      const balance = await this.getTokenBalance(walletAddress, phase.tokenRequirements.tokenAddress);
      const eligible = balance >= phase.tokenRequirements.minimumBalance;
      
      return {
        eligible,
        eligiblePhases: eligible ? [phase] : [],
        currentPhase: phase.isActive ? phase : null,
        reason: eligible ? undefined : `Insufficient ${phase.tokenRequirements.tokenSymbol} balance`
      };
    }

    // Get social verification data for current phase
    let socialVerification;
    if (currentPhase) {
      const socialEligibility = socialVerificationService.checkWhitelistEligibility(
        walletAddress,
        currentPhase.socialRequirements.minimumScore
      );
      
      socialVerification = {
        score: socialEligibility.currentScore,
        required: currentPhase.socialRequirements.required,
        platforms: currentPhase.socialRequirements.requiredPlatforms,
        bonus: currentPhase.socialRequirements.bonusMultiplier
      };
    }

    return {
      eligible: eligiblePhases.length > 0,
      eligiblePhases,
      currentPhase,
      reason: eligiblePhases.length === 0 ? 'No eligible phases' : undefined,
      socialVerification
    };
  }

  /**
   * Get current active phase for a collection
   */
  getCurrentActivePhase(collectionId: string): BondingCurveWhitelistPhase | null {
    const config = this.whitelistConfigs.get(collectionId);
    if (!config) return null;

    const now = Date.now();
    return config.phases.find(phase => {
      const phaseStart = phase.startDate.getTime();
      const phaseEnd = phase.endDate.getTime();
      return now >= phaseStart && now <= phaseEnd;
    }) || null;
  }

  /**
   * Get bonding curve price with whitelist multiplier
   */
  getBondingCurvePrice(
    collectionId: string,
    basePrice: number,
    walletAddress: string
  ): {
    price: number;
    multiplier: number;
    phase: BondingCurveWhitelistPhase | null;
    isWhitelistActive: boolean;
  } {
    const eligibility = this.checkWalletEligibility(collectionId, walletAddress);
    const currentPhase = this.getCurrentActivePhase(collectionId);

    if (currentPhase && eligibility.eligible) {
      const multiplier = currentPhase.bondingCurveBenefits.priceMultiplier;
      return {
        price: basePrice * multiplier,
        multiplier,
        phase: currentPhase,
        isWhitelistActive: true
      };
    }

    // Check if public phase is allowed
    const config = this.whitelistConfigs.get(collectionId);
    const publicMultiplier = config?.globalSettings.publicPhasePriceMultiplier || 1.0;

    return {
      price: basePrice * publicMultiplier,
      multiplier: publicMultiplier,
      phase: null,
      isWhitelistActive: false
    };
  }

  /**
   * Record a mint in a whitelist phase
   */
  recordMint(
    collectionId: string,
    phaseId: string,
    walletAddress: string,
    amount: number,
    value: number
  ): boolean {
    const config = this.whitelistConfigs.get(collectionId);
    if (!config) return false;

    const phase = config.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    // Update phase statistics
    phase.statistics.totalMinted += amount;
    phase.statistics.remainingMints = Math.max(0, phase.statistics.remainingMints - amount);
    phase.statistics.totalVolume += value;
    phase.statistics.averageMintSize = phase.statistics.totalMinted > 0 
      ? phase.statistics.totalMinted / (phase.statistics.totalMints || 1)
      : 0;

    console.log(`📊 Recorded mint in ${phase.name}: ${amount} NFTs, $${value}`);
    return true;
  }

  /**
   * Get token balance (mock implementation - replace with real blockchain call)
   */
  private async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<number> {
    // Mock implementation - replace with actual blockchain call
    const mockBalances: Record<string, Record<string, number>> = {
      '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 15000000 // 15M $LOL
      },
      'test_wallet_1': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 7000000 // 7M $LOL
      },
      'test_wallet_2': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 2000000 // 2M $LOL
      }
    };

    return mockBalances[walletAddress]?.[tokenAddress] || 0;
  }

  /**
   * Update whitelist configuration (admin function)
   */
  updateWhitelistConfig(
    collectionId: string,
    updates: Partial<BondingCurveWhitelistConfig>
  ): boolean {
    const config = this.whitelistConfigs.get(collectionId);
    if (!config) return false;

    // Update configuration
    Object.assign(config, updates);
    this.whitelistConfigs.set(collectionId, config);
    
    console.log(`✅ Updated whitelist config for ${collectionId}`);
    return true;
  }

  /**
   * Add new whitelist phase
   */
  addWhitelistPhase(
    collectionId: string,
    phase: Omit<BondingCurveWhitelistPhase, 'statistics'>
  ): boolean {
    const config = this.whitelistConfigs.get(collectionId);
    if (!config) return false;

    const newPhase: BondingCurveWhitelistPhase = {
      ...phase,
      statistics: {
        totalEligibleWallets: 0,
        totalMinted: 0,
        remainingMints: phase.bondingCurveBenefits.maxMints,
        totalVolume: 0,
        averageMintSize: 0
      }
    };

    config.phases.push(newPhase);
    console.log(`✅ Added new whitelist phase: ${phase.name}`);
    return true;
  }

  /**
   * Get all whitelist configurations (master admin view)
   */
  getAllWhitelistConfigs(): BondingCurveWhitelistConfig[] {
    return Array.from(this.whitelistConfigs.values());
  }

  /**
   * Get whitelist statistics across all collections
   */
  getGlobalWhitelistStats(): {
    totalCollections: number;
    totalActivePhases: number;
    totalUpcomingPhases: number;
    totalCompletedPhases: number;
    totalMinted: number;
    totalVolume: number;
    totalEligibleWallets: number;
  } {
    let totalActivePhases = 0;
    let totalUpcomingPhases = 0;
    let totalCompletedPhases = 0;
    let totalMinted = 0;
    let totalVolume = 0;
    let totalEligibleWallets = 0;

    for (const config of this.whitelistConfigs.values()) {
      for (const phase of config.phases) {
        if (phase.isActive) totalActivePhases++;
        if (phase.isUpcoming) totalUpcomingPhases++;
        if (phase.isCompleted) totalCompletedPhases++;
        
        totalMinted += phase.statistics.totalMinted;
        totalVolume += phase.statistics.totalVolume;
        totalEligibleWallets += phase.statistics.totalEligibleWallets;
      }
    }

    return {
      totalCollections: this.whitelistConfigs.size,
      totalActivePhases,
      totalUpcomingPhases,
      totalCompletedPhases,
      totalMinted,
      totalVolume,
      totalEligibleWallets
    };
  }
}

export const bondingCurveWhitelistService = new BondingCurveWhitelistService();
