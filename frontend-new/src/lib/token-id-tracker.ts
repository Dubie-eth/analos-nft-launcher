// Enhanced token ID tracking with Metaplex integration
// In a production app, this would be stored in a database or on-chain

interface TokenIdMapping {
  [mintAddress: string]: {
    collectionName: string;
    tokenId: number;
    collectionMint: string;
    metadataUri?: string;
    createdAt: number;
  };
}

interface CollectionInfo {
  name: string;
  mint: string;
  totalSupply: number;
  mintedCount: number;
  mintPrice: number;
  createdAt: number;
}

class TokenIdTracker {
  private tokenMappings: TokenIdMapping = {};
  private collectionCounters: { [collectionMint: string]: number } = {};
  private collections: { [collectionMint: string]: CollectionInfo } = {};

  // Create a new collection
  createCollection(collectionMint: string, collectionName: string, totalSupply: number, mintPrice: number): void {
    this.collections[collectionMint] = {
      name: collectionName,
      mint: collectionMint,
      totalSupply,
      mintedCount: 0,
      mintPrice,
      createdAt: Date.now()
    };
    
    this.collectionCounters[collectionMint] = 0;
    console.log(`🏗️ Created collection: ${collectionName} (${collectionMint})`);
  }

  // Add a new NFT to the tracking system
  addNFT(mintAddress: string, collectionName: string, collectionMint: string, metadataUri?: string): number {
    if (!this.collectionCounters[collectionMint]) {
      this.collectionCounters[collectionMint] = 0;
    }
    
    const tokenId = ++this.collectionCounters[collectionMint];
    
    this.tokenMappings[mintAddress] = {
      collectionName,
      tokenId,
      collectionMint,
      metadataUri,
      createdAt: Date.now()
    };

    // Update collection minted count
    if (this.collections[collectionMint]) {
      this.collections[collectionMint].mintedCount = tokenId;
    }

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
  getCollectionInfo(collectionMint: string): CollectionInfo | null {
    return this.collections[collectionMint] || null;
  }

  // Get all collections
  getAllCollections(): CollectionInfo[] {
    return Object.values(this.collections);
  }

  // Get collection statistics
  getCollectionStats(collectionMint: string): {
    totalSupply: number;
    mintedCount: number;
    remainingCount: number;
    mintPrice: number;
    progressPercentage: number;
  } | null {
    const collection = this.collections[collectionMint];
    if (!collection) return null;

    const remainingCount = collection.totalSupply - collection.mintedCount;
    const progressPercentage = (collection.mintedCount / collection.totalSupply) * 100;

    return {
      totalSupply: collection.totalSupply,
      mintedCount: collection.mintedCount,
      remainingCount,
      mintPrice: collection.mintPrice,
      progressPercentage
    };
  }

  // Clear all data for fresh start
  clearAllData() {
    this.tokenMappings = {};
    this.collectionCounters = {};
    this.collections = {};
    console.log('🧹 Cleared all token ID tracking data and collections');
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

// Clear all data for fresh start
tokenIdTracker.clearAllData();
