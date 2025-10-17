'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Plus, Settings, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Save } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import AdvancedLayerManager from './AdvancedLayerManager';
import ThemeToggle from './ThemeToggle';
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
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [savedCollections, setSavedCollections] = useState<any[]>([]);
  const [showCollectionLoader, setShowCollectionLoader] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // Bonding curve configuration state
  const [bondingCurveConfig, setBondingCurveConfig] = useState({
    startingPrice: 0.1,
    maxPrice: 1.0,
    increaseRate: 5.0
  });

  // Whitelist configuration state
  const [whitelistConfig, setWhitelistConfig] = useState({
    phases: [
      { name: 'Early Supporters', enabled: true, spots: 100 },
      { name: 'Community Members', enabled: true, spots: 200 },
      { name: 'Public Access', enabled: false, spots: 200 }
    ],
    tokenContract: 'So11111111111111111111111111111111111111112', // Default to SOL
    minTokenBalance: 1000000,
    minNftHoldings: 1,
    socialVerification: {
      twitter: false,
      discord: false,
      telegram: false
    },
    startTime: '',
    endTime: ''
  });

  // Reveal configuration state
  const [revealConfig, setRevealConfig] = useState({
    revealType: 'instant', // 'instant' or 'delayed'
    delayedReveal: {
      criteria: 'time', // 'time', 'percentage', 'manual'
      timeDelay: 24, // hours
      percentageThreshold: 50, // percentage of collection sold
      manualTrigger: false
    },
    revealRules: {
      enforceWhitelistPhases: true,
      enforceBondingCurve: true,
      enforceTimeBasedAccess: true,
      enforceSocialVerification: true
    }
  });
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

  const loadSavedCollections = async () => {
    if (!publicKey) {
      console.log('❌ No wallet connected');
      return;
    }

    setLoadingCollections(true);
    console.log('🔄 Loading saved collections...');

    try {
      const response = await fetch(`/api/collections/load?wallet=${publicKey.toString()}`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ Loaded collections:', result.collections);
        setSavedCollections(result.collections || []);
        setShowCollectionLoader(true);
      } else {
        console.log('❌ Failed to load collections:', result.error);
      }
    } catch (error) {
      console.error('💥 Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const loadCollection = (collection: any) => {
    console.log('🔄 Loading collection:', collection);
    
    // Load collection config
    setCollectionConfig({
      name: collection.collection_name || '',
      symbol: collection.collection_symbol || '',
      description: collection.description || '',
      supply: collection.total_supply || 1000,
      mintPrice: collection.mint_price || 0.1,
      revealType: collection.reveal_type || 'instant',
      whitelistEnabled: collection.whitelist_enabled || false,
      bondingCurveEnabled: collection.bonding_curve_enabled || false
    });

    // Load layers if available
    if (collection.layers && Array.isArray(collection.layers)) {
      setLayers(collection.layers);
    }

    setShowCollectionLoader(false);
    setUploadMessage('✅ Collection loaded successfully!');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  const deleteCollection = async (collectionId: string) => {
    if (!publicKey) {
      console.log('❌ No wallet connected');
      return;
    }

    setDeletingCollection(collectionId);
    console.log('🔄 Deleting collection:', collectionId);

    try {
      const response = await fetch('/api/collections/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId,
          userWallet: publicKey.toString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Collection deleted successfully');
        // Remove from local state
        setSavedCollections(prev => prev.filter(c => c.id !== collectionId));
        setUploadMessage('✅ Collection deleted successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        console.log('❌ Failed to delete collection:', result.error);
        setUploadMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Error deleting collection:', error);
      setUploadMessage('❌ Failed to delete collection');
    } finally {
      setDeletingCollection(null);
    }
  };

  // Generate bonding curve data based on configuration and remaining supply
  const generateBondingCurveData = () => {
    const data = [];
    
    // Calculate total whitelist spots from enabled phases
    let totalWhitelistSpots = 0;
    if (collectionConfig.whitelistEnabled) {
      totalWhitelistSpots = whitelistConfig.phases
        .filter(phase => phase.enabled)
        .reduce((sum, phase) => sum + phase.spots, 0);
    }
    
    // Get the actual collection supply from collectionConfig
    const totalCollectionSupply = collectionConfig.supply || 1000;
    
    // The effective supply for bonding curve is total supply minus whitelist spots
    const effectiveSupply = Math.max(0, totalCollectionSupply - totalWhitelistSpots);
    
    if (effectiveSupply === 0) {
      return []; // No NFTs left for bonding curve
    }
    
    for (let i = 1; i <= effectiveSupply; i++) {
      // Calculate price using exponential growth formula
      const price = bondingCurveConfig.startingPrice * Math.pow(1 + (bondingCurveConfig.increaseRate / 100), i - 1);
      
      // Cap at max price
      const cappedPrice = Math.min(price, bondingCurveConfig.maxPrice);
      
      data.push({
        mint: i,
        price: cappedPrice,
        supply: i,
        totalSupply: effectiveSupply
      });
    }
    
    return data;
  };

  const generatePreview = async () => {
    if (layers.length === 0) {
      setUploadMessage('❌ No layers available for preview');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    setGeneratingPreview(true);
    console.log('🔄 Generating NFT preview...');

    try {
      // Create a canvas to combine layers
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size (you can adjust this)
      canvas.width = 512;
      canvas.height = 512;

      // Get visible layers sorted by order
      const visibleLayers = layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.order - b.order);

      if (visibleLayers.length === 0) {
        throw new Error('No visible layers to preview');
      }

      // Load and draw each layer
      for (const layer of visibleLayers) {
        if (layer.traits.length > 0) {
          // Pick a random trait from this layer for preview
          const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
          
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = randomTrait.image;
            });

            // Draw the image on canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          } catch (error) {
            console.warn(`Could not load image for layer ${layer.name}:`, error);
          }
        }
      }

      // Convert canvas to data URL
      const previewDataUrl = canvas.toDataURL('image/png');
      setPreviewImage(previewDataUrl);
      
      console.log('✅ Preview generated successfully');
      setUploadMessage('✅ NFT preview generated!');
      setTimeout(() => setUploadMessage(''), 3000);

    } catch (error) {
      console.error('❌ Error generating preview:', error);
      setUploadMessage('❌ Failed to generate preview');
      setTimeout(() => setUploadMessage(''), 3000);
    } finally {
      setGeneratingPreview(false);
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

            {/* Load Saved Collections Section */}
            <div className="mt-8 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-white mb-3">Or Load a Saved Collection</h4>
                <p className="text-white/70 mb-4">Continue working on a previously saved collection</p>
                <button
                  onClick={loadSavedCollections}
                  disabled={loadingCollections}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCollections ? 'Loading...' : '📂 Load Saved Collections'}
                </button>
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
            
            {/* Load Saved Collections Section */}
            <div className="mt-8 p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-white mb-3">Or Load a Saved Collection</h4>
                <p className="text-white/70 mb-4">Continue working on a previously saved collection</p>
                <button
                  onClick={loadSavedCollections}
                  disabled={loadingCollections}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCollections ? 'Loading...' : '📂 Load Saved Collections'}
                </button>
              </div>
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
              <h3 className="text-2xl font-bold text-white mb-2">Configure Layers & Rarity</h3>
              <p className="text-gray-300">Set up your layers, adjust trait rarity, and position layers correctly.</p>
            </div>
            
            <AdvancedLayerManager
              layers={layers}
              onUpdateTrait={updateTrait}
              onToggleVisibility={toggleLayerVisibility}
              onReorderLayer={reorderLayer}
              onDeleteTrait={deleteTrait}
              collectionSupply={collectionConfig.supply}
              onGeneratePreview={generatePreview}
              previewImage={previewImage}
              generatingPreview={generatingPreview}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Reveal Settings</h3>
              <p className="text-white/80 text-lg">Choose how your NFTs will be revealed to users.</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Reveal Type Selection */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h4 className="text-lg font-semibold text-white mb-4">Reveal Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      revealConfig.revealType === 'instant' 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                    onClick={() => setRevealConfig(prev => ({ ...prev, revealType: 'instant' }))}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="revealType"
                        value="instant"
                        checked={revealConfig.revealType === 'instant'}
                        onChange={() => setRevealConfig(prev => ({ ...prev, revealType: 'instant' }))}
                        className="w-4 h-4 text-green-600"
                      />
                      <div>
                        <h5 className="text-white font-medium">Instant Reveal</h5>
                        <p className="text-gray-400 text-sm">NFTs are revealed immediately upon mint</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      revealConfig.revealType === 'delayed' 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
                    }`}
                    onClick={() => setRevealConfig(prev => ({ ...prev, revealType: 'delayed' }))}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="revealType"
                        value="delayed"
                        checked={revealConfig.revealType === 'delayed'}
                        onChange={() => setRevealConfig(prev => ({ ...prev, revealType: 'delayed' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <h5 className="text-white font-medium">Delayed Reveal</h5>
                        <p className="text-gray-400 text-sm">NFTs are revealed based on criteria</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delayed Reveal Configuration */}
              {revealConfig.revealType === 'delayed' && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Delayed Reveal Criteria</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Reveal Trigger</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="revealCriteria"
                          value="time"
                          checked={revealConfig.delayedReveal.criteria === 'time'}
                          onChange={(e) => setRevealConfig(prev => ({ 
                            ...prev, 
                            delayedReveal: { ...prev.delayedReveal, criteria: e.target.value as 'time' | 'percentage' | 'manual' }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-white">Time-based (after X hours)</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="revealCriteria"
                          value="percentage"
                          checked={revealConfig.delayedReveal.criteria === 'percentage'}
                          onChange={(e) => setRevealConfig(prev => ({ 
                            ...prev, 
                            delayedReveal: { ...prev.delayedReveal, criteria: e.target.value as 'time' | 'percentage' | 'manual' }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-white">Percentage-based (after X% sold)</span>
                      </label>
                      
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="revealCriteria"
                          value="manual"
                          checked={revealConfig.delayedReveal.criteria === 'manual'}
                          onChange={(e) => setRevealConfig(prev => ({ 
                            ...prev, 
                            delayedReveal: { ...prev.delayedReveal, criteria: e.target.value as 'time' | 'percentage' | 'manual' }
                          }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-white">Manual trigger (admin controlled)</span>
                      </label>
                    </div>
                  </div>

                  {/* Time-based Configuration */}
                  {revealConfig.delayedReveal.criteria === 'time' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Delay Time (hours)</label>
                      <input
                        type="number"
                        value={revealConfig.delayedReveal.timeDelay}
                        onChange={(e) => setRevealConfig(prev => ({ 
                          ...prev, 
                          delayedReveal: { ...prev.delayedReveal, timeDelay: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="24"
                      />
                    </div>
                  )}

                  {/* Percentage-based Configuration */}
                  {revealConfig.delayedReveal.criteria === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Reveal Threshold (%)</label>
                      <input
                        type="number"
                        value={revealConfig.delayedReveal.percentageThreshold}
                        onChange={(e) => setRevealConfig(prev => ({ 
                          ...prev, 
                          delayedReveal: { ...prev.delayedReveal, percentageThreshold: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="50"
                      />
                      <p className="text-xs text-gray-400 mt-1">NFTs will be revealed when this percentage of the collection is sold</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rule Enforcement Settings */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 space-y-4">
                <h4 className="text-lg font-semibold text-white mb-4">Launch Rule Enforcement</h4>
                <p className="text-gray-400 text-sm mb-4">Configure which rules will be enforced during the launch:</p>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={revealConfig.revealRules.enforceWhitelistPhases}
                      onChange={(e) => setRevealConfig(prev => ({ 
                        ...prev, 
                        revealRules: { ...prev.revealRules, enforceWhitelistPhases: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Enforce Whitelist Phases</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={revealConfig.revealRules.enforceBondingCurve}
                      onChange={(e) => setRevealConfig(prev => ({ 
                        ...prev, 
                        revealRules: { ...prev.revealRules, enforceBondingCurve: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Enforce Bonding Curve Pricing</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={revealConfig.revealRules.enforceTimeBasedAccess}
                      onChange={(e) => setRevealConfig(prev => ({ 
                        ...prev, 
                        revealRules: { ...prev.revealRules, enforceTimeBasedAccess: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Enforce Time-based Access</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={revealConfig.revealRules.enforceSocialVerification}
                      onChange={(e) => setRevealConfig(prev => ({ 
                        ...prev, 
                        revealRules: { ...prev.revealRules, enforceSocialVerification: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-white">Enforce Social Verification</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Whitelist Settings</h3>
              <p className="text-white/80 text-lg">Configure whitelist phases for your collection.</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Whitelist Toggle */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionConfig.whitelistEnabled}
                    onChange={(e) => setCollectionConfig(prev => ({ ...prev, whitelistEnabled: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-3 text-lg font-medium text-white">Enable Whitelist</span>
                </label>
              </div>
              
              {collectionConfig.whitelistEnabled && (
                <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <h4 className="text-xl font-semibold text-blue-300">Whitelist Configuration</h4>
                  </div>
                  <p className="text-blue-200 mb-4">
                    Whitelist settings will be configured in the next step. This will allow you to:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Set token gate requirements (e.g., 1M+ ANAL tokens)</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Configure free mints for whitelist holders</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Set additional mint pricing</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Define whitelist supply limits</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Whitelist Configuration */}
              {collectionConfig.whitelistEnabled && (
                <div className="space-y-6">
                  {/* Basic Whitelist Settings */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 space-y-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Basic Whitelist Settings</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Minimum ANAL Tokens
                        </label>
                        <input
                          type="number"
                          placeholder="1000000"
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Whitelist Supply
                        </label>
                        <input
                          type="number"
                          placeholder="100"
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Whitelist Price (ANAL)
                      </label>
                      <input
                        type="number"
                        placeholder="0.05"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">Special price for whitelist holders (0 = free)</p>
                    </div>
                  </div>

                  {/* Advanced Whitelist Structure */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 space-y-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Advanced Whitelist Structure</h4>
                    
                    {/* Whitelist Phases */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Whitelist Phases</label>
                      <div className="space-y-3">
                        {whitelistConfig.phases.map((phase, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-600">
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-blue-600" 
                                checked={phase.enabled}
                                onChange={(e) => {
                                  const newPhases = [...whitelistConfig.phases];
                                  newPhases[index].enabled = e.target.checked;
                                  setWhitelistConfig(prev => ({ ...prev, phases: newPhases }));
                                }}
                              />
                              <span className="text-white">Phase {index + 1}: {phase.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                value={phase.spots}
                                onChange={(e) => {
                                  const newPhases = [...whitelistConfig.phases];
                                  newPhases[index].spots = parseInt(e.target.value) || 0;
                                  setWhitelistConfig(prev => ({ ...prev, phases: newPhases }));
                                }}
                                className="w-16 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-white text-sm" 
                              />
                              <span className="text-gray-400 text-sm">spots</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Token Gate Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Token Gate Requirements</label>
                      
                      {/* Token Contract Selection */}
                      <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-1">Token Contract Address</label>
                        <input
                          type="text"
                          value={whitelistConfig.tokenContract}
                          onChange={(e) => setWhitelistConfig(prev => ({ ...prev, tokenContract: e.target.value }))}
                          placeholder="Enter token contract address (e.g., ANAL, SOL, or custom token)"
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white placeholder-gray-400 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Popular tokens: ANAL, SOL, USDC, or enter any SPL token contract
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum Token Balance</label>
                          <input
                            type="number"
                            value={whitelistConfig.minTokenBalance}
                            onChange={(e) => setWhitelistConfig(prev => ({ ...prev, minTokenBalance: parseInt(e.target.value) || 0 }))}
                            placeholder="1000000"
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white placeholder-gray-400 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Minimum NFT Holdings</label>
                          <input
                            type="number"
                            value={whitelistConfig.minNftHoldings}
                            onChange={(e) => setWhitelistConfig(prev => ({ ...prev, minNftHoldings: parseInt(e.target.value) || 0 }))}
                            placeholder="1"
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white placeholder-gray-400 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Verification */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Social Verification</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600"
                            checked={whitelistConfig.socialVerification.twitter}
                            onChange={(e) => setWhitelistConfig(prev => ({ 
                              ...prev, 
                              socialVerification: { ...prev.socialVerification, twitter: e.target.checked }
                            }))}
                          />
                          <span className="text-white text-sm">Require Twitter/X verification</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600"
                            checked={whitelistConfig.socialVerification.discord}
                            onChange={(e) => setWhitelistConfig(prev => ({ 
                              ...prev, 
                              socialVerification: { ...prev.socialVerification, discord: e.target.checked }
                            }))}
                          />
                          <span className="text-white text-sm">Require Discord server membership</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600"
                            checked={whitelistConfig.socialVerification.telegram}
                            onChange={(e) => setWhitelistConfig(prev => ({ 
                              ...prev, 
                              socialVerification: { ...prev.socialVerification, telegram: e.target.checked }
                            }))}
                          />
                          <span className="text-white text-sm">Require Telegram group membership</span>
                        </label>
                      </div>
                    </div>

                    {/* Time-based Access */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Time-based Access</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Whitelist Start Time</label>
                          <input
                            type="datetime-local"
                            value={whitelistConfig.startTime}
                            onChange={(e) => setWhitelistConfig(prev => ({ ...prev, startTime: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Whitelist End Time</label>
                          <input
                            type="datetime-local"
                            value={whitelistConfig.endTime}
                            onChange={(e) => setWhitelistConfig(prev => ({ ...prev, endTime: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Whitelist Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Custom Whitelist</label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                        <p className="text-gray-400 text-sm mb-2">Upload CSV file with wallet addresses</p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                          Choose File
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Format: wallet_address,phase,tier</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">Bonding Curve</h3>
              <p className="text-white/80 text-lg">Configure dynamic pricing for your collection.</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Bonding Curve Toggle */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectionConfig.bondingCurveEnabled}
                    onChange={(e) => setCollectionConfig(prev => ({ ...prev, bondingCurveEnabled: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-3 text-lg font-medium text-white">Enable Bonding Curve Pricing</span>
                </label>
              </div>
              
              {collectionConfig.bondingCurveEnabled && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <h4 className="text-xl font-semibold text-green-300">Bonding Curve Benefits</h4>
                  </div>
                  <p className="text-green-200 mb-4">
                    Bonding curve pricing will automatically adjust based on supply:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-green-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Lower prices when supply is high</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Higher prices as supply decreases</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Creates urgency and FOMO</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Maximizes revenue potential</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bonding Curve Configuration with Interactive Chart */}
              {collectionConfig.bondingCurveEnabled && (
                <div className="space-y-6">
                  {/* Pricing Configuration */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 space-y-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Pricing Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Starting Price (ANAL)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.1"
                          value={bondingCurveConfig.startingPrice}
                          onChange={(e) => setBondingCurveConfig(prev => ({ ...prev, startingPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Price (ANAL)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="1.0"
                          value={bondingCurveConfig.maxPrice}
                          onChange={(e) => setBondingCurveConfig(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price Increase Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="5"
                        value={bondingCurveConfig.increaseRate}
                        onChange={(e) => setBondingCurveConfig(prev => ({ ...prev, increaseRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">Percentage increase per mint</p>
                    </div>
                  </div>

                  {/* Interactive Bonding Curve Chart */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Bonding Curve Visualization</h4>
                    
                    <div className="space-y-4">
                      {/* Chart Container */}
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="h-64 flex items-end justify-between gap-1" id="bonding-curve-chart">
                          {generateBondingCurveData().map((point, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center group cursor-pointer"
                              style={{ flex: '1' }}
                            >
                              <div
                                className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t transition-all duration-300 hover:from-blue-500 hover:to-purple-400"
                                style={{ height: `${(point.price / Math.max(...generateBondingCurveData().map(p => p.price))) * 200}px` }}
                                title={`Mint ${index + 1}: ${point.price.toFixed(4)} ANAL`}
                              />
                              {index % 10 === 0 && (
                                <div className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-left">
                                  {index + 1}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Chart Labels */}
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>Mint #1</span>
                          <span>Supply</span>
                          <span>Mint #{generateBondingCurveData().length}</span>
                        </div>
                      </div>

                      {/* Price Range Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                          <div className="text-blue-300 text-sm font-medium">Starting Price</div>
                          <div className="text-white text-lg font-bold">{bondingCurveConfig.startingPrice.toFixed(4)} ANAL</div>
                        </div>
                        
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                          <div className="text-purple-300 text-sm font-medium">Current Price (50% sold)</div>
                          <div className="text-white text-lg font-bold">
                            {generateBondingCurveData()[Math.floor(generateBondingCurveData().length / 2)]?.price.toFixed(4) || '0.0000'} ANAL
                          </div>
                        </div>
                        
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                          <div className="text-green-300 text-sm font-medium">Max Price</div>
                          <div className="text-white text-lg font-bold">{bondingCurveConfig.maxPrice.toFixed(4)} ANAL</div>
                        </div>
                      </div>

                      {/* Revenue Projection */}
                      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4">
                        <h5 className="text-yellow-300 font-medium mb-2">Revenue Projection</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Total Supply:</span>
                            <span className="text-white ml-2">1,000 NFTs</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Projected Revenue:</span>
                            <span className="text-white ml-2">
                              {generateBondingCurveData().reduce((sum, point) => sum + point.price, 0).toFixed(2)} ANAL
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Review & Deploy</h3>
              <p className="text-gray-300">Review your collection configuration before deploying.</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 space-y-4 border border-gray-600">
              <h4 className="font-medium text-white">Collection Summary</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Name:</span>
                  <span className="font-medium ml-2 text-white">{collectionConfig.name}</span>
                </div>
                <div>
                  <span className="text-gray-300">Symbol:</span>
                  <span className="font-medium ml-2 text-white">{collectionConfig.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-300">Supply:</span>
                  <span className="font-medium ml-2">{collectionConfig.supply}</span>
                </div>
                <div>
                  <span className="text-gray-300">Mint Price:</span>
                  <span className="font-medium ml-2">{collectionConfig.mintPrice} SOL</span>
                </div>
                <div>
                  <span className="text-gray-300">Layers:</span>
                  <span className="font-medium ml-2">{layers.length}</span>
                </div>
                <div>
                  <span className="text-gray-300">Total Traits:</span>
                  <span className="font-medium ml-2">
                    {layers.reduce((sum, layer) => sum + layer.traits.length, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-300">Reveal Type:</span>
                  <span className="font-medium ml-2 capitalize">{collectionConfig.revealType}</span>
                </div>
                <div>
                  <span className="text-gray-300">Whitelist:</span>
                  <span className="font-medium ml-2">{collectionConfig.whitelistEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div>
                  <span className="text-gray-300">Bonding Curve:</span>
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
              <h3 className="text-2xl font-bold text-white mb-2">Deploy Collection</h3>
              <p className="text-gray-300">Deploy your collection to the blockchain.</p>
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
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-700/50 dark:border-gray-600/50 px-8 py-6 relative overflow-hidden">
          {/* Logo Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Analos NFT Launcher</h2>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={onCancel}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Step Progress Bar */}
          <div className="flex items-center justify-between relative z-10">
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
          <div className="bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 dark:border-gray-600/50">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-700/50 dark:border-gray-600/50 px-8 py-6">
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

      {/* Collection Loader Modal */}
      {showCollectionLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Your Saved Collections</h3>
                <button
                  onClick={() => setShowCollectionLoader(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-800">
              {savedCollections.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">No Saved Collections</h4>
                  <p className="text-gray-300">You haven't saved any collections yet. Create and save your first collection to see it here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedCollections.map((collection, index) => (
                    <div key={collection.id || index} className="border border-gray-600 bg-gray-800/50 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{collection.collection_name || 'Unnamed Collection'}</h4>
                          <p className="text-sm text-gray-300">Symbol: {collection.collection_symbol || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {new Date(collection.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {collection.description || 'No description provided'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                        <div>Supply: {collection.total_supply || 'N/A'}</div>
                        <div>Type: {collection.bonding_curve_enabled ? 'Bonding Curve' : 'Standard'}</div>
                        <div>Reveal: {collection.reveal_type || 'Instant'}</div>
                        <div>Layers: {collection.layers?.length || 0}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadCollection(collection)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                        >
                          Load Collection
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${collection.collection_name || 'this collection'}"? This action cannot be undone.`)) {
                              deleteCollection(collection.id);
                            }
                          }}
                          disabled={deletingCollection === collection.id}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                        >
                          {deletingCollection === collection.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
