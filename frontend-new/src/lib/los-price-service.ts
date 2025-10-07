export interface LOSPriceData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export class LOSPriceService {
  private cache: LOSPriceData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getLOSPrice(): Promise<LOSPriceData> {
    // Check cache first
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Fetch from Jupiter API (Solana DEX aggregator)
      const response = await fetch('https://price.jup.ag/v4/price?ids=LOS');
      
      if (!response.ok) {
        throw new Error('Failed to fetch LOS price');
      }

      const data = await response.json();
      const losData = data.data?.LOS;

      if (!losData) {
        throw new Error('LOS price data not found');
      }

      const priceData: LOSPriceData = {
        price: losData.price,
        priceChange24h: losData.priceChange24h || 0,
        marketCap: losData.marketCap || 0,
        volume24h: losData.volume24h || 0,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache = priceData;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return priceData;
    } catch (error) {
      console.error('Error fetching LOS price:', error);
      
      // Return fallback data if API fails
      return {
        price: 0.0001, // Fallback price
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  formatPrice(price: number): string {
    return price.toFixed(6);
  }

  formatUSD(price: number, losAmount: number): string {
    return (price * losAmount).toFixed(2);
  }

  getPriceChangeColor(change: number): string {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  }
}

export const losPriceService = new LOSPriceService();
