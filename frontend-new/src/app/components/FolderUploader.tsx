'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FolderOpen, FileImage, AlertCircle, CheckCircle } from 'lucide-react';

interface FolderUploaderProps {
  onFilesUploaded: (files: FileList) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function FolderUploader({ onFilesUploaded, fileInputRef }: FolderUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleFileSelect = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    setUploadStatus('uploading');
    
    // Simulate processing time
    setTimeout(() => {
      setUploadStatus('success');
      onFilesUploaded(files);
    }, 1000);
  }, [onFilesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('📁 File input changed:', files ? files.length : 0, 'files');
    if (files && files.length > 0) {
      // Debug: Log all files being uploaded
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 File ${i}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          webkitRelativePath: (file as any).webkitRelativePath || 'N/A'
        });
      }
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-4 h-4 text-blue-500" />;
    } else if (file.type === 'application/zip') {
      return <FolderOpen className="w-4 h-4 text-green-500" />;
    }
    return <FileImage className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'uploading':
        return <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Upload className={`w-12 h-12 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'success':
        return `Successfully uploaded ${uploadedFiles.length} files!`;
      case 'uploading':
        return 'Processing uploaded files...';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return 'Drag & drop your trait folders here';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Upload Your Trait Folders</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {getStatusIcon()}
        
        <h4 className="text-lg font-medium text-gray-700 mb-2 mt-4">
          {getStatusMessage()}
        </h4>
        
        <p className="text-gray-500 mb-4">
          {uploadStatus === 'idle' 
            ? 'Upload folders containing organized traits (e.g., Background, Clothes, Eyes)'
            : uploadStatus === 'success'
            ? 'Your files have been processed and organized into layers'
            : 'Please wait while we process your files...'
          }
        </p>
        
        {uploadStatus === 'idle' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Choose Folders
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          webkitdirectory="true"
          directory="true"
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Upload Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Upload Guidelines:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Folder Structure:</strong> Organize traits in folders (e.g., "Background", "Eyes", "Mouth")</li>
              <li>• <strong>Drag & Drop:</strong> Drag entire folders directly onto the upload area</li>
              <li>• <strong>File Selection:</strong> Use "Choose Folders" to select multiple folders at once</li>
              <li>• <strong>Supported formats:</strong> PNG, JPG, JPEG, GIF, WebP, SVG</li>
              <li>• <strong>File size:</strong> Recommended under 5MB per image</li>
              <li>• <strong>Dimensions:</strong> All images should be the same size (e.g., 512x512)</li>
            </ul>
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>💡 Perfect for LosBros:</strong> Upload your LosBros folder directly - the system will automatically organize Background, Clothes, Eyes, Hats, Mouth, Skin, and 1of1s into separate layers!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && uploadStatus === 'success' && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploadedFiles.slice(0, 10).map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getFileTypeIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {file.type === 'application/zip' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ZIP Archive
                  </span>
                )}
              </div>
            ))}
            {uploadedFiles.length > 10 && (
              <p className="text-sm text-gray-500 text-center py-2">
                ... and {uploadedFiles.length - 10} more files
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
