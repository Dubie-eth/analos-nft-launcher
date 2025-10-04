import JSZip from 'jszip';
import { Layer, Trait } from '@/types/nft-generator';

export class LayerProcessor {
  /**
   * Process uploaded files and create proper layers
   */
  async processUploadedFiles(files: File[]): Promise<Layer[]> {
    const layers: Layer[] = [];
    const layerMap = new Map<string, Trait[]>();

    console.log('🔄 Processing uploaded files...', files.length);

    for (const file of files) {
      try {
        // Handle ZIP files
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
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
          const trait = await this.processImageFile(file);
          if (trait) {
            const layerName = this.extractLayerName(file.name);
            if (layerMap.has(layerName)) {
              layerMap.get(layerName)!.push(trait);
            } else {
              layerMap.set(layerName, [trait]);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
      }
    }

    // Convert map to layers array
    let order = 0;
    for (const [layerName, traits] of layerMap.entries()) {
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

    const traitName = this.extractTraitName(file.name);
    const imageUrl = URL.createObjectURL(file);

    return {
      id: `trait_${Date.now()}_${Math.random()}`,
      name: traitName,
      image: imageUrl,
      rarity: 100, // Default rarity
      layer: this.extractLayerName(file.name),
      file: file
    };
  }

  /**
   * Extract layer name from file path/name
   */
  private extractLayerName(fileName: string): string {
    // Try to extract from folder structure or naming convention
    const name = fileName.toLowerCase();
    
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
    
    // Default to first part of filename
    const parts = fileName.split(/[-_]/);
    return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Default Layer';
  }

  /**
   * Extract trait name from file name
   */
  private extractTraitName(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split(/[-_]/);
    
    // Remove layer name if it's the first part
    const layerName = this.extractLayerName(fileName).toLowerCase();
    if (parts[0].toLowerCase() === layerName) {
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
