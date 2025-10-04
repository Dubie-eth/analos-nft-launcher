/**
 * Admin Control Service
 * Manages minting toggles and collection controls
 */

export interface CollectionConfig {
  name: string;
  displayName: string;
  isActive: boolean;
  mintingEnabled: boolean;
  isTestMode: boolean;
  totalSupply: number;
  mintPrice: number;
  paymentToken: string;
  description: string;
  imageUrl: string;
  createdAt: number;
  lastModified: number;
}

export interface AdminSettings {
  globalMintingEnabled: boolean;
  testModeEnabled: boolean;
  maintenanceMode: boolean;
  emergencyStop: boolean;
  allowedCollections: string[];
  blockedWallets: string[];
  rateLimits: {
    mintsPerMinute: number;
    mintsPerHour: number;
    mintsPerWallet: number;
  };
}

export class AdminControlService {
  private collections: Map<string, CollectionConfig> = new Map();
  private adminSettings: AdminSettings;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.initializeDefaultCollections();
    this.initializeDefaultSettings();
    console.log('🎛️ Admin Control Service initialized');
  }

  /**
   * Initialize default collections
   */
  private initializeDefaultCollections(): void {
    // Test collection for development
    this.collections.set('Test', {
      name: 'Test',
      displayName: 'Test Collection',
      isActive: false, // Disabled during development
      mintingEnabled: false, // Minting disabled
      isTestMode: true,
      totalSupply: 100,
      mintPrice: 10.00,
      paymentToken: 'LOS',
      description: 'Test collection for development and testing purposes',
      imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
      createdAt: Date.now(),
      lastModified: Date.now()
    });

    // The LosBros - Featured collection for launchonlos.fun
    this.collections.set('The LosBros', {
      name: 'The LosBros',
      displayName: 'The LosBros - Featured Collection',
      isActive: false, // DISABLED until live launch
      mintingEnabled: false, // DISABLED until live launch
      isTestMode: false,
      totalSupply: 2222,
      mintPrice: 4200.69,
      paymentToken: 'LOL',
      description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL - Featured collection for launchonlos.fun',
      imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
      createdAt: Date.now(),
      lastModified: Date.now()
    });

    // Placeholder for additional collections
    this.collections.set('New Collection', {
      name: 'New Collection',
      displayName: 'New Collection',
      isActive: false, // Will be enabled when ready
      mintingEnabled: false, // Will be enabled when ready
      isTestMode: false,
      totalSupply: 1000,
      mintPrice: 50.00,
      paymentToken: 'LOL',
      description: 'New collection ready for launch',
      imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
      createdAt: Date.now(),
      lastModified: Date.now()
    });

    console.log('📋 Default collections initialized');
  }

  /**
   * Initialize default admin settings
   */
  private initializeDefaultSettings(): void {
    this.adminSettings = {
      globalMintingEnabled: false, // Start with minting disabled
      testModeEnabled: true,
      maintenanceMode: false,
      emergencyStop: false,
      allowedCollections: ['Test', 'The LosBros'], // Test and LosBros allowed
      blockedWallets: [],
      rateLimits: {
        mintsPerMinute: 10,
        mintsPerHour: 100,
        mintsPerWallet: 5
      }
    };

    console.log('⚙️ Default admin settings initialized');
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<CollectionConfig[]> {
    const cacheKey = 'all_collections';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const collections = Array.from(this.collections.values());
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: collections,
      timestamp: Date.now()
    });

    return collections;
  }

  /**
   * Get collection by name
   */
  async getCollection(collectionName: string): Promise<CollectionConfig | null> {
    const collection = this.collections.get(collectionName);
    if (!collection) {
      console.warn(`⚠️ Collection not found: ${collectionName}`);
      return null;
    }

    return collection;
  }

  /**
   * Update collection settings
   */
  async updateCollection(collectionName: string, updates: Partial<CollectionConfig>): Promise<boolean> {
    try {
      const collection = this.collections.get(collectionName);
      if (!collection) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      // Update collection with new data
      const updatedCollection = {
        ...collection,
        ...updates,
        lastModified: Date.now()
      };

      this.collections.set(collectionName, updatedCollection);
      
      // Clear cache
      this.clearCollectionCache(collectionName);
      
      console.log(`✅ Collection updated: ${collectionName}`);
      console.log('📝 Changes:', Object.keys(updates));
      
      return true;

    } catch (error) {
      console.error(`❌ Error updating collection ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Toggle minting for a collection
   */
  async toggleCollectionMinting(collectionName: string, enabled: boolean): Promise<boolean> {
    console.log(`🎛️ Toggling minting for ${collectionName}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    const success = await this.updateCollection(collectionName, {
      mintingEnabled: enabled,
      isActive: enabled // Also toggle active status
    });

    if (success) {
      console.log(`✅ Minting ${enabled ? 'enabled' : 'disabled'} for ${collectionName}`);
    }

    return success;
  }

  /**
   * Toggle global minting
   */
  async toggleGlobalMinting(enabled: boolean): Promise<boolean> {
    console.log(`🎛️ Toggling global minting: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    this.adminSettings.globalMintingEnabled = enabled;
    
    // If disabling global minting, disable all collections
    if (!enabled) {
      for (const [name, collection] of this.collections) {
        if (collection.mintingEnabled) {
          await this.updateCollection(name, { mintingEnabled: false });
        }
      }
    }
    
    console.log(`✅ Global minting ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Check if minting is allowed for a collection
   */
  async isMintingAllowed(collectionName: string): Promise<{
    allowed: boolean;
    reason?: string;
    collection?: CollectionConfig;
  }> {
    // Check emergency stop
    if (this.adminSettings.emergencyStop) {
      return {
        allowed: false,
        reason: 'Emergency stop activated'
      };
    }

    // Check maintenance mode
    if (this.adminSettings.maintenanceMode) {
      return {
        allowed: false,
        reason: 'System maintenance in progress'
      };
    }

    // Check global minting
    if (!this.adminSettings.globalMintingEnabled) {
      return {
        allowed: false,
        reason: 'Global minting is disabled'
      };
    }

    // Check collection exists and is active
    const collection = await this.getCollection(collectionName);
    if (!collection) {
      return {
        allowed: false,
        reason: 'Collection not found'
      };
    }

    if (!collection.isActive) {
      return {
        allowed: false,
        reason: 'Collection is inactive'
      };
    }

    if (!collection.mintingEnabled) {
      return {
        allowed: false,
        reason: 'Collection minting is disabled',
        collection
      };
    }

    // Check if collection is in allowed list
    if (!this.adminSettings.allowedCollections.includes(collectionName)) {
      return {
        allowed: false,
        reason: 'Collection not in allowed list'
      };
    }

    return {
      allowed: true,
      collection
    };
  }

  /**
   * Get admin settings
   */
  async getAdminSettings(): Promise<AdminSettings> {
    return { ...this.adminSettings };
  }

  /**
   * Update admin settings
   */
  async updateAdminSettings(updates: Partial<AdminSettings>): Promise<boolean> {
    try {
      this.adminSettings = {
        ...this.adminSettings,
        ...updates
      };

      console.log('✅ Admin settings updated');
      console.log('📝 Changes:', Object.keys(updates));
      
      return true;

    } catch (error) {
      console.error('❌ Error updating admin settings:', error);
      return false;
    }
  }

  /**
   * Create new collection
   */
  async createCollection(config: Omit<CollectionConfig, 'createdAt' | 'lastModified'>): Promise<boolean> {
    try {
      const collection: CollectionConfig = {
        ...config,
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      this.collections.set(config.name, collection);
      
      console.log(`✅ New collection created: ${config.name}`);
      return true;

    } catch (error) {
      console.error(`❌ Error creating collection ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      if (!this.collections.has(collectionName)) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      this.collections.delete(collectionName);
      this.clearCollectionCache(collectionName);
      
      console.log(`✅ Collection deleted: ${collectionName}`);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting collection ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Utility methods
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private clearCollectionCache(collectionName: string): void {
    const keysToDelete = [
      'all_collections',
      `collection_${collectionName}`
    ];
    
    keysToDelete.forEach(key => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    totalCollections: number;
    activeCollections: number;
    mintingEnabledCollections: number;
    globalMintingEnabled: boolean;
    emergencyStop: boolean;
    maintenanceMode: boolean;
  } {
    const collections = Array.from(this.collections.values());
    
    return {
      totalCollections: collections.length,
      activeCollections: collections.filter(c => c.isActive).length,
      mintingEnabledCollections: collections.filter(c => c.mintingEnabled).length,
      globalMintingEnabled: this.adminSettings.globalMintingEnabled,
      emergencyStop: this.adminSettings.emergencyStop,
      maintenanceMode: this.adminSettings.maintenanceMode
    };
  }
}

export const adminControlService = new AdminControlService();
