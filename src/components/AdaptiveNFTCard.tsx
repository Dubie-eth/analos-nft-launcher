/**
 * ADAPTIVE NFT CARD
 * Displays an adaptive NFT that changes based on holder's wallet
 */

'use client';

import React, { useState, useEffect } from 'react';
import AdaptiveNFTService from '@/lib/adaptive-nft-service';

interface AdaptiveNFTCardProps {
  tokenId: string;
  holderWallet: string;
  className?: string;
}

export default function AdaptiveNFTCard({ 
  tokenId, 
  holderWallet, 
  className = '' 
}: AdaptiveNFTCardProps) {
  const [nftState, setNftState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadAdaptiveNFT();
  }, [tokenId, holderWallet]);

  const loadAdaptiveNFT = async () => {
    try {
      setLoading(true);
      
      const adaptiveService = new AdaptiveNFTService();
      
      // Try to get existing NFT
      let currentState = adaptiveService.getAdaptiveNFT(tokenId);
      
      if (!currentState) {
        // Create new adaptive NFT
        currentState = await adaptiveService.createAdaptiveNFT(
          tokenId,
          holderWallet,
          {
            basePrompt: 'An adaptive digital being that reflects its holder',
            adaptationLevel: 'moderate',
            updateFrequency: 'daily',
            personalityWeight: 0.7
          }
        );
      }
      
      setNftState(currentState);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerUpdate = async () => {
    try {
      setIsUpdating(true);
      
      const adaptiveService = new AdaptiveNFTService();
      const updatedAdaptation = await adaptiveService.updateAdaptiveNFT(tokenId);
      
      // Reload the NFT state
      await loadAdaptiveNFT();
      
      console.log('✅ Adaptive NFT updated:', updatedAdaptation.version);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTimeUntilUpdate = () => {
    if (!nftState) return '';
    
    const now = new Date();
    const nextUpdate = new Date(nftState.nextUpdate);
    const timeDiff = nextUpdate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Ready to update!';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m until next update`;
  };

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Analyzing wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 ${className}`}>
        <div className="text-center">
          <h3 className="text-red-400 text-xl font-bold mb-2">Adaptation Error</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadAdaptiveNFT}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!nftState || !nftState.adaptations.length) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="text-center">
          <h3 className="text-white text-xl font-bold mb-2">No Adaptations</h3>
          <p className="text-gray-300">This NFT hasn't adapted yet.</p>
        </div>
      </div>
    );
  }

  const currentAdaptation = nftState.adaptations[nftState.adaptations.length - 1];
  const walletAnalysis = nftState.walletAnalysis;

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
      {/* NFT Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Adaptive NFT #{tokenId}
          </h3>
          <p className="text-gray-300">
            Version {currentAdaptation.version} • {walletAnalysis.personality.style} style
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400 mb-2">
            {formatTimeUntilUpdate()}
          </div>
          <button
            onClick={triggerUpdate}
            disabled={isUpdating}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Adapting...' : 'Force Update'}
          </button>
        </div>
      </div>

      {/* NFT Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image/Video Display */}
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {currentAdaptation.videoUrl ? (
              <video
                src={currentAdaptation.videoUrl}
                autoPlay
                loop
                muted
                className="w-full h-64 object-cover"
                poster={currentAdaptation.imageUrl}
              />
            ) : (
              <img
                src={currentAdaptation.imageUrl}
                alt={`Adaptation ${currentAdaptation.version}`}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              v{currentAdaptation.version}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {walletAnalysis.personality.mood} • {walletAnalysis.riskProfile}
            </div>
          </div>

          {/* Wallet Analysis Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Wallet Analysis</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Portfolio:</span>
                <span className="text-white ml-1">${walletAnalysis.portfolioValue.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">NFTs:</span>
                <span className="text-white ml-1">{walletAnalysis.nftCollections.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Tokens:</span>
                <span className="text-white ml-1">{walletAnalysis.tokenHoldings.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Risk:</span>
                <span className="text-white ml-1 capitalize">{walletAnalysis.riskProfile}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Adaptation Details */}
        <div className="space-y-4">
          {/* Current Adaptation Prompt */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Adaptation Prompt</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentAdaptation.prompt}
            </p>
          </div>

          {/* Wallet Influences */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Wallet Influences</h4>
            <div className="space-y-1 text-sm">
              {currentAdaptation.walletInfluence.map((influence: string, index: number) => (
                <div key={index} className="text-gray-300">• {influence}</div>
              ))}
            </div>
          </div>

          {/* Adaptation Traits */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Adaptive Traits</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(currentAdaptation.traits).slice(0, 8).map(([trait, value]) => (
                <div key={trait} className="flex justify-between text-sm">
                  <span className="text-gray-400">{trait}:</span>
                  <span className="text-white font-mono text-xs">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptation History */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Adaptation History</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {nftState.adaptations.slice(-5).map((adaptation: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    index === nftState.adaptations.length - 1 ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-300">v{adaptation.version}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(adaptation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NFT Actions */}
      <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">NFT Actions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            View in Wallet
          </button>
          <button className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
            Share Adaptation
          </button>
          <button className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
            Evolution Settings
          </button>
          <button className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
            Analyze Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
