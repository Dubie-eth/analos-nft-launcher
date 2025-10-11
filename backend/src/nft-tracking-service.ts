/**
 * NFT Tracking Service - Backend
 * Persistent storage for all NFT minting data and user collections
 * This ensures data is never lost when users clear their cache
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MintedNFT {
  id: string;
  tokenId: number;
  collectionName: string;
  walletAddress: string;
  mintSignature: string;
  mintedAt: number;
  phase: string;
  price: number;
  currency: string;
  metadata?: any;
}

// Export as type for runtime access
export type { MintedNFT as MintedNFTType };

export interface UserNFTStats {
  walletAddress: string;
  totalNFTs: number;
  collections: Record<string, number>;
  phases: Record<string, number>;
  lastMint?: number;
  totalValue: number;
}

export interface CollectionStats {
  collectionName: string;
  totalMinted: number;
  uniqueOwners: string[];
  phases: Record<string, number>;
  lastMint?: number;
  totalRevenue: number;
}

export class NFTTrackingService {
  private dataDir: string;
  private nftsFile: string;
  private statsFile: string;
  private collectionsFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.nftsFile = path.join(this.dataDir, 'minted-nfts.json');
    this.statsFile = path.join(this.dataDir, 'user-stats.json');
    this.collectionsFile = path.join(this.dataDir, 'collection-stats.json');
    
    this.ensureDataDirectory();
    this.initializeFiles();
    console.log('🎯 NFT Tracking Service initialized with persistent storage');
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📁 Created NFT tracking data directory');
    }
  }

  /**
   * Initialize data files if they don't exist
   */
  private initializeFiles(): void {
    const files = [
      { path: this.nftsFile, default: [] },
      { path: this.statsFile, default: {} },
      { path: this.collectionsFile, default: {} }
    ];

    files.forEach(({ path: filePath, default: defaultValue }) => {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        console.log(`📄 Initialized ${path.basename(filePath)}`);
      }
    });
  }

  /**
   * Read JSON file safely
   */
  private readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
  }

  /**
   * Write JSON file safely
   */
  private writeJsonFile<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Track a minted NFT
   */
  trackMintedNFT(nft: MintedNFT): void {
    try {
      // Read current NFTs
      const nfts: MintedNFT[] = this.readJsonFile(this.nftsFile, []);
      
      // Check if NFT already exists (prevent duplicates)
      const existingIndex = nfts.findIndex(existing => 
        existing.id === nft.id || 
        (existing.tokenId === nft.tokenId && existing.collectionName === nft.collectionName)
      );
      
      if (existingIndex >= 0) {
        // Update existing NFT
        nfts[existingIndex] = nft;
        console.log(`🔄 Updated existing NFT: ${nft.collectionName} #${nft.tokenId}`);
      } else {
        // Add new NFT
        nfts.push(nft);
        console.log(`✅ Tracked new NFT: ${nft.collectionName} #${nft.tokenId}`);
      }
      
      // Save NFTs
      this.writeJsonFile(this.nftsFile, nfts);
      
      // Update user stats
      this.updateUserStats(nft);
      
      // Update collection stats
      this.updateCollectionStats(nft);
      
      console.log(`🎯 NFT tracking updated: ${nft.collectionName} #${nft.tokenId} by ${nft.walletAddress.slice(0, 8)}...`);
    } catch (error) {
      console.error('Error tracking NFT:', error);
      throw error;
    }
  }

  /**
   * Get all NFTs for a specific wallet
   */
  getUserNFTs(walletAddress: string): MintedNFT[] {
    try {
      const nfts: MintedNFT[] = this.readJsonFile(this.nftsFile, []);
      return nfts.filter(nft => nft.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }

  /**
   * Get all NFTs for a specific collection
   */
  getCollectionNFTs(collectionName: string): MintedNFT[] {
    try {
      const nfts: MintedNFT[] = this.readJsonFile(this.nftsFile, []);
      return nfts.filter(nft => nft.collectionName === collectionName);
    } catch (error) {
      console.error('Error getting collection NFTs:', error);
      return [];
    }
  }

  /**
   * Get user statistics
   */
  getUserStats(walletAddress: string): UserNFTStats {
    try {
      const stats: Record<string, UserNFTStats> = this.readJsonFile(this.statsFile, {});
      return stats[walletAddress.toLowerCase()] || {
        walletAddress: walletAddress.toLowerCase(),
        totalNFTs: 0,
        collections: {},
        phases: {},
        totalValue: 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        walletAddress: walletAddress.toLowerCase(),
        totalNFTs: 0,
        collections: {},
        phases: {},
        totalValue: 0
      };
    }
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(collectionName: string): CollectionStats {
    try {
      const stats: Record<string, CollectionStats> = this.readJsonFile(this.collectionsFile, {});
      return stats[collectionName] || {
        collectionName,
        totalMinted: 0,
        uniqueOwners: [],
        phases: {},
        totalRevenue: 0
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return {
        collectionName,
        totalMinted: 0,
        uniqueOwners: [],
        phases: {},
        totalRevenue: 0
      };
    }
  }

  /**
   * Update user statistics
   */
  private updateUserStats(nft: MintedNFT): void {
    try {
      const stats: Record<string, UserNFTStats> = this.readJsonFile(this.statsFile, {});
      const walletKey = nft.walletAddress.toLowerCase();
      
      if (!stats[walletKey]) {
        stats[walletKey] = {
          walletAddress: walletKey,
          totalNFTs: 0,
          collections: {},
          phases: {},
          totalValue: 0
        };
      }
      
      const userStats = stats[walletKey];
      
      // Update total NFTs
      const existingNFTs = this.getUserNFTs(nft.walletAddress);
      userStats.totalNFTs = existingNFTs.length;
      
      // Update collections count
      userStats.collections[nft.collectionName] = (userStats.collections[nft.collectionName] || 0) + 1;
      
      // Update phases count
      userStats.phases[nft.phase] = (userStats.phases[nft.phase] || 0) + 1;
      
      // Update total value
      userStats.totalValue += nft.price;
      
      // Update last mint
      userStats.lastMint = Math.max(userStats.lastMint || 0, nft.mintedAt);
      
      // Save updated stats
      this.writeJsonFile(this.statsFile, stats);
      
      console.log(`📊 Updated user stats for ${walletKey.slice(0, 8)}...: ${userStats.totalNFTs} NFTs`);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Update collection statistics
   */
  private updateCollectionStats(nft: MintedNFT): void {
    try {
      const stats: Record<string, CollectionStats> = this.readJsonFile(this.collectionsFile, {});
      
      if (!stats[nft.collectionName]) {
        stats[nft.collectionName] = {
          collectionName: nft.collectionName,
          totalMinted: 0,
          uniqueOwners: [],
          phases: {},
          totalRevenue: 0
        };
      }
      
      const collectionStats = stats[nft.collectionName];
      
      // Update total minted
      const collectionNFTs = this.getCollectionNFTs(nft.collectionName);
      collectionStats.totalMinted = collectionNFTs.length;
      
      // Update unique owners
      const owners = new Set([...collectionStats.uniqueOwners, nft.walletAddress.toLowerCase()]);
      collectionStats.uniqueOwners = Array.from(owners);
      
      // Update phases count
      collectionStats.phases[nft.phase] = (collectionStats.phases[nft.phase] || 0) + 1;
      
      // Update total revenue
      collectionStats.totalRevenue = collectionNFTs.reduce((sum, nft) => sum + nft.price, 0);
      
      // Update last mint
      collectionStats.lastMint = Math.max(collectionStats.lastMint || 0, nft.mintedAt);
      
      // Save updated stats
      this.writeJsonFile(this.collectionsFile, stats);
      
      console.log(`📊 Updated collection stats for ${nft.collectionName}: ${collectionStats.totalMinted} minted`);
    } catch (error) {
      console.error('Error updating collection stats:', error);
    }
  }

  /**
   * Get all minted NFTs (admin function)
   */
  getAllNFTs(): MintedNFT[] {
    try {
      return this.readJsonFile(this.nftsFile, []);
    } catch (error) {
      console.error('Error getting all NFTs:', error);
      return [];
    }
  }

  /**
   * Get all user stats (admin function)
   */
  getAllUserStats(): Record<string, UserNFTStats> {
    try {
      return this.readJsonFile(this.statsFile, {});
    } catch (error) {
      console.error('Error getting all user stats:', error);
      return {};
    }
  }

  /**
   * Get all collection stats (admin function)
   */
  getAllCollectionStats(): Record<string, CollectionStats> {
    try {
      return this.readJsonFile(this.collectionsFile, {});
    } catch (error) {
      console.error('Error getting all collection stats:', error);
      return {};
    }
  }

  /**
   * Generate next token ID for a collection
   */
  generateNextTokenId(collectionName: string): number {
    try {
      const collectionNFTs = this.getCollectionNFTs(collectionName);
      if (collectionNFTs.length === 0) {
        return 1;
      }
      
      const maxTokenId = Math.max(...collectionNFTs.map(nft => nft.tokenId));
      return maxTokenId + 1;
    } catch (error) {
      console.error('Error generating next token ID:', error);
      return 1;
    }
  }

  /**
   * Backup all data (admin function)
   */
  backupData(): {
    nfts: MintedNFT[];
    userStats: Record<string, UserNFTStats>;
    collectionStats: Record<string, CollectionStats>;
    timestamp: number;
  } {
    try {
      return {
        nfts: this.getAllNFTs(),
        userStats: this.getAllUserStats(),
        collectionStats: this.getAllCollectionStats(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup (admin function)
   */
  restoreData(backup: {
    nfts: MintedNFT[];
    userStats: Record<string, UserNFTStats>;
    collectionStats: Record<string, CollectionStats>;
  }): void {
    try {
      this.writeJsonFile(this.nftsFile, backup.nfts || []);
      this.writeJsonFile(this.statsFile, backup.userStats || {});
      this.writeJsonFile(this.collectionsFile, backup.collectionStats || {});
      console.log('✅ NFT tracking data restored from backup');
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }

  /**
   * Clear all data (admin function)
   */
  clearAllData(): void {
    try {
      this.writeJsonFile(this.nftsFile, []);
      this.writeJsonFile(this.statsFile, {});
      this.writeJsonFile(this.collectionsFile, {});
      console.log('🧹 All NFT tracking data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const nftTrackingService = new NFTTrackingService();
