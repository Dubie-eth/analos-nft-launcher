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
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          ${isProfile ? 'profile-upload-area w-48 h-48 mx-auto' : 'banner-upload-area w-full h-32'}
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
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-2">
              {isProfile ? 'Upload Profile Picture' : 'Upload Banner Image'}
            </p>
            <p className="text-xs text-gray-500">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Max {Math.round(maxSize / (1024 * 1024))}MB, {maxDimensions}
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

      {/* Upload Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
        <p>• {isProfile ? 'Square images work best for profile pictures' : 'Wide images work best for banners'}</p>
        <p>• Images are automatically optimized for web</p>
      </div>
    </div>
  );
}
