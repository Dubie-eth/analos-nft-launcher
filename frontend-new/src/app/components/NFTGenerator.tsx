'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Settings, Play, Eye, ArrowRight } from 'lucide-react';
import { Layer, Trait, CollectionSettings, GeneratedNFT } from '../../lib/nft-generator';
import { layerProcessor } from '../../lib/layer-processor';
import FolderUploader from './FolderUploader';
import LayerManager from './LayerManager';
import LivePreview from './LivePreview';

interface NFTGeneratorProps {
  onComplete?: (result: any) => void;
}

export default function NFTGenerator({ onComplete }: NFTGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'settings' | 'generate'>('upload');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [collectionSettings, setCollectionSettings] = useState<CollectionSettings>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    totalSupply: 1000,
    mintPrice: 0.1,
    creator: '',
    royalty: 5,
    website: '',
    twitter: '',
    discord: '',
    telegram: ''
  });
  const [generatedNFTs, setGeneratedNFTs] = useState<GeneratedNFT[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    try {
      console.log('📁 Files uploaded:', files.length);
      const processedLayers = await layerProcessor.processUploadedFiles(files);
      setLayers(processedLayers);
      
      if (processedLayers.length > 0) {
        setCurrentStep('configure');
      }
    } catch (error) {
      console.error('❌ Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updateLayerTrait = useCallback((layerId: string, traitId: string, updates: Partial<Trait>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? {
            ...layer,
            traits: layer.traits.map(trait => 
              trait.id === traitId ? { ...trait, ...updates } : trait
            )
          }
        : layer
    ));
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  const reorderLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const sortedLayers = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sortedLayers.findIndex(layer => layer.id === layerId);
      
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= sortedLayers.length) return prev;
      
      // Swap layers
      [sortedLayers[currentIndex], sortedLayers[newIndex]] = [sortedLayers[newIndex], sortedLayers[currentIndex]];
      
      // Update order values
      return sortedLayers.map((layer, index) => ({ ...layer, order: index }));
    });
  }, []);

  const deleteTrait = useCallback((layerId: string, traitId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? {
            ...layer,
            traits: layer.traits.filter(trait => trait.id !== traitId)
          }
        : layer
    ));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsProcessing(true);
    try {
      const validation = layerProcessor.validateLayers(layers);
      if (!validation.valid) {
        alert(`Validation failed:\n${validation.errors.join('\n')}`);
        return;
      }

      // Simulate NFT generation
      const generated: GeneratedNFT[] = [];
      for (let i = 0; i < Math.min(collectionSettings.totalSupply, 10); i++) {
        const traits = [];
        for (const layer of layers.filter(l => l.visible)) {
          if (layer.traits.length > 0) {
            const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
            traits.push({
              trait_type: layer.name,
              value: randomTrait.name
            });
          }
        }
        
        generated.push({
          id: i + 1,
          name: `${collectionSettings.name} #${i + 1}`,
          image: '', // Would be generated image URL
          traits,
          rarityScore: Math.random() * 100
        });
      }
      
      setGeneratedNFTs(generated);
      setCurrentStep('generate');
      
      if (onComplete) {
        onComplete({ layers, collectionSettings, generatedNFTs: generated });
      }
    } catch (error) {
      console.error('❌ Error generating NFTs:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [layers, collectionSettings, onComplete]);

  const steps = [
    { id: 'upload', name: 'Upload Layers', icon: Upload, description: 'Upload your trait folders' },
    { id: 'configure', name: 'Configure Layers', icon: Settings, description: 'Set rarity and organize layers' },
    { id: 'settings', name: 'Collection Settings', icon: Play, description: 'Configure collection details' },
    { id: 'generate', name: 'Generate & Deploy', icon: Eye, description: 'Generate NFTs and deploy to Analos' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🚀 Professional NFT Generator
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                  BETA
                </span>
              </h1>
              <p className="text-white/80 mt-1">
                Create stunning generative NFT collections with advanced layer management and rarity configuration for Analos blockchain
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  <StepIcon className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-white/40 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Current Step Content */}
          <div className="lg:col-span-2">
            {currentStep === 'upload' && (
              <FolderUploader
                onFilesUploaded={handleFileUpload}
                fileInputRef={fileInputRef}
              />
            )}
            
            {currentStep === 'configure' && (
              <LayerManager
                layers={layers}
                onUpdateTrait={updateLayerTrait}
                onToggleVisibility={toggleLayerVisibility}
                onReorderLayer={reorderLayer}
                onDeleteTrait={deleteTrait}
              />
            )}
            
            {currentStep === 'settings' && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Collection Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                    <input
                      type="text"
                      value={collectionSettings.name}
                      onChange={(e) => setCollectionSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter collection name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={collectionSettings.symbol}
                      onChange={(e) => setCollectionSettings(prev => ({ ...prev, symbol: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter symbol (e.g., LBS)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={collectionSettings.description}
                      onChange={(e) => setCollectionSettings(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe your collection"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Supply</label>
                      <input
                        type="number"
                        value={collectionSettings.totalSupply}
                        onChange={(e) => setCollectionSettings(prev => ({ ...prev, totalSupply: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mint Price (LOS)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={collectionSettings.mintPrice}
                        onChange={(e) => setCollectionSettings(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep('generate')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Continue to Generate
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 'generate' && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Generate</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Layers:</span>
                    <span className="font-medium">{layers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Traits:</span>
                    <span className="font-medium">{layers.reduce((sum, layer) => sum + layer.traits.length, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Possible Combinations:</span>
                    <span className="font-medium">
                      {layers.reduce((total, layer) => total * (layer.visible ? layer.traits.length : 1), 1).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection Name:</span>
                    <span className="font-medium">{collectionSettings.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mint Price:</span>
                    <span className="font-medium">{collectionSettings.mintPrice} LOS</span>
                  </div>
                  
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Generating NFTs...' : '🚀 Generate & Deploy to Analos'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Live Preview */}
          <div className="lg:col-span-1">
            <LivePreview
              layers={layers}
              collectionSettings={collectionSettings}
              generatedNFTs={generatedNFTs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
