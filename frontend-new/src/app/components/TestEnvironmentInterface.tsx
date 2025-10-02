'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { testEnvironmentService, TestCollection, TestGenerationConfig, TestNFT } from '@/lib/test-environment-service';

interface TestEnvironmentInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployCollection?: (collectionData: any) => void;
}

export default function TestEnvironmentInterface({
  isOpen,
  onClose,
  onDeployCollection
}: TestEnvironmentInterfaceProps) {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'generate' | 'test' | 'deploy'>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Generation configuration
  const [generationConfig, setGenerationConfig] = useState<TestGenerationConfig>({
    collectionName: '',
    collectionSymbol: '',
    description: '',
    totalSupply: 100,
    layers: [],
    rarityConfig: {
      enableRarity: true,
      rarityMultipliers: {}
    },
    pricingConfig: {
      basePrice: 100,
      rarityPricing: true,
      tierPricing: true
    }
  });

  // Test collections and current collection
  const [testCollections, setTestCollections] = useState<TestCollection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<TestCollection | null>(null);
  const [selectedNFTs, setSelectedNFTs] = useState<TestNFT[]>([]);

  // Test trading
  const [testMintAmount, setTestMintAmount] = useState(1);
  const [testTradeAmount, setTestTradeAmount] = useState(1000);
  const [testWalletBalance, setTestWalletBalance] = useState({ los: 0, tokens: {} as Record<string, number> });

  useEffect(() => {
    if (isOpen) {
      loadTestCollections();
      updateTestWalletBalance();
    }
  }, [isOpen]);

  const loadTestCollections = () => {
    const collections = testEnvironmentService.getAllTestCollections();
    setTestCollections(collections);
    if (collections.length > 0 && !currentCollection) {
      setCurrentCollection(collections[0]);
    }
  };

  const updateTestWalletBalance = () => {
    const balance = testEnvironmentService.getTestWalletBalance();
    setTestWalletBalance(balance);
  };

  const handleGenerateCollection = async () => {
    if (!generationConfig.collectionName || !generationConfig.collectionSymbol || !generationConfig.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const collection = await testEnvironmentService.generateTestCollection(generationConfig);
      setTestCollections(prev => [...prev, collection]);
      setCurrentCollection(collection);
      setActiveTab('test');
      setSuccess('Collection generated successfully! You can now test all functionality.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate collection');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMint = async () => {
    if (!currentCollection) return;

    setLoading(true);
    setError('');

    try {
      const result = await testEnvironmentService.testMintNFT(currentCollection.id);
      
      if (result.success) {
        setSuccess(`Successfully minted ${result.nft.name}! Transaction: ${result.transactionHash}`);
        loadTestCollections();
        updateTestWalletBalance();
        
        // Update current collection
        const updatedCollection = testEnvironmentService.getTestCollection(currentCollection.id);
        if (updatedCollection) {
          setCurrentCollection(updatedCollection);
        }
      } else {
        setError(result.error || 'Mint failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBondingCurveTrade = async (isBuy: boolean) => {
    if (!currentCollection) return;

    setLoading(true);
    setError('');

    try {
      const result = await testEnvironmentService.testBondingCurveTrade(
        currentCollection.id,
        testTradeAmount,
        isBuy
      );
      
      if (result.success) {
        const action = isBuy ? 'bought' : 'sold';
        setSuccess(`Successfully ${action} ${result.nftsReceived || testTradeAmount} NFTs! Transaction: ${result.transactionHash}`);
        loadTestCollections();
        updateTestWalletBalance();
        
        // Update current collection
        const updatedCollection = testEnvironmentService.getTestCollection(currentCollection.id);
        if (updatedCollection) {
          setCurrentCollection(updatedCollection);
        }
      } else {
        setError(result.error || 'Trade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealCollection = async () => {
    if (!currentCollection) return;

    setLoading(true);
    setError('');

    try {
      const result = await testEnvironmentService.revealCollection(currentCollection.id);
      
      if (result.success) {
        setSuccess('Collection revealed successfully! Bridge trading is now available.');
        loadTestCollections();
        
        // Update current collection
        const updatedCollection = testEnvironmentService.getTestCollection(currentCollection.id);
        if (updatedCollection) {
          setCurrentCollection(updatedCollection);
        }
      } else {
        setError(result.error || 'Reveal failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reveal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeployCollection = async () => {
    if (!currentCollection) return;

    setLoading(true);
    setError('');

    try {
      const result = testEnvironmentService.exportTestCollection(currentCollection.id);
      
      if (result.success) {
        setSuccess('Collection exported successfully! Ready for deployment.');
        onDeployCollection?.(result.data);
        setActiveTab('deploy');
      } else {
        setError(result.error || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const addLayer = () => {
    setGenerationConfig(prev => ({
      ...prev,
      layers: [...prev.layers, {
        name: '',
        traits: [{ name: '', weight: 1, imageUrl: '' }]
      }]
    }));
  };

  const addTrait = (layerIndex: number) => {
    setGenerationConfig(prev => ({
      ...prev,
      layers: prev.layers.map((layer, index) => 
        index === layerIndex 
          ? { ...layer, traits: [...layer.traits, { name: '', weight: 1, imageUrl: '' }] }
          : layer
      )
    }));
  };

  const updateLayer = (layerIndex: number, field: string, value: string) => {
    setGenerationConfig(prev => ({
      ...prev,
      layers: prev.layers.map((layer, index) => 
        index === layerIndex 
          ? { ...layer, [field]: value }
          : layer
      )
    }));
  };

  const updateTrait = (layerIndex: number, traitIndex: number, field: string, value: string | number) => {
    setGenerationConfig(prev => ({
      ...prev,
      layers: prev.layers.map((layer, index) => 
        index === layerIndex 
          ? {
              ...layer,
              traits: layer.traits.map((trait, tIndex) => 
                tIndex === traitIndex 
                  ? { ...trait, [field]: value }
                  : trait
              )
            }
          : layer
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            🧪 Test Environment
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'generate', label: 'Generate', icon: '🎨' },
            { id: 'test', label: 'Test', icon: '🧪' },
            { id: 'deploy', label: 'Deploy', icon: '🚀' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Generate Test Collection</h3>
              <p className="text-gray-300">
                Create a test collection with real-time data and full functionality
              </p>
            </div>

            {/* Collection Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Collection Name *</label>
                  <input
                    type="text"
                    value={generationConfig.collectionName}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, collectionName: e.target.value }))}
                    placeholder="Enter collection name"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Symbol *</label>
                  <input
                    type="text"
                    value={generationConfig.collectionSymbol}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, collectionSymbol: e.target.value }))}
                    placeholder="e.g., MONKES, PUNKS"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Total Supply</label>
                  <input
                    type="number"
                    value={generationConfig.totalSupply}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, totalSupply: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Base Price ($LOS)</label>
                  <input
                    type="number"
                    value={generationConfig.pricingConfig.basePrice}
                    onChange={(e) => setGenerationConfig(prev => ({ 
                      ...prev, 
                      pricingConfig: { ...prev.pricingConfig, basePrice: parseInt(e.target.value) || 100 }
                    }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Description *</label>
                  <textarea
                    value={generationConfig.description}
                    onChange={(e) => setGenerationConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your collection"
                    rows={4}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={generationConfig.rarityConfig.enableRarity}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        rarityConfig: { ...prev.rarityConfig, enableRarity: e.target.checked }
                      }))}
                      className="w-5 h-5 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                    />
                    <span className="text-white">Enable Rarity System</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={generationConfig.pricingConfig.rarityPricing}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        pricingConfig: { ...prev.pricingConfig, rarityPricing: e.target.checked }
                      }))}
                      className="w-5 h-5 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                    />
                    <span className="text-white">Rarity-based Pricing</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Layers Configuration */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-bold text-lg">Trait Layers</h4>
                <button
                  onClick={addLayer}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  + Add Layer
                </button>
              </div>

              <div className="space-y-4">
                {generationConfig.layers.map((layer, layerIndex) => (
                  <div key={layerIndex} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-white font-medium mb-2">Layer Name</label>
                        <input
                          type="text"
                          value={layer.name}
                          onChange={(e) => updateLayer(layerIndex, 'name', e.target.value)}
                          placeholder="e.g., Background, Eyes, Mouth"
                          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => addTrait(layerIndex)}
                          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                        >
                          + Add Trait
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {layer.traits.map((trait, traitIndex) => (
                        <div key={traitIndex} className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-white font-medium mb-2">Trait Name</label>
                            <input
                              type="text"
                              value={trait.name}
                              onChange={(e) => updateTrait(layerIndex, traitIndex, 'name', e.target.value)}
                              placeholder="e.g., Blue, Red, Green"
                              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-medium mb-2">Weight (Rarity)</label>
                            <input
                              type="number"
                              value={trait.weight}
                              onChange={(e) => updateTrait(layerIndex, traitIndex, 'weight', parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-medium mb-2">Image URL</label>
                            <input
                              type="url"
                              value={trait.imageUrl}
                              onChange={(e) => updateTrait(layerIndex, traitIndex, 'imageUrl', e.target.value)}
                              placeholder="https://example.com/image.png"
                              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGenerateCollection}
                disabled={loading || !generationConfig.collectionName || !generationConfig.collectionSymbol || !generationConfig.description}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? 'Generating...' : 'Generate Test Collection'}
              </button>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && currentCollection && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Test Collection Functionality</h3>
              <p className="text-gray-300">
                Test all features with real-time data and simulated blockchain interactions
              </p>
            </div>

            {/* Collection Overview */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-gray-400 text-sm">Total Supply</div>
                <div className="text-white font-bold text-xl">{currentCollection.totalSupply}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-gray-400 text-sm">Generated</div>
                <div className="text-white font-bold text-xl">{currentCollection.stats.totalGenerated}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-gray-400 text-sm">Minted</div>
                <div className="text-white font-bold text-xl">{currentCollection.stats.totalMinted}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-gray-400 text-sm">Volume</div>
                <div className="text-white font-bold text-xl">{currentCollection.stats.totalVolume.toLocaleString()} $LOS</div>
              </div>
            </div>

            {/* Test Wallet Balance */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-xl p-6 mb-6">
              <h4 className="text-green-400 font-bold mb-4">Test Wallet Balance</h4>
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">$LOS</div>
                  <div className="text-white font-bold">{testWalletBalance.los.toLocaleString()}</div>
                </div>
                {Object.entries(testWalletBalance.tokens).map(([symbol, balance]) => (
                  <div key={symbol}>
                    <div className="text-gray-400 text-sm">{symbol}</div>
                    <div className="text-white font-bold">{balance.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mint Testing */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h4 className="text-white font-bold mb-4">🧪 Test Minting</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Amount to Mint</label>
                    <input
                      type="number"
                      value={testMintAmount}
                      onChange={(e) => setTestMintAmount(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={handleTestMint}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
                  >
                    {loading ? 'Minting...' : 'Test Mint NFT'}
                  </button>
                </div>
              </div>

              {/* Bonding Curve Testing */}
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h4 className="text-white font-bold mb-4">📈 Test Bonding Curve</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Trade Amount ($LOS)</label>
                    <input
                      type="number"
                      value={testTradeAmount}
                      onChange={(e) => setTestTradeAmount(parseInt(e.target.value) || 1000)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleTestBondingCurveTrade(true)}
                      disabled={loading}
                      className="py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleTestBondingCurveTrade(false)}
                      disabled={loading}
                      className="py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonding Curve Status */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6">
              <h4 className="text-purple-400 font-bold mb-4">Bonding Curve Status</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Current Price</div>
                  <div className="text-white font-bold">{currentCollection.bondingCurve.currentPrice.toFixed(2)} $LOS</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Total Raised</div>
                  <div className="text-white font-bold">{currentCollection.bondingCurve.totalRaised.toLocaleString()} $LOS</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Progress to Reveal</div>
                  <div className="text-white font-bold">{(currentCollection.bondingCurve.progressToReveal * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Status</div>
                  <div className={`font-bold ${currentCollection.bondingCurve.isRevealed ? 'text-green-400' : 'text-yellow-400'}`}>
                    {currentCollection.bondingCurve.isRevealed ? 'Revealed' : 'Active'}
                  </div>
                </div>
              </div>
              
              {!currentCollection.bondingCurve.isRevealed && (
                <div className="mt-4">
                  <button
                    onClick={handleRevealCollection}
                    disabled={loading || currentCollection.bondingCurve.totalRaised < 1000000}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
                  >
                    {loading ? 'Revealing...' : 'Reveal Collection (1M $LOS cap)'}
                  </button>
                </div>
              )}
            </div>

            {/* NFT Preview */}
            <div>
              <h4 className="text-white font-bold mb-4">Generated NFTs Preview</h4>
              <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {currentCollection.generatedNFTs.slice(0, 24).map((nft) => (
                  <div key={nft.id} className="bg-white/10 rounded-xl p-3 border border-white/20">
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <div className="text-white text-sm font-medium">#{nft.id}</div>
                    <div className={`text-xs ${
                      nft.rarity.tier === 'legendary' ? 'text-yellow-400' :
                      nft.rarity.tier === 'epic' ? 'text-purple-400' :
                      nft.rarity.tier === 'rare' ? 'text-blue-400' :
                      nft.rarity.tier === 'uncommon' ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                      {nft.rarity.tier.toUpperCase()}
                    </div>
                    <div className="text-gray-400 text-xs">{nft.price} $LOS</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && currentCollection && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Deploy Collection</h3>
              <p className="text-gray-300">
                Your collection has been tested and is ready for deployment
              </p>
            </div>

            {/* Deployment Summary */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-xl p-6">
              <h4 className="text-green-400 font-bold mb-4">✅ Deployment Ready</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-white font-semibold mb-2">Collection Details:</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Name: {currentCollection.name}</li>
                    <li>• Symbol: {currentCollection.symbol}</li>
                    <li>• Supply: {currentCollection.totalSupply}</li>
                    <li>• Generated: {currentCollection.stats.totalGenerated}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-2">Test Results:</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Minting: ✅ Tested</li>
                    <li>• Bonding Curve: ✅ Tested</li>
                    <li>• Rarity System: ✅ Working</li>
                    <li>• Pricing: ✅ Calculated</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setActiveTab('test')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
              >
                ← Back to Testing
              </button>
              <button
                onClick={handleDeployCollection}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'Exporting...' : 'Deploy Collection'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
