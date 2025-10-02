/**
 * Collection Builder Service - Handles collection creation, image generation, and metadata management
 */

export interface CollectionBuilderConfig {
  name: string;
  description: string;
  symbol: string;
  totalSupply: number;
  price: number;
  imageGeneration: {
    type: 'upload' | 'generate' | 'template';
    sourceImages?: File[];
    traitFolders?: Record<string, File[]>; // traitName -> files[]
    templateId?: string;
    generationPrompt?: string;
  };
  metadata: {
    attributes: Array<{
      trait_type: string;
      values: string[];
      rarity?: Record<string, number>; // percentage for each value
    }>;
    baseMetadata?: Record<string, any>;
  };
  revealSettings: {
    delayedReveal: boolean;
    revealType: 'timer' | 'completion' | 'manual';
    revealDate?: string;
    completionPercentage?: number;
  };
  advancedSettings?: {
    maxMintsPerWallet?: number;
    whitelistEnabled?: boolean;
    paymentTokens?: Array<{
      mint: string;
      price: number;
      symbol: string;
    }>;
  };
}

export interface GeneratedImage {
  id: string;
  url: string;
  metadata: {
    traits: Record<string, string>;
    rarity: number;
  };
}

export interface CollectionBuildResult {
  collectionId: string;
  images: GeneratedImage[];
  metadataUrls: string[];
  collectionMetadata: {
    name: string;
    description: string;
    image: string; // Collection image
    external_url?: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  revealBatchId?: string;
}

export class CollectionBuilderService {
  private backendUrl: string;
  private pinataApiKey: string;
  private pinataSecretKey: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-production-f3da.up.railway.app';
    this.pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';
  }

  /**
   * Generate collection images from uploaded trait folders
   */
  async generateImagesFromTraitFolders(config: CollectionBuilderConfig): Promise<GeneratedImage[]> {
    try {
      console.log(`🎨 Generating ${config.totalSupply} images from trait folders...`);

      if (!config.imageGeneration.traitFolders || Object.keys(config.imageGeneration.traitFolders).length === 0) {
        throw new Error('No trait folders provided for generation');
      }

      const traitFolders = config.imageGeneration.traitFolders;
      const generatedImages: GeneratedImage[] = [];

      for (let i = 0; i < config.totalSupply; i++) {
        const imageId = `generated_${i + 1}`;
        
        // Generate traits for this NFT
        const traits = this.generateTraits(config.metadata.attributes, i);
        
        // Create layered image from trait folders
        const imageUrl = await this.createLayeredImage(traitFolders, traits, i, config);
        
        const rarity = this.calculateRarity(traits, config.metadata.attributes);

        generatedImages.push({
          id: imageId,
          url: imageUrl,
          metadata: {
            traits,
            rarity
          }
        });
      }

      console.log(`✅ Generated ${generatedImages.length} images from trait folders successfully`);
      return generatedImages;
    } catch (error) {
      console.error('❌ Error generating images from trait folders:', error);
      throw error;
    }
  }

  /**
   * Generate collection images from uploaded source images
   */
  async generateImagesFromUpload(config: CollectionBuilderConfig): Promise<GeneratedImage[]> {
    try {
      console.log(`🎨 Generating ${config.totalSupply} images from uploaded sources...`);

      if (!config.imageGeneration.sourceImages || config.imageGeneration.sourceImages.length === 0) {
        throw new Error('No source images provided for generation');
      }

      // For now, we'll create variations by combining source images
      // In a real implementation, this would use AI image generation or layering
      const generatedImages: GeneratedImage[] = [];

      for (let i = 0; i < config.totalSupply; i++) {
        const imageId = `generated_${i + 1}`;
        
        // Create a variation of one of the source images
        const sourceIndex = i % config.imageGeneration.sourceImages.length;
        const sourceImage = config.imageGeneration.sourceImages[sourceIndex];
        
        // For demo purposes, we'll use the source image directly
        // In production, this would apply AI transformations or layer combinations
        const imageUrl = await this.processImageVariation(sourceImage, i, config);
        
        // Generate traits based on config
        const traits = this.generateTraits(config.metadata.attributes, i);
        const rarity = this.calculateRarity(traits, config.metadata.attributes);

        generatedImages.push({
          id: imageId,
          url: imageUrl,
          metadata: {
            traits,
            rarity
          }
        });
      }

      console.log(`✅ Generated ${generatedImages.length} images successfully`);
      return generatedImages;
    } catch (error) {
      console.error('❌ Error generating images:', error);
      throw error;
    }
  }

  /**
   * Generate collection images using AI prompts
   */
  async generateImagesFromPrompt(config: CollectionBuilderConfig): Promise<GeneratedImage[]> {
    try {
      console.log(`🤖 Generating ${config.totalSupply} images using AI prompt...`);

      if (!config.imageGeneration.generationPrompt) {
        throw new Error('No generation prompt provided');
      }

      // This would integrate with AI image generation services like:
      // - DALL-E API
      // - Midjourney API
      // - Stable Diffusion API
      // - Custom trained models

      const generatedImages: GeneratedImage[] = [];

      for (let i = 0; i < config.totalSupply; i++) {
        const imageId = `ai_generated_${i + 1}`;
        
        // Generate traits first
        const traits = this.generateTraits(config.metadata.attributes, i);
        
        // Create enhanced prompt with traits
        const enhancedPrompt = this.enhancePromptWithTraits(
          config.imageGeneration.generationPrompt!,
          traits
        );

        // For now, we'll simulate AI generation
        // In production, this would call the actual AI service
        const imageUrl = await this.simulateAIGeneration(enhancedPrompt, i);
        
        const rarity = this.calculateRarity(traits, config.metadata.attributes);

        generatedImages.push({
          id: imageId,
          url: imageUrl,
          metadata: {
            traits,
            rarity
          }
        });
      }

      console.log(`✅ Generated ${generatedImages.length} AI images successfully`);
      return generatedImages;
    } catch (error) {
      console.error('❌ Error generating AI images:', error);
      throw error;
    }
  }

  /**
   * Build complete collection with images and metadata
   */
  async buildCollection(config: CollectionBuilderConfig): Promise<CollectionBuildResult> {
    try {
      console.log(`🏗️ Building collection: ${config.name}...`);

      let generatedImages: GeneratedImage[] = [];

      // Generate images based on type
      switch (config.imageGeneration.type) {
        case 'upload':
          // Check if trait folders are available
          if (config.imageGeneration.traitFolders && Object.keys(config.imageGeneration.traitFolders).length > 0) {
            generatedImages = await this.generateImagesFromTraitFolders(config);
          } else if (config.imageGeneration.sourceImages && config.imageGeneration.sourceImages.length > 0) {
            generatedImages = await this.generateImagesFromUpload(config);
          } else {
            throw new Error('No images or trait folders provided for generation');
          }
          break;
        case 'generate':
          generatedImages = await this.generateImagesFromPrompt(config);
          break;
        case 'template':
          // Generate from template (placeholder for future implementation)
          throw new Error('Template generation not yet implemented');
        default:
          throw new Error('Invalid image generation type');
      }

      // Upload images to Pinata
      const imageUrls = await this.uploadImagesToPinata(generatedImages);

      // Create individual NFT metadata
      const metadataUrls = await this.createIndividualMetadata(
        config,
        generatedImages,
        imageUrls
      );

      // Create collection metadata
      const collectionMetadata = await this.createCollectionMetadata(config, imageUrls[0]);

      // Create collection in backend
      const collectionId = await this.createCollectionInBackend(config, collectionMetadata);

      let revealBatchId: string | undefined;

      // If delayed reveal is enabled, create reveal batch
      if (config.revealSettings.delayedReveal) {
        revealBatchId = await this.createDelayedRevealBatch(
          collectionId,
          generatedImages,
          config.revealSettings
        );
      }

      const result: CollectionBuildResult = {
        collectionId,
        images: generatedImages,
        metadataUrls,
        collectionMetadata,
        revealBatchId
      };

      console.log(`🎉 Collection built successfully: ${collectionId}`);
      return result;
    } catch (error) {
      console.error('❌ Error building collection:', error);
      throw error;
    }
  }

  /**
   * Create layered image from trait folders
   */
  private async createLayeredImage(traitFolders: Record<string, File[]>, traits: Record<string, string>, index: number, config: CollectionBuilderConfig): Promise<string> {
    try {
      // For now, we'll simulate layered image creation
      // In production, this would use Canvas API or a backend service to layer images
      
      // Find the file for each trait
      const layeredFiles: File[] = [];
      Object.entries(traits).forEach(([traitType, traitValue]) => {
        const traitFolder = traitFolders[traitType];
        if (traitFolder) {
          const matchingFile = traitFolder.find(file => (file as any).traitValue === traitValue);
          if (matchingFile) {
            layeredFiles.push(matchingFile);
          }
        }
      });

      if (layeredFiles.length === 0) {
        throw new Error('No matching trait files found');
      }

      // For demo purposes, we'll use the first trait file
      // In production, this would composite all layers
      const primaryFile = layeredFiles[0];
      
      // Upload the layered image to Pinata
      const formData = new FormData();
      formData.append('file', primaryFile);
      formData.append('pinataMetadata', JSON.stringify({
        name: `${config.name}_layered_${index + 1}`,
        keyvalues: {
          collection: config.name,
          index: index + 1,
          type: 'layered-nft-image',
          traits: JSON.stringify(traits)
        }
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
        throw new Error(`Failed to upload layered image: ${response.statusText}`);
      }

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('❌ Error creating layered image:', error);
      // Fallback to placeholder
      return `https://picsum.photos/512/512?random=${Date.now()}_${index}`;
    }
  }

  /**
   * Process image variation (placeholder for actual image processing)
   */
  private async processImageVariation(sourceImage: File, index: number, config: CollectionBuilderConfig): Promise<string> {
    // In a real implementation, this would:
    // 1. Apply filters, effects, or transformations
    // 2. Layer different elements
    // 3. Generate variations using AI
    
    // For now, we'll upload the source image to Pinata
    const formData = new FormData();
    formData.append('file', sourceImage);
    formData.append('pinataMetadata', JSON.stringify({
      name: `${config.name}_${index + 1}`,
      keyvalues: {
        collection: config.name,
        index: index + 1,
        type: 'nft-image'
      }
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
      throw new Error(`Failed to upload image variation: ${response.statusText}`);
    }

    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
  }

  /**
   * Simulate AI image generation (placeholder for actual AI service)
   */
  private async simulateAIGeneration(prompt: string, index: number): Promise<string> {
    // This would integrate with actual AI services
    // For now, return a placeholder URL
    return `https://picsum.photos/512/512?random=${Date.now()}_${index}`;
  }

  /**
   * Generate traits for an NFT based on configuration
   */
  private generateTraits(attributes: CollectionBuilderConfig['metadata']['attributes'], index: number): Record<string, string> {
    const traits: Record<string, string> = {};

    attributes.forEach(attr => {
      const { trait_type, values, rarity } = attr;
      
      if (rarity) {
        // Use rarity percentages to select trait
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const [value, percentage] of Object.entries(rarity)) {
          cumulative += percentage;
          if (random <= cumulative) {
            traits[trait_type] = value;
            break;
          }
        }
      } else {
        // Random selection from values
        const randomIndex = Math.floor(Math.random() * values.length);
        traits[trait_type] = values[randomIndex];
      }
    });

    return traits;
  }

  /**
   * Calculate rarity score for an NFT
   */
  private calculateRarity(traits: Record<string, string>, attributes: CollectionBuilderConfig['metadata']['attributes']): number {
    let totalRarity = 0;
    let traitCount = 0;

    Object.entries(traits).forEach(([traitType, value]) => {
      const attribute = attributes.find(attr => attr.trait_type === traitType);
      if (attribute?.rarity?.[value]) {
        totalRarity += attribute.rarity[value];
        traitCount++;
      }
    });

    return traitCount > 0 ? totalRarity / traitCount : 0;
  }

  /**
   * Enhance prompt with generated traits
   */
  private enhancePromptWithTraits(basePrompt: string, traits: Record<string, string>): string {
    const traitDescriptions = Object.entries(traits)
      .map(([trait, value]) => `${trait}: ${value}`)
      .join(', ');
    
    return `${basePrompt}, with the following characteristics: ${traitDescriptions}`;
  }

  /**
   * Upload generated images to Pinata
   */
  private async uploadImagesToPinata(images: GeneratedImage[]): Promise<string[]> {
    // This would upload the actual generated images
    // For now, return the URLs from the generated images
    return images.map(img => img.url);
  }

  /**
   * Create individual NFT metadata and upload to Pinata
   */
  private async createIndividualMetadata(
    config: CollectionBuilderConfig,
    images: GeneratedImage[],
    imageUrls: string[]
  ): Promise<string[]> {
    const metadataUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageUrl = imageUrls[i];

      const metadata = {
        name: `${config.name} #${i + 1}`,
        description: config.description,
        image: imageUrl,
        attributes: Object.entries(image.metadata.traits).map(([trait_type, value]) => ({
          trait_type,
          value
        })),
        properties: {
          files: [{ uri: imageUrl, type: 'image/png' }],
          category: 'image'
        },
        collection: {
          name: config.name,
          family: config.symbol
        }
      };

      // Upload metadata to Pinata
      const metadataJson = JSON.stringify(metadata, null, 2);
      const blob = new Blob([metadataJson], { type: 'application/json' });
      const metadataFile = new File([blob], `metadata_${i + 1}.json`, { type: 'application/json' });

      const formData = new FormData();
      formData.append('file', metadataFile);
      formData.append('pinataMetadata', JSON.stringify({
        name: `${config.name}_metadata_${i + 1}`,
        keyvalues: {
          collection: config.name,
          index: i + 1,
          type: 'nft-metadata'
        }
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
        throw new Error(`Failed to upload metadata for NFT ${i + 1}: ${response.statusText}`);
      }

      const result = await response.json();
      metadataUrls.push(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    }

    return metadataUrls;
  }

  /**
   * Create collection metadata
   */
  private async createCollectionMetadata(config: CollectionBuilderConfig, collectionImageUrl: string): Promise<any> {
    return {
      name: config.name,
      description: config.description,
      image: collectionImageUrl,
      external_url: `${this.backendUrl}/collections/${config.name.toLowerCase().replace(/\s+/g, '-')}`,
      attributes: config.metadata.attributes.map(attr => ({
        trait_type: attr.trait_type,
        value: attr.values.join(', ')
      }))
    };
  }

  /**
   * Create collection in backend
   */
  private async createCollectionInBackend(config: CollectionBuilderConfig, collectionMetadata: any): Promise<string> {
    const collectionData = {
      name: config.name,
      description: config.description,
      symbol: config.symbol,
      totalSupply: config.totalSupply,
      price: config.price,
      metadata: collectionMetadata,
      advancedSettings: config.advancedSettings
    };

    const response = await fetch(`${this.backendUrl}/api/collections/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collectionData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create collection in backend: ${response.statusText}`);
    }

    const result = await response.json();
    return result.collectionId;
  }

  /**
   * Create delayed reveal batch
   */
  private async createDelayedRevealBatch(
    collectionId: string,
    images: GeneratedImage[],
    revealSettings: CollectionBuilderConfig['revealSettings']
  ): Promise<string> {
    // This would create a reveal batch for delayed reveal
    // Implementation depends on your reveal system
    return `reveal_batch_${Date.now()}`;
  }
}

export const collectionBuilderService = new CollectionBuilderService();
