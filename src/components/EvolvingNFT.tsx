/**
 * EVOLVING NFT COMPONENT
 * Displays AI-powered evolving NFTs with daily content updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import AINFTService from '@/lib/ai-nft-service';

interface EvolvingNFTProps {
  tokenId: string;
  ownerWallet: string;
  initialPrompt: string;
  className?: string;
}

export default function EvolvingNFT({ 
  tokenId, 
  ownerWallet, 
  initialPrompt, 
  className = '' 
}: EvolvingNFTProps) {
  const [evolution, setEvolution] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEvolving, setIsEvolving] = useState(false);

  useEffect(() => {
    initializeNFT();
  }, [tokenId, initialPrompt]);

  const initializeNFT = async () => {
    try {
      setLoading(true);
      
      // Initialize AI NFT service
      const aiService = new AINFTService({
        apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
        basePrompt: initialPrompt,
        evolutionStyle: 'artistic',
        updateFrequency: 'daily'
      });

      // Create or get existing evolution
      let currentEvolution = aiService.getEvolution(tokenId);
      if (!currentEvolution) {
        currentEvolution = await aiService.createEvolvingNFT(
          tokenId,
          initialPrompt,
          ownerWallet
        );
      }

      setEvolution(currentEvolution);
      setCurrentStep(currentEvolution.evolutionHistory[currentEvolution.evolutionHistory.length - 1]);
      
      // Check if evolution is due
      if (aiService.shouldEvolve(tokenId)) {
        await evolveNFT();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const evolveNFT = async () => {
    try {
      setIsEvolving(true);
      
      const aiService = new AINFTService({
        apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
        basePrompt: initialPrompt,
        evolutionStyle: 'artistic',
        updateFrequency: 'daily'
      });

      const newStep = await aiService.evolveNFT(tokenId);
      const updatedEvolution = aiService.getEvolution(tokenId);
      
      setEvolution(updatedEvolution);
      setCurrentStep(newStep);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEvolving(false);
    }
  };

  const formatTimeUntilEvolution = () => {
    if (!evolution) return '';
    
    const now = new Date();
    const nextEvolution = new Date(evolution.nextEvolutionDate);
    const timeDiff = nextEvolution.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Ready to evolve!';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m until next evolution`;
  };

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing Evolving NFT...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 ${className}`}>
        <div className="text-center">
          <h3 className="text-red-400 text-xl font-bold mb-2">Evolution Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={initializeNFT}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
        <div className="text-center">
          <h3 className="text-white text-xl font-bold mb-2">No Evolution Data</h3>
          <p className="text-gray-300">This NFT hasn't evolved yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
      {/* NFT Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Evolving NFT #{tokenId}
          </h3>
          <p className="text-gray-300">
            Evolution Stage {currentStep.version}: {currentStep.metadata.traits['Evolution Stage']}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {formatTimeUntilEvolution()}
          </div>
          {evolution && new Date() >= new Date(evolution.nextEvolutionDate) && (
            <button
              onClick={evolveNFT}
              disabled={isEvolving}
              className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isEvolving ? 'Evolving...' : 'Evolve Now'}
            </button>
          )}
        </div>
      </div>

      {/* NFT Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Image/Video Display */}
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {currentStep.videoUrl ? (
              <video
                src={currentStep.videoUrl}
                autoPlay
                loop
                muted
                className="w-full h-64 object-cover"
                poster={currentStep.imageUrl}
              />
            ) : (
              <img
                src={currentStep.imageUrl}
                alt={`Evolution ${currentStep.version}`}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              v{currentStep.version}
            </div>
          </div>

          {/* Evolution Progress */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Evolution Progress</h4>
            <div className="space-y-2">
              {Object.entries(currentStep.metadata.traits).map(([trait, value]) => (
                <div key={trait} className="flex justify-between text-sm">
                  <span className="text-gray-300">{trait}:</span>
                  <span className="text-white font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata and History */}
        <div className="space-y-4">
          {/* Current Prompt */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Current Prompt</h4>
            <p className="text-gray-300 text-sm">{currentStep.prompt}</p>
          </div>

          {/* Evolution History */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Evolution History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {evolution.evolutionHistory.map((step: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className={`w-3 h-3 rounded-full ${
                    index === evolution.evolutionHistory.length - 1 ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-300">v{step.version}</span>
                  <span className="text-gray-400">{step.metadata.traits['Evolution Stage']}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(step.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* NFT Actions */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">NFT Actions</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View in Wallet
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Share Evolution
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Evolution Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
