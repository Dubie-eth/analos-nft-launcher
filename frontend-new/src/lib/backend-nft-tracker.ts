/**
 * Backend NFT Tracker
 * Uses persistent backend storage instead of localStorage
 * Ensures NFTs are never lost when users clear their cache
 */

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

export class BackendNFTTracker {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';
    console.log('🎯 Backend NFT Tracker initialized');
  }

  /**
   * Track a minted NFT on the backend
   */
  async trackMintedNFT(nft: MintedNFT): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nft),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ NFT tracked on backend:', nft.collectionName, `#${nft.tokenId}`);
        return true;
      } else {
        console.error('❌ Backend tracking failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error tracking NFT on backend:', error);
      return false;
    }
  }

  /**
   * Get user's NFTs from backend
   */
  async getUserNFTs(walletAddress: string): Promise<{ nfts: MintedNFT[]; stats: UserNFTStats }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/user/${encodeURIComponent(walletAddress)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // User has no NFTs yet
          return {
            nfts: [],
            stats: {
              walletAddress: walletAddress.toLowerCase(),
              totalNFTs: 0,
              collections: {},
              phases: {},
              totalValue: 0
            }
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Loaded ${result.nfts.length} NFTs from backend for ${walletAddress.slice(0, 8)}...`);
        return { nfts: result.nfts, stats: result.stats };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error getting user NFTs from backend:', error);
      // Return empty data on error
      return {
        nfts: [],
        stats: {
          walletAddress: walletAddress.toLowerCase(),
          totalNFTs: 0,
          collections: {},
          phases: {},
          totalValue: 0
        }
      };
    }
  }

  /**
   * Get collection NFTs from backend
   */
  async getCollectionNFTs(collectionName: string): Promise<{ nfts: MintedNFT[]; stats: CollectionStats }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/collection/${encodeURIComponent(collectionName)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Collection has no NFTs yet
          return {
            nfts: [],
            stats: {
              collectionName,
              totalMinted: 0,
              uniqueOwners: [],
              phases: {},
              totalRevenue: 0
            }
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Loaded ${result.nfts.length} NFTs for collection "${collectionName}"`);
        return { nfts: result.nfts, stats: result.stats };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error getting collection NFTs from backend:', error);
      // Return empty data on error
      return {
        nfts: [],
        stats: {
          collectionName,
          totalMinted: 0,
          uniqueOwners: [],
          phases: {},
          totalRevenue: 0
        }
      };
    }
  }

  /**
   * Get next token ID for a collection
   */
  async generateNextTokenId(collectionName: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/next-token-id/${encodeURIComponent(collectionName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Next token ID for "${collectionName}": ${result.nextTokenId}`);
        return result.nextTokenId;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error getting next token ID from backend:', error);
      // Return 1 as fallback
      return 1;
    }
  }

  /**
   * Get all NFT statistics (admin)
   */
  async getAllStats(): Promise<{
    totalNFTs: number;
    totalUsers: number;
    totalCollections: number;
    stats: {
      users: Record<string, UserNFTStats>;
      collections: Record<string, CollectionStats>;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Loaded NFT stats: ${result.totalNFTs} NFTs, ${result.totalUsers} users, ${result.totalCollections} collections`);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error getting NFT stats from backend:', error);
      // Return empty stats on error
      return {
        totalNFTs: 0,
        totalUsers: 0,
        totalCollections: 0,
        stats: {
          users: {},
          collections: {}
        }
      };
    }
  }

  /**
   * Create backup of all NFT data (admin)
   */
  async createBackup(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/backup`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ NFT backup created successfully');
        return result.backup;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error creating NFT backup:', error);
      throw error;
    }
  }

  /**
   * Restore NFT data from backup (admin)
   */
  async restoreFromBackup(backup: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/nft/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ NFT data restored from backup');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error restoring NFT data from backup:', error);
      return false;
    }
  }

  /**
   * Generate unique NFT ID
   */
  generateNFTId(collectionName: string, tokenId: number, walletAddress: string): string {
    return `nft_${collectionName}_${tokenId}_${walletAddress}_${Date.now()}`;
  }

  /**
   * Create MintedNFT object
   */
  createMintedNFT(
    collectionName: string,
    tokenId: number,
    walletAddress: string,
    mintSignature: string,
    phase: string,
    price: number,
    currency: string,
    metadata?: any
  ): MintedNFT {
    return {
      id: this.generateNFTId(collectionName, tokenId, walletAddress),
      tokenId,
      collectionName,
      walletAddress: walletAddress.toLowerCase(),
      mintSignature,
      mintedAt: Date.now(),
      phase,
      price,
      currency,
      metadata
    };
  }
}

// Export singleton instance
export const backendNFTTracker = new BackendNFTTracker();
