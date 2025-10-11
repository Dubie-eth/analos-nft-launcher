// Utility functions for Analos NFT SDK

import { AnalosNFT, AnalosCollection } from './types';

export class AnalosNFTUtils {
  // Format wallet address for display
  static formatAddress(address: string, startChars: number = 8, endChars: number = 8): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  // Format price for display
  static formatPrice(price: number, currency: string = 'LOS'): string {
    return `${price.toLocaleString()} ${currency}`;
  }

  // Format date for display
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculate time ago
  static timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return this.formatDate(dateString);
    }
  }

  // Validate wallet address format
  static isValidAddress(address: string): boolean {
    // Basic Solana address validation (44 characters, base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  // Generate random placeholder image
  static getPlaceholderImage(width: number = 500, height: number = 500): string {
    return `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
  }

  // Extract collection info from NFT
  static extractCollectionInfo(nft: AnalosNFT): {
    name: string;
    address: string;
    isVerified: boolean;
  } {
    return {
      name: nft.collection,
      address: nft.collectionAddress,
      isVerified: true // This would be determined by actual verification status
    };
  }

  // Calculate collection progress
  static getCollectionProgress(collection: AnalosCollection): {
    percentage: number;
    remaining: number;
    minted: number;
    total: number;
  } {
    const percentage = (collection.currentSupply / collection.totalSupply) * 100;
    const remaining = collection.totalSupply - collection.currentSupply;
    
    return {
      percentage: Math.round(percentage * 100) / 100,
      remaining,
      minted: collection.currentSupply,
      total: collection.totalSupply
    };
  }

  // Sort NFTs by various criteria
  static sortNFTs(nfts: AnalosNFT[], criteria: 'newest' | 'oldest' | 'name' | 'collection'): AnalosNFT[] {
    const sorted = [...nfts];
    
    switch (criteria) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.mintedAt).getTime() - new Date(b.mintedAt).getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'collection':
        return sorted.sort((a, b) => a.collection.localeCompare(b.collection));
      default:
        return sorted;
    }
  }

  // Filter NFTs by criteria
  static filterNFTs(nfts: AnalosNFT[], filters: {
    collection?: string;
    owner?: string;
    hasAttributes?: boolean;
    mintedAfter?: string;
    mintedBefore?: string;
  }): AnalosNFT[] {
    return nfts.filter(nft => {
      if (filters.collection && nft.collection.toLowerCase() !== filters.collection.toLowerCase()) {
        return false;
      }
      
      if (filters.owner && nft.owner !== filters.owner) {
        return false;
      }
      
      if (filters.hasAttributes && (!nft.attributes || nft.attributes.length === 0)) {
        return false;
      }
      
      if (filters.mintedAfter && new Date(nft.mintedAt) < new Date(filters.mintedAfter)) {
        return false;
      }
      
      if (filters.mintedBefore && new Date(nft.mintedAt) > new Date(filters.mintedBefore)) {
        return false;
      }
      
      return true;
    });
  }

  // Generate shareable links
  static generateShareLinks(nft: AnalosNFT): {
    twitter: string;
    facebook: string;
    linkedin: string;
    copyLink: string;
  } {
    const baseUrl = window.location.origin;
    const nftUrl = `${baseUrl}/nft/${nft.mintAddress}`;
    
    const text = `Check out this NFT: ${nft.name} from ${nft.collection} on Analos!`;
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(nftUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(nftUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(nftUrl)}`,
      copyLink: nftUrl
    };
  }

  // Validate NFT data integrity
  static validateNFT(nft: AnalosNFT): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!nft.mintAddress) {
      errors.push('Missing mint address');
    }
    
    if (!nft.name) {
      errors.push('Missing NFT name');
    }
    
    if (!nft.image) {
      errors.push('Missing NFT image');
    }
    
    if (!nft.collection) {
      errors.push('Missing collection name');
    }
    
    if (!nft.owner) {
      errors.push('Missing owner address');
    }
    
    if (!this.isValidAddress(nft.mintAddress)) {
      errors.push('Invalid mint address format');
    }
    
    if (!this.isValidAddress(nft.owner)) {
      errors.push('Invalid owner address format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate rarity score (placeholder implementation)
  static calculateRarityScore(nft: AnalosNFT, allNFTsInCollection: AnalosNFT[]): number {
    if (!nft.attributes || nft.attributes.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let attributeCount = 0;
    
    nft.attributes.forEach(attribute => {
      const attributeOccurrences = allNFTsInCollection.filter(otherNft => 
        otherNft.attributes?.some(attr => 
          attr.trait_type === attribute.trait_type && attr.value === attribute.value
        )
      ).length;
      
      const rarityScore = (allNFTsInCollection.length - attributeOccurrences + 1) / allNFTsInCollection.length;
      totalScore += rarityScore;
      attributeCount++;
    });
    
    return attributeCount > 0 ? (totalScore / attributeCount) * 100 : 0;
  }

  // Generate metadata hash for verification
  static generateMetadataHash(metadata: any): string {
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
}
