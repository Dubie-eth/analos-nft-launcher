/**
 * Token Holder Verification Service
 * Manages access based on token holdings (e.g., $LOL token holders)
 */

import { Connection, PublicKey } from '@solana/web3.js';

export interface TokenHolderConfig {
  tokenMint: string;
  tokenSymbol: string;
  minimumBalance: number;
  decimals: number;
  isEnabled: boolean;
  accessLevel: 'beta' | 'premium' | 'enterprise';
  description: string;
  lastUpdated: number;
}

export interface TokenHolderVerification {
  walletAddress: string;
  tokenMint: string;
  tokenSymbol: string;
  balance: number;
  hasAccess: boolean;
  accessLevel: string;
  verifiedAt: number;
  expiresAt?: number;
}

export interface TokenHolderStats {
  totalHolders: number;
  eligibleHolders: number;
  accessLevels: {
    beta: number;
    premium: number;
    enterprise: number;
  };
  averageBalance: number;
  totalSupply: number;
}

export class TokenHolderService {
  private readonly CONFIG_KEY = 'token_holder_config';
  private readonly VERIFICATION_CACHE_KEY = 'token_holder_verifications';
  private readonly ANALOS_RPC_URL = process.env.NEXT_PUBLIC_ANALOS_RPC_URL || 'https://rpc.analos.io';
  
  private connection: Connection;

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
    this.initializeDefaultConfig();
  }

  /**
   * SSR-safe localStorage access helper
   */
  private safeLocalStorage(): Storage | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Initialize default token holder configurations
   */
  private initializeDefaultConfig() {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    const existingConfig = storage.getItem(this.CONFIG_KEY);
    if (!existingConfig) {
      const defaultConfigs: TokenHolderConfig[] = [
        {
          tokenMint: 'LOL1111111111111111111111111111111111111111', // Placeholder $LOL token mint
          tokenSymbol: 'LOL',
          minimumBalance: 1000000, // 1 $LOL (assuming 6 decimals)
          decimals: 6,
          isEnabled: false, // Disabled by default until ready
          accessLevel: 'beta',
          description: 'Access for $LOL token holders',
          lastUpdated: Date.now()
        },
        {
          tokenMint: 'SOL1111111111111111111111111111111111111111', // SOL token mint
          tokenSymbol: 'SOL',
          minimumBalance: 1000000000, // 1 SOL (9 decimals)
          decimals: 9,
          isEnabled: false,
          accessLevel: 'premium',
          description: 'Premium access for SOL holders',
          lastUpdated: Date.now()
        }
      ];

      storage.setItem(this.CONFIG_KEY, JSON.stringify(defaultConfigs));
      console.log('🎯 Token Holder Service initialized with default configurations');
    }
  }

  /**
   * Get all token holder configurations
   */
  getTokenConfigs(): TokenHolderConfig[] {
    const storage = this.safeLocalStorage();
    if (!storage) return [];

    try {
      const configs = storage.getItem(this.CONFIG_KEY);
      return configs ? JSON.parse(configs) : [];
    } catch (error) {
      console.error('Error loading token holder configs:', error);
      return [];
    }
  }

  /**
   * Update token holder configuration
   */
  updateTokenConfig(tokenMint: string, updates: Partial<TokenHolderConfig>): boolean {
    const storage = this.safeLocalStorage();
    if (!storage) return false;

    try {
      const configs = this.getTokenConfigs();
      const configIndex = configs.findIndex(config => config.tokenMint === tokenMint);
      
      if (configIndex === -1) return false;

      configs[configIndex] = {
        ...configs[configIndex],
        ...updates,
        lastUpdated: Date.now()
      };

      storage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
      console.log(`✅ Updated token holder config for ${updates.tokenSymbol || configs[configIndex].tokenSymbol}`);
      return true;
    } catch (error) {
      console.error('Error updating token holder config:', error);
      return false;
    }
  }

  /**
   * Add new token holder configuration
   */
  addTokenConfig(config: Omit<TokenHolderConfig, 'lastUpdated'>): boolean {
    const storage = this.safeLocalStorage();
    if (!storage) return false;

    try {
      const configs = this.getTokenConfigs();
      
      // Check if token already exists
      if (configs.some(c => c.tokenMint === config.tokenMint)) {
        console.warn(`Token config already exists for ${config.tokenSymbol}`);
        return false;
      }

      const newConfig: TokenHolderConfig = {
        ...config,
        lastUpdated: Date.now()
      };

      configs.push(newConfig);
      storage.setItem(this.CONFIG_KEY, JSON.stringify(configs));
      console.log(`✅ Added new token holder config for ${config.tokenSymbol}`);
      return true;
    } catch (error) {
      console.error('Error adding token holder config:', error);
      return false;
    }
  }

  /**
   * Remove token holder configuration
   */
  removeTokenConfig(tokenMint: string): boolean {
    const storage = this.safeLocalStorage();
    if (!storage) return false;

    try {
      const configs = this.getTokenConfigs();
      const filteredConfigs = configs.filter(config => config.tokenMint !== tokenMint);
      
      if (filteredConfigs.length === configs.length) {
        console.warn(`Token config not found for ${tokenMint}`);
        return false;
      }

      storage.setItem(this.CONFIG_KEY, JSON.stringify(filteredConfigs));
      console.log(`✅ Removed token holder config for ${tokenMint}`);
      return true;
    } catch (error) {
      console.error('Error removing token holder config:', error);
      return false;
    }
  }

  /**
   * Verify if wallet holds required tokens
   */
  async verifyTokenHolder(walletAddress: string): Promise<TokenHolderVerification[]> {
    const configs = this.getTokenConfigs().filter(config => config.isEnabled);
    const verifications: TokenHolderVerification[] = [];

    for (const config of configs) {
      try {
        const balance = await this.getTokenBalance(walletAddress, config.tokenMint);
        const hasAccess = balance >= config.minimumBalance;
        
        const verification: TokenHolderVerification = {
          walletAddress,
          tokenMint: config.tokenMint,
          tokenSymbol: config.tokenSymbol,
          balance,
          hasAccess,
          accessLevel: config.accessLevel,
          verifiedAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours cache
        };

        verifications.push(verification);
      } catch (error) {
        console.error(`Error verifying ${config.tokenSymbol} balance for ${walletAddress}:`, error);
      }
    }

    return verifications;
  }

  /**
   * Get token balance for a wallet
   */
  private async getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    try {
      const walletPubkey = new PublicKey(walletAddress);
      const tokenMintPubkey = new PublicKey(tokenMint);

      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPubkey,
        { mint: tokenMintPubkey }
      );

      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const accountInfo = await this.connection.getTokenAccountBalance(account.pubkey);
        totalBalance += parseInt(accountInfo.value.amount);
      }

      return totalBalance;
    } catch (error) {
      console.error(`Error getting token balance for ${tokenMint}:`, error);
      return 0;
    }
  }

  /**
   * Check if wallet has token holder access
   */
  async hasTokenHolderAccess(walletAddress: string, requiredLevel?: 'beta' | 'premium' | 'enterprise'): Promise<{
    hasAccess: boolean;
    verifications: TokenHolderVerification[];
    highestLevel: string;
  }> {
    const verifications = await this.verifyTokenHolder(walletAddress);
    const eligibleVerifications = verifications.filter(v => v.hasAccess);
    
    if (eligibleVerifications.length === 0) {
      return {
        hasAccess: false,
        verifications,
        highestLevel: 'none'
      };
    }

    // Determine highest access level
    const levels = ['beta', 'premium', 'enterprise'];
    const highestLevel = levels.reduce((highest, level) => {
      if (eligibleVerifications.some(v => v.accessLevel === level)) {
        return level;
      }
      return highest;
    }, 'beta');

    // Check if meets required level
    const hasAccess = !requiredLevel || levels.indexOf(highestLevel) >= levels.indexOf(requiredLevel);

    return {
      hasAccess,
      verifications,
      highestLevel
    };
  }

  /**
   * Cache verification result
   */
  private cacheVerification(walletAddress: string, verifications: TokenHolderVerification[]): void {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    try {
      const cache = JSON.parse(storage.getItem(this.VERIFICATION_CACHE_KEY) || '{}');
      cache[walletAddress.toLowerCase()] = {
        verifications,
        cachedAt: Date.now()
      };
      storage.setItem(this.VERIFICATION_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching verification:', error);
    }
  }

  /**
   * Get cached verification
   */
  private getCachedVerification(walletAddress: string): TokenHolderVerification[] | null {
    const storage = this.safeLocalStorage();
    if (!storage) return null;

    try {
      const cache = JSON.parse(storage.getItem(this.VERIFICATION_CACHE_KEY) || '{}');
      const cached = cache[walletAddress.toLowerCase()];
      
      if (!cached) return null;

      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - cached.cachedAt;
      if (cacheAge > 24 * 60 * 60 * 1000) {
        delete cache[walletAddress.toLowerCase()];
        storage.setItem(this.VERIFICATION_CACHE_KEY, JSON.stringify(cache));
        return null;
      }

      return cached.verifications;
    } catch (error) {
      console.error('Error getting cached verification:', error);
      return null;
    }
  }

  /**
   * Get token holder statistics
   */
  getTokenHolderStats(): TokenHolderStats {
    const configs = this.getTokenConfigs();
    const enabledConfigs = configs.filter(config => config.isEnabled);

    return {
      totalHolders: 0, // Would need to scan blockchain to get real data
      eligibleHolders: 0,
      accessLevels: {
        beta: enabledConfigs.filter(c => c.accessLevel === 'beta').length,
        premium: enabledConfigs.filter(c => c.accessLevel === 'premium').length,
        enterprise: enabledConfigs.filter(c => c.accessLevel === 'enterprise').length
      },
      averageBalance: 0,
      totalSupply: 0
    };
  }

  /**
   * Get verification status for display
   */
  getVerificationStatus(verifications: TokenHolderVerification[]): {
    status: 'verified' | 'partial' | 'none';
    tokens: string[];
    message: string;
  } {
    const eligible = verifications.filter(v => v.hasAccess);
    
    if (eligible.length === 0) {
      return {
        status: 'none',
        tokens: [],
        message: 'No eligible token holdings found'
      };
    }

    if (eligible.length === verifications.length) {
      return {
        status: 'verified',
        tokens: eligible.map(v => v.tokenSymbol),
        message: `Verified holder of: ${eligible.map(v => v.tokenSymbol).join(', ')}`
      };
    }

    return {
      status: 'partial',
      tokens: eligible.map(v => v.tokenSymbol),
      message: `Partial verification: ${eligible.map(v => v.tokenSymbol).join(', ')}`
    };
  }

  /**
   * Format token balance for display
   */
  formatTokenBalance(balance: number, decimals: number): string {
    const formatted = balance / Math.pow(10, decimals);
    return formatted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    const configs = this.getTokenConfigs();
    const enabledConfigs = configs.filter(config => config.isEnabled);

    return {
      totalConfigs: configs.length,
      enabledConfigs: enabledConfigs.length,
      supportedTokens: enabledConfigs.map(config => ({
        symbol: config.tokenSymbol,
        mint: config.tokenMint,
        accessLevel: config.accessLevel,
        minimumBalance: this.formatTokenBalance(config.minimumBalance, config.decimals)
      })),
      rpcUrl: this.ANALOS_RPC_URL
    };
  }
}

// Singleton instance
export const tokenHolderService = new TokenHolderService();
