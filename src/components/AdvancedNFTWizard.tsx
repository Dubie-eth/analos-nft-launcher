'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, Settings, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Save } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import AdvancedLayerManager from './AdvancedLayerManager';
import { LayerProcessor } from '@/lib/layer-processor';
import { Layer, Trait } from '@/lib/nft-generator';

// Trait and Layer interfaces are now imported from @/lib/nft-generator

interface AdvancedNFTWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

export default function AdvancedNFTWizard({ onComplete, onCancel }: AdvancedNFTWizardProps) {
  const { publicKey } = useWallet();
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
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
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
      
      // Show success message
      const totalTraits = newLayers.reduce((sum, layer) => sum + layer.traits.length, 0);
      setUploadMessage(`✅ Successfully uploaded ${processedLayers.length} layers with ${totalTraits} total traits! Click "Next" to continue.`);
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error) {
      console.error('❌ Error processing files:', error);
      setUploadMessage('❌ Error processing files. Please try again.');
      setTimeout(() => setUploadMessage(''), 3000);
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

  const handleSaveCollection = async () => {
    console.log('🔄 Starting collection save process...');
    
    if (!publicKey) {
      console.log('❌ No wallet connected');
      setSaveMessage('Please connect your wallet to save collections');
      return;
    }

    if (!collectionConfig.name || !collectionConfig.symbol) {
      console.log('❌ Missing required fields:', { name: collectionConfig.name, symbol: collectionConfig.symbol });
      setSaveMessage('Please fill in collection name and symbol');
      return;
    }

    console.log('✅ Validation passed, starting save...');
    setSaving(true);
    setSaveMessage('');

    const saveData = {
      userWallet: publicKey.toString(),
      collectionName: collectionConfig.name,
      collectionSymbol: collectionConfig.symbol,
      description: collectionConfig.description,
      totalSupply: collectionConfig.supply,
      mintPrice: collectionConfig.mintPrice,
      revealType: collectionConfig.revealType,
      revealDate: collectionConfig.revealType === 'delayed' ? new Date().toISOString() : null,
      whitelistEnabled: collectionConfig.whitelistEnabled,
      bondingCurveEnabled: collectionConfig.bondingCurveEnabled,
      layers: layers,
      collectionConfig: {
        ...collectionConfig,
        layers: layers,
        timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Sending save request with data:', saveData);

    try {
      const response = await fetch('/api/collections/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📥 API Response data:', result);

      if (result.success) {
        console.log('✅ Collection saved successfully to database!');
        setSaveMessage('✅ Collection saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        console.log('❌ Save failed:', result.error);
        setSaveMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Error saving collection:', error);
      setSaveMessage('❌ Failed to save collection');
    } finally {
      console.log('🏁 Save process completed');
      setSaving(false);
    }
  };

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
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Collection Basic Information</h3>
              <p className="text-white/80 text-lg">Tell us about your NFT collection</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={collectionConfig.name}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My Awesome Collection"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={collectionConfig.symbol}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="MAC"
                  maxLength={10}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={collectionConfig.description}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your collection..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Supply
                </label>
                <input
                  type="number"
                  value={collectionConfig.supply}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, supply: parseInt(e.target.value) || 1000 }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="10000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mint Price
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={collectionConfig.mintPrice}
                    onChange={(e) => setCollectionConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0.1 }))}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                  <select className="px-4 py-3 bg-white/20 border border-white/20 border-l-0 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="LOS">$LOS</option>
                    <option value="SOL">$SOL</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Creator Address
                </label>
                <input
                  type="text"
                  value={publicKey?.toString() || ''}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/70"
                  placeholder="Enter creator address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Royalty (%)
                </label>
                <input
                  type="number"
                  value="5"
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/70"
                />
              </div>
            </div>

            {/* Selection Cards */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-4">
                  Mint Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`bg-white/10 border-2 rounded-xl p-6 cursor-pointer hover:bg-white/15 transition-all ${
                      !collectionConfig.bondingCurveEnabled 
                        ? 'border-purple-500' 
                        : 'border-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, bondingCurveEnabled: false }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🎨</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">Standard NFT</h4>
                        <p className="text-white/70 text-sm">Traditional NFT minting</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`bg-white/10 border-2 rounded-xl p-6 cursor-pointer hover:bg-white/15 transition-all ${
                      collectionConfig.bondingCurveEnabled 
                        ? 'border-blue-500' 
                        : 'border-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, bondingCurveEnabled: true }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📈</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">Bonding Curve</h4>
                        <p className="text-white/70 text-sm">Dynamic pricing model</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-4">
                  Reveal Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`bg-white/10 border-2 rounded-xl p-6 cursor-pointer hover:bg-white/15 transition-all ${
                      collectionConfig.revealType === 'instant' 
                        ? 'border-yellow-500' 
                        : 'border-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, revealType: 'instant' }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">Instant Reveal</h4>
                        <p className="text-white/70 text-sm">Images revealed immediately</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`bg-white/10 border-2 rounded-xl p-6 cursor-pointer hover:bg-white/15 transition-all ${
                      collectionConfig.revealType === 'delayed' 
                        ? 'border-gray-500' 
                        : 'border-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, revealType: 'delayed' }))}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🔒</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">Delayed Reveal</h4>
                        <p className="text-white/70 text-sm">Images revealed later</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Upload Trait Images</h3>
              <p className="text-white/80 text-lg">Upload your trait images using either method below:</p>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">📁 Method 1: Folder Upload</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div><strong>LosBros/Background/blue.png</strong></div>
                    <div><strong>LosBros/Eyes/red.png</strong></div>
                    <div><strong>LosBros/Hat/cap.png</strong></div>
                    <div><strong>LosBros/Clothing/shirt.png</strong></div>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">📦 Method 2: ZIP Upload</h4>
                  <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <div><strong>LosBros.zip</strong> containing:</div>
                    <div>• Background/ folder</div>
                    <div>• Eyes/ folder</div>
                    <div>• Hat/ folder</div>
                    <div>• Clothing/ folder</div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">📝 Method 3: File Naming</h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <div><strong>Background_blue.png</strong></div>
                    <div><strong>Eyes_red.png</strong></div>
                    <div><strong>Hat_cap.png</strong></div>
                    <div><strong>Clothing_shirt.png</strong></div>
                  </div>
                </div>
              </div>
            
            <div
              className="border-2 border-dashed border-white/30 rounded-xl p-12 text-center hover:border-white/50 transition-colors bg-white/5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="w-16 h-16 text-white/60 mx-auto mb-6" />
              <p className="text-xl font-medium text-white mb-3">
                Drag and drop your trait folders, ZIP files, or images here
              </p>
              <p className="text-white/70 mb-6">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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
              <p className="text-sm text-white/60 mt-6">
                Supported formats: PNG, JPG, GIF, ZIP. Max 10MB per file.
              </p>
            </div>
            
            {/* Upload Success Message */}
            {uploadMessage && (
              <div className={`mt-6 p-6 rounded-xl border-2 text-center font-medium ${
                uploadMessage.includes('✅')
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-red-500/20 border-red-500/50 text-red-300'
              }`}>
                {uploadMessage}
              </div>
            )}
            
            {layers.length > 0 && (
              <div className="mt-8">
                <div className="bg-green-500/20 border-2 border-green-500/50 rounded-xl p-6 mb-6">
                  <h4 className="text-xl font-bold text-green-300 mb-3">
                    ✅ Upload Successful!
                  </h4>
                  <p className="text-green-200 mb-2">
                    Your traits have been uploaded successfully. Review the layers below, then click "Next" to continue.
                  </p>
                  <p className="text-sm text-green-300">
                    {layers.length} layers • {layers.reduce((sum, layer) => sum + layer.traits.length, 0)} total traits
                  </p>
                </div>
                
                <h4 className="text-xl font-medium text-white mb-6">Uploaded Layers:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {layers.map(layer => (
                    <div key={layer.id} className="bg-white/10 rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                      <h5 className="font-medium text-white">{layer.name}</h5>
                      <p className="text-sm text-white/70">{layer.traits.length} traits</p>
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

  const stepNames = [
    'Basic Info',
    'Traits', 
    'Configure',
    'Reveal',
    'Whitelist',
    'Bonding Curve',
    'Review',
    'Deploy'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Analos NFT Launcher</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between">
            {stepNames.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/20 text-white/60'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive 
                        ? 'bg-white text-purple-600' 
                        : isCompleted 
                        ? 'bg-white text-green-500' 
                        : 'bg-white/30 text-white/80'
                    }`}>
                      {stepNumber}
                    </div>
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                  {index < stepNames.length - 1 && (
                    <div className="w-8 h-0.5 bg-white/20 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 px-8 py-6">
          {/* Save Message */}
          {saveMessage && (
            <div className={`mb-4 p-4 rounded-lg text-sm ${
              saveMessage.includes('✅') 
                ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                : 'bg-red-500/20 border border-red-500/50 text-red-300'
            }`}>
              {saveMessage}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 text-white/70 border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex gap-3">
              {/* Save Button */}
              <button
                onClick={handleSaveCollection}
                disabled={saving || !collectionConfig.name || !collectionConfig.symbol}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={onCancel}
                className="px-6 py-3 text-white/70 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            
              {currentStep < totalSteps ? (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => onComplete({
                    ...collectionConfig,
                    layers,
                    timestamp: new Date().toISOString()
                  })}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Deploy Collection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
