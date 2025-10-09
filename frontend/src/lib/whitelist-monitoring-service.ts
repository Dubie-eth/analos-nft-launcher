/**
 * Whitelist Monitoring Service
 * Tracks whitelist phases, mint progress, and provides detailed statistics
 */

export interface WhitelistPhase {
  id: string;
  name: string;
  description: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
  priceMultiplier: number;
  maxMintsPerWallet: number;
  minimumLolBalance: number;
  mintedCount: number;
  maxMints: number;
  remainingMints: number;
  eligibleWallets: number;
  totalWallets: number;
}

export interface WhitelistStats {
  totalPhases: number;
  activePhases: number;
  completedPhases: number;
  upcomingPhases: number;
  totalMinted: number;
  totalMaxMints: number;
  overallProgress: number;
  phases: WhitelistPhase[];
}

export class WhitelistMonitoringService {
  private phases: Map<string, WhitelistPhase> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    this.initializeDefaultPhases();
    console.log('📊 Whitelist Monitoring Service initialized');
  }

  /**
   * Initialize default whitelist phases
   */
  private initializeDefaultPhases(): void {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    // Holders Phase (1M+ $LOL holders)
    this.phases.set('holders', {
      id: 'holders',
      name: 'Holders Phase',
      description: 'Free mints for 1M+ $LOL holders (max 3 per wallet)',
      startDate: now - oneDay, // Started yesterday
      endDate: now + oneWeek, // Ends in a week
      isActive: true,
      priceMultiplier: 0, // Free
      maxMintsPerWallet: 3,
      minimumLolBalance: 1000000,
      mintedCount: 15, // Example: 15 mints completed
      maxMints: 100, // First 100 NFTs
      remainingMints: 85,
      eligibleWallets: 25, // Example: 25 eligible wallets
      totalWallets: 1000 // Example: 1000 total wallets checked
    });

    // Public Phase
    this.phases.set('public', {
      id: 'public',
      name: 'Public Phase',
      description: 'Public minting at full price',
      startDate: now + oneWeek, // Starts after holders phase
      endDate: now + (oneWeek * 2), // Ends in 2 weeks
      isActive: false,
      priceMultiplier: 1.0, // Full price
      maxMintsPerWallet: 10,
      minimumLolBalance: 0,
      mintedCount: 0,
      maxMints: 2222, // All remaining NFTs
      remainingMints: 2222,
      eligibleWallets: 1000, // All wallets
      totalWallets: 1000
    });

    console.log('✅ Default whitelist phases initialized:', this.phases.size);
  }

  /**
   * Get all whitelist phases with statistics
   */
  async getAllPhases(): Promise<WhitelistPhase[]> {
    const cacheKey = 'all_phases';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const phases = Array.from(this.phases.values());
    this.setCache(cacheKey, phases);
    return phases;
  }

  /**
   * Get comprehensive whitelist statistics
   */
  async getWhitelistStats(): Promise<WhitelistStats> {
    const cacheKey = 'whitelist_stats';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const phases = await this.getAllPhases();
    const now = Date.now();

    const activePhases = phases.filter(p => p.isActive && now >= p.startDate && now <= p.endDate);
    const completedPhases = phases.filter(p => now > p.endDate);
    const upcomingPhases = phases.filter(p => now < p.startDate);

    const totalMinted = phases.reduce((sum, phase) => sum + phase.mintedCount, 0);
    const totalMaxMints = phases.reduce((sum, phase) => sum + phase.maxMints, 0);
    const overallProgress = totalMaxMints > 0 ? (totalMinted / totalMaxMints) * 100 : 0;

    const stats: WhitelistStats = {
      totalPhases: phases.length,
      activePhases: activePhases.length,
      completedPhases: completedPhases.length,
      upcomingPhases: upcomingPhases.length,
      totalMinted,
      totalMaxMints,
      overallProgress,
      phases
    };

    this.setCache(cacheKey, stats);
    return stats;
  }

  /**
   * Get active phases only
   */
  async getActivePhases(): Promise<WhitelistPhase[]> {
    const phases = await this.getAllPhases();
    const now = Date.now();
    return phases.filter(p => p.isActive && now >= p.startDate && now <= p.endDate);
  }

  /**
   * Update mint count for a phase
   */
  async updateMintCount(phaseId: string, mintCount: number): Promise<boolean> {
    try {
      const phase = this.phases.get(phaseId);
      if (phase) {
        phase.mintedCount = mintCount;
        phase.remainingMints = Math.max(0, phase.maxMints - mintCount);
        
        // Clear cache to force refresh
        this.clearCache();
        
        console.log(`✅ Updated mint count for ${phase.name}: ${mintCount}/${phase.maxMints}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error updating mint count for ${phaseId}:`, error);
      return false;
    }
  }

  /**
   * Update eligible wallets count
   */
  async updateEligibleWallets(phaseId: string, eligibleCount: number, totalCount: number): Promise<boolean> {
    try {
      const phase = this.phases.get(phaseId);
      if (phase) {
        phase.eligibleWallets = eligibleCount;
        phase.totalWallets = totalCount;
        
        // Clear cache to force refresh
        this.clearCache();
        
        console.log(`✅ Updated eligible wallets for ${phase.name}: ${eligibleCount}/${totalCount}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error updating eligible wallets for ${phaseId}:`, error);
      return false;
    }
  }

  /**
   * Toggle phase active status
   */
  async togglePhase(phaseId: string, isActive: boolean): Promise<boolean> {
    try {
      const phase = this.phases.get(phaseId);
      if (phase) {
        phase.isActive = isActive;
        
        // Clear cache to force refresh
        this.clearCache();
        
        console.log(`✅ ${phase.name} ${isActive ? 'activated' : 'deactivated'}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error toggling phase ${phaseId}:`, error);
      return false;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }
}

export const whitelistMonitoringService = new WhitelistMonitoringService();
