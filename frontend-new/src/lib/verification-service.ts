/**
 * Verification Service
 * Provides verifiable links and data for platform statistics
 */

export interface VerificationLink {
  name: string;
  url: string;
  description: string;
  type: 'blockchain' | 'api' | 'external';
}

export interface PlatformStats {
  collectionsLaunched: number;
  nftsMinted: number;
  losBurned: string;
  platformUptime: string;
}

export class VerificationService {
  private static instance: VerificationService;
  
  // Known mint addresses for collections
  private static readonly KNOWN_MINTS = {
    'LosBros': '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
  };

  // Token addresses
  private static readonly TOKEN_ADDRESSES = {
    LOS: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1Fsqp3VZ1Z',
    SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  };

  // Platform URLs
  private static readonly PLATFORM_URLS = {
    explorer: 'https://explorer.analos.io',
    rpc: 'https://rpc.analos.io',
    health: 'https://analos-nft-launcher-9cxc.vercel.app/api/health',
  };

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  /**
   * Get verification links for collections launched
   */
  getCollectionsVerificationLinks(): VerificationLink[] {
    return [
      {
        name: 'Los Bros Collection',
        url: `${VerificationService.PLATFORM_URLS.explorer}/accounts/${VerificationService.KNOWN_MINTS.LosBros}`,
        description: 'View Los Bros collection on Analos Explorer',
        type: 'blockchain',
      },
      {
        name: 'Collection Mint Address',
        url: `${VerificationService.PLATFORM_URLS.explorer}/accounts/${VerificationService.KNOWN_MINTS.LosBros}`,
        description: 'Direct link to collection mint address',
        type: 'blockchain',
      },
    ];
  }

  /**
   * Get verification links for NFTs minted
   */
  getNFTsVerificationLinks(): VerificationLink[] {
    return [
      {
        name: 'Token Program Activity',
        url: `${VerificationService.PLATFORM_URLS.explorer}/token/${VerificationService.TOKEN_ADDRESSES.SOL}`,
        description: 'View token program activity on Analos Explorer',
        type: 'blockchain',
      },
      {
        name: 'Collection Holder Activity',
        url: `${VerificationService.PLATFORM_URLS.explorer}/accounts/${VerificationService.KNOWN_MINTS.LosBros}`,
        description: 'View collection holder and mint activity',
        type: 'blockchain',
      },
    ];
  }

  /**
   * Get verification links for LOS burned
   */
  getLOSBurnVerificationLinks(): VerificationLink[] {
    return [
      {
        name: 'LOS Token Address',
        url: `${VerificationService.PLATFORM_URLS.explorer}/token/${VerificationService.TOKEN_ADDRESSES.LOS}`,
        description: 'View LOS token on Analos Explorer',
        type: 'blockchain',
      },
      {
        name: 'Burn Transactions',
        url: `${VerificationService.PLATFORM_URLS.explorer}/token/${VerificationService.TOKEN_ADDRESSES.LOS}`,
        description: 'View burn transactions and token supply',
        type: 'blockchain',
      },
    ];
  }

  /**
   * Get verification links for platform uptime
   */
  getUptimeVerificationLinks(): VerificationLink[] {
    return [
      {
        name: 'Live Health Check',
        url: VerificationService.PLATFORM_URLS.health,
        description: 'Real-time platform health status',
        type: 'api',
      },
      {
        name: 'Analos RPC Status',
        url: VerificationService.PLATFORM_URLS.rpc,
        description: 'Analos blockchain RPC endpoint',
        type: 'external',
      },
    ];
  }

  /**
   * Get all verification links for a specific stat type
   */
  getVerificationLinks(statType: 'collections' | 'nfts' | 'los-burned' | 'uptime'): VerificationLink[] {
    switch (statType) {
      case 'collections':
        return this.getCollectionsVerificationLinks();
      case 'nfts':
        return this.getNFTsVerificationLinks();
      case 'los-burned':
        return this.getLOSBurnVerificationLinks();
      case 'uptime':
        return this.getUptimeVerificationLinks();
      default:
        return [];
    }
  }

  /**
   * Get a summary of all verification links
   */
  getAllVerificationLinks(): Record<string, VerificationLink[]> {
    return {
      collections: this.getCollectionsVerificationLinks(),
      nfts: this.getNFTsVerificationLinks(),
      losBurned: this.getLOSBurnVerificationLinks(),
      uptime: this.getUptimeVerificationLinks(),
    };
  }

  /**
   * Validate a blockchain address
   */
  isValidAddress(address: string): boolean {
    // Basic Solana address validation (44 characters, base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Get current platform statistics with verification
   */
  async getVerifiedStats(): Promise<{
    stats: PlatformStats;
    verification: Record<string, VerificationLink[]>;
  }> {
    try {
      // In a real implementation, you would fetch these from your backend
      // For now, we'll return the current static stats with verification links
      const stats: PlatformStats = {
        collectionsLaunched: 1,
        nftsMinted: 50,
        losBurned: '25K',
        platformUptime: '99.9%',
      };

      const verification = this.getAllVerificationLinks();

      return {
        stats,
        verification,
      };
    } catch (error) {
      console.error('Error fetching verified stats:', error);
      throw error;
    }
  }
}

export const verificationService = VerificationService.getInstance();