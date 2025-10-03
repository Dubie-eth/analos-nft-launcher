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
  private defaultLOSPrice = 0.00015; // Fallback price if API fails
  private defaultLOLPrice = 0.15; // Fallback price if API fails

  constructor() {
    this.connection = new Connection('https://rpc.analos.io', 'confirmed');
    this.cache = new Map();
    console.log('📊 Market Data Service initialized');
  }

  /**
   * Fetch real-time market data for LOS and LOL tokens
   */
  async getMarketData(): Promise<MarketData> {
    const cacheKey = 'market_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.lastUpdated < this.cacheDurationMs)) {
      console.log('📊 Using cached market data');
      return cached;
    }

    console.log('📊 Fetching fresh market data...');
    
    try {
      // Try multiple sources for price data
      const [losPrice, lolPrice] = await Promise.allSettled([
        this.fetchLOSPrice(),
        this.fetchLOLPrice()
      ]);

      const marketData: MarketData = {
        losPriceUSD: losPrice.status === 'fulfilled' ? losPrice.value : this.defaultLOSPrice,
        lolPriceUSD: lolPrice.status === 'fulfilled' ? lolPrice.value : this.defaultLOLPrice,
        lastUpdated: Date.now(),
        source: 'real-time'
      };

      this.cache.set(cacheKey, marketData);
      console.log('📊 Market data fetched:', {
        LOS: `$${marketData.losPriceUSD.toFixed(6)}`,
        LOL: `$${marketData.lolPriceUSD.toFixed(4)}`
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
   * Fetch LOS token price from Jupiter API or similar
   */
  private async fetchLOSPrice(): Promise<number> {
    try {
      // Try Jupiter API for SOL price (LOS is similar to SOL)
      const response = await fetch('https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112');
      const data = await response.json();
      
      if (data.data && data.data['So11111111111111111111111111111111111111112']) {
        const solPrice = data.data['So11111111111111111111111111111111111111112'].price;
        // LOS is typically priced lower than SOL, adjust accordingly
        return solPrice * 0.001; // Adjust this multiplier based on actual LOS/SOL ratio
      }
      
      // Fallback to CoinGecko
      const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const cgData = await cgResponse.json();
      
      if (cgData.solana && cgData.solana.usd) {
        return cgData.solana.usd * 0.001; // Adjust multiplier
      }
      
      throw new Error('No price data available');
    } catch (error) {
      console.warn('⚠️ Failed to fetch LOS price:', error);
      return this.defaultLOSPrice;
    }
  }

  /**
   * Fetch LOL token price
   */
  private async fetchLOLPrice(): Promise<number> {
    try {
      // Try to get LOL price from Jupiter or similar
      // For now, we'll use a reasonable estimate
      // In production, you'd want to integrate with actual LOL price feeds
      
      // Check if LOL has a Jupiter price feed
      const response = await fetch(`https://price.jup.ag/v4/price?ids=ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6`);
      const data = await response.json();
      
      if (data.data && data.data['ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6']) {
        return data.data['ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6'].price;
      }
      
      // Fallback to estimated price based on market cap or other factors
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
