/**
 * ADAPTIVE NFT SERVICE
 * Creates NFTs that adapt to the holder's wallet composition and holdings
 */

interface WalletAnalysis {
  walletAddress: string;
  totalSOL: number;
  totalTokens: number;
  nftCollections: CollectionData[];
  tokenHoldings: TokenData[];
  tradingActivity: TradingData;
  portfolioValue: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive' | 'degen';
  interests: string[];
  personality: NFTPersonality;
}

interface CollectionData {
  collection: string;
  name: string;
  count: number;
  floorPrice: number;
  totalValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'art' | 'gaming' | 'pfp' | 'utility' | 'collectible';
}

interface TokenData {
  mint: string;
  symbol: string;
  amount: number;
  value: number;
  category: 'meme' | 'defi' | 'utility' | 'governance';
}

interface TradingData {
  totalTrades: number;
  volume30d: number;
  favoriteDEX: string;
  tradingFrequency: 'low' | 'medium' | 'high' | 'whale';
}

interface NFTPersonality {
  style: 'minimalist' | 'maximalist' | 'abstract' | 'realistic' | 'futuristic';
  color: 'monochrome' | 'vibrant' | 'pastel' | 'neon' | 'earth';
  mood: 'calm' | 'energetic' | 'mysterious' | 'playful' | 'serious';
  traits: string[];
}

interface AdaptiveNFTConfig {
  basePrompt: string;
  adaptationLevel: 'subtle' | 'moderate' | 'extreme';
  updateFrequency: 'daily' | 'weekly' | 'on_transfer';
  personalityWeight: number; // 0-1, how much personality affects the NFT
}

interface AdaptiveNFTState {
  tokenId: string;
  currentHolder: string;
  walletAnalysis: WalletAnalysis;
  currentVersion: string;
  adaptations: NFTAdaptation[];
  lastUpdate: Date;
  nextUpdate: Date;
}

interface NFTAdaptation {
  version: string;
  holderWallet: string;
  prompt: string;
  imageUrl: string;
  videoUrl?: string;
  traits: Record<string, any>;
  personalityInfluence: number;
  walletInfluence: string[];
  createdAt: Date;
}

class AdaptiveNFTService {
  private nfts: Map<string, AdaptiveNFTState> = new Map();
  private webhookEndpoints: Map<string, string> = new Map();

  constructor() {
    // Initialize webhook endpoints for different collections
    this.webhookEndpoints.set('analos_adaptive_collection', '/api/webhooks/adaptive-nft');
  }

  /**
   * Analyze a wallet and create personality profile
   */
  async analyzeWallet(walletAddress: string): Promise<WalletAnalysis> {
    try {
      // Fetch wallet data from multiple sources
      const [nftData, tokenData, tradingData] = await Promise.all([
        this.fetchNFTData(walletAddress),
        this.fetchTokenData(walletAddress),
        this.fetchTradingData(walletAddress)
      ]);

      // Calculate portfolio metrics
      const portfolioValue = nftData.reduce((sum, nft) => sum + nft.totalValue, 0) +
                            tokenData.reduce((sum, token) => sum + token.value, 0);

      // Determine risk profile based on holdings
      const riskProfile = this.calculateRiskProfile(nftData, tokenData, tradingData);
      
      // Generate personality based on holdings
      const personality = this.generatePersonality(nftData, tokenData, riskProfile);
      
      // Extract interests from holdings
      const interests = this.extractInterests(nftData, tokenData);

      return {
        walletAddress,
        totalSOL: 0, // Would fetch from RPC
        totalTokens: tokenData.length,
        nftCollections: nftData,
        tokenHoldings: tokenData,
        tradingActivity: tradingData,
        portfolioValue,
        riskProfile: riskProfile as 'conservative' | 'moderate' | 'aggressive' | 'degen',
        interests,
        personality
      };

    } catch (error) {
      console.error('Error analyzing wallet:', error);
      throw new Error('Failed to analyze wallet');
    }
  }

  /**
   * Create or update an adaptive NFT
   */
  async createAdaptiveNFT(
    tokenId: string,
    holderWallet: string,
    config: AdaptiveNFTConfig
  ): Promise<AdaptiveNFTState> {
    try {
      // Analyze the holder's wallet
      const walletAnalysis = await this.analyzeWallet(holderWallet);
      
      // Generate initial adaptation
      const initialAdaptation = await this.generateAdaptation(
        config.basePrompt,
        walletAnalysis,
        config,
        '1.0'
      );

      // Create NFT state
      const nftState: AdaptiveNFTState = {
        tokenId,
        currentHolder: holderWallet,
        walletAnalysis,
        currentVersion: '1.0',
        adaptations: [initialAdaptation],
        lastUpdate: new Date(),
        nextUpdate: this.calculateNextUpdate(config.updateFrequency)
      };

      this.nfts.set(tokenId, nftState);

      // Set up webhook for this NFT
      await this.setupWebhook(tokenId, holderWallet);

      return nftState;

    } catch (error) {
      console.error('Error creating adaptive NFT:', error);
      throw new Error('Failed to create adaptive NFT');
    }
  }

  /**
   * Update NFT when holder changes or on schedule
   */
  async updateAdaptiveNFT(tokenId: string, newHolderWallet?: string): Promise<NFTAdaptation> {
    const nftState = this.nfts.get(tokenId);
    if (!nftState) {
      throw new Error(`Adaptive NFT ${tokenId} not found`);
    }

    const holderWallet = newHolderWallet || nftState.currentHolder;
    
    // Re-analyze wallet if holder changed
    let walletAnalysis = nftState.walletAnalysis;
    if (newHolderWallet && newHolderWallet !== nftState.currentHolder) {
      walletAnalysis = await this.analyzeWallet(holderWallet);
    }

    // Get current config (would be stored with NFT metadata)
    const config: AdaptiveNFTConfig = {
      basePrompt: 'An adaptive digital being that reflects its holder',
      adaptationLevel: 'moderate',
      updateFrequency: 'daily',
      personalityWeight: 0.7
    };

    // Generate new adaptation
    const newVersion = this.incrementVersion(nftState.currentVersion);
    const newAdaptation = await this.generateAdaptation(
      config.basePrompt,
      walletAnalysis,
      config,
      newVersion
    );

    // Update NFT state
    nftState.currentHolder = holderWallet;
    nftState.walletAnalysis = walletAnalysis;
    nftState.currentVersion = newVersion;
    nftState.adaptations.push(newAdaptation);
    nftState.lastUpdate = new Date();
    nftState.nextUpdate = this.calculateNextUpdate(config.updateFrequency);

    this.nfts.set(tokenId, nftState);

    return newAdaptation;
  }

  /**
   * Generate adaptation based on wallet analysis
   */
  private async generateAdaptation(
    basePrompt: string,
    walletAnalysis: WalletAnalysis,
    config: AdaptiveNFTConfig,
    version: string
  ): Promise<NFTAdaptation> {
    
    // Build adaptive prompt based on wallet composition
    const adaptivePrompt = this.buildAdaptivePrompt(basePrompt, walletAnalysis, config);
    
    // Generate image
    const imageUrl = await this.generateAdaptiveImage(adaptivePrompt, walletAnalysis);
    
    // Generate video showing adaptation
    const videoUrl = await this.generateAdaptiveVideo(adaptivePrompt, imageUrl, walletAnalysis);
    
    // Generate traits based on wallet
    const traits = this.generateAdaptiveTraits(walletAnalysis, config);
    
    return {
      version,
      holderWallet: walletAnalysis.walletAddress,
      prompt: adaptivePrompt,
      imageUrl,
      videoUrl,
      traits,
      personalityInfluence: config.personalityWeight,
      walletInfluence: this.getWalletInfluence(walletAnalysis),
      createdAt: new Date()
    };
  }

  /**
   * Build adaptive prompt based on wallet analysis
   */
  private buildAdaptivePrompt(
    basePrompt: string,
    analysis: WalletAnalysis,
    config: AdaptiveNFTConfig
  ): string {
    const personality = analysis.personality;
    const collections = analysis.nftCollections;
    const tokens = analysis.tokenHoldings;
    
    // Personality-based styling
    const stylePrompt = this.getPersonalityPrompt(personality);
    
    // Collection influence
    const collectionInfluence = this.getCollectionInfluence(collections);
    
    // Token influence
    const tokenInfluence = this.getTokenInfluence(tokens);
    
    // Risk profile influence
    const riskInfluence = this.getRiskProfilePrompt(analysis.riskProfile);
    
    return `${basePrompt}, ${stylePrompt}, ${collectionInfluence}, ${tokenInfluence}, ${riskInfluence}, ${personality.mood} mood, ${personality.color} colors, ${personality.style} style, adaptive to holder's portfolio`;
  }

  /**
   * Generate personality-based prompt
   */
  private getPersonalityPrompt(personality: NFTPersonality): string {
    const styleMap = {
      minimalist: 'clean, simple, elegant design',
      maximalist: 'complex, detailed, layered composition',
      abstract: 'abstract forms, geometric patterns',
      realistic: 'photorealistic, detailed rendering',
      futuristic: 'sci-fi, cyberpunk, futuristic elements'
    };

    const colorMap = {
      monochrome: 'black and white, grayscale palette',
      vibrant: 'bright, saturated colors',
      pastel: 'soft, muted pastel colors',
      neon: 'bright neon colors, glowing effects',
      earth: 'natural earth tones, organic colors'
    };

    return `${styleMap[personality.style]}, ${colorMap[personality.color]}`;
  }

  /**
   * Generate collection influence prompt
   */
  private getCollectionInfluence(collections: CollectionData[]): string {
    if (collections.length === 0) return 'first-time collector aesthetic';
    
    const categories = collections.map(c => c.category);
    const topCategory = this.getMostCommon(categories);
    
    const categoryMap = {
      art: 'artistic, creative, expressive elements',
      gaming: 'gaming-inspired, dynamic, action-oriented',
      pfp: 'profile picture style, character-focused',
      utility: 'functional, practical, utility-focused design',
      collectible: 'collectible, rare, premium aesthetic'
    };

    return categoryMap[topCategory] || 'eclectic, diverse influences';
  }

  /**
   * Generate token influence prompt
   */
  private getTokenInfluence(tokens: TokenData[]): string {
    if (tokens.length === 0) return 'SOL-focused, minimal token exposure';
    
    const categories = tokens.map(t => t.category);
    const topCategory = this.getMostCommon(categories);
    
    const categoryMap = {
      meme: 'playful, meme-inspired, humorous elements',
      defi: 'financial, DeFi-inspired, mathematical patterns',
      utility: 'practical, utility-focused, functional design',
      governance: 'democratic, community-focused, voting elements'
    };

    return categoryMap[topCategory] || 'diverse token influences';
  }

  /**
   * Generate risk profile prompt
   */
  private getRiskProfilePrompt(riskProfile: string): string {
    const riskMap: Record<string, string> = {
      conservative: 'stable, reliable, traditional elements',
      moderate: 'balanced, measured, thoughtful design',
      aggressive: 'bold, dynamic, high-energy composition',
      degen: 'extreme, experimental, boundary-pushing design'
    };

    return riskMap[riskProfile] || 'balanced design approach';
  }

  /**
   * Generate adaptive traits based on wallet
   */
  private generateAdaptiveTraits(analysis: WalletAnalysis, config: AdaptiveNFTConfig): Record<string, any> {
    const traits: Record<string, any> = {
      'Holder Portfolio Value': analysis.portfolioValue,
      'Risk Profile': analysis.riskProfile,
      'NFT Count': analysis.nftCollections.length,
      'Token Diversity': analysis.tokenHoldings.length,
      'Trading Activity': analysis.tradingActivity.tradingFrequency,
      'Primary Interest': analysis.interests[0] || 'general',
      'Personality Style': analysis.personality.style,
      'Color Preference': analysis.personality.color,
      'Mood': analysis.personality.mood,
      'Adaptation Level': config.adaptationLevel,
      'Last Wallet Analysis': analysis.walletAddress.slice(0, 8) + '...'
    };

    // Add collection-specific traits
    analysis.nftCollections.forEach((collection, index) => {
      traits[`Collection ${index + 1}`] = `${collection.name} (${collection.count} items)`;
    });

    return traits;
  }

  /**
   * Get wallet influence summary
   */
  private getWalletInfluence(analysis: WalletAnalysis): string[] {
    const influences = [];
    
    if (analysis.nftCollections.length > 0) {
      influences.push(`Influenced by ${analysis.nftCollections.length} NFT collections`);
    }
    
    if (analysis.tokenHoldings.length > 0) {
      influences.push(`Reflects ${analysis.tokenHoldings.length} token holdings`);
    }
    
    influences.push(`Risk profile: ${analysis.riskProfile}`);
    influences.push(`Personality: ${analysis.personality.style} ${analysis.personality.mood}`);
    
    return influences;
  }

  /**
   * Set up webhook for NFT updates
   */
  private async setupWebhook(tokenId: string, holderWallet: string): Promise<void> {
    // In production, this would set up a webhook that monitors:
    // 1. Wallet transfers of this NFT
    // 2. Holder's wallet composition changes
    // 3. Scheduled updates based on frequency
    
    const webhookUrl = `/api/webhooks/adaptive-nft/${tokenId}`;
    console.log(`🔗 Webhook set up for adaptive NFT ${tokenId}: ${webhookUrl}`);
  }

  /**
   * Helper methods
   */
  private async fetchNFTData(walletAddress: string): Promise<CollectionData[]> {
    // In production, this would fetch from Helius, Metaplex, etc.
    // For now, return mock data
    return [
      {
        collection: 'analos_adaptive',
        name: 'Analos Adaptive Collection',
        count: 1,
        floorPrice: 0.5,
        totalValue: 0.5,
        rarity: 'rare',
        category: 'utility'
      }
    ];
  }

  private async fetchTokenData(walletAddress: string): Promise<TokenData[]> {
    // Mock token data - in production would fetch from RPC
    return [
      {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        amount: 10.5,
        value: 1050,
        category: 'utility'
      }
    ];
  }

  private async fetchTradingData(walletAddress: string): Promise<TradingData> {
    // Mock trading data
    return {
      totalTrades: 25,
      volume30d: 5000,
      favoriteDEX: 'Jupiter',
      tradingFrequency: 'medium'
    };
  }

  private calculateRiskProfile(nfts: CollectionData[], tokens: TokenData[], trading: TradingData): string {
    // Simple risk calculation based on holdings and trading
    const nftRisk = nfts.length > 10 ? 'aggressive' : nfts.length > 5 ? 'moderate' : 'conservative';
    const tradingRisk = trading.volume30d > 10000 ? 'degen' : trading.volume30d > 5000 ? 'aggressive' : 'moderate';
    
    return nftRisk === tradingRisk ? nftRisk : 'moderate';
  }

  private generatePersonality(nfts: CollectionData[], tokens: TokenData[], riskProfile: string): NFTPersonality {
    const styles = ['minimalist', 'maximalist', 'abstract', 'realistic', 'futuristic'];
    const colors = ['monochrome', 'vibrant', 'pastel', 'neon', 'earth'];
    const moods = ['calm', 'energetic', 'mysterious', 'playful', 'serious'];
    
    return {
      style: styles[Math.floor(Math.random() * styles.length)] as any,
      color: colors[Math.floor(Math.random() * colors.length)] as any,
      mood: moods[Math.floor(Math.random() * moods.length)] as any,
      traits: ['adaptive', 'personalized', 'evolving']
    };
  }

  private extractInterests(nfts: CollectionData[], tokens: TokenData[]): string[] {
    const interests = new Set<string>();
    
    nfts.forEach(nft => interests.add(nft.category));
    tokens.forEach(token => interests.add(token.category));
    
    return Array.from(interests);
  }

  private async generateAdaptiveImage(prompt: string, analysis: WalletAnalysis): Promise<string> {
    // Call AI image generation with adaptive prompt
    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        style: analysis.personality.style,
        color: analysis.personality.color,
        mood: analysis.personality.mood
      })
    });

    const data = await response.json();
    return data.imageUrl;
  }

  private async generateAdaptiveVideo(prompt: string, imageUrl: string, analysis: WalletAnalysis): Promise<string> {
    // Generate 6.9-second adaptation video
    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Adaptation sequence: ${prompt}`,
        baseImage: imageUrl,
        duration: 6.9,
        style: `${analysis.personality.style} ${analysis.personality.mood} adaptation`
      })
    });

    const data = await response.json();
    return data.videoUrl;
  }

  private incrementVersion(version: string): string {
    const [major, minor] = version.split('.').map(Number);
    return `${major}.${minor + 1}`;
  }

  private calculateNextUpdate(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'on_transfer':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Far future
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private getMostCommon<T extends string>(array: T[]): T {
    const counts = array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as T;
  }

  // Public API methods
  getAdaptiveNFT(tokenId: string): AdaptiveNFTState | undefined {
    return this.nfts.get(tokenId);
  }

  getAllAdaptiveNFTs(): AdaptiveNFTState[] {
    return Array.from(this.nfts.values());
  }

  async triggerWebhookUpdate(tokenId: string, eventType: 'transfer' | 'scheduled' | 'manual'): Promise<void> {
    const nftState = this.nfts.get(tokenId);
    if (!nftState) return;

    try {
      await this.updateAdaptiveNFT(tokenId);
      console.log(`🔄 Adaptive NFT ${tokenId} updated via ${eventType} webhook`);
    } catch (error) {
      console.error(`❌ Failed to update adaptive NFT ${tokenId}:`, error);
    }
  }
}

export default AdaptiveNFTService;
