'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image, X, Check } from 'lucide-react';

interface MobileImageUploadProps {
  type: 'profile' | 'banner';
  currentImage?: string;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  className?: string;
}

export default function MobileImageUpload({
  type,
  currentImage,
  onImageChange,
  className = ''
}: MobileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isProfile = type === 'profile';
  const maxSize = isProfile ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      alert(File size must be less than MB);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onImageChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={mobile-image-upload }>
      <div
        className={
          relative border-2 border-dashed rounded-lg transition-all duration-200
          
          
          
          cursor-pointer hover:border-blue-400 hover:bg-gray-50
          flex items-center justify-center
        }
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
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
              alt={${type} preview}
              className={
                w-full h-full object-cover rounded-lg
                
              }
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <div className="mb-2">
              {isProfile ? (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {isProfile ? 'Add Photo' : 'Add Banner'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isProfile ? 'Tap to upload' : 'Tap to upload'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          {isProfile ? 'Max 5MB, 800x800px' : 'Max 10MB, 1920x1080px'}
        </p>
        <p className="text-xs text-gray-400">
          JPG, PNG, GIF supported
        </p>
      </div>

      {uploading && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading...
          </div>
        </div>
      )}

      <style jsx>{
        .mobile-image-upload {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        .mobile-image-upload input[type="file"] {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        @media (hover: hover) {
          .mobile-image-upload:hover {
            transform: scale(1.02);
          }
        }
        
        @media (max-width: 768px) {
          .mobile-image-upload {
            font-size: 14px;
          }
        }
      }</style>
    </div>
  );
}
