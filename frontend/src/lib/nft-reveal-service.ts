/**
 * NFT Reveal Service - Handles batch metadata updates and reveal operations
 */

export interface RevealBatch {
  id: string;
  collectionId: string;
  nftIds: string[];
  imageUrls: string[];
  metadataUpdates: Record<string, any>;
  revealType: 'sequential' | 'random' | 'uniform';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface CollectionRevealSettings {
  collectionId: string;
  isRevealed: boolean;
  revealType: 'timer' | 'completion' | 'manual';
  revealDate?: string;
  completionPercentage?: number;
  canUpdateAfterReveal: boolean;
  burnUpdateAccess: boolean;
  lastRevealBatchId?: string;
}

export interface PinataUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class NFTRevealService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private backendUrl: string;

  constructor() {
    // SECURITY: No client-side API keys - all uploads go through secure server endpoint
    this.pinataApiKey = '';
    this.pinataSecretKey = '';
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-production-f3da.up.railway.app';
  }

  /**
   * Upload image to Pinata IPFS
   */
  async uploadImageToPinata(imageFile: File): Promise<PinataUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('pinataMetadata', JSON.stringify({
        name: imageFile.name,
        keyvalues: {
          type: 'nft-image',
          uploadedAt: new Date().toISOString()
        }
      }));
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }));

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Image uploaded to Pinata:', result);
      return result;
    } catch (error) {
      console.error('❌ Error uploading to Pinata:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images to Pinata in batch
   */
  async uploadImagesToPinata(images: File[]): Promise<string[]> {
    try {
      console.log(`📤 Uploading ${images.length} images to Pinata...`);
      
      const uploadPromises = images.map(async (image, index) => {
        try {
          const result = await this.uploadImageToPinata(image);
          console.log(`✅ Uploaded image ${index + 1}/${images.length}: ${result.IpfsHash}`);
          return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
        } catch (error) {
          console.error(`❌ Failed to upload image ${index + 1}:`, error);
          throw error;
        }
      });

      const imageUrls = await Promise.all(uploadPromises);
      console.log(`🎉 Successfully uploaded ${imageUrls.length} images to Pinata`);
      return imageUrls;
    } catch (error) {
      console.error('❌ Batch upload to Pinata failed:', error);
      throw error;
    }
  }

  /**
   * Create NFT metadata JSON and upload to Pinata
   */
  async createAndUploadMetadata(metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
    collection?: {
      name: string;
      family: string;
    };
    properties?: Record<string, any>;
  }): Promise<string> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      
      const blob = new Blob([metadataJson], { type: 'application/json' });
      const metadataFile = new File([blob], 'metadata.json', { type: 'application/json' });

      const result = await this.uploadImageToPinata(metadataFile);
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      
      console.log('✅ Metadata uploaded to Pinata:', metadataUrl);
      return metadataUrl;
    } catch (error) {
      console.error('❌ Error creating and uploading metadata:', error);
      throw error;
    }
  }

  /**
   * Create reveal batch for collection
   */
  async createRevealBatch(collectionId: string, options: {
    imageFiles?: File[];
    imageUrls?: string[];
    revealType: 'sequential' | 'random' | 'uniform';
    metadataUpdates?: Record<string, any>;
    nftIds?: string[]; // If not provided, will reveal all NFTs in collection
  }): Promise<RevealBatch> {
    try {
      console.log(`🎭 Creating reveal batch for collection ${collectionId}...`);

      let imageUrls: string[] = [];

      // Upload images if files provided
      if (options.imageFiles && options.imageFiles.length > 0) {
        imageUrls = await this.uploadImagesToPinata(options.imageFiles);
      } else if (options.imageUrls && options.imageUrls.length > 0) {
        imageUrls = options.imageUrls;
      } else {
        throw new Error('No images provided for reveal');
      }

      const batch: RevealBatch = {
        id: `reveal_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        collectionId,
        nftIds: options.nftIds || [],
        imageUrls,
        metadataUpdates: options.metadataUpdates || {},
        revealType: options.revealType,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store batch in backend
      const response = await fetch(`${this.backendUrl}/api/reveal/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`Failed to create reveal batch: ${response.statusText}`);
      }

      const createdBatch = await response.json();
      console.log('✅ Reveal batch created:', createdBatch);
      return createdBatch;
    } catch (error) {
      console.error('❌ Error creating reveal batch:', error);
      throw error;
    }
  }

  /**
   * Execute reveal batch - update all NFTs in the batch
   */
  async executeRevealBatch(batchId: string): Promise<void> {
    try {
      console.log(`🚀 Executing reveal batch ${batchId}...`);

      const response = await fetch(`${this.backendUrl}/api/reveal/batches/${batchId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to execute reveal batch: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Reveal batch executed successfully:', result);
    } catch (error) {
      console.error('❌ Error executing reveal batch:', error);
      throw error;
    }
  }

  /**
   * Update collection reveal settings
   */
  async updateCollectionRevealSettings(collectionId: string, settings: Partial<CollectionRevealSettings>): Promise<void> {
    try {
      console.log(`⚙️ Updating reveal settings for collection ${collectionId}...`);

      const response = await fetch(`${this.backendUrl}/api/collections/${collectionId}/reveal-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Failed to update reveal settings: ${response.statusText}`);
      }

      console.log('✅ Reveal settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating reveal settings:', error);
      throw error;
    }
  }

  /**
   * Burn update access for collection (prevent further updates)
   */
  async burnUpdateAccess(collectionId: string): Promise<void> {
    try {
      console.log(`🔥 Burning update access for collection ${collectionId}...`);

      await this.updateCollectionRevealSettings(collectionId, {
        canUpdateAfterReveal: false,
        burnUpdateAccess: true
      });

      console.log('✅ Update access burned successfully');
    } catch (error) {
      console.error('❌ Error burning update access:', error);
      throw error;
    }
  }

  /**
   * Get reveal batch status
   */
  async getRevealBatchStatus(batchId: string): Promise<RevealBatch> {
    try {
      const response = await fetch(`${this.backendUrl}/api/reveal/batches/${batchId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get reveal batch status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting reveal batch status:', error);
      throw error;
    }
  }

  /**
   * Get all reveal batches for a collection
   */
  async getCollectionRevealBatches(collectionId: string): Promise<RevealBatch[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/reveal/collections/${collectionId}/batches`);
      
      if (!response.ok) {
        throw new Error(`Failed to get collection reveal batches: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting collection reveal batches:', error);
      throw error;
    }
  }

  /**
   * Check if collection can be updated after reveal
   */
  async canUpdateAfterReveal(collectionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/collections/${collectionId}/reveal-settings`);
      
      if (!response.ok) {
        return false; // Default to false if can't check
      }

      const settings = await response.json();
      return settings.canUpdateAfterReveal && !settings.burnUpdateAccess;
    } catch (error) {
      console.error('❌ Error checking update access:', error);
      return false;
    }
  }
}

export const nftRevealService = new NFTRevealService();
