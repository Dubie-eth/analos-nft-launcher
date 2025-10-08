/**
 * Admin Control Service
 * Manages minting toggles and collection controls
 */

import { dataPersistenceService, CollectionData } from './data-persistence-service';

export interface PaymentToken {
  mint: string;
  symbol: string;
  decimals: number;
  pricePerNFT: number;
  minBalanceForWhitelist?: number;
  accepted: boolean;
}

export interface WhitelistConfig {
  enabled: boolean;
  addresses: string[];
  phases: Array<{
    name: string;
    startTime: string;
    endTime: string;
    maxMintsPerWallet: number;
    price: number;
    addresses: string[];
    phaseType: 'address' | 'token' | 'mixed';
    tokenRequirements: Array<{
      tokenMint: string;
      minAmount: number;
      decimals: number;
      tokenSymbol: string;
    }>;
  }>;
}

export interface DelayedRevealConfig {
  enabled: boolean;
  type: 'manual' | 'automatic' | 'completion';
  revealTime: string;
  revealAtCompletion: boolean;
  placeholderImage: string;
}

export interface CollectionConfig {
  name: string;
  displayName: string;
  isActive: boolean;
  mintingEnabled: boolean;
  isTestMode: boolean;
  totalSupply: number;
  mintPrice: number;
  paymentToken: string;
  paymentTokens?: PaymentToken[]; // Multi-token payment configuration
  description: string;
  imageUrl: string;
  createdAt: number;
  lastModified: number;
  // Deployment data
  deployed?: boolean;
  contractAddresses?: {
    mint?: string;
    tokenAccount?: string;
    signature?: string;
    collection?: string;
    metadata?: string;
    masterEdition?: string;
  };
  deploymentSignature?: string;
  deploymentDate?: string;
  // Advanced settings
  whitelist?: WhitelistConfig;
  maxMintsPerWallet?: number;
  delayedReveal?: DelayedRevealConfig;
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
    this.loadCollectionsFromLocalStorage();
    this.loadSettingsFromLocalStorage();
    this.initializeDefaultCollections();
    this.initializeDefaultSettings();
    
    // Initialize data persistence and restore collections
    this.initializeDataPersistence();
    
    // Only log once to reduce console spam
    if (!(window as any).adminControlServiceLogged) {
      console.log('🎛️ Admin Control Service initialized');
      (window as any).adminControlServiceLogged = true;
    }
  }

  private loadCollectionsFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const storedCollections = localStorage.getItem('admin_collections_config');
      if (storedCollections) {
        try {
          const parsedCollections = JSON.parse(storedCollections);
          this.collections = new Map(Object.entries(parsedCollections));
          console.log('📋 Collections loaded from local storage:', this.collections.size);
        } catch (error) {
          console.error('❌ Error parsing collections from local storage:', error);
          localStorage.removeItem('admin_collections_config'); // Clear corrupted data
        }
      }
    }
  }

  private saveCollectionsToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const collectionsObject = Object.fromEntries(this.collections);
      localStorage.setItem('admin_collections_config', JSON.stringify(collectionsObject));
      console.log('💾 Collections saved to local storage:', this.collections.size);
      
      // Also backup to cloud (async, don't wait)
      this.backupCollectionsToCloud();
    }
  }

  /**
   * Backup collections to cloud storage
   */
  private async backupCollectionsToCloud(): Promise<void> {
    try {
      const collectionsArray = Array.from(this.collections.values());
      await dataPersistenceService.saveCollectionData(collectionsArray);
    } catch (error) {
      console.error('❌ Failed to backup collections to cloud:', error);
    }
  }

  private loadSettingsFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('admin_settings_config');
      if (storedSettings) {
        try {
          this.adminSettings = { ...this.adminSettings, ...JSON.parse(storedSettings) };
          console.log('⚙️ Admin settings loaded from local storage');
        } catch (error) {
          console.error('❌ Error parsing settings from local storage:', error);
          localStorage.removeItem('admin_settings_config'); // Clear corrupted data
        }
      }
    }
  }

  private saveSettingsToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_settings_config', JSON.stringify(this.adminSettings));
      console.log('💾 Admin settings saved to local storage');
    }
  }

  /**
   * Initialize data persistence and restore collections
   */
  private async initializeDataPersistence(): Promise<void> {
    try {
      // Try to restore collections from cloud backup
      const restoredCollections = await dataPersistenceService.loadCollectionData();
      
      if (restoredCollections && restoredCollections.length > 0) {
        console.log('🔄 Restoring collections from backup:', restoredCollections.length);
        
        // Clear existing collections and restore from backup
        this.collections.clear();
        
        restoredCollections.forEach(collection => {
          this.collections.set(collection.name, collection);
        });
        
        // Save restored collections to localStorage
        this.saveCollectionsToLocalStorage();
        
        console.log('✅ Collections restored from backup successfully');
      } else {
        console.log('📋 No backup data found, using default collections');
      }
    } catch (error) {
      console.error('❌ Error initializing data persistence:', error);
      // Continue with default collections if backup fails
    }
  }

  /**
   * Initialize default collections
   */
  private initializeDefaultCollections(): void {
        // Test collection for development - PRICE SHOULD BE PULLED FROM BLOCKCHAIN
        // Only set default if not already loaded from localStorage
        if (!this.collections.has('Test')) {
          this.collections.set('Test', {
            name: 'Test',
            displayName: 'Test Collection',
            isActive: false, // DISABLED - hidden from public
            mintingEnabled: false, // DISABLED - hidden from public
            isTestMode: true,
            totalSupply: 2222, // Match the actual collection size
            mintPrice: 10.00, // TODO: This should be pulled from deployed contract on blockchain
            paymentToken: 'LOS',
            description: 'Test collection for development and testing purposes',
            imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
            createdAt: Date.now(),
            lastModified: Date.now()
          });
        }

    // The LosBros - Featured collection for launchonlos.fun
    // Only set default if not already loaded from localStorage
    if (!this.collections.has('The LosBros')) {
      this.collections.set('The LosBros', {
        name: 'The LosBros',
        displayName: 'The LosBros - Featured Collection',
        isActive: true, // ENABLED for testing
        mintingEnabled: true, // ENABLED for testing
        isTestMode: false,
        totalSupply: 2222,
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL - Featured collection for launchonlos.fun',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        createdAt: Date.now(),
        lastModified: Date.now()
      });
    }

    // Los Bros - Newly deployed collection
    if (!this.collections.has('Los Bros')) {
      this.collections.set('Los Bros', {
        name: 'Los Bros',
        displayName: 'Los Bros - Newly Deployed Collection',
        isActive: true,
        mintingEnabled: true,
        isTestMode: false,
        totalSupply: 2222,
        mintPrice: 0, // Free mint
        paymentToken: 'LOL',
        description: 'Los Bros launching On LOS setting the standard for NFT minting on #ANALOS with $LOL',
        imageUrl: 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        createdAt: Date.now(),
        lastModified: Date.now()
      });
    }

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
        globalMintingEnabled: true, // Enable minting for testing
      testModeEnabled: true,
      maintenanceMode: false,
      emergencyStop: false,
      allowedCollections: ['Test', 'The LosBros', 'Los Bros'], // Test and LosBros collections allowed
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
    console.log('🔍 Looking for collection:', collectionName);
    console.log('📋 Available collections:', Array.from(this.collections.keys()));
    
    // Handle URL slug to collection name mapping
    let actualCollectionName = collectionName;
    const collectionNameMappings: { [key: string]: string } = {
      'launch-on-los': 'The LosBros',
      'the-losbros': 'The LosBros',
      'los-bros': 'Los Bros',
      'Launch On LOS': 'The LosBros',
      'losbros': 'Los Bros',
      'the-los-bros': 'The LosBros',
      'Los Bros': 'Los Bros'
    };
    
    if (collectionNameMappings[collectionName]) {
      actualCollectionName = collectionNameMappings[collectionName];
      console.log('🔄 Mapped collection name from', collectionName, 'to', actualCollectionName);
    }
    
    const collection = this.collections.get(actualCollectionName);
    if (!collection) {
      console.warn(`⚠️ Collection not found: ${collectionName} -> ${actualCollectionName}`);
      return null;
    }

    console.log('✅ Found collection:', collectionName, '->', actualCollectionName);
    return collection;
  }

  /**
   * Update collection price from blockchain data
   * This should be called when we have actual contract data
   */
  async updateCollectionPriceFromBlockchain(
    collectionName: string, 
    blockchainPrice: number,
    paymentToken: string
  ): Promise<boolean> {
    try {
      const collection = this.collections.get(collectionName);
      if (collection) {
        collection.mintPrice = blockchainPrice;
        collection.paymentToken = paymentToken;
        collection.lastModified = Date.now();
        
        console.log(`✅ Updated ${collectionName} price from blockchain: ${blockchainPrice} ${paymentToken}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Failed to update ${collectionName} price from blockchain:`, error);
      return false;
    }
  }

  /**
   * Toggle global minting (EMERGENCY CONTROL)
   */
  async toggleGlobalMinting(enabled: boolean): Promise<boolean> {
    try {
      console.log(`🚨 EMERGENCY: Toggling global minting to ${enabled ? 'ENABLED' : 'DISABLED'}`);
      
      this.adminSettings.globalMintingEnabled = enabled;
      this.adminSettings.lastModified = Date.now();
      
      // Clear all caches when toggling global settings
      this.clearCache();
      
      console.log(`✅ Global minting ${enabled ? 'ENABLED' : 'DISABLED'} - All collections affected`);
      return true;
    } catch (error) {
      console.error('❌ Error toggling global minting:', error);
      return false;
    }
  }

  /**
   * Toggle maintenance mode (EMERGENCY CONTROL)
   */
  async toggleMaintenanceMode(enabled: boolean): Promise<boolean> {
    try {
      console.log(`🚨 MAINTENANCE: Setting maintenance mode to ${enabled ? 'ON' : 'OFF'}`);
      
      this.adminSettings.maintenanceMode = enabled;
      this.adminSettings.lastModified = Date.now();
      
      // If enabling maintenance mode, also disable global minting
      if (enabled) {
        this.adminSettings.globalMintingEnabled = false;
        console.log('🔒 Maintenance mode enabled - Global minting automatically disabled');
      }
      
      // Clear all caches when toggling maintenance mode
      this.clearCache();
      
      console.log(`✅ Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
      return true;
    } catch (error) {
      console.error('❌ Error toggling maintenance mode:', error);
      return false;
    }
  }

  /**
   * Emergency stop - disable everything
   */
  async emergencyStop(): Promise<boolean> {
    try {
      console.log('🚨 EMERGENCY STOP ACTIVATED - Disabling all operations');
      
      this.adminSettings.globalMintingEnabled = false;
      this.adminSettings.maintenanceMode = true;
      this.adminSettings.emergencyStop = true;
      this.adminSettings.lastModified = Date.now();
      
      // Disable all collections
      for (const [name, collection] of this.collections) {
        collection.mintingEnabled = false;
        collection.isActive = false;
        collection.lastModified = Date.now();
      }
      
      // Clear all caches
      this.clearCache();
      
      console.log('✅ EMERGENCY STOP COMPLETE - All operations disabled');
      return true;
    } catch (error) {
      console.error('❌ Error during emergency stop:', error);
      return false;
    }
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
      
      // Save to localStorage
      this.saveCollectionsToLocalStorage();
      
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
      
      // Save to localStorage
      this.saveCollectionsToLocalStorage();
      
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

  /**
   * Get all collections as an array
   */
  getAllCollections(): CollectionConfig[] {
    return Array.from(this.collections.values());
  }
}

export const adminControlService = new AdminControlService();
