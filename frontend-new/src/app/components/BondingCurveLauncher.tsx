'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { bondingCurveService, BondingCurveCollection } from '@/lib/bonding-curve-service';
import { tierSystemService, BondingCurveTemplate, TierConfig } from '@/lib/tier-system-service';
import BondingCurveInterface from './BondingCurveInterface';
import NFTBridgeInterface from './NFTBridgeInterface';
import TierConfiguration from './TierConfiguration';
import SocialProfileManager from './SocialProfileManager';

interface BondingCurveLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchComplete?: (collection: BondingCurveCollection) => void;
}

export default function BondingCurveLauncher({
  isOpen,
  onClose,
  onLaunchComplete
}: BondingCurveLauncherProps) {
  const { publicKey, connected } = useWallet();
  const [currentStep, setCurrentStep] = useState<'template' | 'setup' | 'tiers' | 'trading' | 'bridge'>('template');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Template and configuration
  const [selectedTemplate, setSelectedTemplate] = useState<BondingCurveTemplate | null>(null);
  const [configuredTiers, setConfiguredTiers] = useState<TierConfig[]>([]);
  const [showTierConfig, setShowTierConfig] = useState(false);
  const [showSocialManager, setShowSocialManager] = useState(false);

  // Collection setup form
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionImageUrl, setCollectionImageUrl] = useState('');

  // Created collection
  const [createdCollection, setCreatedCollection] = useState<BondingCurveCollection | null>(null);
  const [userNFTBalance, setUserNFTBalance] = useState(0);

  const handleTemplateSelect = (template: BondingCurveTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('setup');
  };

  const handleSetupComplete = () => {
    if (selectedTemplate?.supportsTiers) {
      setCurrentStep('tiers');
    } else {
      handleLaunch();
    }
  };

  const handleTiersConfigured = (tiers: TierConfig[]) => {
    setConfiguredTiers(tiers);
    setShowTierConfig(false);
    handleLaunch();
  };

  const handleLaunch = async () => {
    if (!connected || !publicKey || !selectedTemplate) {
      setError('Please connect your wallet and select a template');
      return;
    }

    if (!collectionName || !collectionSymbol || !collectionDescription) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const collection = await bondingCurveService.createBondingCurveCollection({
        name: collectionName,
        symbol: collectionSymbol,
        description: collectionDescription,
        imageUrl: collectionImageUrl || 'https://picsum.photos/400/400?random=' + Date.now(),
        creator: publicKey.toString(),
        config: {
          virtualLOSReserves: selectedTemplate.virtualLOSReserves,
          virtualNFTSupply: selectedTemplate.virtualNFTSupply,
          bondingCap: selectedTemplate.bondingCap,
          feePercentage: selectedTemplate.feePercentage,
          creatorFeePercentage: selectedTemplate.creatorFeePercentage,
          platformFeePercentage: selectedTemplate.platformFeePercentage
        }
      });

      setCreatedCollection(collection);
      setCurrentStep('trading');
      onLaunchComplete?.(collection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch bonding curve');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeComplete = (tradeResult: any) => {
    // Update user balance based on trade result
    if (tradeResult.nftsReceived) {
      setUserNFTBalance(prev => prev + tradeResult.nftsReceived);
    } else if (tradeResult.nftAmount) {
      setUserNFTBalance(prev => prev - tradeResult.nftAmount);
    }
  };

  const handleBridgeComplete = (bridgeResult: any) => {
    // Update user balance after bridge trade
    if (bridgeResult.nftAmount) {
      setUserNFTBalance(prev => prev - bridgeResult.nftAmount);
    }
  };

  const resetLauncher = () => {
    setCurrentStep('template');
    setSelectedTemplate(null);
    setConfiguredTiers([]);
    setShowTierConfig(false);
    setShowSocialManager(false);
    setCollectionName('');
    setCollectionSymbol('');
    setCollectionDescription('');
    setCollectionImageUrl('');
    setCreatedCollection(null);
    setUserNFTBalance(0);
    setError('');
  };

  const handleClose = () => {
    resetLauncher();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            🚀 Bonding Curve Launcher
          </h2>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[
              { id: 'template', label: 'Template', icon: '🎯' },
              { id: 'setup', label: 'Setup', icon: '⚙️' },
              { id: 'tiers', label: 'Tiers', icon: '🏆' },
              { id: 'trading', label: 'Trading', icon: '💰' },
              { id: 'bridge', label: 'Bridge', icon: '🌉' }
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const stepOrder = ['template', 'setup', 'tiers', 'trading', 'bridge'];
              const currentIndex = stepOrder.indexOf(currentStep);
              const stepIndex = stepOrder.indexOf(step.id);
              const isCompleted = stepIndex < currentIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-white/20 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.icon} {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-4 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Template Selection */}
        {currentStep === 'template' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Bonding Curve Template</h3>
              <p className="text-gray-300">
                Select the perfect template based on your collection size and goals
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {tierSystemService.getBondingCurveTemplates().map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-6 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 cursor-pointer transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{template.name}</h4>
                      <p className="text-gray-300 text-sm">{template.recommendedFor}</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4">{template.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-gray-400 text-sm">Bonding Cap</div>
                      <div className="text-white font-semibold">{template.bondingCap.toLocaleString()} $LOS</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Max Tiers</div>
                      <div className="text-white font-semibold">{template.maxTiers}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Price Range</div>
                      <div className="text-white font-semibold">{template.minPrice}-{template.maxPrice} $LOS</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Trading Fee</div>
                      <div className="text-white font-semibold">{template.feePercentage}%</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-white font-medium mb-2">Features:</h5>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-gray-300 text-sm flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          {feature}
                        </div>
                      ))}
                      {template.features.length > 3 && (
                        <div className="text-gray-400 text-sm">
                          +{template.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200">
                    Select Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Setup */}
        {currentStep === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Launch Your NFT Bonding Curve</h3>
              <p className="text-gray-300">
                Create a bonding curve for your NFT collection, similar to pump.fun but with NFT reveals
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Enter collection name"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Collection Symbol *
                  </label>
                  <input
                    type="text"
                    value={collectionSymbol}
                    onChange={(e) => setCollectionSymbol(e.target.value)}
                    placeholder="e.g., MONKES, PUNKS"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Selected Template
                  </label>
                  <div className="p-3 bg-white/20 border border-white/30 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{selectedTemplate?.icon}</div>
                      <div>
                        <div className="text-white font-semibold">{selectedTemplate?.name}</div>
                        <div className="text-gray-300 text-sm">Bonding Cap: {selectedTemplate?.bondingCap.toLocaleString()} $LOS</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    placeholder="Describe your NFT collection"
                    rows={4}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={collectionImageUrl}
                    onChange={(e) => setCollectionImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Bonding Curve Info */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6">
              <h4 className="text-purple-400 font-bold mb-3">🚀 How Bonding Curves Work</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <h5 className="text-white font-semibold mb-2">Before Reveal:</h5>
                  <ul className="space-y-1">
                    <li>• Users buy/sell NFTs on the curve</li>
                    <li>• Price increases as more NFTs are bought</li>
                    <li>• Price decreases as NFTs are sold</li>
                    <li>• Progress bar shows path to reveal</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-semibold mb-2">After Reveal:</h5>
                  <ul className="space-y-1">
                    <li>• NFTs are revealed and minted</li>
                    <li>• Bridge opens for token trading</li>
                    <li>• Trade NFTs for any supported token</li>
                    <li>• Full liquidity and freedom</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep('template')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
              >
                ← Back to Templates
              </button>
              <button
                onClick={handleSetupComplete}
                disabled={loading || !connected || !collectionName || !collectionSymbol || !collectionDescription}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? 'Processing...' : !connected ? 'Connect Wallet' : selectedTemplate?.supportsTiers ? 'Configure Tiers →' : 'Launch Bonding Curve'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tier Configuration */}
        {currentStep === 'tiers' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Configure Your Tier System</h3>
              <p className="text-gray-300">
                Set up social-based tiers with different pricing and benefits
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowTierConfig(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105"
              >
                🏆 Configure Tiers
              </button>
              <button
                onClick={() => setShowSocialManager(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105"
              >
                👤 Manage Social Profile
              </button>
            </div>

            {configuredTiers.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6">
                <h4 className="text-purple-400 font-bold mb-4">Configured Tiers ({configuredTiers.length})</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configuredTiers.map((tier) => (
                    <div key={tier.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center space-x-3 mb-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: tier.color + '20', border: `2px solid ${tier.color}` }}
                        >
                          {tier.id === 'free' ? '🆓' : tier.id === 'bronze' ? '🥉' : tier.id === 'silver' ? '🥈' : tier.id === 'gold' ? '🥇' : tier.id === 'diamond' ? '💎' : '🐋'}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{tier.name}</div>
                          <div className="text-gray-300 text-sm">{tier.mintPrice} $LOS</div>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Max mints: {tier.maxMints} | Score: {tier.socialRequirements.minSocialScore || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep('setup')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
              >
                ← Back to Setup
              </button>
              <button
                onClick={handleLaunch}
                disabled={configuredTiers.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                Launch Bonding Curve →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Trading */}
        {currentStep === 'trading' && createdCollection && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Trading Phase</h3>
              <p className="text-gray-300">
                Your bonding curve is live! Users can now trade NFTs before reveal.
              </p>
            </div>

            <BondingCurveInterface
              collection={createdCollection}
              onTradeComplete={handleTradeComplete}
            />

            {createdCollection.state.isRevealed && (
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('bridge')}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105"
                >
                  🌉 Open Bridge Trading
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Bridge */}
        {currentStep === 'bridge' && createdCollection && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Bridge Trading</h3>
              <p className="text-gray-300">
                NFTs are revealed! Trade them for any supported token.
              </p>
            </div>

            <NFTBridgeInterface
              collectionId={createdCollection.id}
              collectionName={createdCollection.name}
              userNFTBalance={userNFTBalance}
              onTradeComplete={handleBridgeComplete}
            />
          </div>
        )}
      </div>

      {/* Tier Configuration Modal */}
      {showTierConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <TierConfiguration
            selectedTemplate={selectedTemplate}
            onTiersConfigured={handleTiersConfigured}
            onClose={() => setShowTierConfig(false)}
          />
        </div>
      )}

      {/* Social Profile Manager Modal */}
      {showSocialManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <SocialProfileManager
            onClose={() => setShowSocialManager(false)}
          />
        </div>
      )}
    </div>
  );
}
