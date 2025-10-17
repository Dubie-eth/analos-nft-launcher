// Image cleanup service to manage old images and reduce storage costs
import { supabaseAdmin } from './supabase/client';

interface ImageCleanupTask {
  id: string;
  oldImageUrl: string;
  userId: string;
  collectionId?: string;
  type: 'logo' | 'banner' | 'profile_picture' | 'trait_image';
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class ImageCleanupService {
  private static instance: ImageCleanupService;
  private cleanupQueue: ImageCleanupTask[] = [];

  static getInstance(): ImageCleanupService {
    if (!ImageCleanupService.instance) {
      ImageCleanupService.instance = new ImageCleanupService();
    }
    return ImageCleanupService.instance;
  }

  /**
   * Queue image for cleanup
   */
  async queueImageCleanup(
    oldImageUrl: string,
    userId: string,
    type: 'logo' | 'banner' | 'profile_picture' | 'trait_image',
    collectionId?: string
  ): Promise<void> {
    if (!oldImageUrl || oldImageUrl === 'uploaded_logo_url' || oldImageUrl === 'uploaded_banner_url') {
      return; // Skip placeholder URLs
    }

    const task: ImageCleanupTask = {
      id: `cleanup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      oldImageUrl,
      userId,
      collectionId,
      type,
      createdAt: new Date(),
      status: 'pending'
    };

    this.cleanupQueue.push(task);
    
    // Process cleanup asynchronously
    this.processCleanupQueue();
  }

  /**
   * Process cleanup queue
   */
  private async processCleanupQueue(): Promise<void> {
    const pendingTasks = this.cleanupQueue.filter(task => task.status === 'pending');
    
    for (const task of pendingTasks) {
      try {
        task.status = 'processing';
        await this.cleanupImage(task);
        task.status = 'completed';
      } catch (error) {
        console.error('Image cleanup failed:', error);
        task.status = 'failed';
      }
    }

    // Remove completed and failed tasks older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.cleanupQueue = this.cleanupQueue.filter(
      task => task.status === 'pending' || task.status === 'processing' || task.createdAt > oneHourAgo
    );
  }

  /**
   * Clean up individual image
   */
  private async cleanupImage(task: ImageCleanupTask): Promise<void> {
    try {
      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(task.oldImageUrl);
      if (!filePath) {
        console.warn('Could not extract file path from URL:', task.oldImageUrl);
        return;
      }

      // Delete from Supabase Storage
      const { error } = await supabaseAdmin.storage
        .from('collection-assets')
        .remove([filePath]);

      if (error) {
        console.error('Failed to delete image from storage:', error);
        throw error;
      }

      console.log(`Successfully cleaned up image: ${filePath}`);
    } catch (error) {
      console.error('Image cleanup error:', error);
      throw error;
    }
  }

  /**
   * Extract file path from URL
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      // Handle different URL formats
      if (url.includes('/storage/v1/object/public/')) {
        // Supabase public URL format
        const parts = url.split('/storage/v1/object/public/');
        if (parts.length > 1) {
          return parts[1];
        }
      } else if (url.includes('/storage/v1/object/sign/')) {
        // Supabase signed URL format
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/(.+)/);
        if (pathMatch) {
          return pathMatch[1];
        }
      } else if (url.startsWith('http')) {
        // Generic HTTP URL - extract path
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading slash
      }

      return null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  }

  /**
   * Clean up old images for a collection
   */
  async cleanupCollectionImages(
    collectionId: string,
    newData: any,
    currentData?: any
  ): Promise<void> {
    if (!currentData) {
      return; // No previous data to clean up
    }

    // Check for logo changes
    if (currentData.logo_url && currentData.logo_url !== newData.logo_url) {
      await this.queueImageCleanup(
        currentData.logo_url,
        currentData.user_wallet,
        'logo',
        collectionId
      );
    }

    // Check for banner changes
    if (currentData.banner_url && currentData.banner_url !== newData.banner_url) {
      await this.queueImageCleanup(
        currentData.banner_url,
        currentData.user_wallet,
        'banner',
        collectionId
      );
    }
  }

  /**
   * Clean up old profile images
   */
  async cleanupProfileImages(
    userId: string,
    newData: any,
    currentData?: any
  ): Promise<void> {
    if (!currentData) {
      return; // No previous data to clean up
    }

    // Check for profile picture changes
    if (currentData.profile_picture_url && currentData.profile_picture_url !== newData.profile_picture_url) {
      await this.queueImageCleanup(
        currentData.profile_picture_url,
        userId,
        'profile_picture'
      );
    }

    // Check for banner image changes
    if (currentData.banner_image_url && currentData.banner_image_url !== newData.banner_image_url) {
      await this.queueImageCleanup(
        currentData.banner_image_url,
        userId,
        'banner'
      );
    }
  }

  /**
   * Clean up old trait images
   */
  async cleanupTraitImages(
    collectionId: string,
    userId: string,
    oldLayers: any[],
    newLayers: any[]
  ): Promise<void> {
    const oldImageUrls = new Set<string>();
    const newImageUrls = new Set<string>();

    // Collect old image URLs
    oldLayers.forEach(layer => {
      layer.traits?.forEach((trait: any) => {
        if (trait.imageUrl) {
          oldImageUrls.add(trait.imageUrl);
        }
      });
    });

    // Collect new image URLs
    newLayers.forEach(layer => {
      layer.traits?.forEach((trait: any) => {
        if (trait.imageUrl) {
          newImageUrls.add(trait.imageUrl);
        }
      });
    });

    // Find images that are no longer used
    const imagesToCleanup = Array.from(oldImageUrls).filter(url => !newImageUrls.has(url));

    // Queue cleanup for unused images
    for (const imageUrl of imagesToCleanup) {
      await this.queueImageCleanup(imageUrl, userId, 'trait_image', collectionId);
    }
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): {
    totalTasks: number;
    pendingTasks: number;
    processingTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const stats = {
      totalTasks: this.cleanupQueue.length,
      pendingTasks: 0,
      processingTasks: 0,
      completedTasks: 0,
      failedTasks: 0
    };

    this.cleanupQueue.forEach(task => {
      switch (task.status) {
        case 'pending':
          stats.pendingTasks++;
          break;
        case 'processing':
          stats.processingTasks++;
          break;
        case 'completed':
          stats.completedTasks++;
          break;
        case 'failed':
          stats.failedTasks++;
          break;
      }
    });

    return stats;
  }
}

// Process cleanup queue every 5 minutes
setInterval(() => {
  ImageCleanupService.getInstance()['processCleanupQueue']();
}, 5 * 60 * 1000);
