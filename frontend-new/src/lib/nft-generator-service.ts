/**
 * NFT Generator Service - Handles NFT generation, layer processing, and metadata creation
 * Based on the original Launch On Los (LOL) NFT Generator design
 */

export interface Layer {
  name: string;
  traits: string[];
  weights?: number[];
  images: Map<string, Buffer>;
}

export interface GenerationConfig {
  order: string[];
  rarity: { [layerName: string]: { [traitName: string]: number } };
  supply: number;
  collection: {
    name: string;
    symbol: string;
    description: string;
    royalties: number;
    price?: number;
  };
  createdAt: Date;
}

export interface GenerationProgress {
  sessionId: string;
  status: 'pending' | 'generating' | 'uploading' | 'completed' | 'error';
  progress: number;
  current: number;
  total: number;
  message: string;
  error?: string;
}

export interface GenerationResult {
  sessionId: string;
  baseURI: string;
  totalSupply: number;
  metadata: Array<{
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  }>;
  hashlist: string[];
  collection: GenerationConfig['collection'];
}

export class NFTGeneratorService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-production-f3da.up.railway.app';
  }

  /**
   * Upload ZIP file containing trait layers
   */
  async uploadLayers(zipFile: File): Promise<{
    sessionId: string;
    layers: Layer[];
    totalTraits: number;
  }> {
    const formData = new FormData();
    formData.append('zipFile', zipFile);

    const response = await fetch(`${this.backendUrl}/api/nft-generator/upload-layers`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload layers');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Upload folder containing trait layers
   */
  async uploadFolder(files: File[]): Promise<{
    sessionId: string;
    layers: Layer[];
    totalTraits: number;
  }> {
    try {
      // Try backend folder upload first
      const formData = new FormData();
      
      // Add all files to form data
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.backendUrl}/api/nft-generator/upload-folder`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.log('Backend folder upload not available, using client-side processing');
    }

    // Fallback: Process folder client-side and create a ZIP
    return this.processFolderClientSide(files);
  }

  /**
   * Process folder client-side and create layers structure
   */
  private async processFolderClientSide(files: File[]): Promise<{
    sessionId: string;
    layers: Layer[];
    totalTraits: number;
  }> {
    // Group files by folder structure
    const layersMap = new Map<string, File[]>();
    
    files.forEach((file) => {
      // Extract folder path from file.webkitRelativePath
      const pathParts = file.webkitRelativePath.split('/');
      if (pathParts.length >= 2) {
        const folderName = pathParts[0]; // First folder is the layer name
        
        // Validate image file
        const isValidImage = this.isValidImageFile(file.name);
        if (isValidImage) {
          if (!layersMap.has(folderName)) {
            layersMap.set(folderName, []);
          }
          layersMap.get(folderName)!.push(file);
        }
      }
    });

    // Convert to layers array
    const layers: Layer[] = [];
    let totalTraits = 0;

    layersMap.forEach((files, layerName) => {
      const traits = files.map(file => {
        // Remove extension from filename
        const name = file.name.replace(/\.[^/.]+$/, '');
        return name;
      });

      layers.push({
        name: layerName,
        traits,
        images: new Map() // Will be populated during generation
      });

      totalTraits += traits.length;
    });

    // Generate session ID
    const sessionId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      sessionId,
      layers,
      totalTraits
    };
  }

  /**
   * Check if file is a valid image
   */
  private isValidImageFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
  }

  /**
   * Save generation configuration
   */
  async saveConfig(sessionId: string, config: GenerationConfig): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/generate-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        ...config,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to save configuration');
    }
  }

  /**
   * Start NFT generation
   */
  async generateNFTs(sessionId: string): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/generate-nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to start generation');
    }
  }

  /**
   * Get generation progress
   */
  async getProgress(sessionId: string): Promise<GenerationProgress> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/progress/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get progress');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get generation result
   */
  async getGenerationResult(sessionId: string): Promise<GenerationResult> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/result/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get result');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Deploy collection to blockchain
   */
  async deployCollection(sessionId: string, walletSignature: string, walletAddress: string): Promise<{
    collectionAddress: string;
    mintPageUrl: string;
  }> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/deploy-collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        walletSignature,
        walletAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to deploy collection');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Clean up session data
   */
  async cleanupSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/nft-generator/cleanup/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to cleanup session');
    }
  }

  /**
   * Validate generation configuration
   */
  validateConfig(config: GenerationConfig, layers: Layer[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate collection info
    if (!config.collection.name || config.collection.name.trim().length === 0) {
      errors.push('Collection name is required');
    }

    if (!config.collection.symbol || config.collection.symbol.trim().length === 0) {
      errors.push('Collection symbol is required');
    }

    if (config.collection.royalties < 0 || config.collection.royalties > 25) {
      errors.push('Royalties must be between 0 and 25%');
    }

    // Validate supply
    if (config.supply < 1 || config.supply > 10000) {
      errors.push('Supply must be between 1 and 10,000');
    }

    // Validate layer order
    if (config.order.length === 0) {
      errors.push('At least one layer must be selected');
    }

    for (const layerName of config.order) {
      const layer = layers.find(l => l.name === layerName);
      if (!layer) {
        errors.push(`Layer "${layerName}" not found`);
        continue;
      }

      // Validate rarity weights
      const rarityWeights = config.rarity[layerName];
      if (!rarityWeights) {
        errors.push(`Rarity weights not configured for layer "${layerName}"`);
        continue;
      }

      const weights = Object.values(rarityWeights);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

      if (totalWeight === 0) {
        errors.push(`Layer "${layerName}" has no valid rarity weights`);
      }

      // Check if all traits have weights
      for (const trait of layer.traits) {
        if (!(trait in rarityWeights)) {
          errors.push(`Trait "${trait}" in layer "${layerName}" missing rarity weight`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate total possible combinations
   */
  calculateTotalCombinations(layers: Layer[]): number {
    let totalCombinations = 1;
    
    for (const layer of layers) {
      totalCombinations *= layer.traits.length;
    }
    
    return totalCombinations;
  }

  /**
   * Generate preview combinations
   */
  generatePreviewCombinations(layers: Layer[], config: GenerationConfig, count: number = 5): Array<{ [layerName: string]: string }> {
    const combinations: Array<{ [layerName: string]: string }> = [];
    
    for (let i = 0; i < count; i++) {
      const combination: { [layerName: string]: string } = {};
      
      for (const layerName of config.order) {
        const layer = layers.find(l => l.name === layerName);
        if (layer && layer.traits.length > 0) {
          const randomIndex = Math.floor(Math.random() * layer.traits.length);
          combination[layerName] = layer.traits[randomIndex];
        }
      }
      
      combinations.push(combination);
    }
    
    return combinations;
  }
}

export const nftGeneratorService = new NFTGeneratorService();
