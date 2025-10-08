/**
 * User NFT Tracker Service
 * Tracks and displays user's minted NFTs
 */

export interface MintedNFT {
  id: string;
  signature: string;
  collectionName: string;
  phase: string;
  timestamp: number;
  walletAddress: string;
  quantity: number;
  explorerUrl: string;
  tokenId: number; // Add unique token ID
}

export class UserNFTTracker {
  /**
   * Generate unique token ID for a collection
   * Uses timestamp-based approach to ensure uniqueness across all users
   */
  generateTokenId(collectionName: string): number {
    try {
      // Get all existing NFTs for this collection across all users
      const allExistingNFTs: MintedNFT[] = [];
      
      // Check localStorage for all users' minted NFTs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('minted_nfts_')) {
          try {
            const userNFTs = JSON.parse(localStorage.getItem(key) || '[]');
            const collectionNFTs = userNFTs.filter((nft: MintedNFT) => 
              nft.collectionName === collectionName
            );
            allExistingNFTs.push(...collectionNFTs);
          } catch (error) {
            console.warn('Failed to parse user NFTs:', error);
          }
        }
      }
      
      // Find the highest token ID for this collection
      const maxTokenId = allExistingNFTs.reduce((max, nft) => 
        Math.max(max, nft.tokenId || 0), 0
      );
      
      // Generate new token ID (highest + 1)
      const newTokenId = maxTokenId + 1;
      
      console.log(`🎯 Generated token ID ${newTokenId} for collection ${collectionName} (max existing: ${maxTokenId})`);
      return newTokenId;
      
    } catch (error) {
      console.error('Error generating token ID:', error);
      // Fallback to timestamp-based ID
      return Math.floor(Date.now() / 1000) % 1000000;
    }
  }

  /**
   * Get all minted NFTs for a wallet
   */
  getMintedNFTs(walletAddress: string): MintedNFT[] {
    try {
      const mintedNFTsKey = `minted_nfts_${walletAddress.toLowerCase()}`;
      const mintedNFTs = JSON.parse(localStorage.getItem(mintedNFTsKey) || '[]');
      
      // Sort by timestamp (newest first)
      return mintedNFTs.sort((a: MintedNFT, b: MintedNFT) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting minted NFTs:', error);
      return [];
    }
  }

  /**
   * Get minted NFTs for a specific collection
   */
  getMintedNFTsForCollection(walletAddress: string, collectionName: string): MintedNFT[] {
    const allNFTs = this.getMintedNFTs(walletAddress);
    return allNFTs.filter(nft => nft.collectionName === collectionName);
  }

  /**
   * Get minted NFTs for a specific phase
   */
  getMintedNFTsForPhase(walletAddress: string, phaseId: string): MintedNFT[] {
    const allNFTs = this.getMintedNFTs(walletAddress);
    return allNFTs.filter(nft => nft.phase === phaseId);
  }

  /**
   * Get total count of minted NFTs for a collection
   */
  getTotalMintedCount(walletAddress: string, collectionName: string): number {
    const collectionNFTs = this.getMintedNFTsForCollection(walletAddress, collectionName);
    return collectionNFTs.reduce((total, nft) => total + nft.quantity, 0);
  }

  /**
   * Get minted NFTs count for a specific phase
   */
  getPhaseMintedCount(walletAddress: string, collectionName: string, phaseId: string): number {
    const allNFTs = this.getMintedNFTs(walletAddress);
    const phaseNFTs = allNFTs.filter(nft => 
      nft.collectionName === collectionName && nft.phase === phaseId
    );
    return phaseNFTs.reduce((total, nft) => total + nft.quantity, 0);
  }

  /**
   * Clear all minted NFT data (for testing)
   */
  clearMintedNFTs(walletAddress: string): void {
    const mintedNFTsKey = `minted_nfts_${walletAddress.toLowerCase()}`;
    localStorage.removeItem(mintedNFTsKey);
    console.log('🧹 Cleared minted NFT data for wallet:', walletAddress);
  }

  /**
   * Get mint statistics for a wallet
   */
  getMintStatistics(walletAddress: string): {
    totalNFTs: number;
    collections: { [collectionName: string]: number };
    phases: { [phaseId: string]: number };
    lastMint?: MintedNFT;
  } {
    const allNFTs = this.getMintedNFTs(walletAddress);
    
    const collections: { [collectionName: string]: number } = {};
    const phases: { [phaseId: string]: number } = {};
    
    let totalNFTs = 0;
    let lastMint: MintedNFT | undefined;
    
    allNFTs.forEach(nft => {
      totalNFTs += nft.quantity;
      
      // Count by collection
      if (!collections[nft.collectionName]) {
        collections[nft.collectionName] = 0;
      }
      collections[nft.collectionName] += nft.quantity;
      
      // Count by phase
      if (!phases[nft.phase]) {
        phases[nft.phase] = 0;
      }
      phases[nft.phase] += nft.quantity;
      
      // Track latest mint
      if (!lastMint || nft.timestamp > lastMint.timestamp) {
        lastMint = nft;
      }
    });
    
    return {
      totalNFTs,
      collections,
      phases,
      lastMint
    };
  }
}

// Export singleton instance
export const userNFTTracker = new UserNFTTracker();
