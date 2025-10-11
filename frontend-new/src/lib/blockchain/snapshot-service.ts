import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';

export interface SnapshotConfig {
  tokenMint: string;
  minimumBalance: number;
  blockHeight?: number;
  includeInactive: boolean;
  snapshotName: string;
}

export interface HolderInfo {
  address: string;
  balance: number;
  percentage: number;
  isActive: boolean;
  tokenAccount: string;
  lastActivity?: Date;
}

export interface SnapshotResult {
  success: boolean;
  snapshot?: {
    id: string;
    name: string;
    tokenMint: string;
    blockHeight: number;
    totalHolders: number;
    totalSupply: number;
    holders: HolderInfo[];
    createdAt: Date;
  };
  error?: string;
}

/**
 * Snapshot Service for Analos Blockchain
 * Captures token holder snapshots for rewards, airdrops, and governance
 */
export class SnapshotService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Take a snapshot of token holders
   */
  async takeSnapshot(config: SnapshotConfig): Promise<SnapshotResult> {
    try {
      console.log('📸 Taking snapshot for token:', config.tokenMint);
      console.log('📊 Config:', config);

      const tokenMint = new PublicKey(config.tokenMint);
      
      // Get current block height
      const blockHeight = config.blockHeight || await this.connection.getSlot();
      console.log('📦 Block height:', blockHeight);

      // Get token supply
      const mintInfo = await this.connection.getTokenSupply(tokenMint);
      const totalSupply = Number(mintInfo.value.amount);
      console.log('💰 Total supply:', totalSupply);

      // Find all token accounts for this mint
      const holders = await this.findTokenHolders(tokenMint, config.minimumBalance);
      console.log('👥 Found holders:', holders.length);

      // Calculate percentages
      const holdersWithPercentage = holders.map(holder => ({
        ...holder,
        percentage: totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0
      }));

      // Filter active holders if needed
      const filteredHolders = config.includeInactive 
        ? holdersWithPercentage 
        : holdersWithPercentage.filter(h => h.isActive);

      const snapshot = {
        id: `snapshot_${Date.now()}_${config.tokenMint.slice(0, 8)}`,
        name: config.snapshotName,
        tokenMint: config.tokenMint,
        blockHeight,
        totalHolders: filteredHolders.length,
        totalSupply,
        holders: filteredHolders,
        createdAt: new Date()
      };

      console.log('✅ Snapshot completed:', {
        totalHolders: snapshot.totalHolders,
        totalSupply: snapshot.totalSupply,
        blockHeight: snapshot.blockHeight
      });

      return {
        success: true,
        snapshot
      };

    } catch (error) {
      console.error('❌ Snapshot failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find all token holders for a given mint
   */
  private async findTokenHolders(
    tokenMint: PublicKey,
    minimumBalance: number
  ): Promise<HolderInfo[]> {
    const holders: HolderInfo[] = [];

    try {
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // SPL Token program
        {
          filters: [
            {
              dataSize: 165, // Token account data size
            },
            {
              memcmp: {
                offset: 0, // Mint address offset
                bytes: tokenMint.toBase58(),
              },
            },
          ],
        }
      );

      console.log('🔍 Found token accounts:', tokenAccounts.length);

      for (const accountInfo of tokenAccounts) {
        try {
          const tokenAccount = accountInfo.account;
          const parsedData = tokenAccount.data.parsed.info;
          const balance = Number(parsedData.tokenAmount.amount);
          const decimals = parsedData.tokenAmount.decimals;
          
          // Convert to actual balance considering decimals
          const actualBalance = balance / Math.pow(10, decimals);

          if (actualBalance >= minimumBalance) {
            const holder: HolderInfo = {
              address: parsedData.owner,
              balance: actualBalance,
              percentage: 0, // Will be calculated later
              isActive: await this.isActiveHolder(parsedData.owner),
              tokenAccount: accountInfo.pubkey.toBase58()
            };

            holders.push(holder);
          }
        } catch (accountError) {
          console.warn('⚠️ Error processing token account:', accountError);
          continue;
        }
      }

    } catch (error) {
      console.error('❌ Error finding token holders:', error);
      throw error;
    }

    return holders;
  }

  /**
   * Check if a holder is active (has recent transactions)
   */
  private async isActiveHolder(address: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(address);
      
      // Get recent signatures (last 30 days)
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit: 1 }
      );

      if (signatures.length === 0) {
        return false;
      }

      const lastSignature = signatures[0];
      const lastActivity = new Date(lastSignature.blockTime! * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      return lastActivity > thirtyDaysAgo;
    } catch (error) {
      console.warn('⚠️ Error checking holder activity:', error);
      return false;
    }
  }

  /**
   * Export snapshot to CSV format
   */
  exportSnapshotToCSV(snapshot: SnapshotResult['snapshot']): string {
    if (!snapshot) {
      throw new Error('No snapshot data to export');
    }

    const headers = [
      'Address',
      'Balance',
      'Percentage',
      'Active',
      'Token Account',
      'Last Activity'
    ];

    const rows = snapshot.holders.map(holder => [
      holder.address,
      holder.balance.toString(),
      holder.percentage.toFixed(4),
      holder.isActive ? 'Yes' : 'No',
      holder.tokenAccount,
      holder.lastActivity?.toISOString() || 'Unknown'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Get snapshot statistics
   */
  getSnapshotStats(snapshot: SnapshotResult['snapshot']) {
    if (!snapshot) {
      return null;
    }

    const totalHolders = snapshot.holders.length;
    const activeHolders = snapshot.holders.filter(h => h.isActive).length;
    const totalBalance = snapshot.holders.reduce((sum, h) => sum + h.balance, 0);
    const averageBalance = totalHolders > 0 ? totalBalance / totalHolders : 0;
    const topHolder = snapshot.holders.reduce((max, h) => 
      h.balance > max.balance ? h : max, snapshot.holders[0] || { balance: 0, percentage: 0 }
    );

    return {
      totalHolders,
      activeHolders,
      inactiveHolders: totalHolders - activeHolders,
      totalBalance,
      averageBalance,
      topHolder: {
        address: topHolder.address,
        balance: topHolder.balance,
        percentage: topHolder.percentage
      },
      concentration: topHolder.percentage // Percentage held by top holder
    };
  }

  /**
   * Validate snapshot configuration
   */
  validateSnapshotConfig(config: SnapshotConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.tokenMint) {
      errors.push('Token mint address is required');
    }

    if (config.minimumBalance < 0) {
      errors.push('Minimum balance must be non-negative');
    }

    if (!config.snapshotName || config.snapshotName.trim().length === 0) {
      errors.push('Snapshot name is required');
    }

    try {
      if (config.tokenMint) {
        new PublicKey(config.tokenMint);
      }
    } catch {
      errors.push('Invalid token mint address format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
