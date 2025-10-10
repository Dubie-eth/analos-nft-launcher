/**
 * Ticker Registry Service
 * Prevents collection symbol/ticker collisions across the platform
 */

export interface TickerRegistry {
  symbol: string;
  collectionName: string;
  collectionAddress: string;
  creatorWallet: string;
  registeredAt: number;
  status: 'active' | 'inactive' | 'reserved';
}

export class TickerRegistryService {
  private readonly registry: Map<string, TickerRegistry> = new Map();
  private readonly reservedTickers: Set<string> = new Set();
  private readonly ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

  constructor() {
    console.log('🏷️ Ticker Registry Service initialized');
    this.initializeReservedTickers();
  }

  /**
   * Initialize reserved tickers that cannot be used
   */
  private initializeReservedTickers(): void {
    // Common reserved tickers
    const reserved = [
      'SOL', 'BTC', 'ETH', 'USDC', 'USDT', 'LOS', 'LOL', '404', 'NFT', 'DAO',
      'DEFI', 'WEB3', 'GAME', 'ART', 'META', 'AI', 'VR', 'AR', 'PFP', 'AVATAR',
      'COLLECTIBLE', 'TRADING', 'CARD', 'TOKEN', 'COIN', 'CRYPTO', 'BLOCKCHAIN',
      'SMART', 'CONTRACT', 'DAPP', 'PLATFORM', 'MARKETPLACE', 'AUCTION',
      'BID', 'SELL', 'BUY', 'TRADE', 'SWAP', 'BRIDGE', 'STAKING', 'YIELD',
      'FARMING', 'LIQUIDITY', 'POOL', 'VAULT', 'STRATEGY', 'PROTOCOL',
      'GOVERNANCE', 'VOTE', 'PROPOSAL', 'TREASURY', 'FUND', 'GRANT',
      'BOUNTY', 'REWARD', 'INCENTIVE', 'BONUS', 'AIRDROP', 'CLAIM',
      'VERIFY', 'KYC', 'AML', 'COMPLIANCE', 'SECURITY', 'AUDIT',
      'TEST', 'DEMO', 'BETA', 'ALPHA', 'MAINNET', 'TESTNET', 'DEV',
      'STAGING', 'PRODUCTION', 'LIVE', 'OFFLINE', 'MAINTENANCE',
      'UPGRADE', 'MIGRATION', 'DEPRECATED', 'LEGACY', 'OLD', 'NEW'
    ];

    reserved.forEach(ticker => {
      this.reservedTickers.add(ticker.toUpperCase());
    });

    console.log(`🔒 Initialized ${reserved.length} reserved tickers`);
  }

  /**
   * Check if a ticker is available for registration
   */
  isTickerAvailable(symbol: string): { available: boolean; reason?: string } {
    const upperSymbol = symbol.toUpperCase().trim();
    
    // Check if empty or too short
    if (!upperSymbol || upperSymbol.length < 2) {
      return { available: false, reason: 'Ticker must be at least 2 characters long' };
    }

    // Check if too long
    if (upperSymbol.length > 10) {
      return { available: false, reason: 'Ticker must be 10 characters or less' };
    }

    // Check if reserved
    if (this.reservedTickers.has(upperSymbol)) {
      return { available: false, reason: `Ticker "${upperSymbol}" is reserved` };
    }

    // Check if already registered
    if (this.registry.has(upperSymbol)) {
      const existing = this.registry.get(upperSymbol)!;
      return { 
        available: false, 
        reason: `Ticker "${upperSymbol}" is already used by "${existing.collectionName}"` 
      };
    }

    // Check for similar tickers (fuzzy matching)
    const similarTickers = this.findSimilarTickers(upperSymbol);
    if (similarTickers.length > 0) {
      return { 
        available: false, 
        reason: `Ticker "${upperSymbol}" is too similar to existing tickers: ${similarTickers.join(', ')}` 
      };
    }

    return { available: true };
  }

  /**
   * Find similar tickers using fuzzy matching
   */
  private findSimilarTickers(targetSymbol: string): string[] {
    const similar: string[] = [];
    
    for (const [symbol, registry] of this.registry) {
      const similarity = this.calculateSimilarity(targetSymbol, symbol);
      if (similarity > 0.8) { // 80% similarity threshold
        similar.push(symbol);
      }
    }

    return similar;
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Register a new ticker
   */
  registerTicker(
    symbol: string,
    collectionName: string,
    collectionAddress: string,
    creatorWallet: string
  ): { success: boolean; message: string } {
    const upperSymbol = symbol.toUpperCase().trim();
    
    // Check availability
    const availability = this.isTickerAvailable(upperSymbol);
    if (!availability.available) {
      return { success: false, message: availability.reason || 'Ticker not available' };
    }

    // Register the ticker
    const registry: TickerRegistry = {
      symbol: upperSymbol,
      collectionName,
      collectionAddress,
      creatorWallet,
      registeredAt: Date.now(),
      status: 'active'
    };

    this.registry.set(upperSymbol, registry);
    console.log(`✅ Registered ticker: ${upperSymbol} for collection "${collectionName}"`);
    
    return { success: true, message: `Ticker "${upperSymbol}" registered successfully` };
  }

  /**
   * Get ticker information
   */
  getTickerInfo(symbol: string): TickerRegistry | null {
    return this.registry.get(symbol.toUpperCase()) || null;
  }

  /**
   * Get all registered tickers
   */
  getAllTickers(): TickerRegistry[] {
    return Array.from(this.registry.values()).sort((a, b) => b.registeredAt - a.registeredAt);
  }

  /**
   * Search tickers by pattern
   */
  searchTickers(pattern: string): TickerRegistry[] {
    const upperPattern = pattern.toUpperCase();
    return Array.from(this.registry.values())
      .filter(registry => 
        registry.symbol.includes(upperPattern) || 
        registry.collectionName.toUpperCase().includes(upperPattern)
      )
      .sort((a, b) => b.registeredAt - a.registeredAt);
  }

  /**
   * Reserve a ticker temporarily (for pending collections)
   */
  reserveTicker(symbol: string, creatorWallet: string): { success: boolean; message: string } {
    const upperSymbol = symbol.toUpperCase().trim();
    
    const availability = this.isTickerAvailable(upperSymbol);
    if (!availability.available) {
      return { success: false, message: availability.reason || 'Ticker not available' };
    }

    // Create temporary reservation
    const registry: TickerRegistry = {
      symbol: upperSymbol,
      collectionName: `RESERVED_${upperSymbol}`,
      collectionAddress: '',
      creatorWallet,
      registeredAt: Date.now(),
      status: 'reserved'
    };

    this.registry.set(upperSymbol, registry);
    console.log(`🔒 Reserved ticker: ${upperSymbol} for wallet ${creatorWallet}`);
    
    return { success: true, message: `Ticker "${upperSymbol}" reserved for 10 minutes` };
  }

  /**
   * Cancel a reservation
   */
  cancelReservation(symbol: string, creatorWallet: string): boolean {
    const upperSymbol = symbol.toUpperCase();
    const registry = this.registry.get(upperSymbol);
    
    if (registry && registry.status === 'reserved' && registry.creatorWallet === creatorWallet) {
      this.registry.delete(upperSymbol);
      console.log(`❌ Cancelled reservation for ticker: ${upperSymbol}`);
      return true;
    }
    
    return false;
  }

  /**
   * Clean up expired reservations (older than 10 minutes)
   */
  cleanupExpiredReservations(): void {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    for (const [symbol, registry] of this.registry) {
      if (registry.status === 'reserved' && (now - registry.registeredAt) > tenMinutes) {
        this.registry.delete(symbol);
        console.log(`🧹 Cleaned up expired reservation: ${symbol}`);
      }
    }
  }

  /**
   * Get ticker statistics
   */
  getStats(): {
    totalRegistered: number;
    activeTickers: number;
    reservedTickers: number;
    inactiveTickers: number;
    reservedCount: number;
  } {
    const allTickers = Array.from(this.registry.values());
    return {
      totalRegistered: allTickers.length,
      activeTickers: allTickers.filter(t => t.status === 'active').length,
      reservedTickers: allTickers.filter(t => t.status === 'reserved').length,
      inactiveTickers: allTickers.filter(t => t.status === 'inactive').length,
      reservedCount: this.reservedTickers.size
    };
  }
}
