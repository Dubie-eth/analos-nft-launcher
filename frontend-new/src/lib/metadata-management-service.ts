/**
 * Metadata Management Service
 * Handles metadata for pre/post reveal states of NFTs
 */

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    rarity?: string;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  collection?: {
    name: string;
    family: string;
  };
  properties?: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface PreRevealMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

export interface PostRevealMetadata extends NFTMetadata {
  revealedAt: number;
  rarityScore: number;
  rarityRank: number;
  traits: Array<{
    layerName: string;
    traitName: string;
    rarity: string;
    weight: number;
  }>;
}

export interface MetadataState {
  tokenId: number;
  collectionId: string;
  mintAddress: string;
  ownerAddress: string;
  mintTime: number;
  preRevealMetadata: PreRevealMetadata;
  postRevealMetadata?: PostRevealMetadata;
  isRevealed: boolean;
  revealTime?: number;
  lastUpdated: number;
}

export interface CollectionMetadataConfig {
  collectionId: string;
  collectionName: string;
  totalSupply: number;
  placeholderImage: string;
  placeholderDescription: string;
  revealMessage: string;
  baseMetadata: Partial<NFTMetadata>;
  rarityConfig: {
    common: { min: number; max: number; weight: number };
    uncommon: { min: number; max: number; weight: number };
    rare: { min: number; max: number; weight: number };
    epic: { min: number; max: number; weight: number };
    legendary: { min: number; max: number; weight: number };
  };
}

export class MetadataManagementService {
  private metadataStates: Map<string, MetadataState> = new Map();
  private collectionConfigs: Map<string, CollectionMetadataConfig> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialize collection metadata configuration
   */
  initializeCollection(config: CollectionMetadataConfig): void {
    this.collectionConfigs.set(config.collectionId, config);
    this.saveToStorage();
  }

  /**
   * Create pre-reveal metadata for a new NFT
   */
  createPreRevealMetadata(
    tokenId: number,
    collectionId: string,
    mintAddress: string,
    ownerAddress: string
  ): PreRevealMetadata {
    const config = this.collectionConfigs.get(collectionId);
    if (!config) {
      throw new Error(`Collection config not found for ${collectionId}`);
    }

    const preRevealMetadata: PreRevealMetadata = {
      name: `${config.collectionName} #${tokenId}`,
      description: config.placeholderDescription,
      image: config.placeholderImage,
      attributes: [
        { trait_type: 'Status', value: 'Unrevealed' },
        { trait_type: 'Collection', value: config.collectionName },
        { trait_type: 'Token ID', value: tokenId }
      ],
      external_url: config.baseMetadata.external_url,
      animation_url: config.baseMetadata.animation_url,
      background_color: config.baseMetadata.background_color
    };

    // Store metadata state
    const metadataState: MetadataState = {
      tokenId,
      collectionId,
      mintAddress,
      ownerAddress,
      mintTime: Date.now(),
      preRevealMetadata,
      isRevealed: false,
      lastUpdated: Date.now()
    };

    this.metadataStates.set(mintAddress, metadataState);
    this.saveToStorage();

    return preRevealMetadata;
  }

  /**
   * Reveal NFT and create post-reveal metadata
   */
  revealNFT(
    mintAddress: string,
    postRevealMetadata: PostRevealMetadata,
    finalImageUrl: string
  ): void {
    const metadataState = this.metadataStates.get(mintAddress);
    if (!metadataState) {
      throw new Error(`NFT metadata not found for ${mintAddress}`);
    }

    // Calculate rarity score and rank
    const rarityScore = this.calculateRarityScore(postRevealMetadata.traits);
    const rarityRank = this.calculateRarityRank(mintAddress, rarityScore);

    // Create post-reveal metadata
    const revealedMetadata: PostRevealMetadata = {
      ...postRevealMetadata,
      name: `${metadataState.preRevealMetadata.name}`,
      image: finalImageUrl,
      revealedAt: Date.now(),
      rarityScore,
      rarityRank,
      traits: postRevealMetadata.traits
    };

    // Update metadata state
    metadataState.postRevealMetadata = revealedMetadata;
    metadataState.isRevealed = true;
    metadataState.revealTime = Date.now();
    metadataState.lastUpdated = Date.now();

    this.metadataStates.set(mintAddress, metadataState);
    this.saveToStorage();
  }

  /**
   * Get metadata for an NFT (pre or post reveal)
   */
  getNFTMetadata(mintAddress: string): NFTMetadata | null {
    const metadataState = this.metadataStates.get(mintAddress);
    if (!metadataState) {
      return null;
    }

    if (metadataState.isRevealed && metadataState.postRevealMetadata) {
      return metadataState.postRevealMetadata;
    }

    return metadataState.preRevealMetadata;
  }

  /**
   * Get metadata state for an NFT
   */
  getMetadataState(mintAddress: string): MetadataState | null {
    return this.metadataStates.get(mintAddress) || null;
  }

  /**
   * Update metadata for an NFT (before reveal)
   */
  updatePreRevealMetadata(
    mintAddress: string,
    updates: Partial<PreRevealMetadata>
  ): void {
    const metadataState = this.metadataStates.get(mintAddress);
    if (!metadataState) {
      throw new Error(`NFT metadata not found for ${mintAddress}`);
    }

    if (metadataState.isRevealed) {
      throw new Error('Cannot update metadata after reveal');
    }

    metadataState.preRevealMetadata = {
      ...metadataState.preRevealMetadata,
      ...updates
    };
    metadataState.lastUpdated = Date.now();

    this.metadataStates.set(mintAddress, metadataState);
    this.saveToStorage();
  }

  /**
   * Get all NFTs for a collection
   */
  getCollectionNFTs(collectionId: string): MetadataState[] {
    return Array.from(this.metadataStates.values())
      .filter(state => state.collectionId === collectionId)
      .sort((a, b) => a.tokenId - b.tokenId);
  }

  /**
   * Get revealed NFTs for a collection
   */
  getRevealedNFTs(collectionId: string): MetadataState[] {
    return this.getCollectionNFTs(collectionId)
      .filter(state => state.isRevealed);
  }

  /**
   * Get unrevealed NFTs for a collection
   */
  getUnrevealedNFTs(collectionId: string): MetadataState[] {
    return this.getCollectionNFTs(collectionId)
      .filter(state => !state.isRevealed);
  }

  /**
   * Calculate rarity score based on traits
   */
  private calculateRarityScore(traits: Array<{ rarity: string; weight: number }>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const trait of traits) {
      totalScore += trait.weight;
      totalWeight += 100; // Assuming max weight is 100
    }

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  /**
   * Calculate rarity rank within collection
   */
  private calculateRarityRank(mintAddress: string, rarityScore: number): number {
    const metadataState = this.metadataStates.get(mintAddress);
    if (!metadataState) return 0;

    const collectionNFTs = this.getRevealedNFTs(metadataState.collectionId);
    const sortedNFTs = collectionNFTs.sort((a, b) => {
      const aScore = a.postRevealMetadata?.rarityScore || 0;
      const bScore = b.postRevealMetadata?.rarityScore || 0;
      return bScore - aScore; // Higher score = rarer
    });

    const rank = sortedNFTs.findIndex(nft => nft.mintAddress === mintAddress);
    return rank >= 0 ? rank + 1 : 0;
  }

  /**
   * Generate metadata JSON for blockchain
   */
  generateMetadataJSON(mintAddress: string): string {
    const metadata = this.getNFTMetadata(mintAddress);
    if (!metadata) {
      throw new Error(`Metadata not found for ${mintAddress}`);
    }

    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Validate metadata structure
   */
  validateMetadata(metadata: NFTMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.name || typeof metadata.name !== 'string') {
      errors.push('Name is required and must be a string');
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
      errors.push('Description is required and must be a string');
    }

    if (!metadata.image || typeof metadata.image !== 'string') {
      errors.push('Image URL is required and must be a string');
    }

    if (!Array.isArray(metadata.attributes)) {
      errors.push('Attributes must be an array');
    } else {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || !attr.value) {
          errors.push(`Attribute ${index} is missing trait_type or value`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export metadata for collection
   */
  exportCollectionMetadata(collectionId: string): { [tokenId: string]: NFTMetadata } {
    const collectionNFTs = this.getCollectionNFTs(collectionId);
    const exportData: { [tokenId: string]: NFTMetadata } = {};

    collectionNFTs.forEach(nft => {
      const metadata = this.getNFTMetadata(nft.mintAddress);
      if (metadata) {
        exportData[nft.tokenId.toString()] = metadata;
      }
    });

    return exportData;
  }

  /**
   * Import metadata for collection
   */
  importCollectionMetadata(
    collectionId: string,
    metadataData: { [tokenId: string]: NFTMetadata }
  ): void {
    Object.entries(metadataData).forEach(([tokenId, metadata]) => {
      const mintAddress = `mint_${collectionId}_${tokenId}`;
      const ownerAddress = 'imported';
      
      // Create pre-reveal metadata
      const preRevealMetadata: PreRevealMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes,
        external_url: metadata.external_url,
        animation_url: metadata.animation_url,
        background_color: metadata.background_color
      };

      const metadataState: MetadataState = {
        tokenId: parseInt(tokenId),
        collectionId,
        mintAddress,
        ownerAddress,
        mintTime: Date.now(),
        preRevealMetadata,
        isRevealed: true, // Assume imported metadata is revealed
        revealTime: Date.now(),
        lastUpdated: Date.now()
      };

      this.metadataStates.set(mintAddress, metadataState);
    });

    this.saveToStorage();
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('metadata_states', JSON.stringify(
          Array.from(this.metadataStates.entries())
        ));
        localStorage.setItem('collection_configs', JSON.stringify(
          Array.from(this.collectionConfigs.entries())
        ));
      } catch (error) {
        console.error('Error saving metadata to storage:', error);
      }
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedStates = localStorage.getItem('metadata_states');
        if (storedStates) {
          const states = new Map(JSON.parse(storedStates));
          this.metadataStates = states;
        }

        const storedConfigs = localStorage.getItem('collection_configs');
        if (storedConfigs) {
          const configs = new Map(JSON.parse(storedConfigs));
          this.collectionConfigs = configs;
        }
      } catch (error) {
        console.error('Error loading metadata from storage:', error);
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.metadataStates.clear();
    this.collectionConfigs.clear();
    this.cache.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('metadata_states');
      localStorage.removeItem('collection_configs');
    }
  }

  /**
   * Get collection statistics
   */
  getCollectionStats(collectionId: string): {
    total: number;
    revealed: number;
    unrevealed: number;
    averageRarityScore: number;
    topRarity: number;
  } {
    const collectionNFTs = this.getCollectionNFTs(collectionId);
    const revealedNFTs = this.getRevealedNFTs(collectionId);
    
    const total = collectionNFTs.length;
    const revealed = revealedNFTs.length;
    const unrevealed = total - revealed;
    
    let averageRarityScore = 0;
    let topRarity = 0;
    
    if (revealed > 0) {
      const totalScore = revealedNFTs.reduce((sum, nft) => 
        sum + (nft.postRevealMetadata?.rarityScore || 0), 0
      );
      averageRarityScore = totalScore / revealed;
      topRarity = Math.max(...revealedNFTs.map(nft => 
        nft.postRevealMetadata?.rarityScore || 0
      ));
    }

    return {
      total,
      revealed,
      unrevealed,
      averageRarityScore,
      topRarity
    };
  }
}

// Export singleton instance
export const metadataManagementService = new MetadataManagementService();
export default metadataManagementService;
