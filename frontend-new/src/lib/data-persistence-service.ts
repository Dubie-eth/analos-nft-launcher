/**
 * Data Persistence Service
 * Provides multiple backup strategies for collection data
 */

export interface CollectionData {
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
  // Deployment data
  deployedAt?: number;
  signature?: string;
  mintAddress?: string;
  collectionAddress?: string;
  // Additional metadata
  metadata?: any;
}

export interface PersistenceBackup {
  id: string;
  timestamp: number;
  data: CollectionData[];
  version: string;
  source: 'localStorage' | 'backend' | 'github';
}

export class DataPersistenceService {
  private readonly BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';
  private readonly GITHUB_GIST_ID = 'your-gist-id'; // Will be set up
  private readonly GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN; // For GitHub API
  private readonly BACKUP_INTERVAL = 60000; // 1 minute
  private backupTimer: NodeJS.Timeout | null = null;
  private isBackingUp = false;

  constructor() {
    console.log('💾 Data Persistence Service initialized');
    this.startPeriodicBackup();
  }

  /**
   * Save collection data to multiple locations
   */
  async saveCollectionData(collections: CollectionData[]): Promise<{
    success: boolean;
    errors: string[];
    backups: string[];
  }> {
    const errors: string[] = [];
    const backups: string[] = [];

    // 1. Save to backend API (primary)
    try {
      const backendResult = await this.saveToBackend(collections);
      if (backendResult.success) {
        backups.push('backend');
      } else {
        errors.push(`Backend: ${backendResult.error}`);
      }
    } catch (error) {
      errors.push(`Backend: ${error}`);
    }

    // 2. Save to localStorage (immediate fallback)
    try {
      this.saveToLocalStorage(collections);
      backups.push('localStorage');
    } catch (error) {
      errors.push(`LocalStorage: ${error}`);
    }

    // 3. Save to GitHub Gist (long-term backup)
    try {
      const githubResult = await this.saveToGitHub(collections);
      if (githubResult.success) {
        backups.push('github');
      } else {
        errors.push(`GitHub: ${githubResult.error}`);
      }
    } catch (error) {
      errors.push(`GitHub: ${error}`);
    }

    return {
      success: backups.length > 0,
      errors,
      backups
    };
  }

  /**
   * Load collection data from multiple sources (filtered by new program ID)
   */
  async loadCollectionData(): Promise<CollectionData[]> {
    console.log('📥 Loading collection data from multiple sources...');

    let allCollections: CollectionData[] = [];

    // Try backend first (most reliable)
    try {
      const backendData = await this.loadFromBackend();
      if (backendData && backendData.length > 0) {
        console.log('✅ Loaded collection data from backend:', backendData.length, 'collections');
        allCollections = [...allCollections, ...backendData];
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from backend:', error);
    }

    // Try GitHub Gist (reliable backup)
    try {
      const githubData = await this.loadFromGitHub();
      if (githubData && githubData.length > 0) {
        console.log('✅ Loaded collection data from GitHub:', githubData.length, 'collections');
        allCollections = [...allCollections, ...githubData];
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from GitHub:', error);
    }

    // Try localStorage (fallback)
    try {
      const localData = this.loadFromLocalStorage();
      if (localData && localData.length > 0) {
        console.log('✅ Loaded collection data from localStorage:', localData.length, 'collections');
        allCollections = [...allCollections, ...localData];
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from localStorage:', error);
    }

    // If no data found, use default collections
    if (allCollections.length === 0) {
      console.log('📋 Using default collection data');
      allCollections = this.getDefaultCollections();
    }

    // Filter collections by program ID
    const filteredCollections = this.filterCollectionsByProgramId(allCollections);
    console.log(`🔍 Filtered collections: ${allCollections.length} → ${filteredCollections.length} (new program only)`);
    
    return filteredCollections;
  }

  /**
   * Filter collections to only include those from the new program
   */
  private filterCollectionsByProgramId(collections: CollectionData[]): CollectionData[] {
    const NEW_PROGRAM_ID = '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk';
    const OLD_PROGRAM_IDS = [
      '28YCSetmG6PSRdhQV6iBFuAE7NqWtLCryr3GYtR3qS6p',
      '3FNWoNWiBcbA67yYXrczCj8KdUo2TphCZXYHthqewwcX'
    ];

    return collections.filter(collection => {
      // If no programId is set, assume it's from the new program (for existing collections)
      if (!collection.programId) {
        return true;
      }

      // Only show collections from the new program
      const isFromNewProgram = collection.programId === NEW_PROGRAM_ID;
      const isFromOldProgram = OLD_PROGRAM_IDS.includes(collection.programId);

      if (isFromOldProgram) {
        console.log(`🗑️ Filtering out "${collection.name}" from data persistence - old program ID: ${collection.programId}`);
        return false;
      }

      return isFromNewProgram;
    });
  }

  /**
   * Save to backend API
   */
  private async saveToBackend(collections: CollectionData[]): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.BACKEND_API_URL.replace(/\/$/, '')}/api/collections/backup`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collections,
          timestamp: Date.now(),
          version: '1.0.0'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Collection data saved to backend');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save to backend:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load from backend API
   */
  private async loadFromBackend(): Promise<CollectionData[]> {
    try {
      const url = `${this.BACKEND_API_URL.replace(/\/$/, '')}/api/collections/backup`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📋 No backup data found on backend (this is normal for first-time setup)');
          return [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.collections) {
        console.log('✅ Loaded backup from backend:', data.collections.length, 'collections');
        return data.collections;
      } else {
        console.log('📋 No collections in backend backup');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to load from backend:', error);
      throw error;
    }
  }

  /**
   * Save to GitHub Gist
   */
  private async saveToGitHub(collections: CollectionData[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.GITHUB_TOKEN) {
        console.warn('⚠️ GitHub token not configured, skipping GitHub backup');
        return { success: false, error: 'GitHub token not configured' };
      }

      const gistData = {
        description: `Analos NFT Launcher Collection Data - ${new Date().toISOString()}`,
        public: false,
        files: {
          'collections.json': {
            content: JSON.stringify({
              collections,
              timestamp: Date.now(),
              version: '1.0.0'
            }, null, 2)
          }
        }
      };

      const response = await fetch(`https://api.github.com/gists/${this.GITHUB_GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Collection data saved to GitHub Gist');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save to GitHub:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load from GitHub Gist
   */
  private async loadFromGitHub(): Promise<CollectionData[]> {
    try {
      if (!this.GITHUB_TOKEN) {
        throw new Error('GitHub token not configured');
      }

      const response = await fetch(`https://api.github.com/gists/${this.GITHUB_GIST_ID}`, {
        headers: {
          'Authorization': `token ${this.GITHUB_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const gist = await response.json();
      const fileContent = gist.files['collections.json']?.content;
      
      if (!fileContent) {
        throw new Error('No collections.json file found in Gist');
      }

      const data = JSON.parse(fileContent);
      return data.collections || [];
    } catch (error) {
      console.error('❌ Failed to load from GitHub:', error);
      throw error;
    }
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(collections: CollectionData[]): void {
    try {
      localStorage.setItem('collections_backup', JSON.stringify({
        collections,
        timestamp: Date.now(),
        version: '1.0.0'
      }));
      console.log('✅ Collection data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): CollectionData[] {
    try {
      const backupData = localStorage.getItem('collections_backup');
      if (!backupData) {
        return [];
      }

      const data = JSON.parse(backupData);
      return data.collections || [];
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
      throw error;
    }
  }

  /**
   * Get default collections
   */
  private getDefaultCollections(): CollectionData[] {
    return [
      {
        name: 'The LosBros',
        displayName: 'The LosBros - Featured Collection',
        isActive: true, // Enable by default
        mintingEnabled: true, // Enable by default
        isTestMode: false,
        totalSupply: 2222,
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL - Featured collection for launchonlos.fun',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        createdAt: Date.now(),
        lastModified: Date.now()
      },
      {
        name: 'Test',
        displayName: 'Test Collection',
        isActive: false,
        mintingEnabled: false,
        isTestMode: true,
        totalSupply: 2222,
        mintPrice: 10.00,
        paymentToken: 'LOS',
        description: 'Test collection for development and testing purposes',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        createdAt: Date.now(),
        lastModified: Date.now()
      }
    ];
  }

  /**
   * Start periodic backup
   */
  private startPeriodicBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      if (!this.isBackingUp) {
        await this.performPeriodicBackup();
      }
    }, this.BACKUP_INTERVAL);
  }

  /**
   * Perform periodic backup
   */
  private async performPeriodicBackup(): Promise<void> {
    this.isBackingUp = true;
    try {
      // Get current collections from localStorage
      const currentCollections = this.loadFromLocalStorage();
      if (currentCollections.length > 0) {
        await this.saveCollectionData(currentCollections);
      }
    } catch (error) {
      console.error('❌ Periodic backup failed:', error);
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Create a manual backup
   */
  async createManualBackup(): Promise<{ success: boolean; message: string }> {
    try {
      const collections = this.loadFromLocalStorage();
      if (collections.length === 0) {
        return { success: false, message: 'No collections to backup' };
      }

      const result = await this.saveCollectionData(collections);
      
      if (result.success) {
        return { 
          success: true, 
          message: `Backup successful! Saved to: ${result.backups.join(', ')}` 
        };
      } else {
        return { 
          success: false, 
          message: `Backup failed: ${result.errors.join(', ')}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Backup error: ${error}` 
      };
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(): Promise<{ success: boolean; message: string; collections: CollectionData[] }> {
    try {
      const collections = await this.loadCollectionData();
      
      if (collections.length > 0) {
        // Save to localStorage for immediate use
        this.saveToLocalStorage(collections);
        
        return { 
          success: true, 
          message: `Restored ${collections.length} collections successfully`,
          collections
        };
      } else {
        return { 
          success: false, 
          message: 'No backup data found to restore',
          collections: []
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Restore error: ${error}`,
        collections: []
      };
    }
  }

  /**
   * Get backup status
   */
  getBackupStatus(): {
    hasLocalBackup: boolean;
    lastBackupTime: number | null;
    backupCount: number;
  } {
    try {
      const backupData = localStorage.getItem('collections_backup');
      if (!backupData) {
        return {
          hasLocalBackup: false,
          lastBackupTime: null,
          backupCount: 0
        };
      }

      const data = JSON.parse(backupData);
      return {
        hasLocalBackup: true,
        lastBackupTime: data.timestamp,
        backupCount: data.collections?.length || 0
      };
    } catch (error) {
      return {
        hasLocalBackup: false,
        lastBackupTime: null,
        backupCount: 0
      };
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }
}

// Export singleton instance
export const dataPersistenceService = new DataPersistenceService();
export default dataPersistenceService;
