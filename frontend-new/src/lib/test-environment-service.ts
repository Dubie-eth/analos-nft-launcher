/**
 * Test Environment Service - Comprehensive testing environment for collection generation
 * Allows teams to test all functionality with real-time data before deployment
 */

export interface TestNFT {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity: number;
  }>;
  rarity: {
    score: number;
    rank: number;
    tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  price: number; // In $LOS
  isRevealed: boolean;
  owner?: string;
}

export interface TestCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  generatedNFTs: TestNFT[];
  metadata: {
    attributes: Array<{
      name: string;
      values: string[];
      weights: number[];
    }>;
    rarity: {
      totalCombinations: number;
      uniqueTraits: number;
      averageRarity: number;
    };
  };
  pricing: {
    basePrice: number;
    rarityMultipliers: Record<string, number>;
    tierPricing: Record<string, number>;
  };
  bondingCurve: {
    isActive: boolean;
    currentPrice: number;
    totalRaised: number;
    progressToReveal: number;
    isRevealed: boolean;
  };
  bridge: {
    isActive: boolean;
    supportedTokens: Array<{
      mint: string;
      symbol: string;
      priceInLOS: number;
    }>;
    liquidity: Record<string, number>;
  };
  stats: {
    totalGenerated: number;
    totalMinted: number;
    totalVolume: number;
    averagePrice: number;
    topRarity: number;
    lowestRarity: number;
  };
}

export interface TestTradingResult {
  success: boolean;
  transactionHash: string;
  nftsReceived?: number;
  losSpent?: number;
  tokensReceived?: number;
  error?: string;
}

export interface TestMintResult {
  success: boolean;
  nftId: number;
  nft: TestNFT;
  transactionHash: string;
  error?: string;
}

export interface TestGenerationConfig {
  collectionName: string;
  collectionSymbol: string;
  description: string;
  totalSupply: number;
  layers: Array<{
    name: string;
    traits: Array<{
      name: string;
      weight: number;
      imageUrl: string;
    }>;
  }>;
  rarityConfig: {
    enableRarity: boolean;
    rarityMultipliers: Record<string, number>;
  };
  pricingConfig: {
    basePrice: number;
    rarityPricing: boolean;
    tierPricing: boolean;
  };
}

export class TestEnvironmentService {
  private testCollections: Map<string, TestCollection> = new Map();
  private testWallet = 'TEST_WALLET_ADDRESS';
  private testLOSBalance = 1000000; // 1M $LOS for testing
  private testTokenBalances: Record<string, number> = {
    'So11111111111111111111111111111111111111112': 100, // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000000, // USDC
    'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 10000000, // LOL
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1000000 // USDT
  };

  /**
   * Generate test collection with real-time data
   */
  async generateTestCollection(config: TestGenerationConfig): Promise<TestCollection> {
    const collectionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate NFTs based on configuration
    const generatedNFTs = await this.generateNFTs(config);
    
    // Calculate rarity and metadata
    const metadata = this.calculateMetadata(config, generatedNFTs);
    
    // Set up pricing
    const pricing = this.calculatePricing(config, generatedNFTs);
    
    // Initialize bonding curve
    const bondingCurve = {
      isActive: true,
      currentPrice: config.pricingConfig.basePrice,
      totalRaised: 0,
      progressToReveal: 0,
      isRevealed: false
    };
    
    // Initialize bridge
    const bridge = {
      isActive: false, // Will activate after reveal
      supportedTokens: [
        { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', priceInLOS: 1000000 },
        { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', priceInLOS: 1 },
        { mint: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6', symbol: 'LOL', priceInLOS: 1 },
        { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', priceInLOS: 1 }
      ],
      liquidity: {
        'So11111111111111111111111111111111111111112': 1000000,
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000000,
        'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 1000000,
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1000000
      }
    };
    
    // Calculate stats
    const stats = this.calculateStats(generatedNFTs);
    
    const testCollection: TestCollection = {
      id: collectionId,
      name: config.collectionName,
      symbol: config.collectionSymbol,
      description: config.description,
      imageUrl: `https://picsum.photos/400/400?random=${collectionId}`,
      totalSupply: config.totalSupply,
      generatedNFTs,
      metadata,
      pricing,
      bondingCurve,
      bridge,
      stats
    };
    
    this.testCollections.set(collectionId, testCollection);
    return testCollection;
  }

  /**
   * Generate individual NFTs based on configuration
   */
  private async generateNFTs(config: TestGenerationConfig): Promise<TestNFT[]> {
    const nfts: TestNFT[] = [];
    
    for (let i = 1; i <= config.totalSupply; i++) {
      const nft = await this.generateSingleNFT(i, config);
      nfts.push(nft);
    }
    
    // Calculate rarity rankings after all NFTs are generated
    return this.calculateRarityRankings(nfts);
  }

  /**
   * Generate a single NFT with traits
   */
  private async generateSingleNFT(id: number, config: TestGenerationConfig): Promise<TestNFT> {
    const attributes: Array<{ trait_type: string; value: string; rarity: number }> = [];
    let rarityScore = 1;
    
    // Generate traits for each layer
    for (const layer of config.layers) {
      const selectedTrait = this.selectTraitByWeight(layer.traits);
      const rarity = this.calculateTraitRarity(selectedTrait, layer.traits);
      
      attributes.push({
        trait_type: layer.name,
        value: selectedTrait.name,
        rarity
      });
      
      rarityScore *= rarity;
    }
    
    // Calculate base price with rarity multiplier
    let price = config.pricingConfig.basePrice;
    if (config.pricingConfig.rarityPricing) {
      price *= rarityScore;
    }
    
    const nft: TestNFT = {
      id,
      name: `${config.collectionName} #${id}`,
      description: `${config.description} - This is NFT #${id}`,
      imageUrl: `https://picsum.photos/400/400?random=${id}`,
      attributes,
      rarity: {
        score: rarityScore,
        rank: 0, // Will be calculated later
        tier: this.getRarityTier(rarityScore)
      },
      price: Math.round(price),
      isRevealed: false
    };
    
    return nft;
  }

  /**
   * Select trait based on weight
   */
  private selectTraitByWeight(traits: Array<{ name: string; weight: number; imageUrl: string }>): { name: string; weight: number; imageUrl: string } {
    const totalWeight = traits.reduce((sum, trait) => sum + trait.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const trait of traits) {
      random -= trait.weight;
      if (random <= 0) {
        return trait;
      }
    }
    
    return traits[traits.length - 1];
  }

  /**
   * Calculate trait rarity based on weight
   */
  private calculateTraitRarity(selectedTrait: { name: string; weight: number; imageUrl: string }, allTraits: Array<{ name: string; weight: number; imageUrl: string }>): number {
    const totalWeight = allTraits.reduce((sum, trait) => sum + trait.weight, 0);
    return totalWeight / selectedTrait.weight;
  }

  /**
   * Calculate rarity rankings for all NFTs
   */
  private calculateRarityRankings(nfts: TestNFT[]): TestNFT[] {
    // Sort by rarity score (descending)
    const sorted = [...nfts].sort((a, b) => b.rarity.score - a.rarity.score);
    
    // Assign ranks
    sorted.forEach((nft, index) => {
      nft.rarity.rank = index + 1;
    });
    
    return sorted;
  }

  /**
   * Get rarity tier based on score
   */
  private getRarityTier(score: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (score >= 1000) return 'legendary';
    if (score >= 100) return 'epic';
    if (score >= 10) return 'rare';
    if (score >= 2) return 'uncommon';
    return 'common';
  }

  /**
   * Calculate collection metadata
   */
  private calculateMetadata(config: TestGenerationConfig, nfts: TestNFT[]) {
    const attributes = config.layers.map(layer => ({
      name: layer.name,
      values: layer.traits.map(trait => trait.name),
      weights: layer.traits.map(trait => trait.weight)
    }));
    
    const rarity = {
      totalCombinations: config.layers.reduce((total, layer) => total * layer.traits.length, 1),
      uniqueTraits: config.layers.reduce((total, layer) => total + layer.traits.length, 0),
      averageRarity: nfts.reduce((sum, nft) => sum + nft.rarity.score, 0) / nfts.length
    };
    
    return { attributes, rarity };
  }

  /**
   * Calculate pricing configuration
   */
  private calculatePricing(config: TestGenerationConfig, nfts: TestNFT[]) {
    const rarityMultipliers: Record<string, number> = {};
    
    // Calculate rarity multipliers
    if (config.rarityConfig.enableRarity) {
      const rarityCounts: Record<string, number> = {};
      nfts.forEach(nft => {
        const tier = nft.rarity.tier;
        rarityCounts[tier] = (rarityCounts[tier] || 0) + 1;
      });
      
      Object.keys(rarityCounts).forEach(tier => {
        rarityMultipliers[tier] = config.pricingConfig.basePrice * (nfts.length / rarityCounts[tier]);
      });
    }
    
    const tierPricing: Record<string, number> = {
      'common': config.pricingConfig.basePrice,
      'uncommon': config.pricingConfig.basePrice * 2,
      'rare': config.pricingConfig.basePrice * 5,
      'epic': config.pricingConfig.basePrice * 10,
      'legendary': config.pricingConfig.basePrice * 25
    };
    
    return {
      basePrice: config.pricingConfig.basePrice,
      rarityMultipliers,
      tierPricing
    };
  }

  /**
   * Calculate collection statistics
   */
  private calculateStats(nfts: TestNFT[]) {
    return {
      totalGenerated: nfts.length,
      totalMinted: 0,
      totalVolume: 0,
      averagePrice: nfts.reduce((sum, nft) => sum + nft.price, 0) / nfts.length,
      topRarity: Math.max(...nfts.map(nft => nft.rarity.score)),
      lowestRarity: Math.min(...nfts.map(nft => nft.rarity.score))
    };
  }

  /**
   * Test mint an NFT
   */
  async testMintNFT(collectionId: string, tierId?: string): Promise<TestMintResult> {
    const collection = this.testCollections.get(collectionId);
    if (!collection) {
      return { success: false, nftId: 0, nft: {} as TestNFT, transactionHash: '', error: 'Collection not found' };
    }
    
    // Find next available NFT
    const availableNFT = collection.generatedNFTs.find(nft => !nft.owner);
    if (!availableNFT) {
      return { success: false, nftId: 0, nft: {} as TestNFT, transactionHash: '', error: 'No NFTs available' };
    }
    
    // Calculate price based on tier
    let price = availableNFT.price;
    if (tierId && collection.pricing.tierPricing[tierId]) {
      price = collection.pricing.tierPricing[tierId];
    }
    
    // Check balance
    if (this.testLOSBalance < price) {
      return { success: false, nftId: 0, nft: {} as TestNFT, transactionHash: '', error: 'Insufficient balance' };
    }
    
    // Execute mint
    this.testLOSBalance -= price;
    availableNFT.owner = this.testWallet;
    availableNFT.isRevealed = true;
    
    collection.stats.totalMinted++;
    collection.stats.totalVolume += price;
    collection.bondingCurve.totalRaised += price;
    collection.bondingCurve.currentPrice = price * 1.1; // Price increases with each mint
    
    const transactionHash = `test_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      nftId: availableNFT.id,
      nft: { ...availableNFT },
      transactionHash
    };
  }

  /**
   * Test bonding curve trading
   */
  async testBondingCurveTrade(collectionId: string, losAmount: number, isBuy: boolean): Promise<TestTradingResult> {
    const collection = this.testCollections.get(collectionId);
    if (!collection) {
      return { success: false, transactionHash: '', error: 'Collection not found' };
    }
    
    if (isBuy) {
      // Buy NFTs with $LOS
      if (this.testLOSBalance < losAmount) {
        return { success: false, transactionHash: '', error: 'Insufficient $LOS balance' };
      }
      
      const nftsReceived = Math.floor(losAmount / collection.bondingCurve.currentPrice);
      const actualCost = nftsReceived * collection.bondingCurve.currentPrice;
      
      this.testLOSBalance -= actualCost;
      collection.bondingCurve.totalRaised += actualCost;
      collection.bondingCurve.currentPrice *= 1.05; // Price increases
      
      const transactionHash = `test_buy_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionHash,
        nftsReceived,
        losSpent: actualCost
      };
    } else {
      // Sell NFTs for $LOS (simplified)
      const losReceived = losAmount * collection.bondingCurve.currentPrice * 0.9; // 10% fee
      
      this.testLOSBalance += losReceived;
      collection.bondingCurve.currentPrice *= 0.95; // Price decreases
      
      const transactionHash = `test_sell_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionHash,
        tokensReceived: losReceived
      };
    }
  }

  /**
   * Test bridge trading
   */
  async testBridgeTrade(collectionId: string, nftAmount: number, tokenMint: string): Promise<TestTradingResult> {
    const collection = this.testCollections.get(collectionId);
    if (!collection) {
      return { success: false, transactionHash: '', error: 'Collection not found' };
    }
    
    if (!collection.bridge.isActive) {
      return { success: false, transactionHash: '', error: 'Bridge not active' };
    }
    
    const token = collection.bridge.supportedTokens.find(t => t.mint === tokenMint);
    if (!token) {
      return { success: false, transactionHash: '', error: 'Token not supported' };
    }
    
    const losValue = nftAmount * collection.bondingCurve.currentPrice;
    const tokenAmount = losValue / token.priceInLOS;
    
    // Check liquidity
    if (collection.bridge.liquidity[tokenMint] < tokenAmount) {
      return { success: false, transactionHash: '', error: 'Insufficient liquidity' };
    }
    
    // Execute trade
    this.testTokenBalances[tokenMint] += tokenAmount;
    collection.bridge.liquidity[tokenMint] -= tokenAmount;
    
    const transactionHash = `test_bridge_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transactionHash,
      tokensReceived: tokenAmount
    };
  }

  /**
   * Reveal collection
   */
  async revealCollection(collectionId: string): Promise<{ success: boolean; error?: string }> {
    const collection = this.testCollections.get(collectionId);
    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }
    
    // Check if bonding cap is reached
    if (collection.bondingCurve.totalRaised < 1000000) { // 1M $LOS cap for testing
      return { success: false, error: 'Bonding cap not reached' };
    }
    
    // Reveal all NFTs
    collection.generatedNFTs.forEach(nft => {
      nft.isRevealed = true;
    });
    
    collection.bondingCurve.isRevealed = true;
    collection.bridge.isActive = true;
    collection.bondingCurve.progressToReveal = 1;
    
    return { success: true };
  }

  /**
   * Get test collection
   */
  getTestCollection(collectionId: string): TestCollection | null {
    return this.testCollections.get(collectionId) || null;
  }

  /**
   * Get all test collections
   */
  getAllTestCollections(): TestCollection[] {
    return Array.from(this.testCollections.values());
  }

  /**
   * Get test wallet balance
   */
  getTestWalletBalance(): { los: number; tokens: Record<string, number> } {
    return {
      los: this.testLOSBalance,
      tokens: { ...this.testTokenBalances }
    };
  }

  /**
   * Reset test environment
   */
  resetTestEnvironment(): void {
    this.testCollections.clear();
    this.testLOSBalance = 1000000;
    this.testTokenBalances = {
      'So11111111111111111111111111111111111111112': 100,
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000000,
      'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6': 10000000,
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1000000
    };
  }

  /**
   * Export test collection for deployment
   */
  exportTestCollection(collectionId: string): { success: boolean; data?: any; error?: string } {
    const collection = this.testCollections.get(collectionId);
    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }
    
    // Prepare deployment data
    const deploymentData = {
      collection: {
        name: collection.name,
        symbol: collection.symbol,
        description: collection.description,
        imageUrl: collection.imageUrl,
        totalSupply: collection.totalSupply
      },
      nfts: collection.generatedNFTs.map(nft => ({
        id: nft.id,
        name: nft.name,
        description: nft.description,
        imageUrl: nft.imageUrl,
        attributes: nft.attributes
      })),
      metadata: collection.metadata,
      pricing: collection.pricing,
      bondingCurve: collection.bondingCurve,
      bridge: collection.bridge
    };
    
    return { success: true, data: deploymentData };
  }
}

export const testEnvironmentService = new TestEnvironmentService();
