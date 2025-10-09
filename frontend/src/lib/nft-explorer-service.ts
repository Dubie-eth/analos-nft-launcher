/**
 * NFT Explorer Service
 * Tracks and displays all minted NFTs across the platform
 */

import { MintedNFT } from './user-nft-tracker';

export interface ExplorerNFT extends MintedNFT {
  walletAddress: string;
  walletDisplay: string; // First 4 + last 4 characters
}

export interface CollectionStats {
  collectionName: string;
  totalMints: number;
  uniqueWallets: number;
  latestMint?: ExplorerNFT;
  mintHistory: ExplorerNFT[];
}

export interface WalletStats {
  walletAddress: string;
  walletDisplay: string;
  totalMints: number;
  collections: { [collectionName: string]: number };
  latestMint?: ExplorerNFT;
}

export class NFTExplorerService {
  /**
   * Get all minted NFTs across all wallets (from localStorage)
   * Note: This is a simplified implementation using localStorage
   * In a real app, this would query a database or blockchain
   */
  getAllMintedNFTs(): ExplorerNFT[] {
    try {
      const allNFTs: ExplorerNFT[] = [];
      
      // Iterate through all localStorage keys to find minted NFTs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('minted_nfts_')) {
          try {
            const walletAddress = key.replace('minted_nfts_', '');
            const mintedNFTs: MintedNFT[] = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Convert to ExplorerNFT format
            const explorerNFTs: ExplorerNFT[] = mintedNFTs.map(nft => ({
              ...nft,
              walletAddress: walletAddress,
              walletDisplay: this.formatWalletAddress(walletAddress)
            }));
            
            allNFTs.push(...explorerNFTs);
          } catch (error) {
            console.error(`Error parsing NFTs for key ${key}:`, error);
          }
        }
      }
      
      // Sort by timestamp (newest first)
      return allNFTs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting all minted NFTs:', error);
      return [];
    }
  }

  /**
   * Get NFTs for a specific collection
   */
  getNFTsByCollection(collectionName: string): ExplorerNFT[] {
    const allNFTs = this.getAllMintedNFTs();
    return allNFTs.filter(nft => nft.collectionName === collectionName);
  }

  /**
   * Get NFTs for a specific wallet
   */
  getNFTsByWallet(walletAddress: string): ExplorerNFT[] {
    const allNFTs = this.getAllMintedNFTs();
    return allNFTs.filter(nft => 
      nft.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(collectionName: string): CollectionStats {
    const collectionNFTs = this.getNFTsByCollection(collectionName);
    const uniqueWallets = new Set(collectionNFTs.map(nft => nft.walletAddress));
    
    return {
      collectionName,
      totalMints: collectionNFTs.length,
      uniqueWallets: uniqueWallets.size,
      latestMint: collectionNFTs[0], // Already sorted by timestamp
      mintHistory: collectionNFTs
    };
  }

  /**
   * Get wallet statistics
   */
  getWalletStats(walletAddress: string): WalletStats {
    const walletNFTs = this.getNFTsByWallet(walletAddress);
    const collections: { [collectionName: string]: number } = {};
    
    walletNFTs.forEach(nft => {
      if (!collections[nft.collectionName]) {
        collections[nft.collectionName] = 0;
      }
      collections[nft.collectionName]++;
    });
    
    return {
      walletAddress,
      walletDisplay: this.formatWalletAddress(walletAddress),
      totalMints: walletNFTs.length,
      collections,
      latestMint: walletNFTs[0] // Already sorted by timestamp
    };
  }

  /**
   * Get recent mints (last 24 hours)
   */
  getRecentMints(hours: number = 24): ExplorerNFT[] {
    const allNFTs = this.getAllMintedNFTs();
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return allNFTs.filter(nft => nft.timestamp >= cutoffTime);
  }

  /**
   * Get top minters by collection
   */
  getTopMinters(collectionName: string, limit: number = 10): WalletStats[] {
    const collectionNFTs = this.getNFTsByCollection(collectionName);
    const walletCounts: { [walletAddress: string]: number } = {};
    
    collectionNFTs.forEach(nft => {
      if (!walletCounts[nft.walletAddress]) {
        walletCounts[nft.walletAddress] = 0;
      }
      walletCounts[nft.walletAddress]++;
    });
    
    // Convert to array and sort by mint count
    const topMinters = Object.entries(walletCounts)
      .map(([walletAddress, count]) => ({
        walletAddress,
        walletDisplay: this.formatWalletAddress(walletAddress),
        totalMints: count,
        collections: { [collectionName]: count },
        latestMint: collectionNFTs.find(nft => nft.walletAddress === walletAddress)
      }))
      .sort((a, b) => b.totalMints - a.totalMints)
      .slice(0, limit);
    
    return topMinters;
  }

  /**
   * Format wallet address for display (first 4 + last 4)
   */
  private formatWalletAddress(address: string): string {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  /**
   * Search NFTs by wallet address or transaction signature
   */
  searchNFTs(query: string): ExplorerNFT[] {
    const allNFTs = this.getAllMintedNFTs();
    const lowerQuery = query.toLowerCase();
    
    return allNFTs.filter(nft => 
      nft.walletAddress.toLowerCase().includes(lowerQuery) ||
      nft.signature.toLowerCase().includes(lowerQuery) ||
      nft.collectionName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): {
    totalNFTs: number;
    totalWallets: number;
    totalCollections: number;
    recentMints: ExplorerNFT[];
  } {
    const allNFTs = this.getAllMintedNFTs();
    const uniqueWallets = new Set(allNFTs.map(nft => nft.walletAddress));
    const uniqueCollections = new Set(allNFTs.map(nft => nft.collectionName));
    
    return {
      totalNFTs: allNFTs.length,
      totalWallets: uniqueWallets.size,
      totalCollections: uniqueCollections.size,
      recentMints: allNFTs.slice(0, 10) // Top 10 most recent
    };
  }
}

// Export singleton instance
export const nftExplorerService = new NFTExplorerService();
