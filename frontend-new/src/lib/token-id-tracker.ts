// Simple in-memory token ID tracking
// In a production app, this would be stored in a database or on-chain

interface TokenIdMapping {
  [mintAddress: string]: {
    collectionName: string;
    tokenId: number;
    collectionMint: string;
  };
}

class TokenIdTracker {
  private tokenMappings: TokenIdMapping = {};
  private collectionCounters: { [collectionMint: string]: number } = {};

  // Add a new NFT to the tracking system
  addNFT(mintAddress: string, collectionName: string, collectionMint: string): number {
    if (!this.collectionCounters[collectionMint]) {
      this.collectionCounters[collectionMint] = 0;
    }
    
    const tokenId = ++this.collectionCounters[collectionMint];
    
    this.tokenMappings[mintAddress] = {
      collectionName,
      tokenId,
      collectionMint
    };

    console.log(`📝 Tracked NFT: ${mintAddress} -> ${collectionName} #${tokenId}`);
    return tokenId;
  }

  // Get token information for a mint address
  getTokenInfo(mintAddress: string): { collectionName: string; tokenId: number; collectionMint: string } | null {
    return this.tokenMappings[mintAddress] || null;
  }

  // Get all NFTs for a collection
  getCollectionNFTs(collectionMint: string): string[] {
    return Object.keys(this.tokenMappings).filter(
      mint => this.tokenMappings[mint].collectionMint === collectionMint
    );
  }

  // Get collection info
  getCollectionInfo(collectionMint: string): { name: string; totalSupply: number } | null {
    const nfts = this.getCollectionNFTs(collectionMint);
    if (nfts.length === 0) return null;

    const firstNFT = this.tokenMappings[nfts[0]];
    return {
      name: firstNFT.collectionName,
      totalSupply: nfts.length
    };
  }

  // Initialize with some sample data for testing
  initializeSampleData() {
    // Add some sample mappings for testing
    this.addNFT('5AWa2uJS...', 'LOL Genesis Collection', 'collection1');
    this.addNFT('3w2Ss8ve...', 'LOL Genesis Collection', 'collection1');
    
    console.log('🎯 Initialized sample token ID data');
  }
}

// Export singleton instance
export const tokenIdTracker = new TokenIdTracker();

// Initialize with sample data for now
tokenIdTracker.initializeSampleData();
