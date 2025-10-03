/**
 * Collection Statistics Service
 * Fetches real-time collection statistics from the backend
 */

export interface CollectionStats {
  collectionsLaunched: number;
  totalNFTsMinted: number;
  platformUptime: string;
  losBurned: number;
}

class CollectionStatsService {
  private cache: CollectionStats | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Fetch collection statistics from the backend
   */
  async getCollectionStats(): Promise<CollectionStats> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      console.log('📊 Fetching collection statistics from backend...');
      
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const response = await fetch(`${backendUrl}/api/collections/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collection stats: ${response.status}`);
      }

      const stats: CollectionStats = await response.json();
      
      // Cache the results
      this.cache = stats;
      this.lastFetch = now;
      
      console.log('✅ Collection statistics fetched:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error fetching collection stats:', error);
      
      // Return default stats if fetch fails
      const defaultStats: CollectionStats = {
        collectionsLaunched: 1, // At least "The LosBros" collection
        totalNFTsMinted: 50,
        platformUptime: '99.9%',
        losBurned: 25
      };
      
      return defaultStats;
    }
  }

  /**
   * Get cached collection statistics (doesn't make network request)
   */
  getCachedStats(): CollectionStats | null {
    return this.cache;
  }

  /**
   * Clear the cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  /**
   * Format collection count with appropriate suffix
   */
  formatCollectionCount(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}+`;
  }

  /**
   * Format NFT count with appropriate suffix
   */
  formatNFTCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M+`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K+`;
    }
    return `${count}+`;
  }
}

// Export singleton instance
export const collectionStatsService = new CollectionStatsService();
