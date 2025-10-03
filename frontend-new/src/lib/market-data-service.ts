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
   * TEMPORARY: Using fallback data until Analos API is available
   */
  async getMarketData(): Promise<MarketData> {
    const cacheKey = 'market_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.lastUpdated < this.cacheDurationMs)) {
      console.log('📊 Using cached market data');
      return cached;
    }

    console.log('📊 Using fallback market data (Analos API not available)');
    
    // TEMPORARY: Use fallback data until we get proper Analos API endpoints
    const marketData: MarketData = {
      losPriceUSD: this.defaultLOSPrice,
      lolPriceUSD: this.defaultLOLPrice,
      lastUpdated: Date.now(),
      source: 'fallback'
    };

    this.cache.set(cacheKey, marketData);
    console.log('📊 Market data set (fallback):', {
      LOS: `$${marketData.losPriceUSD.toFixed(6)}`,
      LOL: `$${marketData.lolPriceUSD.toFixed(4)}`
    });

    return marketData;
  }

  /**
   * Fetch LOS token price from Analos DEX or fallback sources
   */
  private async fetchLOSPrice(): Promise<number> {
    try {
      // Try Analos DEX API first for LOS/USDC pair
      // LOS token address: So11111111111111111111111111111111111111112 (native SOL)
      const analosResponse = await fetch('https://app.analos.io/api/token/So11111111111111111111111111111111111111112/price');
      
      if (analosResponse.ok) {
        const data = await analosResponse.json();
        if (data.price && data.price > 0) {
          console.log('✅ LOS price fetched from Analos DEX:', data.price);
          return data.price;
        }
      }
      
      // Fallback to CoinGecko for SOL price
      const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const cgData = await cgResponse.json();
      
      if (cgData.solana && cgData.solana.usd) {
        console.log('✅ LOS price fetched from CoinGecko (SOL):', cgData.solana.usd);
        return cgData.solana.usd;
      }
      
      throw new Error('No price data available');
    } catch (error) {
      console.warn('⚠️ Failed to fetch LOS price:', error);
      return this.defaultLOSPrice;
    }
  }

  /**
   * Fetch LOL token price from Analos DEX
   */
  private async fetchLOLPrice(): Promise<number> {
    try {
      // Try Analos DEX API for LOL token price
      // LOL token address: ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6
      const analosResponse = await fetch('https://app.analos.io/api/token/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6/price');
      
      if (analosResponse.ok) {
        const data = await analosResponse.json();
        if (data.price && data.price > 0) {
          console.log('✅ LOL price fetched from Analos DEX:', data.price);
          return data.price;
        }
      }
      
      // Try alternative Analos DEX endpoint for the specific LOL/USDC pair
      const pairResponse = await fetch('https://app.analos.io/api/pair/9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6/price');
      
      if (pairResponse.ok) {
        const pairData = await pairResponse.json();
        if (pairData.price && pairData.price > 0) {
          console.log('✅ LOL price fetched from Analos DEX pair:', pairData.price);
          return pairData.price;
        }
      }
      
      // Fallback to default price
      console.log('⚠️ Using fallback LOL price:', this.defaultLOLPrice);
      return this.defaultLOLPrice;
    } catch (error) {
      console.warn('⚠️ Failed to fetch LOL price:', error);
      return this.defaultLOLPrice;
    }
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
