'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Settings, Play, Eye, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { Layer, Trait, CollectionSettings, GeneratedNFT, GenerationProgress } from '@/types/nft-generator';
import { layerProcessor } from '@/lib/layer-processor';
import LayerUploader from './LayerUploader';
import LayerManager from './LayerManager';
import CollectionSettingsForm from './CollectionSettingsForm';
import LivePreview from './LivePreview';
import GenerationProgressModal from './GenerationProgressModal';

interface ProfessionalNFTGeneratorProps {
  onComplete?: (result: any) => void;
}

export default function ProfessionalNFTGenerator({ onComplete }: ProfessionalNFTGeneratorProps) {
  // State management
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'settings' | 'generate'>('upload');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [collectionSettings, setCollectionSettings] = useState<CollectionSettings>({
    name: '',
    description: '',
    symbol: '',
    totalSupply: 1000,
    imageSize: { width: 512, height: 512 },
    socials: {},
    creator: { name: '', wallet: '' },
    royalties: 5
  });
  const [generatedNFTs, setGeneratedNFTs] = useState<GeneratedNFT[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    console.log('📁 Files uploaded:', fileArray.length);
    
    try {
      const processedLayers = await layerProcessor.processUploadedFiles(fileArray);
      setLayers(processedLayers);
      setCurrentStep('configure');
      console.log('✅ Layers processed:', processedLayers);
    } catch (error) {
      console.error('❌ Error processing files:', error);
      alert('Error processing uploaded files. Please try again.');
    }
  }, []);

  // Update layer traits
  const updateLayerTrait = useCallback((layerId: string, traitId: string, updates: Partial<Trait>) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          traits: layer.traits.map(trait => 
            trait.id === traitId ? { ...trait, ...updates } : trait
          )
        };
      }
      return layer;
    }));
  }, []);

  // Update layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  // Reorder layers
  const reorderLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const newLayers = [...prev];
      const index = newLayers.findIndex(layer => layer.id === layerId);
      
      if (direction === 'up' && index > 0) {
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      } else if (direction === 'down' && index < newLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      }
      
      return newLayers;
    });
  }, []);

  // Delete trait
  const deleteTrait = useCallback((layerId: string, traitId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const updatedTraits = layer.traits.filter(trait => trait.id !== traitId);
        return { ...layer, traits: updatedTraits };
      }
      return layer;
    }));
  }, []);

  // Validate current step
  const canProceedToNextStep = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        return layers.length > 0;
      case 'configure':
        return layers.every(layer => layer.traits.length > 0);
      case 'settings':
        return collectionSettings.name.trim() !== '' && 
               collectionSettings.symbol.trim() !== '' && 
               collectionSettings.creator.name.trim() !== '' &&
               collectionSettings.creator.wallet.trim() !== '';
      default:
        return true;
    }
  }, [currentStep, layers, collectionSettings]);

  // Step buttons
  const stepButtons = [
    {
      id: 'upload' as const,
      label: 'Upload Layers',
      icon: Upload,
      description: 'Upload your trait files and folders'
    },
    {
      id: 'configure' as const,
      label: 'Configure Layers',
      icon: Settings,
      description: 'Set rarity and organize your traits'
    },
    {
      id: 'settings' as const,
      label: 'Collection Settings',
      icon: Settings,
      description: 'Configure collection metadata and socials'
    },
    {
      id: 'generate' as const,
      label: 'Generate & Deploy',
      icon: Play,
      description: 'Generate NFTs and deploy to blockchain'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-generator-darker via-generator-dark to-purple-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-generator-purple to-generator-blue p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Layers className="w-8 h-8" />
                Professional NFT Generator
                <span className="bg-yellow-500 text-black px-2 py-1 text-sm rounded-full">BETA</span>
              </h1>
              <p className="text-lg opacity-90 mt-2">
                Create stunning generative NFT collections with advanced layer management and rarity configuration.
              </p>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex gap-4 mt-6">
            {stepButtons.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = stepButtons.slice(0, index).every(s => 
                s.id === 'upload' ? layers.length > 0 :
                s.id === 'configure' ? layers.every(layer => layer.traits.length > 0) :
                s.id === 'settings' ? collectionSettings.name.trim() !== '' : true
              );
              const canAccess = index === 0 || isCompleted;

              return (
                <button
                  key={step.id}
                  onClick={() => canAccess && setCurrentStep(step.id)}
                  disabled={!canAccess}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-generator-purple shadow-lg'
                      : canAccess
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{step.label}</span>
                  {isCompleted && !isActive && (
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Current Step Content */}
          <div className="lg:col-span-2">
            {currentStep === 'upload' && (
              <LayerUploader
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
              <CollectionSettingsForm
                settings={collectionSettings}
                onSettingsChange={setCollectionSettings}
              />
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
                    <span>Collection Name:</span>
                    <span className="font-medium">{collectionSettings.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Supply:</span>
                    <span className="font-medium">{collectionSettings.totalSupply}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    // Start generation process
                    setProgress({
                      current: 0,
                      total: collectionSettings.totalSupply,
                      status: 'processing',
                      message: 'Starting generation...'
                    });
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🚀 Start Generation & Deploy
                </button>
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

      {/* Generation Progress Modal */}
      {progress.status !== 'idle' && (
        <GenerationProgressModal
          progress={progress}
          onClose={() => setProgress({ ...progress, status: 'idle' })}
        />
      )}
    </div>
  );
}
