'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { GenerationProgress } from '@/lib/nft-generator';

interface GenerationProgressModalProps {
  progress: GenerationProgress;
  onClose: () => void;
}

export default function GenerationProgressModal({ progress, onClose }: GenerationProgressModalProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Loader className="w-8 h-8 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Generation Progress</h3>
          {progress.status !== 'processing' && progress.status !== 'generating' && progress.status !== 'uploading' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="text-center mb-6">
          <div className="mb-4">
            {getStatusIcon()}
          </div>
          <h4 className={`text-lg font-medium mb-2 ${getStatusColor()}`}>
            {progress.message}
          </h4>
          
          {progress.error && (
            <p className="text-red-600 text-sm mt-2">{progress.error}</p>
          )}
        </div>

        {/* Progress Bar */}
        {progress.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.current} of {progress.total}</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-generator-purple to-generator-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Steps */}
        <div className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${
            ['processing', 'generating', 'uploading', 'complete'].includes(progress.status) 
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              ['processing', 'generating', 'uploading', 'complete'].includes(progress.status)
                ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            Processing layers and traits
          </div>
          
          <div className={`flex items-center gap-2 ${
            ['generating', 'uploading', 'complete'].includes(progress.status) 
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              ['generating', 'uploading', 'complete'].includes(progress.status)
                ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            Generating NFT images
          </div>
          
          <div className={`flex items-center gap-2 ${
            ['uploading', 'complete'].includes(progress.status) 
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              ['uploading', 'complete'].includes(progress.status)
                ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            Uploading to IPFS
          </div>
          
          <div className={`flex items-center gap-2 ${
            progress.status === 'complete' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              progress.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            Deploying to blockchain
          </div>
        </div>

        {progress.status === 'complete' && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            View Collection
          </button>
        )}

        {progress.status === 'error' && (
          <button
            onClick={onClose}
            className="w-full mt-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
