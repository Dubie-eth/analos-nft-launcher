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
  // Advanced minting features
  maxMintsPerWallet: number;
  delayedReveal: {
    enabled: boolean;
    type: 'timer' | 'completion' | 'manual';
    revealTime?: number; // Unix timestamp for timer
    revealAtCompletion?: boolean;
    placeholderImage: string;
    revealedImage?: string;
  };
  whitelist: {
    enabled: boolean;
    addresses: string[];
    phases: WhitelistPhase[];
  };
}

interface WhitelistPhase {
  name: string;
  startTime: number;
  endTime: number;
  maxMintsPerWallet: number;
  price: number;
  addresses: string[];
  active: boolean;
}

interface WalletMintCount {
  [walletAddress: string]: {
    totalMints: number;
    phaseMints: { [phaseName: string]: number };
    lastMintTime: number;
  };
}

class TokenIdTracker {
  private tokenMappings: TokenIdMapping = {};
  private collectionCounters: { [collectionMint: string]: number } = {};
  private collections: { [collectionMint: string]: CollectionInfo } = {};
  private walletMintCounts: { [collectionMint: string]: WalletMintCount } = {};

  // Create a new collection with advanced features
  createCollection(
    collectionMint: string, 
    collectionName: string, 
    totalSupply: number, 
    mintPrice: number,
    options: {
      maxMintsPerWallet?: number;
      delayedReveal?: {
        enabled: boolean;
        type: 'timer' | 'completion' | 'manual';
        revealTime?: number;
        revealAtCompletion?: boolean;
        placeholderImage: string;
      };
      whitelist?: {
        enabled: boolean;
        addresses?: string[];
        phases?: WhitelistPhase[];
      };
    } = {}
  ): void {
    this.collections[collectionMint] = {
      name: collectionName,
      mint: collectionMint,
      totalSupply,
      mintedCount: 0,
      mintPrice,
      createdAt: Date.now(),
      maxMintsPerWallet: options.maxMintsPerWallet || 10,
      delayedReveal: {
        enabled: options.delayedReveal?.enabled || false,
        type: options.delayedReveal?.type || 'manual',
        revealTime: options.delayedReveal?.revealTime,
        revealAtCompletion: options.delayedReveal?.revealAtCompletion || false,
        placeholderImage: options.delayedReveal?.placeholderImage || 'https://picsum.photos/300/300?random=placeholder'
      },
      whitelist: {
        enabled: options.whitelist?.enabled || false,
        addresses: options.whitelist?.addresses || [],
        phases: options.whitelist?.phases || []
      }
    };
    
    this.collectionCounters[collectionMint] = 0;
    this.walletMintCounts[collectionMint] = {};
    console.log(`🏗️ Created collection: ${collectionName} (${collectionMint}) with advanced features`);
  }

  // Add a new NFT to the tracking system
  addNFT(mintAddress: string, collectionName: string, collectionMint: string, walletAddress: string, metadataUri?: string, phaseName?: string): number {
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

    // Update wallet mint counts
    if (!this.walletMintCounts[collectionMint]) {
      this.walletMintCounts[collectionMint] = {};
    }
    
    if (!this.walletMintCounts[collectionMint][walletAddress]) {
      this.walletMintCounts[collectionMint][walletAddress] = {
        totalMints: 0,
        phaseMints: {},
        lastMintTime: 0
      };
    }

    this.walletMintCounts[collectionMint][walletAddress].totalMints++;
    this.walletMintCounts[collectionMint][walletAddress].lastMintTime = Date.now();

    if (phaseName) {
      this.walletMintCounts[collectionMint][walletAddress].phaseMints[phaseName] = 
        (this.walletMintCounts[collectionMint][walletAddress].phaseMints[phaseName] || 0) + 1;
    }

    console.log(`📝 Tracked NFT: ${mintAddress} -> ${collectionName} #${tokenId} (Wallet: ${walletAddress})`);
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

  // Whitelist management
  addToWhitelist(collectionMint: string, addresses: string[]): void {
    if (this.collections[collectionMint]) {
      this.collections[collectionMint].whitelist.addresses = [
        ...new Set([...this.collections[collectionMint].whitelist.addresses, ...addresses])
      ];
      console.log(`📝 Added ${addresses.length} addresses to whitelist for ${collectionMint}`);
    }
  }

  removeFromWhitelist(collectionMint: string, addresses: string[]): void {
    if (this.collections[collectionMint]) {
      this.collections[collectionMint].whitelist.addresses = 
        this.collections[collectionMint].whitelist.addresses.filter(addr => !addresses.includes(addr));
      console.log(`🗑️ Removed ${addresses.length} addresses from whitelist for ${collectionMint}`);
    }
  }

  // Whitelist phase management
  addWhitelistPhase(collectionMint: string, phase: WhitelistPhase): void {
    if (this.collections[collectionMint]) {
      this.collections[collectionMint].whitelist.phases.push(phase);
      console.log(`📅 Added whitelist phase "${phase.name}" to ${collectionMint}`);
    }
  }

  updateWhitelistPhase(collectionMint: string, phaseName: string, updates: Partial<WhitelistPhase>): void {
    if (this.collections[collectionMint]) {
      const phaseIndex = this.collections[collectionMint].whitelist.phases.findIndex(p => p.name === phaseName);
      if (phaseIndex !== -1) {
        this.collections[collectionMint].whitelist.phases[phaseIndex] = {
          ...this.collections[collectionMint].whitelist.phases[phaseIndex],
          ...updates
        };
        console.log(`📝 Updated whitelist phase "${phaseName}" for ${collectionMint}`);
      }
    }
  }

  // Wallet mint count tracking
  canMint(collectionMint: string, walletAddress: string, quantity: number = 1): {
    canMint: boolean;
    reason?: string;
    currentCount: number;
    maxAllowed: number;
    phaseInfo?: any;
  } {
    const collection = this.collections[collectionMint];
    if (!collection) {
      return { canMint: false, reason: 'Collection not found', currentCount: 0, maxAllowed: 0 };
    }

    const walletCounts = this.walletMintCounts[collectionMint]?.[walletAddress] || {
      totalMints: 0,
      phaseMints: {},
      lastMintTime: 0
    };

    // Check whitelist phases first
    const activePhase = collection.whitelist.phases.find(phase => 
      phase.active && 
      Date.now() >= phase.startTime && 
      Date.now() <= phase.endTime &&
      phase.addresses.includes(walletAddress)
    );

    if (activePhase) {
      const phaseMintCount = walletCounts.phaseMints[activePhase.name] || 0;
      if (phaseMintCount + quantity > activePhase.maxMintsPerWallet) {
        return {
          canMint: false,
          reason: `Exceeds phase limit (${activePhase.maxMintsPerWallet} per wallet)`,
          currentCount: phaseMintCount,
          maxAllowed: activePhase.maxMintsPerWallet,
          phaseInfo: { phase: activePhase.name, price: activePhase.price }
        };
      }
    } else if (collection.whitelist.enabled) {
      // Check general whitelist
      if (!collection.whitelist.addresses.includes(walletAddress)) {
        return {
          canMint: false,
          reason: 'Wallet not on whitelist',
          currentCount: walletCounts.totalMints,
          maxAllowed: collection.maxMintsPerWallet
        };
      }
    }

    // Check overall mint limit
    if (walletCounts.totalMints + quantity > collection.maxMintsPerWallet) {
      return {
        canMint: false,
        reason: `Exceeds wallet limit (${collection.maxMintsPerWallet} per wallet)`,
        currentCount: walletCounts.totalMints,
        maxAllowed: collection.maxMintsPerWallet
      };
    }

    return {
      canMint: true,
      currentCount: walletCounts.totalMints,
      maxAllowed: activePhase?.maxMintsPerWallet || collection.maxMintsPerWallet,
      phaseInfo: activePhase ? { phase: activePhase.name, price: activePhase.price } : undefined
    };
  }

  // Delayed reveal management
  isRevealed(collectionMint: string): boolean {
    const collection = this.collections[collectionMint];
    if (!collection || !collection.delayedReveal.enabled) return true;

    switch (collection.delayedReveal.type) {
      case 'timer':
        return Date.now() >= (collection.delayedReveal.revealTime || 0);
      case 'completion':
        return collection.delayedReveal.revealAtCompletion ? 
          collection.mintedCount >= collection.totalSupply : false;
      case 'manual':
        return !!collection.delayedReveal.revealedImage;
      default:
        return true;
    }
  }

  manualReveal(collectionMint: string, revealedImageUrl: string): void {
    if (this.collections[collectionMint]?.delayedReveal.enabled) {
      this.collections[collectionMint].delayedReveal.revealedImage = revealedImageUrl;
      console.log(`🎉 Manual reveal triggered for collection ${collectionMint}`);
    }
  }

  // Clear all data for fresh start
  clearAllData() {
    this.tokenMappings = {};
    this.collectionCounters = {};
    this.collections = {};
    this.walletMintCounts = {};
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
