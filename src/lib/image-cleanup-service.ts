/**
 * Image Cleanup Service
 * Handles automatic cleanup of old images to prevent data bloat
 */

interface ImageCleanupData {
  timestamp: number;
  originalSize: number;
  compressedSize: number;
}

interface CollectionImageData {
  logo_url?: string | null;
  banner_url?: string | null;
  logo_cleanup?: ImageCleanupData;
  banner_cleanup?: ImageCleanupData;
}

export class ImageCleanupService {
  private static instance: ImageCleanupService;

  public static getInstance(): ImageCleanupService {
    if (!ImageCleanupService.instance) {
      ImageCleanupService.instance = new ImageCleanupService();
    }
    return ImageCleanupService.instance;
  }

  /**
   * Extract cleanup data from a data URL
   */
  private extractCleanupData(dataUrl: string): ImageCleanupData | null {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return null;
    }

    try {
      // Extract base64 part and calculate size
      const base64Part = dataUrl.split(',')[1];
      if (!base64Part) return null;

      const compressedSize = base64Part.length;
      const originalSize = Math.round((compressedSize * 3) / 4); // Approximate original size
      const timestamp = Date.now();

      return {
        timestamp,
        originalSize,
        compressedSize
      };
    } catch (error) {
      console.error('Error extracting cleanup data:', error);
      return null;
    }
  }

  /**
   * Clean up old images from collection data
   */
  public cleanupCollectionImages(
    newData: CollectionImageData,
    existingData?: CollectionImageData
  ): CollectionImageData {
    const cleanedData = { ...newData };

    // Clean up logo if it changed
    if (newData.logo_url && newData.logo_url !== existingData?.logo_url) {
      console.log('🧹 Cleaning up old logo data');
      cleanedData.logo_cleanup = this.extractCleanupData(newData.logo_url);
      
      // Log size comparison
      if (existingData?.logo_cleanup) {
        const sizeDiff = (cleanedData.logo_cleanup?.compressedSize || 0) - existingData.logo_cleanup.compressedSize;
        console.log(`📊 Logo size change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);
      }
    }

    // Clean up banner if it changed
    if (newData.banner_url && newData.banner_url !== existingData?.banner_url) {
      console.log('🧹 Cleaning up old banner data');
      cleanedData.banner_cleanup = this.extractCleanupData(newData.banner_url);
      
      // Log size comparison
      if (existingData?.banner_cleanup) {
        const sizeDiff = (cleanedData.banner_cleanup?.compressedSize || 0) - existingData.banner_cleanup.compressedSize;
        console.log(`📊 Banner size change: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);
      }
    }

    return cleanedData;
  }

  /**
   * Get storage statistics for a collection
   */
  public getStorageStats(data: CollectionImageData): {
    totalSize: number;
    logoSize: number;
    bannerSize: number;
    imageCount: number;
  } {
    const logoSize = data.logo_cleanup?.compressedSize || 0;
    const bannerSize = data.banner_cleanup?.compressedSize || 0;
    const totalSize = logoSize + bannerSize;
    const imageCount = (data.logo_url ? 1 : 0) + (data.banner_url ? 1 : 0);

    return {
      totalSize,
      logoSize,
      bannerSize,
      imageCount
    };
  }

  /**
   * Log storage usage for monitoring
   */
  public logStorageUsage(data: CollectionImageData, collectionName: string): void {
    const stats = this.getStorageStats(data);
    
    console.log(`📊 Storage stats for "${collectionName}":`, {
      totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
      logoSize: `${(stats.logoSize / 1024).toFixed(2)} KB`,
      bannerSize: `${(stats.bannerSize / 1024).toFixed(2)} KB`,
      imageCount: stats.imageCount
    });

    // Warn if storage is getting large
    if (stats.totalSize > 2 * 1024 * 1024) { // 2MB
      console.warn(`⚠️ Large storage usage detected: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }
}