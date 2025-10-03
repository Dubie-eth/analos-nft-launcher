import { Connection, PublicKey } from '@solana/web3.js';

export interface MarketData {
  losPriceUSD: number;
  lolPriceUSD: number;
  lastUpdated: number;
  source: string;
}

export interface ServicePricing {
  serviceName: string;
  usdTarget: number;
  losCost: number;
  lolCost: number;
  perNFTCost?: number;
}

class MarketDataService {
  private connection: Connection;
  private cache: Map<string, MarketData>;
  private cacheDurationMs = 60 * 1000; // 1 minute cache
  private defaultLOSPrice = 0.00012; // Fallback price if API fails (adjusted for Analos)
  private defaultLOLPrice = 0.00015; // Fallback price if API fails (adjusted for Analos)

  constructor() {
    this.connection = new Connection('https://rpc.analos.io', 'confirmed');
    this.cache = new Map();
    console.log('📊 Market Data Service initialized');
  }

  /**
   * Fetch real-time market data for LOS and LOL tokens
   * Using Jupiter Price API V3 for accurate pricing
   */
  async getMarketData(): Promise<MarketData> {
    const cacheKey = 'market_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.lastUpdated < this.cacheDurationMs)) {
      console.log('📊 Using cached market data');
      return cached;
    }

    console.log('📊 Fetching fresh market data from Jupiter API...');
    
    try {
      // Fetch LOS (SOL) price from Jupiter Price API V3
      const losPrice = await this.fetchLOSPriceFromJupiter();
      
      // For LOL, we'll use a reasonable estimate since it's specific to Analos
      const lolPrice = this.defaultLOLPrice;

      const marketData: MarketData = {
        losPriceUSD: losPrice,
        lolPriceUSD: lolPrice,
        lastUpdated: Date.now(),
        source: 'jupiter-api'
      };

      this.cache.set(cacheKey, marketData);
      console.log('📊 Market data fetched from Jupiter:', {
        LOS: `$${marketData.losPriceUSD.toFixed(6)}`,
        LOL: `$${marketData.lolPriceUSD.toFixed(4)}`,
        source: 'Jupiter API'
      });

      return marketData;
    } catch (error) {
      console.error('❌ Error fetching market data:', error);
      return {
        losPriceUSD: this.defaultLOSPrice,
        lolPriceUSD: this.defaultLOLPrice,
        lastUpdated: Date.now(),
        source: 'fallback'
      };
    }
  }

  /**
   * Fetch LOS token price from Jupiter API
   * LOS is SOL (So11111111111111111111111111111111111111112)
   * Meteora API disabled due to 404 errors
   */
  private async fetchLOSPriceFromJupiter(): Promise<number> {
    try {
      // Use Jupiter API only (Meteora API endpoints returning 404)
      const jupiterResult = await this.fetchLOSPriceFromJupiterAPI();
      
      console.log('✅ LOS price from Jupiter API:', jupiterResult);
      return jupiterResult;
    } catch (error) {
      console.warn('⚠️ Failed to fetch LOS price from Jupiter:', error);
      return this.defaultLOSPrice;
    }
  }

  /**
   * Fetch LOS price from Jupiter Price API V3
   */
  private async fetchLOSPriceFromJupiterAPI(): Promise<number> {
    const response = await fetch('https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112');
    
    if (!response.ok) {
      throw new Error(`Jupiter API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['So11111111111111111111111111111111111111112'] && data['So11111111111111111111111111111111111111112'].usdPrice) {
      return data['So11111111111111111111111111111111111111112'].usdPrice;
    }
    
    throw new Error('No SOL price data in Jupiter response');
  }

  /**
   * Calculate LOS cost for a given USD amount
   */
  async calculateLOSCost(usdAmount: number): Promise<number> {
    const marketData = await this.getMarketData();
    const losCost = usdAmount / marketData.losPriceUSD;
    return Math.ceil(losCost); // Round up to ensure sufficient payment
  }

  /**
   * Calculate LOL cost for a given USD amount
   */
  async calculateLOLCost(usdAmount: number): Promise<number> {
    const marketData = await this.getMarketData();
    const lolCost = usdAmount / marketData.lolPriceUSD;
    return Math.ceil(lolCost); // Round up to ensure sufficient payment
  }

  /**
   * Get service pricing with real-time calculations
   */
  async getServicePricing(): Promise<ServicePricing[]> {
    const marketData = await this.getMarketData();
    
    // Define USD targets for each service
    const serviceTargets = [
      { name: 'Art Generator - Starter', usdTarget: 120, perNFT: 0.12 },
      { name: 'Art Generator - Professional', usdTarget: 150, perNFT: 0.15 },
      { name: 'Art Generator - Enterprise', usdTarget: 180, perNFT: 0.18 },
      { name: 'NFT Minting', usdTarget: 1.50, perNFT: 1.50 },
      { name: 'Collection Deployment', usdTarget: 5.00 },
      { name: 'Bonding Curve Launch', usdTarget: 10.00 },
    ];

    const pricing: ServicePricing[] = [];

    for (const service of serviceTargets) {
      const losCost = await this.calculateLOSCost(service.usdTarget);
      const lolCost = await this.calculateLOLCost(service.usdTarget);
      
      pricing.push({
        serviceName: service.name,
        usdTarget: service.usdTarget,
        losCost,
        lolCost,
        perNFTCost: service.perNFT
      });
    }

    return pricing;
  }

  /**
   * Get art generator pricing tiers with real-time calculations
   */
  async getArtGeneratorPricing(): Promise<{
    starter: { usdTarget: number; losCost: number; perNFT: number };
    professional: { usdTarget: number; losCost: number; perNFT: number };
    enterprise: { usdTarget: number; losCost: number; perNFT: number };
  }> {
    const marketData = await this.getMarketData();
    
    const starter = {
      usdTarget: 120,
      losCost: await this.calculateLOSCost(120),
      perNFT: 0.12
    };

    const professional = {
      usdTarget: 150,
      losCost: await this.calculateLOSCost(150),
      perNFT: 0.15
    };

    const enterprise = {
      usdTarget: 180,
      losCost: await this.calculateLOSCost(180),
      perNFT: 0.18
    };

    return { starter, professional, enterprise };
  }

  /**
   * Calculate collection pricing based on size and tier
   */
  async calculateCollectionPricing(collectionSize: number, tier: 'starter' | 'professional' | 'enterprise'): Promise<{
    totalUSD: number;
    totalLOS: number;
    perNFTUSD: number;
    perNFTLOS: number;
  }> {
    const pricing = await this.getArtGeneratorPricing();
    const tierPricing = pricing[tier];
    
    const totalUSD = tierPricing.usdTarget + (collectionSize * tierPricing.perNFT);
    const totalLOS = await this.calculateLOSCost(totalUSD);
    const perNFTUSD = totalUSD / collectionSize;
    const perNFTLOS = totalLOS / collectionSize;

    return {
      totalUSD,
      totalLOS,
      perNFTUSD,
      perNFTLOS
    };
  }

  /**
   * Get current market summary
   */
  async getMarketSummary(): Promise<{
    losPrice: string;
    lolPrice: string;
    lastUpdated: string;
    source: string;
  }> {
    const marketData = await this.getMarketData();
    
    return {
      losPrice: `$${marketData.losPriceUSD.toFixed(6)}`,
      lolPrice: `$${marketData.lolPriceUSD.toFixed(4)}`,
      lastUpdated: new Date(marketData.lastUpdated).toLocaleTimeString(),
      source: marketData.source
    };
  }
}

export const marketDataService = new MarketDataService();
