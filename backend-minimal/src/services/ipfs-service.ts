/**
 * IPFS/Pinata Service
 * 
 * Handles metadata and image uploads to IPFS via Pinata
 * Security: File size limits, type validation, rate limiting
 */

import PinataClient from '@pinata/sdk';
import axios from 'axios';
import FormData from 'form-data';

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  pinataUrl?: string;
  error?: string;
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

export class IPFSService {
  private pinata: any;
  private apiKey: string;
  private secretKey: string;
  private jwt: string;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || '';
    this.secretKey = process.env.PINATA_SECRET_KEY || '';
    this.jwt = process.env.PINATA_JWT || '';

    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️ Warning: Pinata credentials not set');
    } else {
      this.pinata = new PinataClient(this.apiKey, this.secretKey);
      console.log('✅ Pinata SDK initialized');
    }
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.pinata.testAuthentication();
      console.log('✅ Pinata authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Pinata authentication failed:', error);
      return false;
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<IPFSUploadResult> {
    try {
      // Validate metadata
      if (!metadata.name || !metadata.description || !metadata.image) {
        return {
          success: false,
          error: 'Missing required metadata fields (name, description, image)'
        };
      }

      // Upload to Pinata
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `${metadata.name} - Metadata`,
        },
        pinataOptions: {
          cidVersion: 1
        }
      });

      const ipfsHash = result.IpfsHash;
      const ipfsUrl = `ipfs://${ipfsHash}`;
      const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      console.log(`✅ Metadata uploaded: ${ipfsUrl}`);

      return {
        success: true,
        ipfsHash,
        ipfsUrl,
        pinataUrl
      };

    } catch (error) {
      console.error('❌ Error uploading metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload file to IPFS (image, etc.)
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<IPFSUploadResult> {
    try {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > maxSize) {
        return {
          success: false,
          error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`
        };
      }

      // Validate MIME type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];
      
      if (!allowedTypes.includes(mimeType)) {
        return {
          success: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        };
      }

      // Create readable stream
      const options = {
        pinataMetadata: {
          name: fileName,
        },
        pinataOptions: {
          cidVersion: 1
        }
      };

      // Upload to Pinata using JWT
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType
      });
      formData.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
      formData.append('pinataOptions', JSON.stringify(options.pinataOptions));

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.jwt}`
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      const ipfsUrl = `ipfs://${ipfsHash}`;
      const pinataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      console.log(`✅ File uploaded: ${ipfsUrl}`);

      return {
        success: true,
        ipfsHash,
        ipfsUrl,
        pinataUrl
      };

    } catch (error) {
      console.error('❌ Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload image from URL
   */
  async uploadImageFromUrl(imageUrl: string): Promise<IPFSUploadResult> {
    try {
      // Fetch image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';
      const fileName = imageUrl.split('/').pop() || 'image.png';

      // Upload to IPFS
      return await this.uploadFile(buffer, fileName, contentType);

    } catch (error) {
      console.error('❌ Error fetching/uploading image from URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch upload multiple NFT metadata
   */
  async batchUploadMetadata(
    metadataArray: NFTMetadata[]
  ): Promise<IPFSUploadResult[]> {
    console.log(`📦 Batch uploading ${metadataArray.length} metadata files...`);

    const results: IPFSUploadResult[] = [];

    for (let i = 0; i < metadataArray.length; i++) {
      const metadata = metadataArray[i];
      console.log(`Uploading ${i + 1}/${metadataArray.length}: ${metadata.name}`);
      
      const result = await this.uploadMetadata(metadata);
      results.push(result);

      // Small delay to avoid rate limiting
      if (i < metadataArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch upload complete: ${successCount}/${metadataArray.length} successful`);

    return results;
  }

  /**
   * Unpin (remove) content from IPFS
   */
  async unpinContent(ipfsHash: string): Promise<boolean> {
    try {
      await this.pinata.unpin(ipfsHash);
      console.log(`✅ Unpinned: ${ipfsHash}`);
      return true;
    } catch (error) {
      console.error('❌ Error unpinning content:', error);
      return false;
    }
  }

  /**
   * Get pinned files list
   */
  async listPinnedFiles(): Promise<any[]> {
    try {
      const result = await this.pinata.pinList({
        status: 'pinned',
        pageLimit: 100
      });
      return result.rows;
    } catch (error) {
      console.error('❌ Error listing pinned files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();

