import { Connection, PublicKey } from '@solana/web3.js';
import { getParsedTokenAccountsByOwner, getTokenAccountsByOwner } from '@solana/spl-token';
import { tokenMetadataService } from './token-metadata-service';

export interface TokenHolder {
  walletAddress: string;
  balance: number;
  balanceFormatted: number; // Human readable balance
  tokenSymbol: string;
  tokenMint: string;
  lastUpdated: number;
}

export interface WhitelistSnapshot {
  id: string;
  name: string;
  tokenMint: string;
  tokenSymbol: string;
  minBalance: number;
  snapshotDate: number;
  holders: TokenHolder[];
  totalHolders: number;
  totalSupply: number;
}

export interface WhitelistCriteria {
  tokenMint: string;
  minBalance: number;
  maxBalance?: number;
  snapshotDate?: number; // Unix timestamp for historical snapshots
  includeZeroBalances?: boolean;
  sortBy?: 'balance' | 'date' | 'wallet';
  sortOrder?: 'asc' | 'desc';
  limit?: number; // Max number of holders to return
}

export class WhitelistHolderService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get all token holders for a specific token with optional filtering
   */
  async getTokenHolders(criteria: WhitelistCriteria): Promise<TokenHolder[]> {
    try {
      console.log(`🔍 Fetching token holders for ${criteria.tokenMint} with criteria:`, criteria);
      
      const tokenMint = new PublicKey(criteria.tokenMint);
      
      // Get token metadata to understand decimals
      const tokenMetadata = await tokenMetadataService.getTokenMetadata(criteria.tokenMint);
      const decimals = tokenMetadata?.decimals || 6;
      const tokenSymbol = tokenMetadata?.symbol || this.generateSymbolFromMint(criteria.tokenMint);

      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token Program
        {
          filters: [
            {
              dataSize: 165, // Token account data size
            },
            {
              memcmp: {
                offset: 0, // Mint address offset in token account
                bytes: tokenMint.toBase58(),
              },
            },
          ],
        }
      );

      console.log(`📊 Found ${tokenAccounts.length} token accounts for ${tokenSymbol}`);

      const holders: TokenHolder[] = [];

      for (const account of tokenAccounts) {
        try {
          // Parse token account data
          const accountInfo = await this.connection.getParsedAccountInfo(account.pubkey);
          
          if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
            const parsedData = accountInfo.value.data.parsed;
            const owner = parsedData.info.owner;
            const amount = parsedData.info.tokenAmount.uiAmount || 0;
            const rawAmount = parsedData.info.tokenAmount.amount;

            // Apply filters
            if (amount < criteria.minBalance) continue;
            if (criteria.maxBalance && amount > criteria.maxBalance) continue;
            if (!criteria.includeZeroBalances && amount === 0) continue;

            holders.push({
              walletAddress: owner,
              balance: rawAmount,
              balanceFormatted: amount,
              tokenSymbol,
              tokenMint: criteria.tokenMint,
              lastUpdated: Date.now()
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing token account ${account.pubkey.toString()}:`, error);
        }
      }

      // Sort holders
      if (criteria.sortBy) {
        holders.sort((a, b) => {
          let comparison = 0;
          
          switch (criteria.sortBy) {
            case 'balance':
              comparison = a.balanceFormatted - b.balanceFormatted;
              break;
            case 'date':
              comparison = a.lastUpdated - b.lastUpdated;
              break;
            case 'wallet':
              comparison = a.walletAddress.localeCompare(b.walletAddress);
              break;
          }
          
          return criteria.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply limit
      const limitedHolders = criteria.limit ? holders.slice(0, criteria.limit) : holders;

      console.log(`✅ Found ${limitedHolders.length} qualifying holders for ${tokenSymbol}`);
      return limitedHolders;

    } catch (error) {
      console.error(`❌ Error fetching token holders for ${criteria.tokenMint}:`, error);
      throw error;
    }
  }

  /**
   * Create a snapshot of current token holders for whitelisting
   */
  async createWhitelistSnapshot(
    name: string,
    tokenMint: string,
    minBalance: number,
    options: {
      maxBalance?: number;
      includeZeroBalances?: boolean;
      limit?: number;
    } = {}
  ): Promise<WhitelistSnapshot> {
    try {
      console.log(`📸 Creating whitelist snapshot: ${name}`);
      
      const criteria: WhitelistCriteria = {
        tokenMint,
        minBalance,
        ...options
      };

      const holders = await this.getTokenHolders(criteria);
      
      // Get total supply
      const tokenMetadata = await tokenMetadataService.getTokenMetadata(tokenMint);
      const totalSupply = tokenMetadata?.supply || 0;

      const snapshot: WhitelistSnapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        tokenMint,
        tokenSymbol: tokenMetadata?.symbol || 'UNKNOWN',
        minBalance,
        snapshotDate: Date.now(),
        holders,
        totalHolders: holders.length,
        totalSupply
      };

      console.log(`✅ Created snapshot "${name}" with ${holders.length} holders`);
      return snapshot;

    } catch (error) {
      console.error(`❌ Error creating whitelist snapshot:`, error);
      throw error;
    }
  }

  /**
   * Get holders from a specific wallet address
   */
  async getWalletTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    try {
      const balance = await tokenMetadataService.getTokenBalance(walletAddress, tokenMint);
      return balance;
    } catch (error) {
      console.error(`❌ Error getting wallet balance for ${walletAddress}:`, error);
      return 0;
    }
  }

  /**
   * Check if a wallet qualifies for whitelist based on token holdings
   */
  async checkWhitelistEligibility(
    walletAddress: string,
    tokenMint: string,
    minBalance: number
  ): Promise<{
    eligible: boolean;
    currentBalance: number;
    requiredBalance: number;
    tokenSymbol: string;
  }> {
    try {
      const currentBalance = await this.getWalletTokenBalance(walletAddress, tokenMint);
      const tokenMetadata = await tokenMetadataService.getTokenMetadata(tokenMint);
      
      return {
        eligible: currentBalance >= minBalance,
        currentBalance,
        requiredBalance: minBalance,
        tokenSymbol: tokenMetadata?.symbol || 'UNKNOWN'
      };
    } catch (error) {
      console.error(`❌ Error checking whitelist eligibility:`, error);
      return {
        eligible: false,
        currentBalance: 0,
        requiredBalance: minBalance,
        tokenSymbol: 'UNKNOWN'
      };
    }
  }

  /**
   * Get top holders for a token (useful for VIP whitelist)
   */
  async getTopHolders(
    tokenMint: string,
    limit: number = 100
  ): Promise<TokenHolder[]> {
    const criteria: WhitelistCriteria = {
      tokenMint,
      minBalance: 0,
      includeZeroBalances: false,
      sortBy: 'balance',
      sortOrder: 'desc',
      limit
    };

    return await this.getTokenHolders(criteria);
  }

  /**
   * Get holders within a specific balance range
   */
  async getHoldersInRange(
    tokenMint: string,
    minBalance: number,
    maxBalance: number
  ): Promise<TokenHolder[]> {
    const criteria: WhitelistCriteria = {
      tokenMint,
      minBalance,
      maxBalance,
      includeZeroBalances: false,
      sortBy: 'balance',
      sortOrder: 'desc'
    };

    return await this.getTokenHolders(criteria);
  }

  /**
   * Generate whitelist addresses array from holders
   */
  static generateWhitelistAddresses(holders: TokenHolder[]): string[] {
    return holders.map(holder => holder.walletAddress);
  }

  /**
   * Generate detailed whitelist report
   */
  static generateWhitelistReport(snapshot: WhitelistSnapshot): {
    summary: {
      totalHolders: number;
      tokenSymbol: string;
      minBalance: number;
      averageBalance: number;
      totalSupply: number;
    };
    topHolders: TokenHolder[];
    distribution: {
      ranges: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
    };
  } {
    const holders = snapshot.holders;
    const totalBalance = holders.reduce((sum, holder) => sum + holder.balanceFormatted, 0);
    const averageBalance = holders.length > 0 ? totalBalance / holders.length : 0;

    // Top 10 holders
    const topHolders = holders
      .sort((a, b) => b.balanceFormatted - a.balanceFormatted)
      .slice(0, 10);

    // Balance distribution
    const ranges = [
      { min: 0, max: 1000, label: '0 - 1K' },
      { min: 1000, max: 10000, label: '1K - 10K' },
      { min: 10000, max: 100000, label: '10K - 100K' },
      { min: 100000, max: 1000000, label: '100K - 1M' },
      { min: 1000000, max: Infinity, label: '1M+' }
    ];

    const distribution = ranges.map(range => {
      const count = holders.filter(holder => 
        holder.balanceFormatted >= range.min && holder.balanceFormatted < range.max
      ).length;
      
      return {
        range: range.label,
        count,
        percentage: holders.length > 0 ? (count / holders.length) * 100 : 0
      };
    });

    return {
      summary: {
        totalHolders: holders.length,
        tokenSymbol: snapshot.tokenSymbol,
        minBalance: snapshot.minBalance,
        averageBalance,
        totalSupply: snapshot.totalSupply
      },
      topHolders,
      distribution: { ranges: distribution }
    };
  }

  private generateSymbolFromMint(mintAddress: string): string {
    const shortMint = mintAddress.slice(0, 4).toUpperCase();
    return `${shortMint}...`;
  }
}

export const whitelistHolderService = new WhitelistHolderService();
