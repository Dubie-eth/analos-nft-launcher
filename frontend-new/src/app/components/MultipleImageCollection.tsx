'use client';

import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, Eye, EyeOff, Clock, Zap, CheckCircle, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { DeploymentStrategy } from './DeploymentStrategySelector';

interface MultipleImageCollectionProps {
  strategy: DeploymentStrategy;
  onComplete: (result: any) => void;
  onBack: () => void;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export default function MultipleImageCollection({ strategy, onComplete, onBack }: MultipleImageCollectionProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [revealType, setRevealType] = useState<'instant' | 'delayed'>('instant');
  const [collectionSettings, setCollectionSettings] = useState({
    mintPrice: 0.1,
    royaltyFee: 5,
    revealDelay: 24, // hours for delayed reveal
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setIsUploading(true);
    
    // Process each image
    const newImages: UploadedImage[] = imageFiles.map(file => ({
      id: `img_${Date.now()}_${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    setIsUploading(false);
    console.log(`📸 Uploaded ${newImages.length} images. Total: ${uploadedImages.length + newImages.length}`);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleDeploy = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setIsDeploying(true);
    console.log('🚀 Deploying multiple image collection...');
    
    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = {
        collectionName: strategy.collectionName,
        mintType: strategy.mintType,
        tokenSetType: strategy.tokenSetType,
        totalSupply: uploadedImages.length,
        revealType: revealType,
        images: uploadedImages.map(img => ({
          id: img.id,
          name: img.name,
          url: img.preview
        }))
      };
      
      console.log('✅ Multiple image collection deployed:', result);
      onComplete(result);
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      alert('Deployment failed. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Strategy Selection
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Multiple Image Collection</h1>
          <p className="text-white/70">
            Upload multiple pre-made images. Each NFT will have its own unique image from your collection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Upload */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Images ({uploadedImages.length})
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add More Images
              </button>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                uploadedImages.length > 0
                  ? 'border-green-400 bg-green-500/10'
                  : 'border-white/30 hover:border-white/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImages.length === 0 ? (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-white/50 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Click to upload images</h3>
                    <p className="text-white/70 text-sm">
                      PNG, JPG, JPEG, GIF, WebP (max 10MB each)
                    </p>
                    <p className="text-white/60 text-xs mt-2">
                      You can upload multiple images at once
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadedImages.length > 0 && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{uploadedImages.length} Images Ready</span>
                </div>
                <p className="text-white/70 text-sm">
                  Each uploaded image will become a unique NFT in your collection.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Reveal Type Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Reveal Configuration
              </h2>
              
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    revealType === 'instant'
                      ? 'border-blue-400 bg-blue-500/20'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setRevealType('instant')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      revealType === 'instant' ? 'border-blue-400 bg-blue-400' : 'border-white/40'
                    }`} />
                    <Zap className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="font-medium text-white">Instant Reveal</h3>
                      <p className="text-white/70 text-sm">
                        Users get the actual NFT immediately upon minting
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    revealType === 'delayed'
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setRevealType('delayed')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      revealType === 'delayed' ? 'border-purple-400 bg-purple-400' : 'border-white/40'
                    }`} />
                    <Clock className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="font-medium text-white">Delayed Reveal</h3>
                      <p className="text-white/70 text-sm">
                        Users see a placeholder until reveal date, then get their unique NFT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {revealType === 'delayed' && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Delayed Reveal Settings</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Reveal Delay (hours)</label>
                      <input
                        type="number"
                        value={collectionSettings.revealDelay}
                        onChange={(e) => setCollectionSettings(prev => ({
                          ...prev,
                          revealDelay: parseInt(e.target.value) || 24
                        }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        max="168"
                      />
                    </div>
                    <p className="text-white/60 text-xs">
                      NFTs will be revealed {collectionSettings.revealDelay} hours after minting starts
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Collection Settings */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Collection Settings</h2>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-sm">Total Supply</p>
                  <p className="text-white font-medium text-lg">{uploadedImages.length} NFTs</p>
                  <p className="text-white/60 text-xs">Based on uploaded images</p>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Mint Price (LOS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={collectionSettings.mintPrice}
                    onChange={(e) => setCollectionSettings(prev => ({
                      ...prev,
                      mintPrice: parseFloat(e.target.value) || 0.1
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-1">Royalty Fee (%)</label>
                  <input
                    type="number"
                    value={collectionSettings.royaltyFee}
                    onChange={(e) => setCollectionSettings(prev => ({
                      ...prev,
                      royaltyFee: parseFloat(e.target.value) || 5
                    }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={uploadedImages.length === 0 || isDeploying}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                uploadedImages.length > 0 && !isDeploying
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isDeploying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying to Analos...
                </div>
              ) : (
                `Deploy ${uploadedImages.length} Image Collection`
              )}
            </button>
          </div>
        </div>

        {/* Collection Details Summary */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">Collection Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm">Collection Name</p>
              <p className="text-white font-medium">{strategy.collectionName}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm">Mint Type</p>
              <p className="text-white font-medium">
                {strategy.mintType === 'regular' ? 'Regular NFT Launch' : 'Bonding Curve Launch'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm">Reveal Type</p>
              <p className="text-white font-medium">
                {revealType === 'instant' ? 'Instant Reveal' : 'Delayed Reveal'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm">Total Supply</p>
              <p className="text-white font-medium">{uploadedImages.length} Unique NFTs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
