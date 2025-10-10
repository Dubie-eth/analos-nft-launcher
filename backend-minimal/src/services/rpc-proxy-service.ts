/**
 * RPC Proxy Service
 * 
 * Proxies RPC calls to Analos blockchain with rate limiting and caching
 * Prevents frontend from hitting rate limits and exposes RPC endpoint
 */

import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import axios from 'axios';

export interface RPCProxyOptions {
  method: string;
  params?: any[];
  commitment?: Commitment;
}

export interface RPCProxyResult {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
}

export class RPCProxyService {
  private connection: Connection;
  private rpcUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheDuration: number = 30000; // 30 seconds

  constructor() {
    this.rpcUrl = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';
    this.connection = new Connection(this.rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    this.cache = new Map();

    console.log(`✅ RPC Proxy initialized: ${this.rpcUrl}`);
  }

  /**
   * Proxy an RPC call
   */
  async proxyCall(options: RPCProxyOptions): Promise<RPCProxyResult> {
    try {
      // Generate cache key
      const cacheKey = `${options.method}:${JSON.stringify(options.params)}`;

      // Check cache for read-only methods
      if (this.isReadOnlyMethod(options.method)) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true
          };
        }
      }

      // Make RPC call
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          id: 1,
          method: options.method,
          params: options.params || []
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.error) {
        return {
          success: false,
          error: response.data.error.message || 'RPC error'
        };
      }

      // Cache read-only results
      if (this.isReadOnlyMethod(options.method)) {
        this.setCache(cacheKey, response.data.result);
      }

      return {
        success: true,
        data: response.data.result,
        cached: false
      };

    } catch (error) {
      console.error('❌ RPC proxy error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown RPC error'
      };
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<RPCProxyResult> {
    try {
      const pubkey = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(pubkey);

      return {
        success: true,
        data: accountInfo
      };
    } catch (error) {
      console.error('❌ Error getting account info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get token supply
   */
  async getTokenSupply(mint: string): Promise<RPCProxyResult> {
    try {
      const pubkey = new PublicKey(mint);
      const supply = await this.connection.getTokenSupply(pubkey);

      return {
        success: true,
        data: supply
      };
    } catch (error) {
      console.error('❌ Error getting token supply:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction
   */
  async getTransaction(signature: string): Promise<RPCProxyResult> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      return {
        success: true,
        data: tx
      };
    } catch (error) {
      console.error('❌ Error getting transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recent blockhash
   */
  async getRecentBlockhash(): Promise<RPCProxyResult> {
    try {
      const blockhash = await this.connection.getLatestBlockhash();

      return {
        success: true,
        data: blockhash
      };
    } catch (error) {
      console.error('❌ Error getting blockhash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get program accounts
   */
  async getProgramAccounts(programId: string): Promise<RPCProxyResult> {
    try {
      const pubkey = new PublicKey(programId);
      const accounts = await this.connection.getProgramAccounts(pubkey);

      return {
        success: true,
        data: accounts
      };
    } catch (error) {
      console.error('❌ Error getting program accounts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm transaction
   */
  async confirmTransaction(signature: string): Promise<RPCProxyResult> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature);

      return {
        success: true,
        data: confirmation
      };
    } catch (error) {
      console.error('❌ Error confirming transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get slot
   */
  async getSlot(): Promise<RPCProxyResult> {
    try {
      const slot = await this.connection.getSlot();

      return {
        success: true,
        data: slot
      };
    } catch (error) {
      console.error('❌ Error getting slot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 500).forEach(([k]) => this.cache.delete(k));
    }
  }

  /**
   * Check if method is read-only (cacheable)
   */
  private isReadOnlyMethod(method: string): boolean {
    const readOnlyMethods = [
      'getAccountInfo',
      'getBalance',
      'getBlockHeight',
      'getBlockTime',
      'getEpochInfo',
      'getTokenSupply',
      'getTokenAccountBalance',
      'getTransaction',
      'getProgramAccounts',
      'getSignaturesForAddress',
      'getSlot'
    ];

    return readOnlyMethods.includes(method);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ RPC cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: number } {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += JSON.stringify(entry.data).length;
    });

    return {
      size: totalSize,
      entries: this.cache.size
    };
  }
}

// Export singleton instance
export const rpcProxyService = new RPCProxyService();

