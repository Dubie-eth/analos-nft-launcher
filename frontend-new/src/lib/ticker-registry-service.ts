/**
 * Frontend Ticker Registry Service
 * Handles ticker validation and collision prevention
 */

export interface TickerInfo {
  symbol: string;
  collectionName: string;
  collectionAddress: string;
  creatorWallet: string;
  registeredAt: number;
  status: 'active' | 'inactive' | 'reserved';
}

export interface TickerAvailability {
  symbol: string;
  available: boolean;
  reason?: string;
}

export interface TickerSearchResult {
  query: string;
  results: TickerInfo[];
  count: number;
}

export interface TickerStats {
  totalRegistered: number;
  activeTickers: number;
  reservedTickers: number;
  inactiveTickers: number;
  reservedCount: number;
}

class TickerRegistryService {
  private readonly BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';
  private cache: Map<string, TickerAvailability> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    console.log('🏷️ Ticker Registry Service initialized');
  }

  /**
   * Check if a ticker is available
   */
  async checkTickerAvailability(symbol: string): Promise<TickerAvailability> {
    const upperSymbol = symbol.toUpperCase().trim();
    
    // Check cache first
    const cached = this.cache.get(upperSymbol);
    if (cached && (Date.now() - (cached as any).timestamp) < this.cacheTimeout) {
      console.log(`📋 Using cached ticker availability for: ${upperSymbol}`);
      return cached;
    }

    try {
      console.log(`🔍 Checking ticker availability: ${upperSymbol}`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/check/${encodeURIComponent(upperSymbol)}`);
      
      if (response.ok) {
        const data = await response.json();
        const result: TickerAvailability = {
          symbol: data.symbol,
          available: data.available,
          reason: data.reason
        };
        
        // Cache the result
        (result as any).timestamp = Date.now();
        this.cache.set(upperSymbol, result);
        
        console.log(`✅ Ticker ${upperSymbol}: ${data.available ? 'Available' : 'Not Available'} - ${data.reason || 'OK'}`);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error checking ticker availability for ${upperSymbol}:`, error);
      
      // Return unavailable on error to be safe
      const result: TickerAvailability = {
        symbol: upperSymbol,
        available: false,
        reason: 'Unable to verify ticker availability'
      };
      
      (result as any).timestamp = Date.now();
      this.cache.set(upperSymbol, result);
      return result;
    }
  }

  /**
   * Reserve a ticker temporarily
   */
  async reserveTicker(symbol: string, creatorWallet: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔒 Reserving ticker: ${symbol} for wallet: ${creatorWallet}`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          creatorWallet
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Ticker reserved: ${data.symbol}`);
        // Clear cache to force fresh check
        this.cache.delete(symbol.toUpperCase());
        return { success: true, message: data.message };
      } else {
        console.log(`❌ Failed to reserve ticker: ${data.error || 'Unknown error'}`);
        return { success: false, message: data.error || 'Failed to reserve ticker' };
      }
    } catch (error) {
      console.error(`❌ Error reserving ticker ${symbol}:`, error);
      return { success: false, message: 'Network error while reserving ticker' };
    }
  }

  /**
   * Register a ticker permanently
   */
  async registerTicker(
    symbol: string,
    collectionName: string,
    collectionAddress: string,
    creatorWallet: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📝 Registering ticker: ${symbol} for collection: ${collectionName}`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase().trim(),
          collectionName,
          collectionAddress,
          creatorWallet
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Ticker registered: ${data.symbol}`);
        // Clear cache to force fresh check
        this.cache.delete(symbol.toUpperCase());
        return { success: true, message: data.message };
      } else {
        console.log(`❌ Failed to register ticker: ${data.error || 'Unknown error'}`);
        return { success: false, message: data.error || 'Failed to register ticker' };
      }
    } catch (error) {
      console.error(`❌ Error registering ticker ${symbol}:`, error);
      return { success: false, message: 'Network error while registering ticker' };
    }
  }

  /**
   * Get ticker information
   */
  async getTickerInfo(symbol: string): Promise<TickerInfo | null> {
    try {
      console.log(`ℹ️ Getting ticker info: ${symbol}`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/info/${encodeURIComponent(symbol.toUpperCase())}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ticker) {
          console.log(`✅ Found ticker info for: ${data.ticker.symbol}`);
          return data.ticker;
        }
      }
      
      console.log(`ℹ️ No ticker info found for: ${symbol}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting ticker info for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Search tickers
   */
  async searchTickers(query: string): Promise<TickerSearchResult> {
    try {
      console.log(`🔍 Searching tickers: ${query}`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/search?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Found ${data.count} tickers matching: ${query}`);
          return {
            query: data.query,
            results: data.results,
            count: data.count
          };
        }
      }
      
      return {
        query,
        results: [],
        count: 0
      };
    } catch (error) {
      console.error(`❌ Error searching tickers for ${query}:`, error);
      return {
        query,
        results: [],
        count: 0
      };
    }
  }

  /**
   * Get all registered tickers
   */
  async getAllTickers(): Promise<{ tickers: TickerInfo[]; stats: TickerStats } | null> {
    try {
      console.log(`📋 Getting all registered tickers`);
      
      const response = await fetch(`${this.BACKEND_URL}/api/ticker/all`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Retrieved ${data.tickers.length} registered tickers`);
          return {
            tickers: data.tickers,
            stats: data.stats
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting all tickers:`, error);
      return null;
    }
  }

  /**
   * Validate ticker format
   */
  validateTickerFormat(symbol: string): { valid: boolean; message?: string } {
    const upperSymbol = symbol.toUpperCase().trim();
    
    // Check if empty
    if (!upperSymbol) {
      return { valid: false, message: 'Ticker symbol is required' };
    }
    
    // Check length
    if (upperSymbol.length < 2) {
      return { valid: false, message: 'Ticker must be at least 2 characters long' };
    }
    
    if (upperSymbol.length > 10) {
      return { valid: false, message: 'Ticker must be 10 characters or less' };
    }
    
    // Check for valid characters (alphanumeric only)
    if (!/^[A-Z0-9]+$/.test(upperSymbol)) {
      return { valid: false, message: 'Ticker can only contain letters and numbers' };
    }
    
    // Check if it starts with a number (not recommended)
    if (/^[0-9]/.test(upperSymbol)) {
      return { valid: false, message: 'Ticker should not start with a number' };
    }
    
    return { valid: true };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Ticker registry cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const tickerRegistryService = new TickerRegistryService();
export default tickerRegistryService;
