'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { nftGeneratorService, Layer, GenerationConfig, GenerationProgress, GenerationResult } from '@/lib/nft-generator-service';
import { pricingService, PricingTier } from '@/lib/pricing-service';


interface NFTGeneratorProps {
  onGenerationComplete?: (result: any) => void;
}

export default function NFTGenerator({ onGenerationComplete }: NFTGeneratorProps) {
  const { publicKey, connected } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string>('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [config, setConfig] = useState<GenerationConfig>({
    order: [],
    rarity: {},
    supply: 1000,
    collection: {
      name: '',
      symbol: '',
      description: '',
      royalties: 5
    }
  });
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadType, setUploadType] = useState<'zip' | 'folder'>('zip');
  const [selectedPricingTier, setSelectedPricingTier] = useState<PricingTier | null>(null);
  const [showPricingSelection, setShowPricingSelection] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);

  // Load pricing tiers with real-time market data
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const tiers = await pricingService.getArtGeneratorPricing();
        setPricingTiers(tiers);
        
        const marketSummary = await pricingService.getMarketSummary();
        setMarketData(marketSummary);
      } catch (error) {
        console.error('Error loading pricing:', error);
      }
    };
    
    loadPricing();
  }, []);

  // Calculate pricing for current configuration
  useEffect(() => {
    const calculatePricing = async () => {
      if (!selectedPricingTier || !config.supply) return null;
      
      try {
        const result = await pricingService.calculateGenerationCost(config.supply, selectedPricingTier.name);
        setPricing(result);
      } catch (error) {
        console.error('Error calculating pricing:', error);
      }
    };

    calculatePricing();
  }, [selectedPricingTier, config.supply]);

  // Step 1: Upload ZIP file or folder with layers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');

    try {
      let result;
      
      if (uploadType === 'zip') {
        const zipFile = files[0];
        if (!zipFile.name.endsWith('.zip')) {
          setError('Please upload a ZIP file containing your trait folders');
          return;
        }
        result = await nftGeneratorService.uploadLayers(zipFile);
      } else {
        // Handle folder upload
        result = await nftGeneratorService.uploadFolder(files);
      }
      
      setSessionId(result.sessionId);
      setLayers(result.layers);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  // Step 2: Configure generation settings
  const handleConfigSubmit = async () => {
    if (!config.collection.name || !config.collection.symbol) {
      setError('Collection name and symbol are required');
      return;
    }

    if (config.order.length === 0) {
      setError('Please select at least one layer');
      return;
    }

    setError('');
    try {
      // Validate configuration
      const validation = nftGeneratorService.validateConfig(config, layers);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return;
      }

      await nftGeneratorService.saveConfig(sessionId, config);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
    }
  };

  // Step 3: Generate NFTs
  const handleGenerateNFTs = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet to generate NFTs');
      return;
    }

    if (!selectedPricingTier) {
      setError('Please select a pricing tier');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Include pricing information in the generation request
      const generationRequest = {
        pricing: {
          tier: selectedPricingTier.name,
          pricePerToken: selectedPricingTier.pricePerToken,
          totalCost: pricing?.totalLOS || 0,
          totalCostUSD: pricing?.totalUSD || 0
        }
      };

      // Start generation
      await nftGeneratorService.generateNFTs(sessionId, generationRequest);
      
      // Start polling for progress
      pollProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setIsGenerating(false);
    }
  };

  // Poll for generation progress
  const pollProgress = async () => {
    const pollInterval = setInterval(async () => {
      try {
        const progressData = await nftGeneratorService.getProgress(sessionId);
        setProgress(progressData);
        
        if (progressData.status === 'completed' || progressData.status === 'error') {
          clearInterval(pollInterval);
          setIsGenerating(false);
          
          if (progressData.status === 'completed') {
            setCurrentStep(4);
            if (onGenerationComplete) {
              const result = await nftGeneratorService.getGenerationResult(sessionId);
              onGenerationComplete(result);
            }
          } else {
            setError(progressData.error || 'Generation failed');
          }
        }
      } catch (err) {
        console.error('Progress polling error:', err);
      }
    }, 2000);
  };

  // Update layer order
  const updateLayerOrder = (layerName: string, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        order: [...prev.order, layerName],
        rarity: {
          ...prev.rarity,
          [layerName]: {}
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        order: prev.order.filter(name => name !== layerName),
        rarity: Object.fromEntries(
          Object.entries(prev.rarity).filter(([name]) => name !== layerName)
        )
      }));
    }
  };

  // Update rarity weights
  const updateRarityWeight = (layerName: string, traitName: string, weight: number) => {
    setConfig(prev => ({
      ...prev,
      rarity: {
        ...prev.rarity,
        [layerName]: {
          ...prev.rarity[layerName],
          [traitName]: weight
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎨 NFT Generator
          </h1>
          <p className="text-gray-300 text-lg">
            Create generative NFT collections with custom traits and rarity
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= step 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                    : 'bg-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: Upload Layers */}
        {currentStep === 1 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              📁 Upload Trait Layers
            </h2>
            
            {/* Upload Type Selection */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/5 rounded-xl p-1 flex">
                <button
                  onClick={() => setUploadType('zip')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    uploadType === 'zip'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  📦 ZIP File
                </button>
                <button
                  onClick={() => setUploadType('folder')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    uploadType === 'folder'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  📂 Folder
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <div className="border-2 border-dashed border-white/30 rounded-2xl p-12 mb-6">
                <div className="text-6xl mb-4">
                  {uploadType === 'zip' ? '📦' : '📂'}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {uploadType === 'zip' ? 'Upload ZIP File' : 'Upload Folder'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {uploadType === 'zip' 
                    ? 'Upload a ZIP file containing organized trait folders'
                    : 'Select a folder containing organized trait subfolders'
                  }
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadType === 'zip' ? '.zip' : 'image/*,.png,.jpg,.jpeg,.gif,.webp'}
                  webkitdirectory={uploadType === 'folder'}
                  directory={uploadType === 'folder'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  {uploadType === 'zip' ? 'Choose ZIP File' : 'Choose Folder'}
                </button>
              </div>

              <div className="text-left bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  📋 {uploadType === 'zip' ? 'ZIP' : 'Folder'} Structure Guide
                </h4>
                <div className="text-gray-300 space-y-2">
                  <p>
                    {uploadType === 'zip' 
                      ? 'Your ZIP file should contain folders for each trait layer:'
                      : 'Your folder should contain subfolders for each trait layer:'
                    }
                  </p>
                  <pre className="bg-black/20 p-3 rounded text-sm overflow-x-auto">
{uploadType === 'zip' 
? `layers.zip
├── Backgrounds/
│   ├── blue.png
│   ├── red.png
│   └── green.png
├── Eyes/
│   ├── normal.png
│   ├── laser.png
│   └── glowing.png
└── Hats/
    ├── none.png
    ├── cap.png
    └── crown.png`
: `MyCollection/
├── Backgrounds/
│   ├── blue.png
│   ├── red.png
│   └── green.png
├── Eyes/
│   ├── normal.png
│   ├── laser.png
│   └── glowing.png
└── Hats/
    ├── none.png
    ├── cap.png
    └── crown.png`}
                  </pre>
                  <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      💡 <strong>Tip:</strong> Each subfolder represents a trait layer. 
                      Place all your trait images inside the appropriate layer folder.
                    </p>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-200 text-sm mb-2">
                      🎨 <strong>Supported Formats:</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-green-200">PNG (with transparency)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-green-200">JPG/JPEG</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-green-200">GIF (including animated)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-green-200">WebP (modern format)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure Generation */}
        {currentStep === 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              ⚙️ Configure Generation
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Collection Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Collection Details</h3>
                
                {/* Pricing Selection */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white">💰 Select Pricing Plan</h4>
                    {marketData && (
                      <div className="text-sm text-gray-300">
                        <div>LOS: {marketData.losPrice}</div>
                        <div>LOL: {marketData.lolPrice}</div>
                        <div className="text-xs text-gray-400">Updated: {marketData.lastUpdated}</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {pricingTiers.map((tier) => (
                      <div
                        key={tier.name}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedPricingTier?.name === tier.name
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedPricingTier(tier)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="text-white font-semibold">{tier.name}</h5>
                              {tier.isPopular && (
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm mt-1">{tier.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">{tier.pricePerToken.toLocaleString()} $LOS</div>
                            <div className="text-gray-400 text-sm">${tier.pricePerTokenUSD} per NFT</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedPricingTier && pricing && (
                    <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Total Cost ({config.supply} NFTs):</span>
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-lg">
                            {pricing.totalLOS.toLocaleString()} $LOS
                          </div>
                          <div className="text-gray-300 text-sm">
                            ~${pricing.totalUSD.toFixed(2)} USD
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={config.collection.name}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      collection: { ...prev.collection, name: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter collection name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={config.collection.symbol}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      collection: { ...prev.collection, symbol: e.target.value.toUpperCase() }
                    }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., MONKES, PUNKS"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Description
                  </label>
                  <textarea
                    value={config.collection.description}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      collection: { ...prev.collection, description: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Describe your collection..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Total Supply
                    </label>
                    <input
                      type="number"
                      value={config.supply}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        supply: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Royalties (%)
                    </label>
                    <input
                      type="number"
                      value={config.collection.royalties}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        collection: { ...prev.collection, royalties: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="25"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Layer Configuration */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Layer Configuration</h3>
                
                <div className="space-y-4">
                  {layers.map((layer) => (
                    <div key={layer.name} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          checked={config.order.includes(layer.name)}
                          onChange={(e) => updateLayerOrder(layer.name, e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                        />
                        <label className="ml-3 text-white font-medium">
                          {layer.name} ({layer.traits.length} traits)
                        </label>
                      </div>

                      {config.order.includes(layer.name) && (
                        <div className="ml-7 space-y-2">
                          {layer.traits.map((trait) => (
                            <div key={trait} className="flex items-center justify-between">
                              <span className="text-gray-300 text-sm">{trait}</span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={config.rarity[layer.name]?.[trait] || 0}
                                  onChange={(e) => updateRarityWeight(layer.name, trait, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-gray-400 text-sm">%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfigSubmit}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Generation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate NFTs */}
        {currentStep === 3 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              🚀 Generate NFTs
            </h2>

            <div className="text-center">
              <div className="mb-8">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Generate
                </h3>
                <p className="text-gray-300 mb-6">
                  Generate {config.supply} unique NFTs with your configured traits and rarity
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-semibold text-white mb-4">Generation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <span className="text-gray-300">Collection:</span>
                    <span className="text-white ml-2">{config.collection.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Symbol:</span>
                    <span className="text-white ml-2">{config.collection.symbol}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Supply:</span>
                    <span className="text-white ml-2">{config.supply}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Layers:</span>
                    <span className="text-white ml-2">{config.order.length}</span>
                  </div>
                </div>
              </div>

              {!connected && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-200">
                    ⚠️ Please connect your wallet to generate NFTs
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerateNFTs}
                disabled={!connected || isGenerating}
                className={`px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-200 transform ${
                  connected && !isGenerating
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating...
                  </div>
                ) : (
                  '🚀 Start Generation'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generation Progress */}
        {currentStep === 4 && progress && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              📊 Generation Progress
            </h2>

            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-white mb-2">
                  <span>Progress</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-300">Status:</span>
                    <span className="text-white ml-2 capitalize">{progress.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Progress:</span>
                    <span className="text-white ml-2">{progress.current}/{progress.total}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-300">Message:</span>
                  <span className="text-white ml-2">{progress.message}</span>
                </div>
              </div>

              {progress.status === 'completed' && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-200 mb-4">
                    🎉 Generation Complete!
                  </h3>
                  <p className="text-green-200">
                    Your NFT collection has been generated successfully. You can now deploy it to the blockchain.
                  </p>
                </div>
              )}

              {progress.status === 'error' && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-red-200 mb-4">
                    ❌ Generation Failed
                  </h3>
                  <p className="text-red-200">{progress.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
