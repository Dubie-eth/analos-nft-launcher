'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, Settings, Eye, EyeOff, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import AdvancedLayerManager from './AdvancedLayerManager';
import { LayerProcessor } from '@/lib/layer-processor';
import { Layer, Trait } from '@/lib/nft-generator';

// Trait and Layer interfaces are now imported from @/lib/nft-generator

interface AdvancedNFTWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

export default function AdvancedNFTWizard({ onComplete, onCancel }: AdvancedNFTWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [collectionConfig, setCollectionConfig] = useState({
    name: '',
    symbol: '',
    description: '',
    supply: 1000,
    mintPrice: 0.1,
    revealType: 'instant' as 'instant' | 'delayed',
    whitelistEnabled: false,
    bondingCurveEnabled: false
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerProcessor = useRef(new LayerProcessor());

  const totalSteps = 8;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    
    try {
      console.log('🔄 Processing uploaded files with LayerProcessor...');
      
      // Use the LayerProcessor to properly handle file uploads
      const processedLayers = await layerProcessor.current.processUploadedFiles(files);
      
      // Merge with existing layers
      const existingLayers = [...layers];
      const newLayers: Layer[] = [];
      
      for (const processedLayer of processedLayers) {
        const existingLayer = existingLayers.find(l => l.name === processedLayer.name);
        
        if (existingLayer) {
          // Add traits to existing layer
          existingLayer.traits.push(...processedLayer.traits);
          newLayers.push(existingLayer);
        } else {
          // Create new layer
          newLayers.push(processedLayer);
        }
      }
      
      // Add existing layers that weren't updated
      existingLayers.forEach(layer => {
        if (!newLayers.find(l => l.id === layer.id)) {
          newLayers.push(layer);
        }
      });
      
      setLayers(newLayers);
      console.log(`✅ Successfully processed ${processedLayers.length} layers`);
    } catch (error) {
      console.error('❌ Error processing files:', error);
    } finally {
      setUploading(false);
    }
  }, [layers]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const updateTrait = (layerId: string, traitId: string, updates: Partial<Trait>) => {
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
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const reorderLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(l => l.id === layerId);
      
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= sorted.length) return prev;
      
      // Swap orders
      const temp = sorted[index].order;
      sorted[index].order = sorted[newIndex].order;
      sorted[newIndex].order = temp;
      
      return sorted;
    });
  };

  const deleteTrait = (layerId: string, traitId: string) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId
        ? {
            ...layer,
            traits: layer.traits.filter(trait => trait.id !== traitId)
          }
        : layer
    ));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Collection Basics</h3>
              <p className="text-gray-600">Set up the basic information for your NFT collection.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionConfig.name}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Collection"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={collectionConfig.symbol}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MAC"
                  maxLength={10}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={collectionConfig.description}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your collection..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Supply
                </label>
                <input
                  type="number"
                  value={collectionConfig.supply}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, supply: parseInt(e.target.value) || 1000 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mint Price (SOL)
                </label>
                <input
                  type="number"
                  value={collectionConfig.mintPrice}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0.1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Trait Images</h3>
              <p className="text-gray-600 mb-4">Upload your trait images using either method below:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📁 Method 1: Folder Upload</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div><strong>LosBros/Background/blue.png</strong></div>
                    <div><strong>LosBros/Eyes/red.png</strong></div>
                    <div><strong>LosBros/Hat/cap.png</strong></div>
                    <div><strong>LosBros/Clothing/shirt.png</strong></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">📦 Method 2: ZIP Upload</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <div><strong>LosBros.zip</strong> containing:</div>
                    <div>• Background/ folder</div>
                    <div>• Eyes/ folder</div>
                    <div>• Hat/ folder</div>
                    <div>• Clothing/ folder</div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">📝 Method 3: File Naming</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div><strong>Background_blue.png</strong></div>
                    <div><strong>Eyes_red.png</strong></div>
                    <div><strong>Hat_cap.png</strong></div>
                    <div><strong>Clothing_shirt.png</strong></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your trait folders, ZIP files, or images here
              </p>
              <p className="text-gray-500 mb-4">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose Folders/ZIP/Files'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.zip"
                {...({ webkitdirectory: "" } as any)}
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PNG, JPG, GIF, ZIP. Max 10MB per file.
              </p>
            </div>
            
            {layers.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Layers:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {layers.map(layer => (
                    <div key={layer.id} className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800">{layer.name}</h5>
                      <p className="text-sm text-gray-500">{layer.traits.length} traits</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configure Layers & Rarity</h3>
              <p className="text-gray-600">Set up your layers, adjust trait rarity, and position layers correctly.</p>
            </div>
            
            <AdvancedLayerManager
              layers={layers}
              onUpdateTrait={updateTrait}
              onToggleVisibility={toggleLayerVisibility}
              onReorderLayer={reorderLayer}
              onDeleteTrait={deleteTrait}
              collectionSupply={collectionConfig.supply}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reveal Settings</h3>
              <p className="text-gray-600">Choose how your NFTs will be revealed to users.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reveal Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="revealType"
                      value="instant"
                      checked={collectionConfig.revealType === 'instant'}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, revealType: e.target.value as 'instant' | 'delayed' }))}
                      className="mr-2"
                    />
                    <span>Instant Reveal</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="revealType"
                      value="delayed"
                      checked={collectionConfig.revealType === 'delayed'}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, revealType: e.target.value as 'instant' | 'delayed' }))}
                      className="mr-2"
                    />
                    <span>Delayed Reveal</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Whitelist Settings</h3>
              <p className="text-gray-600">Configure whitelist phases for your collection.</p>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={collectionConfig.whitelistEnabled}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, whitelistEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <span>Enable Whitelist</span>
              </label>
              
              {collectionConfig.whitelistEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Whitelist Configuration</h4>
                  <p className="text-sm text-blue-700">
                    Whitelist settings will be configured in the next step. This will allow you to:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                    <li>Set token gate requirements (e.g., 1M+ ANAL tokens)</li>
                    <li>Configure free mints for whitelist holders</li>
                    <li>Set additional mint pricing</li>
                    <li>Define whitelist supply limits</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Bonding Curve</h3>
              <p className="text-gray-600">Configure dynamic pricing for your collection.</p>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={collectionConfig.bondingCurveEnabled}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, bondingCurveEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <span>Enable Bonding Curve Pricing</span>
              </label>
              
              {collectionConfig.bondingCurveEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Bonding Curve Benefits</h4>
                  <p className="text-sm text-green-700">
                    Bonding curve pricing will automatically adjust based on supply:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 list-disc list-inside">
                    <li>Lower prices when supply is high</li>
                    <li>Higher prices as supply decreases</li>
                    <li>Creates urgency and FOMO</li>
                    <li>Maximizes revenue potential</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Review & Deploy</h3>
              <p className="text-gray-600">Review your collection configuration before deploying.</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h4 className="font-medium text-gray-800">Collection Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium ml-2">{collectionConfig.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Symbol:</span>
                  <span className="font-medium ml-2">{collectionConfig.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-500">Supply:</span>
                  <span className="font-medium ml-2">{collectionConfig.supply}</span>
                </div>
                <div>
                  <span className="text-gray-500">Mint Price:</span>
                  <span className="font-medium ml-2">{collectionConfig.mintPrice} SOL</span>
                </div>
                <div>
                  <span className="text-gray-500">Layers:</span>
                  <span className="font-medium ml-2">{layers.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Traits:</span>
                  <span className="font-medium ml-2">
                    {layers.reduce((sum, layer) => sum + layer.traits.length, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reveal Type:</span>
                  <span className="font-medium ml-2 capitalize">{collectionConfig.revealType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Whitelist:</span>
                  <span className="font-medium ml-2">{collectionConfig.whitelistEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Bonding Curve:</span>
                  <span className="font-medium ml-2">{collectionConfig.bondingCurveEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Deploy Collection</h3>
              <p className="text-gray-600">Deploy your collection to the blockchain.</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-medium text-green-800 mb-2">Ready to Deploy!</h4>
              <p className="text-sm text-green-700 mb-4">
                Your collection is configured and ready to be deployed to the Analos blockchain.
              </p>
              <button
                onClick={() => onComplete({
                  ...collectionConfig,
                  layers,
                  timestamp: new Date().toISOString()
                })}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Deploy Collection
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">NFT Collection Wizard</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="mt-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => onComplete({
                  ...collectionConfig,
                  layers,
                  timestamp: new Date().toISOString()
                })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Deploy Collection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
