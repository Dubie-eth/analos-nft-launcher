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
      // Try multiple price sources for better reliability
      const priceSources = [
        'https://api.coingecko.com/api/v3/simple/price?ids=los&vs_currencies=usd&include_24hr_change=true',
        'https://price.jup.ag/v4/price?ids=LOS',
        'https://api.birdeye.so/v1/token/price?address=So11111111111111111111111111111111111111112' // Fallback to SOL price
      ];

      let priceData: LOSPriceData | null = null;

      for (const url of priceSources) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            // Add timeout
            signal: AbortSignal.timeout(5000)
          });
          
          if (!response.ok) continue;

          const data = await response.json();
          
          // Handle different API response formats
          if (url.includes('coingecko')) {
            const losData = data.los;
            if (losData) {
              priceData = {
                price: losData.usd,
                priceChange24h: losData.usd_24h_change || 0,
                marketCap: 0,
                volume24h: 0,
                lastUpdated: new Date().toISOString()
              };
              break;
            }
          } else if (url.includes('jup.ag')) {
            const losData = data.data?.LOS;
            if (losData) {
              priceData = {
                price: losData.price,
                priceChange24h: losData.priceChange24h || 0,
                marketCap: losData.marketCap || 0,
                volume24h: losData.volume24h || 0,
                lastUpdated: new Date().toISOString()
              };
              break;
            }
          }
        } catch (sourceError) {
          console.warn(`Price source failed: ${url}`, sourceError);
          continue;
        }
      }

      // If all sources fail, use fallback
      if (!priceData) {
        throw new Error('All price sources failed');
      }

      // Cache the result
      this.cache = priceData;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return priceData;
    } catch (error) {
      console.error('Error fetching LOS price:', error);
      
      // Return fallback data if all APIs fail
      const fallbackData = {
        price: 0.0001, // Fallback price
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        lastUpdated: new Date().toISOString()
      };

      // Cache fallback data for shorter duration
      this.cache = fallbackData;
      this.cacheExpiry = Date.now() + (60 * 1000); // 1 minute cache for fallback

      return fallbackData;
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
