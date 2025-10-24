/**
 * Token Holder Cache Service
 * Fetches and caches $LOL token holder data from Analos Explorer or on-chain
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

const LOL_TOKEN_MINT = new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6');

interface TokenHolder {
  wallet: string;
  balance: number; // Actual balance (accounting for decimals)
  rawBalance: number; // Raw balance in smallest units
}

class TokenHolderCache {
  private holders: Map<string, TokenHolder> = new Map();
  private lastUpdate: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private connection: Connection;
  private isUpdating: boolean = false;

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    console.log('💾 Token Holder Cache initialized');
  }

  /**
   * Get token holder data (from cache or fetch fresh)
   */
  async getHolderBalance(walletAddress: string): Promise<number | null> {
    // Normalize wallet address
    const normalizedWallet = walletAddress.toLowerCase();

    // Check if cache is fresh
    const now = Date.now();
    const cacheAge = now - this.lastUpdate;

    if (cacheAge > this.CACHE_DURATION && !this.isUpdating) {
      console.log('🔄 Cache expired, refreshing token holders...');
      await this.refreshHolders();
    }

    // Get from cache
    const holder = this.holders.get(normalizedWallet);
    if (holder) {
      console.log(`✅ Found in cache: ${walletAddress} has ${holder.balance.toLocaleString()} $LOL`);
      return holder.balance;
    }

    console.log(`❌ Not found in cache: ${walletAddress}`);
    return null;
  }

  /**
   * Refresh holder list from on-chain data
   */
  private async refreshHolders(): Promise<void> {
    if (this.isUpdating) {
      console.log('⏳ Already updating, skipping...');
      return;
    }

    this.isUpdating = true;
    console.log('📡 Fetching all $LOL token holders from blockchain...');

    try {
      // Get all token accounts for the $LOL mint
      const accounts = await this.connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 165, // Size of token account
            },
            {
              memcmp: {
                offset: 0, // Mint address is at offset 0
                bytes: LOL_TOKEN_MINT.toBase58(),
              },
            },
          ],
        }
      );

      console.log(`📊 Found ${accounts.length} token accounts`);

      // Clear old cache
      this.holders.clear();

      // Parse and cache each holder
      for (const account of accounts) {
        try {
          const accountData = AccountLayout.decode(account.account.data);
          const owner = new PublicKey(accountData.owner).toBase58().toLowerCase();
          const rawBalance = Number(accountData.amount);
          const actualBalance = rawBalance / Math.pow(10, 9); // $LOL has 9 decimals

          // Only cache if balance > 0
          if (actualBalance > 0) {
            this.holders.set(owner, {
              wallet: owner,
              balance: actualBalance,
              rawBalance: rawBalance,
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse account:', parseError);
        }
      }

      this.lastUpdate = Date.now();
      console.log(`✅ Cached ${this.holders.size} token holders`);
      console.log(`📊 Top holders:`);
      
      // Log top 5 holders for debugging
      const sorted = Array.from(this.holders.values())
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5);
      
      sorted.forEach((holder, i) => {
        console.log(`  ${i + 1}. ${holder.wallet.slice(0, 8)}... - ${holder.balance.toLocaleString()} $LOL`);
      });

    } catch (error) {
      console.error('❌ Failed to refresh token holders:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Force refresh the cache
   */
  async forceRefresh(): Promise<void> {
    this.lastUpdate = 0; // Invalidate cache
    await this.refreshHolders();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      totalHolders: this.holders.size,
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      cacheAge: Date.now() - this.lastUpdate,
      isStale: Date.now() - this.lastUpdate > this.CACHE_DURATION,
    };
  }
}

// Export singleton instance
export const tokenHolderCache = new TokenHolderCache();

