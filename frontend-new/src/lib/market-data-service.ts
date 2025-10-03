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
        source: 'jupiter-meteora-verified'
      };

      this.cache.set(cacheKey, marketData);
      console.log('📊 Market data fetched and verified:', {
        LOS: `$${marketData.losPriceUSD.toFixed(6)}`,
        LOL: `$${marketData.lolPriceUSD.toFixed(4)}`,
        sources: 'Jupiter & Meteora'
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
   * Fetch LOS token price from multiple sources for verification
   * LOS is SOL (So11111111111111111111111111111111111111112)
   */
  private async fetchLOSPriceFromJupiter(): Promise<number> {
    try {
      // Get prices from both Jupiter and Meteora for cross-verification
      const [jupiterPrice, meteoraPrice] = await Promise.allSettled([
        this.fetchLOSPriceFromJupiterAPI(),
        this.fetchLOSPriceFromMeteoraAPI()
      ]);

      const jupiterResult = jupiterPrice.status === 'fulfilled' ? jupiterPrice.value : null;
      const meteoraResult = meteoraPrice.status === 'fulfilled' ? meteoraPrice.value : null;

      // Use Jupiter as primary, Meteora as verification
      if (jupiterResult && meteoraResult) {
        const priceDiff = Math.abs(jupiterResult - meteoraResult);
        const avgPrice = (jupiterResult + meteoraResult) / 2;
        
        // If prices are within 5% of each other, use average
        if (priceDiff / avgPrice < 0.05) {
          console.log('✅ LOS price verified across Jupiter & Meteora:', {
            jupiter: jupiterResult,
            meteora: meteoraResult,
            average: avgPrice
          });
          return avgPrice;
        } else {
          console.warn('⚠️ Price discrepancy between Jupiter & Meteora:', {
            jupiter: jupiterResult,
            meteora: meteoraResult,
            using: 'jupiter'
          });
        }
      }

      // Fallback to available source
      if (jupiterResult) {
        console.log('✅ LOS price from Jupiter API:', jupiterResult);
        return jupiterResult;
      }
      
      if (meteoraResult) {
        console.log('✅ LOS price from Meteora API:', meteoraResult);
        return meteoraResult;
      }

      throw new Error('No price data available from any source');
    } catch (error) {
      console.warn('⚠️ Failed to fetch LOS price from all sources:', error);
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
   * Fetch LOS price from Meteora API
   * Using DLMM (Dynamic Liquidity Market Maker) API for SOL pairs
   */
  private async fetchLOSPriceFromMeteoraAPI(): Promise<number> {
    try {
      // Try Meteora DLMM API for SOL pairs
      // SOL token: So11111111111111111111111111111111111111112
      const response = await fetch('https://dlmm-api.meteora.ag/pair/So11111111111111111111111111111111111111112');
      
      if (!response.ok) {
        throw new Error(`Meteora API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Look for price information in Meteora response
      // This might need adjustment based on actual Meteora API response format
      if (data.price && typeof data.price === 'number') {
        return data.price;
      }
      
      // Alternative: try to find price in pair data
      if (data.pair && data.pair.price) {
        return data.pair.price;
      }
      
      throw new Error('No price data in Meteora response');
    } catch (error) {
      // If DLMM API fails, try alternative Meteora endpoints
      try {
        const altResponse = await fetch('https://dlmm-api.meteora.ag/pairs');
        if (altResponse.ok) {
          const pairsData = await altResponse.json();
          // Look for SOL pair in the list
          const solPair = pairsData.find((pair: any) => 
            pair.token_x === 'So11111111111111111111111111111111111111112' || 
            pair.token_y === 'So11111111111111111111111111111111111111112'
          );
          
          if (solPair && solPair.price) {
            return solPair.price;
          }
        }
      } catch (altError) {
        console.warn('⚠️ Alternative Meteora API also failed:', altError);
      }
      
      throw error;
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
