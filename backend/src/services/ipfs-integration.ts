/**
 * IPFS Integration Service
 * Handles uploading generated NFTs and metadata to IPFS
 * Supports multiple providers with fallback
 */

import { NFTStorage, File, Blob } from 'nft.storage';
import pinataSDK from '@pinata/sdk';

export interface UploadProgress {
  current: number;
  total: number;
  status: 'uploading' | 'completed' | 'error';
  message: string;
  currentFile?: string;
}

export interface CollectionUploadResult {
  baseURI: string;
  imageCIDs: string[];
  metadataCIDs: string[];
  collectionCID: string;
  uploadTime: number;
  totalSize: number;
}

export interface IPFSUploadOptions {
  batchSize?: number;
  retryAttempts?: number;
  useNFTStorage?: boolean;
  usePinata?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

export class IPFSIntegrationService {
  private nftStorage?: NFTStorage;
  private pinata?: pinataSDK;
  private options: IPFSUploadOptions;

  constructor(options: IPFSUploadOptions = {}) {
    this.options = {
      batchSize: 10,
      retryAttempts: 3,
      useNFTStorage: true,
      usePinata: true,
      ...options,
    };

    // Initialize NFT.Storage if enabled
    if (this.options.useNFTStorage && process.env.NFT_STORAGE_API_KEY) {
      this.nftStorage = new NFTStorage({ 
        token: process.env.NFT_STORAGE_API_KEY 
      });
    }

    // Initialize Pinata if enabled
    if (this.options.usePinata && 
        process.env.PINATA_API_KEY && 
        process.env.PINATA_SECRET_KEY) {
      this.pinata = new pinataSDK({
        pinataApiKey: process.env.PINATA_API_KEY,
        pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
      });
    }
  }

  /**
   * Upload complete NFT collection to IPFS
   */
  async uploadCollection(collection: {
    images: Buffer[];
    metadata: any[];
    collectionMetadata: any;
    collectionName: string;
  }): Promise<CollectionUploadResult> {
    const startTime = Date.now();
    
    try {
      this.updateProgress({
        current: 0,
        total: collection.images.length + collection.metadata.length + 1,
        status: 'uploading',
        message: 'Starting collection upload...',
      });

      // Step 1: Upload all images
      const imageCIDs = await this.batchUploadImages(collection.images, collection.collectionName);
      
      // Step 2: Update metadata with image URLs
      const updatedMetadata = collection.metadata.map((meta, index) => ({
        ...meta,
        image: imageCIDs[index],
      }));

      // Step 3: Upload all metadata
      const metadataCIDs = await this.batchUploadMetadata(updatedMetadata, collection.collectionName);
      
      // Step 4: Upload collection metadata
      const collectionMetadata = {
        ...collection.collectionMetadata,
        totalSupply: collection.metadata.length,
        baseImageURI: imageCIDs[0]?.split('/').slice(0, -1).join('/') + '/',
        baseMetadataURI: metadataCIDs[0]?.split('/').slice(0, -1).join('/') + '/',
      };
      
      const collectionCID = await this.uploadMetadata(
        collectionMetadata, 
        `${collection.collectionName}-collection.json`,
        collection.collectionName
      );

      const uploadTime = Date.now() - startTime;
      const totalSize = this.calculateTotalSize(collection.images);

      this.updateProgress({
        current: collection.images.length + collection.metadata.length + 1,
        total: collection.images.length + collection.metadata.length + 1,
        status: 'completed',
        message: `Upload complete! Collection available at: ipfs://${collectionCID}`,
      });

      return {
        baseURI: `ipfs://${collectionCID}/`,
        imageCIDs,
        metadataCIDs,
        collectionCID,
        uploadTime,
        totalSize,
      };

    } catch (error) {
      this.updateProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      throw error;
    }
  }

  /**
   * Batch upload images to IPFS
   */
  private async batchUploadImages(
    images: Buffer[], 
    collectionName: string
  ): Promise<string[]> {
    const batchSize = this.options.batchSize || 10;
    const results: string[] = [];
    
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      this.updateProgress({
        current: i,
        total: images.length,
        status: 'uploading',
        message: `Uploading images ${i + 1}-${Math.min(i + batchSize, images.length)} of ${images.length}`,
        currentFile: `${collectionName}-${i}.png`,
      });

      const batchResults = await Promise.all(
        batch.map((img, idx) => 
          this.uploadImage(img, `${collectionName}-${i + idx}.png`)
        )
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Batch upload metadata to IPFS
   */
  private async batchUploadMetadata(
    metadata: any[], 
    collectionName: string
  ): Promise<string[]> {
    const batchSize = this.options.batchSize || 10;
    const results: string[] = [];
    
    for (let i = 0; i < metadata.length; i += batchSize) {
      const batch = metadata.slice(i, i + batchSize);
      
      this.updateProgress({
        current: i,
        total: metadata.length,
        status: 'uploading',
        message: `Uploading metadata ${i + 1}-${Math.min(i + batchSize, metadata.length)} of ${metadata.length}`,
        currentFile: `${collectionName}-metadata-${i}.json`,
      });

      const batchResults = await Promise.all(
        batch.map((meta, idx) => 
          this.uploadMetadata(meta, `${collectionName}-${i + idx}.json`, collectionName)
        )
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Upload single image to IPFS
   */
  private async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const maxRetries = this.options.retryAttempts || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Try NFT.Storage first (free)
        if (this.nftStorage) {
          const file = new File([imageBuffer], filename, { type: 'image/png' });
          const cid = await this.nftStorage.storeBlob(file);
          return `ipfs://${cid}`;
        }
        
        // Fallback to Pinata
        if (this.pinata) {
          const result = await this.pinata.pinFileToIPFS(imageBuffer, {
            pinataMetadata: { 
              name: filename,
              keyvalues: {
                type: 'nft-image',
                timestamp: Date.now().toString(),
              }
            },
            pinataOptions: {
              cidVersion: 1,
            }
          });
          return `ipfs://${result.IpfsHash}`;
        }
        
        throw new Error('No IPFS provider configured');
        
      } catch (error) {
        console.warn(`Upload attempt ${attempt} failed for ${filename}:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to upload ${filename} after ${maxRetries} attempts: ${error}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Upload failed');
  }

  /**
   * Upload metadata JSON to IPFS
   */
  private async uploadMetadata(
    metadata: any, 
    filename: string, 
    collectionName: string
  ): Promise<string> {
    const maxRetries = this.options.retryAttempts || 3;
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { 
      type: 'application/json' 
    });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Try NFT.Storage first
        if (this.nftStorage) {
          const cid = await this.nftStorage.storeBlob(blob);
          return `ipfs://${cid}`;
        }
        
        // Fallback to Pinata
        if (this.pinata) {
          const result = await this.pinata.pinFileToIPFS(blob, {
            pinataMetadata: { 
              name: filename,
              keyvalues: {
                type: 'nft-metadata',
                collection: collectionName,
                timestamp: Date.now().toString(),
              }
            },
            pinataOptions: {
              cidVersion: 1,
            }
          });
          return `ipfs://${result.IpfsHash}`;
        }
        
        throw new Error('No IPFS provider configured');
        
      } catch (error) {
        console.warn(`Metadata upload attempt ${attempt} failed for ${filename}:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to upload metadata ${filename} after ${maxRetries} attempts: ${error}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Metadata upload failed');
  }

  /**
   * Calculate total size of images
   */
  private calculateTotalSize(images: Buffer[]): number {
    return images.reduce((total, img) => total + img.length, 0);
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: UploadProgress): void {
    if (this.options.onProgress) {
      this.options.onProgress(progress);
    }
  }

  /**
   * Test IPFS connectivity
   */
  async testConnectivity(): Promise<{
    nftStorage: boolean;
    pinata: boolean;
    error?: string;
  }> {
    const testData = new Blob(['test'], { type: 'text/plain' });
    
    const result = {
      nftStorage: false,
      pinata: false,
      error: undefined as string | undefined,
    };

    try {
      // Test NFT.Storage
      if (this.nftStorage) {
        try {
          await this.nftStorage.storeBlob(testData);
          result.nftStorage = true;
        } catch (error) {
          console.warn('NFT.Storage test failed:', error);
        }
      }

      // Test Pinata
      if (this.pinata) {
        try {
          await this.pinata.pinFileToIPFS(testData, {
            pinataMetadata: { name: 'test' },
          });
          result.pinata = true;
        } catch (error) {
          console.warn('Pinata test failed:', error);
        }
      }

      if (!result.nftStorage && !result.pinata) {
        result.error = 'No working IPFS provider found';
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Get upload cost estimate
   */
  async getUploadCostEstimate(collectionSize: number): Promise<{
    nftStorage: { cost: number; currency: string };
    pinata: { cost: number; currency: string };
  }> {
    // NFT.Storage is free
    const nftStorageCost = 0;

    // Pinata pricing (approximate)
    // Free tier: 1GB, then $15/month for 100GB
    const estimatedSize = collectionSize * 0.5; // ~0.5MB per NFT
    const pinataCost = estimatedSize > 1000 ? 15 : 0; // $15/month if over 1GB

    return {
      nftStorage: { cost: nftStorageCost, currency: 'USD' },
      pinata: { cost: pinataCost, currency: 'USD/month' },
    };
  }

  /**
   * Validate collection before upload
   */
  validateCollection(collection: {
    images: Buffer[];
    metadata: any[];
    collectionMetadata: any;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check image count matches metadata count
    if (collection.images.length !== collection.metadata.length) {
      errors.push(`Image count (${collection.images.length}) doesn't match metadata count (${collection.metadata.length})`);
    }

    // Check for empty images
    const emptyImages = collection.images.filter(img => img.length === 0);
    if (emptyImages.length > 0) {
      errors.push(`${emptyImages.length} empty images found`);
    }

    // Check for large images (warn if > 1MB)
    const largeImages = collection.images.filter(img => img.length > 1024 * 1024);
    if (largeImages.length > 0) {
      warnings.push(`${largeImages.length} images are larger than 1MB`);
    }

    // Check metadata structure
    for (let i = 0; i < collection.metadata.length; i++) {
      const meta = collection.metadata[i];
      if (!meta.name) {
        errors.push(`Metadata ${i} missing name`);
      }
      if (!meta.description) {
        warnings.push(`Metadata ${i} missing description`);
      }
      if (!meta.attributes || !Array.isArray(meta.attributes)) {
        errors.push(`Metadata ${i} missing or invalid attributes`);
      }
    }

    // Check collection metadata
    if (!collection.collectionMetadata.name) {
      errors.push('Collection metadata missing name');
    }
    if (!collection.collectionMetadata.description) {
      warnings.push('Collection metadata missing description');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const ipfsService = new IPFSIntegrationService();