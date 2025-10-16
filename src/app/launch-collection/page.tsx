'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';
import AdvancedNFTWizard from '@/components/AdvancedNFTWizard';
import AdvancedWhitelistConfig from '@/components/AdvancedWhitelistConfig';

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  mintPriceUSD: number;
  creatorAddress: string;
  isWhitelistOnly: boolean;
  revealType: 'instant' | 'delayed';
  revealDate?: string;
  advancedWhitelist?: {
    enabled: boolean;
    phases: Array<{
      id: string;
      name: string;
      description: string;
      startDate: string;
      endDate: string;
      maxMintsPerWallet: number;
      maxTotalMints: number;
      price: number;
      priceMultiplier: number;
      phaseType: 'address' | 'token' | 'social' | 'mixed';
      tokenRequirements: Array<{
        tokenMint: string;
        tokenSymbol: string;
        minBalance: number;
        decimals: number;
      }>;
      socialRequirements: {
        twitter?: boolean;
        discord?: boolean;
        telegram?: boolean;
        instagram?: boolean;
        minFollowers?: number;
        verifiedAccount?: boolean;
      };
      addressWhitelist: string[];
      isActive: boolean;
    }>;
  };
}

export default function LaunchCollectionPage() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 1000,
    mintPriceUSD: 10,
    creatorAddress: publicKey?.toString() || '',
    isWhitelistOnly: false,
    revealType: 'instant',
    revealDate: '',
  });

  // Update creator address when wallet connects
  useEffect(() => {
    if (publicKey) {
      setCollectionConfig(prev => ({ ...prev, creatorAddress: publicKey.toString() }));
    }
  }, [publicKey]);

  const handleInputChange = (field: keyof CollectionConfig, value: string | number | boolean) => {
    setCollectionConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleWizardComplete = (wizardConfig: any) => {
    setCollectionConfig({
      name: wizardConfig.name,
      symbol: wizardConfig.symbol,
      description: wizardConfig.description,
      maxSupply: wizardConfig.supply,
      mintPriceUSD: wizardConfig.mintPrice,
      creatorAddress: publicKey?.toString() || '',
      isWhitelistOnly: wizardConfig.whitelistEnabled,
      revealType: wizardConfig.revealType,
      revealDate: wizardConfig.revealDate,
    });
    setShowWizard(false);
    
    // Store advanced configuration including layers and traits
    console.log('Advanced wizard completed with config:', {
      ...wizardConfig,
      layers: wizardConfig.layers,
      totalTraits: wizardConfig.layers?.reduce((sum: number, layer: any) => sum + layer.traits.length, 0) || 0,
      bondingCurveEnabled: wizardConfig.bondingCurveEnabled
    });
    
    // You can now use this data to deploy to your NFT_LAUNCHPAD_CORE program
    alert(`Collection configured successfully!\n\nName: ${wizardConfig.name}\nSymbol: ${wizardConfig.symbol}\nSupply: ${wizardConfig.supply}\nLayers: ${wizardConfig.layers?.length || 0}\nTotal Traits: ${wizardConfig.layers?.reduce((sum: number, layer: any) => sum + layer.traits.length, 0) || 0}\n\nReady to deploy to your existing NFT Launchpad!`);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const validateForm = (): string | null => {
    if (!connected) return 'Please connect your wallet first';
    if (!collectionConfig.name.trim()) return 'Collection name is required';
    if (!collectionConfig.symbol.trim()) return 'Collection symbol is required';
    if (collectionConfig.symbol.length > 10) return 'Symbol must be 10 characters or less';
    if (!collectionConfig.description.trim()) return 'Description is required';
    if (collectionConfig.maxSupply < 1 || collectionConfig.maxSupply > 10000) return 'Max supply must be between 1 and 10,000';
    if (collectionConfig.mintPriceUSD < 0.01) return 'Mint price must be at least $0.01';
    if (collectionConfig.revealType === 'delayed' && !collectionConfig.revealDate) return 'Reveal date is required for delayed reveal';
    return null;
  };

  const handleLaunchCollection = async () => {
    const validationError = validateForm();
    if (validationError) {
      setResult({ success: false, message: validationError });
      return;
    }

    if (!connected || !publicKey || !signTransaction) {
      setResult({ success: false, message: 'Wallet not connected or missing signing capability' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // TODO: Implement actual smart contract integration
      // This would call your NFT_LAUNCHPAD program's initialize_collection instruction
      
      console.log('🚀 Launching collection with config:', collectionConfig);
      console.log('📋 Program ID:', ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString());
      console.log('🔗 Explorer:', ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD);

      // Simulate transaction for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResult({
        success: true,
        message: 'Collection launched successfully! (Demo mode - actual smart contract integration pending)',
        signature: 'DemoSignature123456789'
      });

    } catch (error: any) {
      console.error('❌ Error launching collection:', error);
      setResult({
        success: false,
        message: `Failed to launch collection: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Show wizard if requested
  if (showWizard) {
    return <AdvancedNFTWizard onComplete={handleWizardComplete} onCancel={handleWizardCancel} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🚀 Launch Your NFT Collection
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Deploy your collection on the Analos blockchain with our enterprise-grade NFT launchpad
          </p>
        </div>

        {/* Wizard Option */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🎨 Advanced NFT Collection Wizard</h2>
            <p className="text-gray-300 mb-6">
              Create your NFT collection with advanced features: trait layers, rarity controls, bonding curves, and whitelist management
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>🎨</span>
                <span>Start Advanced Wizard</span>
              </div>
            </button>
            <p className="text-gray-400 text-sm mt-4">
              Or continue with manual configuration below
            </p>
          </div>
        </div>

        {/* Program Information */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🔗 Smart Contract Integration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">NFT Launchpad Program</h3>
              <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
                {ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString()}
              </div>
              <a
                href={ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-purple-400 hover:text-purple-300 text-sm"
              >
                View on Explorer →
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Supported Programs</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Price Oracle:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Rarity Oracle:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Launch:</span>
                  <span className="text-green-400">✓ Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Configuration Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Collection Configuration</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={collectionConfig.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Awesome Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={collectionConfig.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="MAC"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={collectionConfig.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your collection..."
                />
              </div>
            </div>

            {/* Collection Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Collection Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Supply *
                </label>
                <input
                  type="number"
                  value={collectionConfig.maxSupply}
                  onChange={(e) => handleInputChange('maxSupply', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mint Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={collectionConfig.mintPriceUSD}
                  onChange={(e) => handleInputChange('mintPriceUSD', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Creator Address *
                </label>
                <input
                  type="text"
                  value={collectionConfig.creatorAddress}
                  onChange={(e) => handleInputChange('creatorAddress', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your wallet address"
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={collectionConfig.isWhitelistOnly}
                    onChange={(e) => handleInputChange('isWhitelistOnly', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-300">Whitelist Only</span>
                </label>
                <p className="text-sm text-gray-400 mt-1">Only whitelisted addresses can mint</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reveal Type
                </label>
                <select
                  value={collectionConfig.revealType}
                  onChange={(e) => handleInputChange('revealType', e.target.value as 'instant' | 'delayed')}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="instant">Instant Reveal</option>
                  <option value="delayed">Delayed Reveal</option>
                </select>
              </div>
            </div>

            {collectionConfig.revealType === 'delayed' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reveal Date
                </label>
                <input
                  type="datetime-local"
                  value={collectionConfig.revealDate}
                  onChange={(e) => handleInputChange('revealDate', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Advanced Whitelist Configuration */}
          {collectionConfig.isWhitelistOnly && (
            <div className="mt-8">
              <AdvancedWhitelistConfig
                onConfigChange={(config) => {
                  console.log('Advanced whitelist config:', config);
                  // Store the advanced whitelist configuration
                  setCollectionConfig(prev => ({
                    ...prev,
                    advancedWhitelist: config
                  }));
                }}
                initialConfig={collectionConfig.advancedWhitelist}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLaunchCollection}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Launching Collection...
                </div>
              ) : (
                '🚀 Launch Collection'
              )}
            </button>
            
            <button
              onClick={() => setCollectionConfig({
                name: '',
                symbol: '',
                description: '',
                maxSupply: 1000,
                mintPriceUSD: 10,
                creatorAddress: publicKey?.toString() || '',
                isWhitelistOnly: false,
                revealType: 'instant',
                revealDate: '',
              })}
              disabled={loading}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-lg font-semibold transition-all duration-200 border border-white/20"
            >
              Reset Form
            </button>
          </div>

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-900/20 border-green-500 text-green-300' 
                : 'bg-red-900/20 border-red-500 text-red-300'
            }`}>
              <div className="flex items-start">
                <span className="text-xl mr-3">{result.success ? '✅' : '❌'}</span>
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.signature && (
                    <div className="mt-2">
                      <p className="text-sm opacity-75">Transaction Signature:</p>
                      <code className="block mt-1 p-2 bg-black/20 rounded text-xs break-all">
                        {result.signature}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
