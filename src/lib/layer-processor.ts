import { Layer, Trait } from './nft-generator';

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
        
        // Handle individual image files
        if (this.isImageFile(file.name)) {
          console.log('🖼️ Processing as image file');
          const trait = await this.processImageFile(file);
          if (trait) {
            const layerName = this.extractLayerName(file.name);
            console.log(`📂 Extracted layer name: "${layerName}" from file: "${file.name}"`);
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
   * Process a single image file into a trait
   */
  private async processImageFile(file: File): Promise<Trait | null> {
    try {
      if (!this.isImageFile(file.name)) {
        console.log(`⚠️ Not an image file: ${file.name}`);
        return null;
      }

      const imageUrl = URL.createObjectURL(file);
      const traitName = this.extractTraitName(file.name);
      
      const trait: Trait = {
        id: `trait_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: traitName,
        image: imageUrl,
        rarity: 10, // Default rarity
        weight: 1
      };

      console.log(`✅ Created trait: ${trait.name} for layer: ${this.extractLayerName(file.name)}`);
      return trait;
    } catch (error) {
      console.error(`❌ Error processing image file ${file.name}:`, error);
      return null;
    }
  }

  /**
   * Extract layer name from file path
   * Supports formats like: "Background_blue.png", "Eyes_red.png", "Hat_cap.png"
   */
  private extractLayerName(filePath: string): string {
    const fileName = filePath.split('/').pop() || filePath;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Split by underscore and take the first part as layer name
    const parts = nameWithoutExt.split('_');
    if (parts.length > 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    }
    
    // If no underscore, use the whole name as layer name
    return nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1).toLowerCase();
  }

  /**
   * Extract trait name from file path
   * Supports formats like: "Background_blue.png", "Eyes_red.png", "Hat_cap.png"
   */
  private extractTraitName(filePath: string): string {
    const fileName = filePath.split('/').pop() || filePath;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Split by underscore and take everything after the first underscore as trait name
    const parts = nameWithoutExt.split('_');
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/_/g, ' ');
    }
    
    // If no underscore, use the whole name as trait name
    return nameWithoutExt.replace(/_/g, ' ');
  }

  /**
   * Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[ext || ''] || 'image/png';
  }
}
