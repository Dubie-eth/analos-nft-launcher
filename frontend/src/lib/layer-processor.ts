import JSZip from 'jszip';
import { Layer, Trait, GeneratedNFT } from './nft-generator';

export class LayerProcessor {
  /**
   * Process uploaded files and create proper layers
   */
  async processUploadedFiles(files: FileList): Promise<Layer[]> {
    const layers: Layer[] = [];
    const layerMap = new Map<string, Trait[]>();

    console.log('🔄 Processing uploaded files...', files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`📁 Processing file: ${file.name} (type: ${file.type}, size: ${file.size})`);
        
        // Handle ZIP files
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          console.log('📦 Processing as ZIP file');
          const zipLayers = await this.processZipFile(file);
          for (const layer of zipLayers) {
            if (layerMap.has(layer.name)) {
              layerMap.get(layer.name)!.push(...layer.traits);
            } else {
              layerMap.set(layer.name, [...layer.traits]);
            }
          }
        } else {
          // Handle individual image files
          console.log('🖼️ Processing as image file');
          const trait = await this.processImageFile(file);
          if (trait) {
            // Use webkitRelativePath if available for folder uploads
            const filePath = (file as any).webkitRelativePath || file.name;
            const layerName = this.extractLayerName(filePath);
            console.log(`📂 Extracted layer name: "${layerName}" from file: "${filePath}"`);
            if (layerMap.has(layerName)) {
              layerMap.get(layerName)!.push(trait);
            } else {
              layerMap.set(layerName, [trait]);
            }
          } else {
            console.log(`⚠️ Could not process image file: ${file.name}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
      }
    }

    // Convert map to layers array
    let order = 0;
    console.log(`📊 Layer map entries: ${layerMap.size}`);
    for (const [layerName, traits] of layerMap.entries()) {
      console.log(`📂 Layer "${layerName}": ${traits.length} traits`);
      if (traits.length > 0) {
        layers.push({
          id: `layer_${order}`,
          name: layerName,
          traits: traits,
          order: order++,
          visible: true
        });
      }
    }

    // Sort layers by name for consistency
    layers.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ Processed ${layers.length} layers with ${layers.reduce((sum, layer) => sum + layer.traits.length, 0)} total traits`);
    return layers;
  }

  /**
   * Process a ZIP file containing layer folders
   */
  private async processZipFile(file: File): Promise<Layer[]> {
    const layers: Layer[] = [];
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);

    console.log('📦 Processing ZIP file:', file.name);

    // Group files by folder (layer)
    const layerMap = new Map<string, File[]>();
    
    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && this.isImageFile(relativePath)) {
        const pathParts = relativePath.split('/');
        const layerName = pathParts[0] || 'Default Layer';
        
        // Extract file from ZIP
        const fileData = await zipEntry.async('blob');
        const fileName = pathParts[pathParts.length - 1];
        const file = new File([fileData], fileName, { type: this.getMimeType(fileName) });
        
        if (layerMap.has(layerName)) {
          layerMap.get(layerName)!.push(file);
        } else {
          layerMap.set(layerName, [file]);
        }
      }
    }

    // Create layers from grouped files
    let order = 0;
    for (const [layerName, files] of layerMap.entries()) {
      const traits: Trait[] = [];
      
      for (const file of files) {
        const trait = await this.processImageFile(file);
        if (trait) {
          trait.layer = layerName;
          traits.push(trait);
        }
      }

      if (traits.length > 0) {
        layers.push({
          id: `layer_${order}`,
          name: layerName,
          traits: traits,
          order: order++,
          visible: true
        });
      }
    }

    console.log(`✅ ZIP processed: ${layers.length} layers`);
    return layers;
  }

  /**
   * Process an individual image file
   */
  private async processImageFile(file: File): Promise<Trait | null> {
    if (!this.isImageFile(file.name)) {
      return null;
    }

    // Use webkitRelativePath if available for proper path handling
    const filePath = (file as any).webkitRelativePath || file.name;
    const traitName = this.extractTraitName(filePath);
    
    // Convert file to base64 data URL for better reliability
    const imageUrl = await this.fileToDataURL(file);

    return {
      id: `trait_${Date.now()}_${Math.random()}`,
      name: traitName,
      image: imageUrl,
      rarity: 100, // Default rarity
      layer: this.extractLayerName(filePath),
      file: file
    };
  }

  /**
   * Convert file to data URL for better reliability
   */
  private async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract layer name from file path/name
   * For folder uploads, this handles the webkitRelativePath properly
   */
  private extractLayerName(filePath: string): string {
    console.log(`🔍 Extracting layer name from: "${filePath}"`);
    
    // For folder uploads with webkitRelativePath, extract the folder name
    // Example: "LosBros/Background/solid_blue.png" -> "Background"
    const pathParts = filePath.split('/');
    console.log(`📂 Path parts:`, pathParts);
    
    // If there's a folder structure (LosBros/Skin/skin_dark.png), use the folder name as the layer
    if (pathParts.length >= 2) {
      const folderName = pathParts[1]; // Get the folder name (index 1: "Skin", "Mouth", "Hats", etc.)
      console.log(`📁 Folder name extracted: "${folderName}"`);
      if (folderName && folderName !== '.' && folderName !== 'LosBros') {
        const formatted = this.formatLayerName(folderName);
        console.log(`✅ Formatted layer name: "${formatted}"`);
        return formatted;
      }
    }
    
    // Fallback to filename-based extraction
    const name = filePath.toLowerCase();
    
    // Common layer patterns
    if (name.includes('background') || name.includes('bg')) return 'Background';
    if (name.includes('body') || name.includes('skin')) return 'Body';
    if (name.includes('clothes') || name.includes('clothing')) return 'Clothes';
    if (name.includes('eyes')) return 'Eyes';
    if (name.includes('mouth')) return 'Mouth';
    if (name.includes('hat') || name.includes('head')) return 'Head';
    if (name.includes('accessory')) return 'Accessory';
    if (name.includes('weapon')) return 'Weapon';
    if (name.includes('special') || name.includes('effect')) return 'Special';
    if (name.includes('1of1')) return '1of1s';
    
    // Default to first part of filename
    const parts = filePath.split(/[-_]/);
    const result = parts[0] ? this.formatLayerName(parts[0]) : 'Default Layer';
    console.log(`🔄 Fallback layer name: "${result}"`);
    return result;
  }

  /**
   * Format layer name for display
   */
  private formatLayerName(name: string): string {
    // Remove common prefixes and format nicely
    let formatted = name.replace(/^[0-9]+_/, ''); // Remove leading numbers
    formatted = formatted.replace(/_/g, ' '); // Replace underscores with spaces
    formatted = formatted.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
    return formatted;
  }

  /**
   * Extract trait name from file name
   */
  private extractTraitName(filePath: string): string {
    // Get just the filename from the full path
    const fileName = filePath.split('/').pop() || filePath;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split(/[-_]/);
    
    // Remove layer name if it's the first part
    const layerName = this.extractLayerName(filePath).toLowerCase();
    if (parts[0] && parts[0].toLowerCase() === layerName) {
      parts.shift();
    }
    
    // Join remaining parts and format
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  /**
   * Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * Get MIME type for file
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'image/png';
  }

  /**
   * Generate NFTs from layers
   */
  async generateNFTs(
    layers: Layer[], 
    count: number, 
    onProgress?: (current: number, total: number) => void
  ): Promise<GeneratedNFT[]> {
    console.log(`🎨 Starting NFT generation: ${count} NFTs from ${layers.length} layers`);
    
    const generatedNFTs: GeneratedNFT[] = [];
    const usedCombinations = new Set<string>();

    for (let i = 0; i < count; i++) {
      try {
        // Generate unique combination
        let combination: { [layerName: string]: Trait } = {};
        let combinationKey = '';
        let attempts = 0;
        const maxAttempts = 1000; // Prevent infinite loops

        do {
          combination = {};
          combinationKey = '';
          
          for (const layer of layers) {
            if (layer.visible && layer.traits.length > 0) {
              // Weighted random selection based on rarity
              const selectedTrait = this.selectTraitByRarity(layer.traits);
              combination[layer.name] = selectedTrait;
              combinationKey += `${layer.name}:${selectedTrait.name};`;
            }
          }
          
          attempts++;
        } while (usedCombinations.has(combinationKey) && attempts < maxAttempts);

        // If we couldn't find a unique combination, use the last one
        if (attempts >= maxAttempts) {
          console.warn(`⚠️ Could not generate unique combination for NFT #${i + 1}, using existing`);
        }

        usedCombinations.add(combinationKey);

        // Generate composite image
        let compositeImage: string;
        try {
          compositeImage = await this.generateCompositeImage(combination, layers);
        } catch (error) {
          console.error(`❌ Failed to generate composite for NFT #${i + 1}:`, error);
          // Create a fallback placeholder image
          compositeImage = this.createFallbackImage(combination);
        }
        
        // Calculate rarity score
        const rarityScore = this.calculateRarityScore(combination);

        // Create NFT metadata
        const nft: GeneratedNFT = {
          id: i + 1,
          name: `Los Bros #${i + 1}`,
          image: compositeImage,
          description: `A unique Los Bros NFT with ${Object.keys(combination).length} traits`,
          traits: Object.entries(combination).map(([layerName, trait]) => ({
            trait_type: layerName,
            value: trait.name
          })),
          rarityScore
        };

        generatedNFTs.push(nft);
        
        // Update progress
        if (onProgress) {
          onProgress(i + 1, count);
        }

        console.log(`✅ Generated NFT #${i + 1}: ${nft.name}`);
      } catch (error) {
        console.error(`❌ Error generating NFT #${i + 1}:`, error);
        // Continue with next NFT
      }
    }

    console.log(`🎉 NFT generation complete: ${generatedNFTs.length} NFTs generated`);
    return generatedNFTs;
  }

  /**
   * Select trait based on rarity weights
   */
  private selectTraitByRarity(traits: Trait[]): Trait {
    const totalRarity = traits.reduce((sum, trait) => sum + trait.rarity, 0);
    let random = Math.random() * totalRarity;

    for (const trait of traits) {
      random -= trait.rarity;
      if (random <= 0) {
        return trait;
      }
    }

    // Fallback to last trait
    return traits[traits.length - 1];
  }

  /**
   * Generate composite image from traits
   */
  private async generateCompositeImage(
    combination: { [layerName: string]: Trait }, 
    layers: Layer[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size (assuming all images are the same size)
      canvas.width = 512;
      canvas.height = 512;

      // Sort layers by order
      const sortedLayers = layers
        .filter(layer => combination[layer.name])
        .sort((a, b) => a.order - b.order);

      let loadedImages = 0;
      const totalImages = sortedLayers.length;

      if (totalImages === 0) {
        reject(new Error('No layers to composite'));
        return;
      }

      // Load and composite images
      sortedLayers.forEach((layer, index) => {
        const trait = combination[layer.name];
        const img = new Image();
        
        img.onload = () => {
          try {
            // Draw image on canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log(`✅ Loaded image for trait: ${trait.name}`);
          } catch (error) {
            console.error(`❌ Error drawing image for trait: ${trait.name}`, error);
          }
          
          loadedImages++;

          // When all images are loaded, convert to data URL
          if (loadedImages === totalImages) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              console.log(`✅ Generated composite image successfully`);
              resolve(dataUrl);
            } catch (error) {
              console.error(`❌ Error generating data URL:`, error);
              reject(error);
            }
          }
        };

        img.onerror = (error) => {
          console.error(`❌ Failed to load image for trait: ${trait.name}`, error);
          console.error(`❌ Image source: ${trait.image.substring(0, 100)}...`);
          loadedImages++;
          
          if (loadedImages === totalImages) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              console.log(`⚠️ Generated composite with missing images`);
              resolve(dataUrl);
            } catch (error) {
              console.error(`❌ Error generating fallback data URL:`, error);
              reject(error);
            }
          }
        };

        // Set crossOrigin to handle CORS issues
        img.crossOrigin = 'anonymous';
        img.src = trait.image;
      });
    });
  }

  /**
   * Create a fallback placeholder image when compositing fails
   */
  private createFallbackImage(combination: { [layerName: string]: Trait }): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }

    canvas.width = 512;
    canvas.height = 512;

    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NFT Preview', 256, 200);
    
    ctx.font = '16px Arial';
    ctx.fillText('Image Loading...', 256, 250);
    
    // Add trait info
    const traits = Object.entries(combination);
    ctx.font = '14px Arial';
    traits.forEach(([layerName, trait], index) => {
      ctx.fillText(`${layerName}: ${trait.name}`, 256, 300 + (index * 20));
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Calculate rarity score for combination
   */
  private calculateRarityScore(combination: { [layerName: string]: Trait }): number {
    let totalRarity = 0;
    let traitCount = 0;

    for (const trait of Object.values(combination)) {
      totalRarity += trait.rarity;
      traitCount++;
    }

    // Lower rarity values = higher score (more rare)
    return traitCount > 0 ? Math.round(1000000000000 / (totalRarity / traitCount)) : 0;
  }

  /**
   * Validate layers before generation
   */
  validateLayers(layers: Layer[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (layers.length === 0) {
      errors.push('No layers found. Please upload some image files.');
    }

    for (const layer of layers) {
      if (layer.traits.length === 0) {
        errors.push(`Layer "${layer.name}" has no traits.`);
      }

      const totalRarity = layer.traits.reduce((sum, trait) => sum + trait.rarity, 0);
      if (totalRarity === 0) {
        errors.push(`Layer "${layer.name}" has no valid rarity settings.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const layerProcessor = new LayerProcessor();
