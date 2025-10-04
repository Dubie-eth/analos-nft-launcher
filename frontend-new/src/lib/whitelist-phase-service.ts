/**
 * Whitelist Phase Service - Manages hardcoded mint limits per phase
 */

export interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number; // 0 = free, 0.001 = 0.1% of base price, 1 = full price
  maxMintsPerWallet: number; // Hardcoded limit per phase
  description: string;
  requirements: {
    tokenMint?: string; // Token required for this phase
    minBalance?: number; // Minimum token balance required
    tokenSymbol?: string; // Display symbol for the token
  };
}

export class WhitelistPhaseService {
  // Hardcoded whitelist phases for The LosBros collection
  private readonly WHITELIST_PHASES: WhitelistPhase[] = [
    {
      id: 'phase_1_ogs',
      name: 'OGs Phase',
      enabled: true,
      startDate: '2025-10-03T11:11:00Z',
      endDate: '2025-10-03T23:11:00Z',
      priceMultiplier: 0.001, // 0.1% of base price = 4.20069 $LOS
      maxMintsPerWallet: 2, // HARDCODED: Max 2 mints per wallet
      description: 'Early supporters with 1M+ $LOL tokens',
      requirements: {
        tokenMint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
        minBalance: 1000000, // 1,000,000 $LOL tokens
        tokenSymbol: '$LOL'
      }
    },
    {
      id: 'phase_2_holders',
      name: 'Holders Phase',
      enabled: false, // Will be enabled after OGs phase
      startDate: '2025-10-04T00:00:00Z',
      endDate: '2025-10-04T12:00:00Z',
      priceMultiplier: 0.5, // 50% of base price = 2100.345 $LOS
      maxMintsPerWallet: 5, // HARDCODED: Max 5 mints per wallet
      description: 'All $LOL token holders',
      requirements: {
        tokenMint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
        minBalance: 100000, // 100,000 $LOL tokens
        tokenSymbol: '$LOL'
      }
    },
    {
      id: 'phase_3_public',
      name: 'Public Phase',
      enabled: false, // Will be enabled after Holders phase
      startDate: '2025-10-04T12:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      priceMultiplier: 1.0, // Full price = 4200.69 $LOS
      maxMintsPerWallet: 10, // HARDCODED: Max 10 mints per wallet
      description: 'Public minting for everyone',
      requirements: {} // No requirements for public phase
    }
  ];

  /**
   * Get the currently active whitelist phase
   */
  getCurrentActivePhase(): WhitelistPhase | null {
    const now = new Date();
    
    for (const phase of this.WHITELIST_PHASES) {
      if (!phase.enabled) continue;
      
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      
      if (now >= startDate && now <= endDate) {
        return phase;
      }
    }
    
    return null;
  }

  /**
   * Get all phases (for admin display)
   */
  getAllPhases(): WhitelistPhase[] {
    return this.WHITELIST_PHASES;
  }

  /**
   * Check if a wallet is eligible for a specific phase
   */
  async checkWalletEligibility(
    walletAddress: string, 
    phase: WhitelistPhase,
    tokenBalance?: number
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    currentBalance?: number;
  }> {
    // Public phase has no requirements
    if (phase.id === 'phase_3_public') {
      return { isEligible: true };
    }

    // Check token balance requirements
    if (phase.requirements.tokenMint && phase.requirements.minBalance) {
      let balance = tokenBalance;
      
      // If balance not provided, try to fetch it
      if (balance === undefined) {
        try {
          // Import the LOL balance checker to get real balance
          const { LOLBalanceChecker } = await import('@/lib/lol-balance-checker');
          const balanceChecker = new LOLBalanceChecker();
          const balanceInfo = await balanceChecker.checkLOLBalance(walletAddress);
          balance = balanceInfo.balance || 0;
        } catch (error) {
          console.error('Error fetching token balance:', error);
          balance = 0;
        }
      }
      
      if (balance < phase.requirements.minBalance) {
        return {
          isEligible: false,
          reason: `You need at least ${phase.requirements.minBalance.toLocaleString()} ${phase.requirements.tokenSymbol} tokens`,
          currentBalance: balance
        };
      }
    }

    return { isEligible: true, currentBalance: tokenBalance };
  }

  /**
   * Get the effective price for a phase
   */
  getEffectivePrice(basePrice: number, phase: WhitelistPhase): number {
    return basePrice * phase.priceMultiplier;
  }

  /**
   * Check how many mints a wallet has left in the current phase
   */
  async getRemainingMints(
    walletAddress: string,
    phase: WhitelistPhase
  ): Promise<{
    remaining: number;
    used: number;
    maxAllowed: number;
  }> {
    // TODO: This should check actual minted NFTs from blockchain
    // For now, return the full allowance (this will be updated with real data)
    return {
      remaining: phase.maxMintsPerWallet,
      used: 0,
      maxAllowed: phase.maxMintsPerWallet
    };
  }

  /**
   * Get phase information for display
   */
  getPhaseDisplayInfo(phase: WhitelistPhase, basePrice: number) {
    const effectivePrice = this.getEffectivePrice(basePrice, phase);
    
    return {
      phaseName: phase.name,
      description: phase.description,
      maxMints: phase.maxMintsPerWallet,
      basePrice: basePrice,
      effectivePrice: effectivePrice,
      priceMultiplier: phase.priceMultiplier,
      savings: basePrice - effectivePrice,
      requirements: phase.requirements
    };
  }
}

// Export singleton instance
export const whitelistPhaseService = new WhitelistPhaseService();
