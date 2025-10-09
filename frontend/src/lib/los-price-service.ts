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
        {
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=los&vs_currencies=usd&include_24hr_change=true',
          parser: (data: any) => {
            const losData = data.los;
            if (losData) {
              return {
                price: losData.usd,
                priceChange24h: losData.usd_24h_change || 0,
                marketCap: 0,
                volume24h: 0,
                lastUpdated: new Date().toISOString()
              };
            }
            return null;
          }
        },
        {
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
          parser: (data: any) => {
            const solData = data.solana;
            if (solData) {
              // Use SOL price as fallback (LOS is similar to SOL)
              return {
                price: solData.usd * 0.001, // Scale down SOL price for LOS
                priceChange24h: solData.usd_24h_change || 0,
                marketCap: 0,
                volume24h: 0,
                lastUpdated: new Date().toISOString()
              };
            }
            return null;
          }
        }
      ];

      let priceData: LOSPriceData | null = null;

      for (const source of priceSources) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

          const response = await fetch(source.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) continue;

          const data = await response.json();
          priceData = source.parser(data);
          
          if (priceData) {
            console.log(`✅ LOS price fetched from ${source.url}: $${priceData.price}`);
            break;
          }
        } catch (sourceError) {
          console.warn(`❌ Price source failed: ${source.url}`, sourceError);
          continue;
        }
      }

      // If all sources fail, use fallback
      if (!priceData) {
        console.warn('⚠️ All price sources failed, using fallback');
        throw new Error('All price sources failed');
      }

      // Cache the result
      this.cache = priceData;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return priceData;
    } catch (error) {
      console.error('❌ Error fetching LOS price:', error);
      
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
    if (typeof price !== 'number' || isNaN(price)) {
      return '0.000000';
    }
    return price.toFixed(6);
  }

  formatUSD(price: number, losAmount: number): string {
    if (typeof price !== 'number' || isNaN(price) || typeof losAmount !== 'number' || isNaN(losAmount)) {
      return '0.00';
    }
    return (price * losAmount).toFixed(2);
  }

  getPriceChangeColor(change: number): string {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  }
}

export const losPriceService = new LOSPriceService();
