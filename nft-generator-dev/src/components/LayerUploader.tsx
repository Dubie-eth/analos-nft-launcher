'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FolderOpen, FileImage, AlertCircle } from 'lucide-react';

interface LayerUploaderProps {
  onFilesUploaded: (files: FileList) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function LayerUploader({ onFilesUploaded, fileInputRef }: LayerUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileSelect = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    onFilesUploaded(files);
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
    if (files && files.length > 0) {
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Upload Your Trait Files</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-generator-purple bg-purple-50'
            : 'border-gray-300 hover:border-generator-purple hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-generator-purple' : 'text-gray-400'}`} />
        
        <h4 className="text-lg font-medium text-gray-700 mb-2">
          Drag & drop your files here
        </h4>
        
        <p className="text-gray-500 mb-4">
          Upload individual images or ZIP files containing organized folders
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-r from-generator-purple to-generator-blue hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.zip"
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
              <li>• <strong>ZIP files:</strong> Organize traits in folders (e.g., "Backgrounds", "Eyes", "Mouth")</li>
              <li>• <strong>Individual files:</strong> Use descriptive names like "background_sunset.png"</li>
              <li>• <strong>Supported formats:</strong> PNG, JPG, JPEG, GIF, WebP, SVG</li>
              <li>• <strong>File size:</strong> Recommended under 5MB per image</li>
              <li>• <strong>Dimensions:</strong> All images should be the same size (e.g., 512x512)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploadedFiles.map((file, index) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
