/**
 * PROFILE PICTURE UPLOAD COMPONENT
 * Handles profile picture and banner uploads with preview
 */

'use client';

import React, { useState, useRef } from 'react';
import { useFileUpload } from '@/lib/ipfs-service';
import { logger } from '@/lib/logger';

interface ProfilePictureUploadProps {
  currentImage?: string;
  type: 'profile' | 'banner';
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ProfilePictureUpload({
  currentImage,
  type,
  onUploadComplete,
  onError,
  className = ''
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading, progress, error, clearError } = useFileUpload();

  const isProfile = type === 'profile';
  const maxSize = isProfile ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for profile, 10MB for banner
  const maxDimensions = isProfile ? '800x800px' : '1920x1080px';

  const handleFileSelect = async (file: File) => {
    clearError();

    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
      onError?.(errorMsg);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to IPFS
    logger.log(`Uploading ${type} picture:`, file.name);
    const result = await uploadFile(file);

    if (result.success && result.url) {
      setPreview(result.url);
      onUploadComplete(result.url);
      logger.log(`${type} picture uploaded successfully:`, result.url);
    } else {
      const errorMsg = result.error || 'Upload failed';
      onError?.(errorMsg);
      logger.error(`Failed to upload ${type} picture:`, errorMsg);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          ${isProfile ? 'w-24 h-24' : 'w-20 h-12'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt={`${type} preview`}
              className={`
                w-full h-full object-cover rounded-lg
                ${isProfile ? 'rounded-full' : 'rounded-lg'}
              `}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-2">
            <svg
              className="w-6 h-6 text-gray-400 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <p className="text-xs text-gray-600 text-center">
              {isProfile ? 'Add Photo' : 'Add Banner'}
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && progress && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <p className="text-sm text-blue-600 text-center">
          Uploading... {progress ? `${Math.round(progress.percentage)}%` : ''}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

    </div>
  );
}
