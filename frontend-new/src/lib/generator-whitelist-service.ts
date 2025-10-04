/**
 * Generator Whitelist Service
 * Manages whitelist opportunities and access control for NFT generator
 * Integrates with existing whitelist systems and social verification
 */

import { whitelistPhaseService, WhitelistPhase } from './whitelist-phase-service';
import { bondingCurveWhitelistService, BondingCurveWhitelistPhase } from './bonding-curve-whitelist-service';
import { socialVerificationService, SocialAccount } from './social-verification-service';

export interface GeneratorWhitelistPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  
  // Access requirements
  requirements: {
    tokenHoldings?: {
      tokenAddress: string;
      tokenSymbol: string;
      minimumBalance: number;
      tokenDecimals: number;
    };
    socialVerification?: {
      required: boolean;
      minimumScore: number;
      requiredPlatforms: string[];
      bonusMultiplier: number;
    };
    manualWhitelist?: {
      walletAddresses: string[];
      maxWallets: number;
    };
  };
  
  // Generator access benefits
  benefits: {
    maxCollectionsPerWallet: number;
    priorityAccess: boolean;
    skipQueue: boolean;
    advancedFeatures: boolean; // Access to advanced collection features
    customPricing: boolean; // Access to custom pricing tiers
    earlyDeployment: boolean; // Can deploy before public
  };
  
  // Statistics
  statistics: {
    totalEligibleWallets: number;
    totalCollectionsCreated: number;
    remainingSlots: number;
    totalVolume: number;
  };
}

export interface GeneratorAccessConfig {
  generatorEnabled: boolean;
  publicAccess: boolean;
  whitelistOnly: boolean;
  maxPublicCollections: number;
  whitelistPhases: GeneratorWhitelistPhase[];
  globalSettings: {
    maxCollectionsPerWallet: number;
    defaultCollectionLimit: number;
    emergencyShutdown: boolean;
    maintenanceMode: boolean;
  };
}

export class GeneratorWhitelistService {
  private accessConfig: GeneratorAccessConfig;
  private createdCollections: Map<string, { wallet: string; timestamp: Date; collectionId: string }[]> = new Map();

  constructor() {
    this.accessConfig = this.getDefaultConfig();
    console.log('🎯 Generator Whitelist Service initialized');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): GeneratorAccessConfig {
    return {
      generatorEnabled: false, // Start disabled for security
      publicAccess: false,
      whitelistOnly: true,
      maxPublicCollections: 0,
      whitelistPhases: [
        {
          id: 'vip_creators',
          name: '🎨 VIP Creators',
          description: 'Premium creators with verified social presence and token holdings',
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
          isUpcoming: false,
          isCompleted: false,
          requirements: {
            tokenHoldings: {
              tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', // $LOL
              tokenSymbol: '$LOL',
              minimumBalance: 5000000, // 5M $LOL
              tokenDecimals: 9
            },
            socialVerification: {
              required: true,
              minimumScore: 1000,
              requiredPlatforms: ['twitter'],
              bonusMultiplier: 1.5
            }
          },
          benefits: {
            maxCollectionsPerWallet: 5,
            priorityAccess: true,
            skipQueue: true,
            advancedFeatures: true,
            customPricing: true,
            earlyDeployment: true
          },
          statistics: {
            totalEligibleWallets: 12,
            totalCollectionsCreated: 3,
            remainingSlots: 57,
            totalVolume: 15000
          }
        },
        {
          id: 'verified_creators',
          name: '✅ Verified Creators',
          description: 'Verified creators with moderate token holdings',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 7 days
          endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), // 37 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          requirements: {
            tokenHoldings: {
              tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
              tokenSymbol: '$LOL',
              minimumBalance: 1000000, // 1M $LOL
              tokenDecimals: 9
            },
            socialVerification: {
              required: true,
              minimumScore: 500,
              requiredPlatforms: ['twitter', 'telegram'],
              bonusMultiplier: 1.3
            }
          },
          benefits: {
            maxCollectionsPerWallet: 3,
            priorityAccess: true,
            skipQueue: false,
            advancedFeatures: true,
            customPricing: false,
            earlyDeployment: false
          },
          statistics: {
            totalEligibleWallets: 0,
            totalCollectionsCreated: 0,
            remainingSlots: 300,
            totalVolume: 0
          }
        },
        {
          id: 'early_adopters',
          name: '🚀 Early Adopters',
          description: 'Early supporters with basic token holdings',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Starts in 14 days
          endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000), // 44 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          requirements: {
            tokenHoldings: {
              tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
              tokenSymbol: '$LOL',
              minimumBalance: 100000, // 100K $LOL
              tokenDecimals: 9
            },
            socialVerification: {
              required: false,
              minimumScore: 200,
              requiredPlatforms: [],
              bonusMultiplier: 1.1
            }
          },
          benefits: {
            maxCollectionsPerWallet: 2,
            priorityAccess: false,
            skipQueue: false,
            advancedFeatures: false,
            customPricing: false,
            earlyDeployment: false
          },
          statistics: {
            totalEligibleWallets: 0,
            totalCollectionsCreated: 0,
            remainingSlots: 1000,
            totalVolume: 0
          }
        },
        {
          id: 'manual_whitelist',
          name: '👑 Manual Whitelist',
          description: 'Manually approved creators and partners',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isActive: true,
          isUpcoming: false,
          isCompleted: false,
          requirements: {
            manualWhitelist: {
              walletAddresses: [
                '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Admin wallet
                'test_wallet_partner_1',
                'test_wallet_partner_2'
              ],
              maxWallets: 50
            }
          },
          benefits: {
            maxCollectionsPerWallet: 10,
            priorityAccess: true,
            skipQueue: true,
            advancedFeatures: true,
            customPricing: true,
            earlyDeployment: true
          },
          statistics: {
            totalEligibleWallets: 3,
            totalCollectionsCreated: 1,
            remainingSlots: 49,
            totalVolume: 5000
          }
        }
      ],
      globalSettings: {
        maxCollectionsPerWallet: 1,
        defaultCollectionLimit: 100,
        emergencyShutdown: false,
        maintenanceMode: false
      }
    };
  }

  /**
   * Check if wallet has access to generator
   */
  async checkGeneratorAccess(walletAddress: string): Promise<{
    hasAccess: boolean;
    eligiblePhases: GeneratorWhitelistPhase[];
    currentPhase: GeneratorWhitelistPhase | null;
    accessLevel: 'none' | 'basic' | 'premium' | 'vip';
    reason?: string;
    remainingCollections: number;
    socialVerification?: {
      score: number;
      accounts: SocialAccount[];
      eligible: boolean;
    };
  }> {
    // Check if generator is enabled
    if (!this.accessConfig.generatorEnabled) {
      return {
        hasAccess: false,
        eligiblePhases: [],
        currentPhase: null,
        accessLevel: 'none',
        reason: 'Generator is currently disabled',
        remainingCollections: 0
      };
    }

    // Check for emergency shutdown
    if (this.accessConfig.globalSettings.emergencyShutdown) {
      return {
        hasAccess: false,
        eligiblePhases: [],
        currentPhase: null,
        accessLevel: 'none',
        reason: 'Generator is in emergency shutdown mode',
        remainingCollections: 0
      };
    }

    // Check for maintenance mode
    if (this.accessConfig.globalSettings.maintenanceMode) {
      return {
        hasAccess: false,
        eligiblePhases: [],
        currentPhase: null,
        accessLevel: 'none',
        reason: 'Generator is in maintenance mode',
        remainingCollections: 0
      };
    }

    // Check public access
    if (this.accessConfig.publicAccess && !this.accessConfig.whitelistOnly) {
      const remainingCollections = await this.getRemainingCollections(walletAddress);
      return {
        hasAccess: true,
        eligiblePhases: [],
        currentPhase: null,
        accessLevel: 'basic',
        remainingCollections
      };
    }

    // Check whitelist phases
    const eligiblePhases: GeneratorWhitelistPhase[] = [];
    let currentPhase: GeneratorWhitelistPhase | null = null;
    const now = Date.now();

    for (const phase of this.accessConfig.whitelistPhases) {
      const phaseStart = phase.startDate.getTime();
      const phaseEnd = phase.endDate.getTime();

      // Check if phase is currently active
      if (now >= phaseStart && now <= phaseEnd && phase.isActive) {
        currentPhase = phase;
      }

      // Check eligibility for this phase
      const isEligible = await this.checkPhaseEligibility(walletAddress, phase);
      if (isEligible) {
        eligiblePhases.push(phase);
      }
    }

    // Determine access level
    let accessLevel: 'none' | 'basic' | 'premium' | 'vip' = 'none';
    if (eligiblePhases.length > 0) {
      const highestPhase = eligiblePhases.reduce((highest, current) => {
        const highestBenefits = highest.benefits.maxCollectionsPerWallet;
        const currentBenefits = current.benefits.maxCollectionsPerWallet;
        return currentBenefits > highestBenefits ? current : highest;
      });
      
      if (highestPhase.benefits.maxCollectionsPerWallet >= 5) accessLevel = 'vip';
      else if (highestPhase.benefits.maxCollectionsPerWallet >= 3) accessLevel = 'premium';
      else accessLevel = 'basic';
    }

    // Get social verification data
    const socialVerification = await this.getSocialVerificationData(walletAddress);

    // Get remaining collections
    const remainingCollections = await this.getRemainingCollections(walletAddress);

    return {
      hasAccess: eligiblePhases.length > 0,
      eligiblePhases,
      currentPhase,
      accessLevel,
      reason: eligiblePhases.length === 0 ? 'No eligible whitelist phases' : undefined,
      remainingCollections,
      socialVerification
    };
  }

  /**
   * Check eligibility for a specific phase
   */
  private async checkPhaseEligibility(
    walletAddress: string, 
    phase: GeneratorWhitelistPhase
  ): Promise<boolean> {
    // Check manual whitelist
    if (phase.requirements.manualWhitelist) {
      return phase.requirements.manualWhitelist.walletAddresses.includes(walletAddress);
    }

    // Check token holdings
    if (phase.requirements.tokenHoldings) {
      const balance = await this.getTokenBalance(
        walletAddress, 
        phase.requirements.tokenHoldings.tokenAddress
      );
      
      if (balance < phase.requirements.tokenHoldings.minimumBalance) {
        return false;
      }
    }

    // Check social verification
    if (phase.requirements.socialVerification?.required) {
      const socialEligibility = socialVerificationService.checkWhitelistEligibility(
        walletAddress,
        phase.requirements.socialVerification.minimumScore
      );
      
      if (!socialEligibility.eligible) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get social verification data for wallet
   */
  private async getSocialVerificationData(walletAddress: string) {
    const accounts = socialVerificationService.getWalletSocialAccounts(walletAddress);
    const eligibility = socialVerificationService.checkWhitelistEligibility(walletAddress);
    
    return {
      score: eligibility.currentScore,
      accounts: accounts.filter(a => a.verificationStatus === 'verified'),
      eligible: eligibility.eligible
    };
  }

  /**
   * Get remaining collections for wallet
   */
  private async getRemainingCollections(walletAddress: string): Promise<number> {
    const created = this.createdCollections.get(walletAddress) || [];
    const accessInfo = await this.checkGeneratorAccess(walletAddress);
    
    if (!accessInfo.hasAccess) return 0;
    
    const maxCollections = accessInfo.eligiblePhases.reduce((max, phase) => {
      return Math.max(max, phase.benefits.maxCollectionsPerWallet);
    }, this.accessConfig.globalSettings.maxCollectionsPerWallet);
    
    return Math.max(0, maxCollections - created.length);
  }

  /**
   * Record collection creation
   */
  recordCollectionCreation(walletAddress: string, collectionId: string): boolean {
    const created = this.createdCollections.get(walletAddress) || [];
    created.push({
      wallet: walletAddress,
      timestamp: new Date(),
      collectionId
    });
    
    this.createdCollections.set(walletAddress, created);
    
    // Update phase statistics
    for (const phase of this.accessConfig.whitelistPhases) {
      if (phase.isActive) {
        phase.statistics.totalCollectionsCreated++;
        phase.statistics.remainingSlots = Math.max(0, phase.statistics.remainingSlots - 1);
      }
    }
    
    console.log(`📊 Recorded collection creation: ${collectionId} by ${walletAddress}`);
    return true;
  }

  /**
   * Get token balance (mock implementation)
   */
  private async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<number> {
    // Mock implementation - replace with actual blockchain call
    const mockBalances: Record<string, Record<string, number>> = {
      '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 15000000 // 15M $LOL
      },
      'test_wallet_partner_1': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 8000000 // 8M $LOL
      },
      'test_wallet_partner_2': {
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 3000000 // 3M $LOL
      }
    };

    return mockBalances[walletAddress]?.[tokenAddress] || 0;
  }

  /**
   * Update access configuration (admin function)
   */
  updateAccessConfig(updates: Partial<GeneratorAccessConfig>): boolean {
    this.accessConfig = { ...this.accessConfig, ...updates };
    console.log('✅ Generator access config updated');
    return true;
  }

  /**
   * Add wallet to manual whitelist
   */
  addToManualWhitelist(walletAddress: string, phaseId: string): boolean {
    const phase = this.accessConfig.whitelistPhases.find(p => p.id === phaseId);
    if (!phase || !phase.requirements.manualWhitelist) return false;

    if (!phase.requirements.manualWhitelist.walletAddresses.includes(walletAddress)) {
      phase.requirements.manualWhitelist.walletAddresses.push(walletAddress);
      phase.statistics.totalEligibleWallets++;
      console.log(`✅ Added ${walletAddress} to manual whitelist phase: ${phase.name}`);
      return true;
    }

    return false;
  }

  /**
   * Remove wallet from manual whitelist
   */
  removeFromManualWhitelist(walletAddress: string, phaseId: string): boolean {
    const phase = this.accessConfig.whitelistPhases.find(p => p.id === phaseId);
    if (!phase || !phase.requirements.manualWhitelist) return false;

    const index = phase.requirements.manualWhitelist.walletAddresses.indexOf(walletAddress);
    if (index > -1) {
      phase.requirements.manualWhitelist.walletAddresses.splice(index, 1);
      phase.statistics.totalEligibleWallets--;
      console.log(`✅ Removed ${walletAddress} from manual whitelist phase: ${phase.name}`);
      return true;
    }

    return false;
  }

  /**
   * Get access statistics
   */
  getAccessStatistics(): {
    totalEligibleWallets: number;
    totalCollectionsCreated: number;
    activePhases: number;
    upcomingPhases: number;
    totalVolume: number;
    accessLevels: {
      vip: number;
      premium: number;
      basic: number;
    };
  } {
    let totalEligibleWallets = 0;
    let totalCollectionsCreated = 0;
    let activePhases = 0;
    let upcomingPhases = 0;
    let totalVolume = 0;
    const accessLevels = { vip: 0, premium: 0, basic: 0 };

    for (const phase of this.accessConfig.whitelistPhases) {
      totalEligibleWallets += phase.statistics.totalEligibleWallets;
      totalCollectionsCreated += phase.statistics.totalCollectionsCreated;
      totalVolume += phase.statistics.totalVolume;

      if (phase.isActive) activePhases++;
      if (phase.isUpcoming) upcomingPhases++;

      // Count access levels (this would be more accurate with real wallet data)
      if (phase.benefits.maxCollectionsPerWallet >= 5) accessLevels.vip++;
      else if (phase.benefits.maxCollectionsPerWallet >= 3) accessLevels.premium++;
      else accessLevels.basic++;
    }

    return {
      totalEligibleWallets,
      totalCollectionsCreated,
      activePhases,
      upcomingPhases,
      totalVolume,
      accessLevels
    };
  }

  /**
   * Emergency shutdown
   */
  emergencyShutdown(): void {
    this.accessConfig.globalSettings.emergencyShutdown = true;
    console.log('🚨 Generator access emergency shutdown activated');
  }

  /**
   * Enable generator access
   */
  enableGenerator(): void {
    this.accessConfig.generatorEnabled = true;
    this.accessConfig.globalSettings.emergencyShutdown = false;
    this.accessConfig.globalSettings.maintenanceMode = false;
    console.log('✅ Generator access enabled');
  }

  /**
   * Disable generator access
   */
  disableGenerator(): void {
    this.accessConfig.generatorEnabled = false;
    console.log('❌ Generator access disabled');
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): GeneratorAccessConfig {
    return { ...this.accessConfig };
  }

  /**
   * Update a specific whitelist phase
   */
  updateWhitelistPhase(phaseId: string, updates: Partial<GeneratorWhitelistPhase>): boolean {
    const phaseIndex = this.accessConfig.whitelistPhases.findIndex(phase => phase.id === phaseId);
    if (phaseIndex === -1) return false;

    // Update the phase
    this.accessConfig.whitelistPhases[phaseIndex] = {
      ...this.accessConfig.whitelistPhases[phaseIndex],
      ...updates
    };

    console.log(`✅ Updated whitelist phase: ${phaseId}`);
    return true;
  }

  /**
   * Add a new whitelist phase
   */
  addWhitelistPhase(phase: Omit<GeneratorWhitelistPhase, 'statistics'>): boolean {
    const newPhase: GeneratorWhitelistPhase = {
      ...phase,
      statistics: {
        totalEligibleWallets: 0,
        totalCollectionsCreated: 0,
        remainingSlots: 1000, // Default remaining slots
        totalVolume: 0
      }
    };

    this.accessConfig.whitelistPhases.push(newPhase);
    console.log(`✅ Added new whitelist phase: ${phase.name}`);
    return true;
  }

  /**
   * Remove a whitelist phase
   */
  removeWhitelistPhase(phaseId: string): boolean {
    const phaseIndex = this.accessConfig.whitelistPhases.findIndex(phase => phase.id === phaseId);
    if (phaseIndex === -1) return false;

    const removedPhase = this.accessConfig.whitelistPhases[phaseIndex];
    this.accessConfig.whitelistPhases.splice(phaseIndex, 1);
    
    console.log(`✅ Removed whitelist phase: ${removedPhase.name}`);
    return true;
  }
}

export const generatorWhitelistService = new GeneratorWhitelistService();
