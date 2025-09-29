// Metadata utilities for Analos NFT SDK

import { AnalosNFT } from './types';

export interface MetadataStandard {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  youtube_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
    display_type?: string;
    max_value?: number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      verified: boolean;
      share: number;
    }>;
  };
}

export class AnalosMetadataUtils {
  // Parse metadata from URI
  static async fetchMetadata(uri: string): Promise<MetadataStandard | null> {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const metadata = await response.json();
      return this.validateMetadata(metadata);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  // Validate metadata structure
  static validateMetadata(metadata: any): MetadataStandard | null {
    try {
      // Required fields
      if (!metadata.name || typeof metadata.name !== 'string') {
        throw new Error('Missing or invalid name field');
      }
      
      if (!metadata.description || typeof metadata.description !== 'string') {
        throw new Error('Missing or invalid description field');
      }
      
      if (!metadata.image || typeof metadata.image !== 'string') {
        throw new Error('Missing or invalid image field');
      }

      // Optional fields with validation
      const validatedMetadata: MetadataStandard = {
        name: metadata.name,
        symbol: metadata.symbol || '',
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        animation_url: metadata.animation_url,
        background_color: metadata.background_color,
        youtube_url: metadata.youtube_url,
        attributes: metadata.attributes || [],
        properties: metadata.properties || {}
      };

      // Validate attributes if present
      if (metadata.attributes && Array.isArray(metadata.attributes)) {
        validatedMetadata.attributes = metadata.attributes.map((attr: any) => {
          if (!attr.trait_type || !attr.value) {
            throw new Error('Invalid attribute: missing trait_type or value');
          }
          
          return {
            trait_type: attr.trait_type,
            value: attr.value,
            display_type: attr.display_type,
            max_value: attr.max_value
          };
        });
      }

      return validatedMetadata;
    } catch (error) {
      console.error('Metadata validation error:', error);
      return null;
    }
  }

  // Generate metadata URI
  static generateMetadataURI(metadata: MetadataStandard, baseUrl?: string): string {
    const metadataJson = JSON.stringify(metadata, null, 2);
    
    if (baseUrl) {
      // In a real implementation, this would upload to IPFS or a CDN
      return `${baseUrl}/metadata/${this.generateMetadataHash(metadata)}`;
    }
    
    // For demo purposes, return a data URI
    return `data:application/json;base64,${btoa(metadataJson)}`;
  }

  // Extract attributes from NFT
  static extractAttributes(nft: AnalosNFT): Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }> {
    if (!nft.attributes) {
      return [];
    }

    return nft.attributes.map(attr => ({
      trait_type: attr.trait_type,
      value: attr.value,
      // Rarity would be calculated based on collection data
      rarity: undefined
    }));
  }

  // Get attribute values by trait type
  static getAttributeValues(nfts: AnalosNFT[], traitType: string): Array<{
    value: string;
    count: number;
    percentage: number;
  }> {
    const values: { [key: string]: number } = {};
    let total = 0;

    nfts.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          if (attr.trait_type === traitType) {
            values[attr.value] = (values[attr.value] || 0) + 1;
            total++;
          }
        });
      }
    });

    return Object.entries(values).map(([value, count]) => ({
      value,
      count,
      percentage: Math.round((count / total) * 100 * 100) / 100
    }));
  }

  // Generate trait statistics
  static generateTraitStats(nfts: AnalosNFT[]): {
    [traitType: string]: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  } {
    const stats: { [traitType: string]: { [value: string]: number } } = {};
    const totals: { [traitType: string]: number } = {};

    nfts.forEach(nft => {
      if (nft.attributes) {
        nft.attributes.forEach(attr => {
          if (!stats[attr.trait_type]) {
            stats[attr.trait_type] = {};
            totals[attr.trait_type] = 0;
          }
          
          stats[attr.trait_type][attr.value] = (stats[attr.trait_type][attr.value] || 0) + 1;
          totals[attr.trait_type]++;
        });
      }
    });

    const result: { [traitType: string]: Array<{
      value: string;
      count: number;
      percentage: number;
    }> } = {};

    Object.keys(stats).forEach(traitType => {
      result[traitType] = Object.entries(stats[traitType]).map(([value, count]) => ({
        value,
        count,
        percentage: Math.round((count / totals[traitType]) * 100 * 100) / 100
      }));
    });

    return result;
  }

  // Generate metadata hash
  private static generateMetadataHash(metadata: MetadataStandard): string {
    const jsonString = JSON.stringify(metadata, Object.keys(metadata).sort());
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Create collection metadata template
  static createCollectionMetadataTemplate(collectionData: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    externalUrl?: string;
    feeRecipient: string;
  }): MetadataStandard {
    return {
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      image: collectionData.image,
      external_url: collectionData.externalUrl,
      properties: {
        creators: [
          {
            address: collectionData.feeRecipient,
            verified: true,
            share: 100
          }
        ],
        category: 'image'
      }
    };
  }

  // Create individual NFT metadata template
  static createNFTMetadataTemplate(nftData: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
    collection?: {
      name: string;
      family: string;
    };
  }): MetadataStandard {
    return {
      name: nftData.name,
      symbol: '', // Usually inherited from collection
      description: nftData.description,
      image: nftData.image,
      attributes: nftData.attributes || [],
      properties: {
        files: [
          {
            uri: nftData.image,
            type: 'image/png'
          }
        ],
        category: 'image'
      }
    };
  }

  // Validate image URL
  static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    } catch {
      return false;
    }
  }

  // Get image dimensions (placeholder implementation)
  static async getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  }
}
