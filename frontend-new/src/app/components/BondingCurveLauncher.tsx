'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { bondingCurveService, BondingCurveCollection } from '@/lib/bonding-curve-service';
import BondingCurveInterface from './BondingCurveInterface';
import NFTBridgeInterface from './NFTBridgeInterface';

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
  const [currentStep, setCurrentStep] = useState<'setup' | 'trading' | 'bridge'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Collection setup form
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionImageUrl, setCollectionImageUrl] = useState('');
  const [bondingCap, setBondingCap] = useState(10000000); // 10M $LOS default

  // Created collection
  const [createdCollection, setCreatedCollection] = useState<BondingCurveCollection | null>(null);
  const [userNFTBalance, setUserNFTBalance] = useState(0);

  const handleLaunch = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
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
          bondingCap: bondingCap
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
    setCurrentStep('setup');
    setCollectionName('');
    setCollectionSymbol('');
    setCollectionDescription('');
    setCollectionImageUrl('');
    setBondingCap(10000000);
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
          <div className="flex items-center space-x-4">
            {[
              { id: 'setup', label: 'Setup', icon: '⚙️' },
              { id: 'trading', label: 'Trading', icon: '💰' },
              { id: 'bridge', label: 'Bridge', icon: '🌉' }
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = ['setup', 'trading'].indexOf(currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-white/20 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.icon} {step.label}
                  </span>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-4 ${
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

        {/* Step 1: Setup */}
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
                    Bonding Cap ($LOS)
                  </label>
                  <input
                    type="number"
                    value={bondingCap}
                    onChange={(e) => setBondingCap(parseInt(e.target.value) || 10000000)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
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

            <div className="flex justify-center">
              <button
                onClick={handleLaunch}
                disabled={loading || !connected || !collectionName || !collectionSymbol || !collectionDescription}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? 'Launching...' : !connected ? 'Connect Wallet' : 'Launch Bonding Curve'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Trading */}
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
    </div>
  );
}
