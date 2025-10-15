/**
 * IPFS SERVICE
 * Handles file uploads to IPFS for profile pictures and banners
 */

import { useState } from 'react';
import { create } from 'ipfs-http-client';

// IPFS configuration
const IPFS_GATEWAY = 'https://gateway.pinata.cloud';
const IPFS_API_URL = 'https://api.pinata.cloud';

// Pinata configuration (you can get these from pinata.cloud)
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';

export interface UploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class IPFSService {
  private client: any;

  constructor() {
    // Initialize IPFS client if keys are available
    if (PINATA_API_KEY && PINATA_SECRET_KEY) {
      this.client = create({
        url: IPFS_API_URL,
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        }
      });
    }
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        return {
          success: false,
          error: 'IPFS configuration missing. Please configure Pinata API keys.'
        };
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedBy: 'analos-nft-launchpad',
          type: 'profile-image',
          timestamp: Date.now().toString()
        }
      });
      formData.append('pinataMetadata', metadata);

      // Add options
      const options = JSON.stringify({
        cidVersion: 0,
        wrapWithDirectory: false
      });
      formData.append('pinataOptions', options);

      // Upload with progress tracking
      const response = await fetch(`${IPFS_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        hash: result.IpfsHash,
        url: `${IPFS_GATEWAY}/ipfs/${result.IpfsHash}`
      };

    } catch (error) {
      console.error('IPFS upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload multiple files (for galleries)
   */
  async uploadMultipleFiles(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFile(file, onProgress);
      results.push(result);
      
      if (!result.success) {
        break; // Stop on first error
      }
    }
    
    return results;
  }

  /**
   * Get file URL from hash
   */
  getFileUrl(hash: string): string {
    return `${IPFS_GATEWAY}/ipfs/${hash}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    return { valid: true };
  }

  /**
   * Resize image before upload (client-side)
   */
  async resizeImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();

/**
 * Hook for file uploads with progress
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      // Validate file
      const validation = ipfsService.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Resize image if it's too large
      let fileToUpload = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB
        fileToUpload = await ipfsService.resizeImage(file);
      }

      // Upload to IPFS
      const result = await ipfsService.uploadFile(fileToUpload, setProgress);

      if (!result.success) {
        setError(result.error || 'Upload failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return {
    uploadFile,
    uploading,
    progress,
    error,
    clearError: () => setError(null)
  };
}

