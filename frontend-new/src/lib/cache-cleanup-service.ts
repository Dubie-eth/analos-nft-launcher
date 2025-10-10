/**
 * Cache Cleanup Service
 * Removes old collections and data from previous program versions
 */

export class CacheCleanupService {
  private static readonly NEW_PROGRAM_ID = '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk';
  private static readonly OLD_PROGRAM_IDS = [
    '28YCSetmG6PSRdhQV6iBFuAE7NqWtLCryr3GYtR3qS6p',
    '3FNWoNWiBcbA67yYXrczCj8KdUo2TphCZXYHthqewwcX'
  ];

  /**
   * Clean all caches and remove old program data
   */
  static async cleanAllCaches(): Promise<void> {
    console.log('🧹 Starting comprehensive cache cleanup...');
    
    try {
      // 1. Clean localStorage
      await this.cleanLocalStorage();
      
      // 2. Clean sessionStorage
      await this.cleanSessionStorage();
      
      // 3. Clean IndexedDB (if used)
      await this.cleanIndexedDB();
      
      // 4. Clear service caches
      await this.clearServiceCaches();
      
      console.log('✅ Cache cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  /**
   * Clean localStorage of old collections
   */
  private static async cleanLocalStorage(): Promise<void> {
    try {
      console.log('🧹 Cleaning localStorage...');
      
      // Clean launched collections
      const launchedCollections = localStorage.getItem('launched_collections');
      if (launchedCollections) {
        const collections = JSON.parse(launchedCollections);
        const filteredCollections = collections.filter((col: any) => {
          // Remove collections from old programs
          if (col.programId && this.OLD_PROGRAM_IDS.includes(col.programId)) {
            console.log(`🗑️ Removing "${col.name}" - old program ID: ${col.programId}`);
            return false;
          }
          
          // Remove collections without program ID (they're old)
          if (!col.programId && col.name !== 'Los Bros') {
            console.log(`🗑️ Removing "${col.name}" - no program ID`);
            return false;
          }
          
          return true;
        });
        
        localStorage.setItem('launched_collections', JSON.stringify(filteredCollections));
        console.log(`✅ Cleaned localStorage: ${collections.length} → ${filteredCollections.length} collections`);
      }
      
      // Clean other collection-related data
      const keysToCheck = [
        'collections_backup',
        'admin_collections',
        'blockchain_collections',
        'user_nft_tracker',
        'token_id_tracker',
        'collection_stats'
      ];
      
      keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => {
                // Remove items from old programs
                if (item.programId && this.OLD_PROGRAM_IDS.includes(item.programId)) {
                  return false;
                }
                return true;
              });
              localStorage.setItem(key, JSON.stringify(filtered));
              console.log(`✅ Cleaned ${key}: ${parsed.length} → ${filtered.length} items`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not parse ${key}:`, error);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error cleaning localStorage:', error);
    }
  }

  /**
   * Clean sessionStorage
   */
  private static async cleanSessionStorage(): Promise<void> {
    try {
      console.log('🧹 Cleaning sessionStorage...');
      
      // Clear all session storage
      sessionStorage.clear();
      console.log('✅ Cleaned sessionStorage');
      
    } catch (error) {
      console.error('❌ Error cleaning sessionStorage:', error);
    }
  }

  /**
   * Clean IndexedDB if used
   */
  private static async cleanIndexedDB(): Promise<void> {
    try {
      console.log('🧹 Cleaning IndexedDB...');
      
      // This would clean IndexedDB if we were using it
      // For now, just log that we're checking
      console.log('✅ IndexedDB cleanup not needed (not used)');
      
    } catch (error) {
      console.error('❌ Error cleaning IndexedDB:', error);
    }
  }

  /**
   * Clear service caches
   */
  private static async clearServiceCaches(): Promise<void> {
    try {
      console.log('🧹 Clearing service caches...');
      
      // Clear admin control service cache and remove old collections
      try {
        const { adminControlService } = await import('./admin-control-service');
        if (adminControlService.clearCache) {
          adminControlService.clearCache();
          console.log('✅ Cleared admin control service cache');
        }
        if (adminControlService.removeOldProgramCollections) {
          adminControlService.removeOldProgramCollections();
          console.log('✅ Removed old program collections from admin service');
        }
      } catch (error) {
        console.warn('⚠️ Could not clear admin control service cache:', error);
      }
      
      // Clear blockchain data service cache
      try {
        const { blockchainDataService } = await import('./blockchain-data-service');
        if (blockchainDataService.clearCache) {
          blockchainDataService.clearCache();
          console.log('✅ Cleared blockchain data service cache');
        }
      } catch (error) {
        console.warn('⚠️ Could not clear blockchain data service cache:', error);
      }
      
      // Clear other service caches
      const serviceNames = [
        'blockchain-first-service',
        'blockchain-first-frontend-service',
        'data-persistence-service',
        'collection-stats-service'
      ];
      
      for (const serviceName of serviceNames) {
        try {
          const service = await import(`./${serviceName}`);
          if (service.default?.clearCache) {
            service.default.clearCache();
            console.log(`✅ Cleared ${serviceName} cache`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not clear ${serviceName} cache:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error clearing service caches:', error);
    }
  }

  /**
   * Force refresh all collection data
   */
  static async forceRefreshCollections(): Promise<void> {
    try {
      console.log('🔄 Force refreshing all collection data...');
      
      // Clear caches first
      await this.cleanAllCaches();
      
      // Force reload the page to refresh all data
      if (typeof window !== 'undefined') {
        console.log('🔄 Reloading page to refresh all data...');
        window.location.reload();
      }
      
    } catch (error) {
      console.error('❌ Error force refreshing collections:', error);
    }
  }

  /**
   * Check if a collection is from the new program
   */
  static isFromNewProgram(collection: any): boolean {
    if (!collection.programId) {
      return false;
    }
    return collection.programId === this.NEW_PROGRAM_ID;
  }

  /**
   * Check if a collection is from an old program
   */
  static isFromOldProgram(collection: any): boolean {
    if (!collection.programId) {
      return true; // Collections without program ID are considered old
    }
    return this.OLD_PROGRAM_IDS.includes(collection.programId);
  }
}

// Export singleton instance
export const cacheCleanupService = new CacheCleanupService();
