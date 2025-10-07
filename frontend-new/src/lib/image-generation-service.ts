/**
 * Image Generation Service
 * Handles generation of NFT images during reveal process
 */

export interface LayerConfig {
  id: string;
  name: string;
  traits: TraitConfig[];
  order: number;
}

export interface TraitConfig {
  id: string;
  name: string;
  imagePath: string;
  weight: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface GeneratedNFT {
  id: string;
  tokenId: number;
  layers: SelectedTrait[];
  finalImage: string;
  metadata: NFTMetadata;
  rarityScore: number;
  rarityRank: number;
}

export interface SelectedTrait {
  layerId: string;
  layerName: string;
  traitId: string;
  traitName: string;
  imagePath: string;
  rarity: string;
  weight: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

export interface RarityConfig {
  common: { min: number; max: number; weight: number };
  uncommon: { min: number; max: number; weight: number };
  rare: { min: number; max: number; weight: number };
  epic: { min: number; max: number; weight: number };
  legendary: { min: number; max: number; weight: number };
}

export class ImageGenerationService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private rarityConfig: RarityConfig = {
    common: { min: 1, max: 40, weight: 0.4 },
    uncommon: { min: 41, max: 70, weight: 0.25 },
    rare: { min: 71, max: 85, weight: 0.15 },
    epic: { min: 86, max: 95, weight: 0.15 },
    legendary: { min: 96, max: 100, weight: 0.05 }
  };

  constructor() {
    this.initializeCanvas();
  }

  private initializeCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }
  }

  /**
   * Generate a complete NFT with random traits
   */
  async generateNFT(
    tokenId: number,
    collectionName: string,
    layers: LayerConfig[],
    collectionMetadata: Partial<NFTMetadata>
  ): Promise<GeneratedNFT> {
    try {
      // Select random traits for each layer
      const selectedTraits = this.selectRandomTraits(layers);
      
      // Generate the final image
      const finalImage = await this.generateImage(selectedTraits);
      
      // Calculate rarity score
      const rarityScore = this.calculateRarityScore(selectedTraits);
      
      // Create metadata
      const metadata: NFTMetadata = {
        name: `${collectionName} #${tokenId}`,
        description: collectionMetadata.description || 'A unique NFT from the collection',
        image: finalImage,
        attributes: [
          { trait_type: 'Collection', value: collectionName },
          { trait_type: 'Token ID', value: tokenId },
          ...selectedTraits.map(trait => ({
            trait_type: trait.layerName,
            value: trait.traitName,
            rarity: trait.rarity
          }))
        ],
        external_url: collectionMetadata.external_url,
        animation_url: collectionMetadata.animation_url,
        background_color: collectionMetadata.background_color
      };

      return {
        id: `nft_${tokenId}`,
        tokenId,
        layers: selectedTraits,
        finalImage,
        metadata,
        rarityScore,
        rarityRank: 0 // Will be calculated when comparing with other NFTs
      };
    } catch (error) {
      console.error('Error generating NFT:', error);
      throw error;
    }
  }

  /**
   * Select random traits for each layer based on weights
   */
  private selectRandomTraits(layers: LayerConfig[]): SelectedTrait[] {
    return layers.map(layer => {
      const totalWeight = layer.traits.reduce((sum, trait) => sum + trait.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const trait of layer.traits) {
        random -= trait.weight;
        if (random <= 0) {
          return {
            layerId: layer.id,
            layerName: layer.name,
            traitId: trait.id,
            traitName: trait.name,
            imagePath: trait.imagePath,
            rarity: trait.rarity,
            weight: trait.weight
          };
        }
      }
      
      // Fallback to last trait
      const lastTrait = layer.traits[layer.traits.length - 1];
      return {
        layerId: layer.id,
        layerName: layer.name,
        traitId: lastTrait.id,
        traitName: lastTrait.name,
        imagePath: lastTrait.imagePath,
        rarity: lastTrait.rarity,
        weight: lastTrait.weight
      };
    });
  }

  /**
   * Generate the final composite image from selected traits
   */
  private async generateImage(selectedTraits: SelectedTrait[]): Promise<string> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort traits by layer order
    const sortedTraits = [...selectedTraits].sort((a, b) => {
      // You might want to add layer order to the trait interface
      return 0; // For now, keep original order
    });

    // Draw each layer
    for (const trait of sortedTraits) {
      await this.drawLayer(trait.imagePath);
    }

    // Convert to base64
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Draw a single layer onto the canvas
   */
  private async drawLayer(imagePath: string): Promise<void> {
    if (!this.ctx) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.ctx!.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${imagePath}`);
        resolve(); // Continue with other layers even if one fails
      };
      
      img.src = imagePath;
    });
  }

  /**
   * Calculate rarity score based on trait weights
   */
  private calculateRarityScore(selectedTraits: SelectedTrait[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const trait of selectedTraits) {
      totalScore += trait.weight;
      totalWeight += 100; // Assuming max weight is 100
    }

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  /**
   * Generate multiple NFTs at once
   */
  async generateBatch(
    startTokenId: number,
    count: number,
    collectionName: string,
    layers: LayerConfig[],
    collectionMetadata: Partial<NFTMetadata>
  ): Promise<GeneratedNFT[]> {
    const nfts: GeneratedNFT[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const nft = await this.generateNFT(
          startTokenId + i,
          collectionName,
          layers,
          collectionMetadata
        );
        nfts.push(nft);
      } catch (error) {
        console.error(`Error generating NFT ${startTokenId + i}:`, error);
      }
    }

    // Calculate rarity ranks
    this.calculateRarityRanks(nfts);
    
    return nfts;
  }

  /**
   * Calculate rarity ranks for a batch of NFTs
   */
  private calculateRarityRanks(nfts: GeneratedNFT[]): void {
    // Sort by rarity score (higher is rarer)
    const sortedNFTs = [...nfts].sort((a, b) => b.rarityScore - a.rarityScore);
    
    sortedNFTs.forEach((nft, index) => {
      nft.rarityRank = index + 1;
    });
  }

  /**
   * Upload generated image to IPFS or other storage
   */
  async uploadImage(imageData: string, filename: string): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, filename);
      
      // Upload to backend endpoint
      const uploadResponse = await fetch('https://analos-nft-launcher-production-f3da.up.railway.app/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await uploadResponse.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Return original data URL as fallback
      return imageData;
    }
  }

  /**
   * Update rarity configuration
   */
  updateRarityConfig(config: Partial<RarityConfig>): void {
    this.rarityConfig = { ...this.rarityConfig, ...config };
  }

  /**
   * Get current rarity configuration
   */
  getRarityConfig(): RarityConfig {
    return { ...this.rarityConfig };
  }

  /**
   * Generate placeholder image for unrevealed NFTs
   */
  generatePlaceholderImage(collectionName: string, tokenId: number): string {
    if (!this.canvas || !this.ctx) return '';

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw lock icon
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 120px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🔒', this.canvas.width / 2, this.canvas.height / 2 - 60);

    // Draw collection name
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillText(collectionName, this.canvas.width / 2, this.canvas.height / 2 + 60);

    // Draw token ID
    this.ctx.font = '32px Arial';
    this.ctx.fillText(`#${tokenId}`, this.canvas.width / 2, this.canvas.height / 2 + 120);

    // Draw "Coming Soon" text
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#cccccc';
    this.ctx.fillText('Reveal Coming Soon!', this.canvas.width / 2, this.canvas.height / 2 + 180);

    return this.canvas.toDataURL('image/png');
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;
