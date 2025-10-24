'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getRarityColor, formatRarity } from '@/config/los-bros-collection';

interface LosBrosNFT {
  mint: string;
  name: string;
  image: string;
  traits: Array<{ trait_type: string; value: string }>;
  rarityScore: number;
  rarityTier: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  collection?: string;
}

interface LosBrosSelectorProps {
  onSelect: (nft: LosBrosNFT | null) => void;
  selectedNFT: LosBrosNFT | null;
}

export default function LosBrosSelector({ onSelect, selectedNFT }: LosBrosSelectorProps) {
  const { publicKey } = useWallet();
  const [losBrosNFTs, setLosBrosNFTs] = useState<LosBrosNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      loadLosBrosNFTs();
    }
  }, [publicKey]);

  const loadLosBrosNFTs = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/los-bros/user-nfts/${publicKey.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLosBrosNFTs(data.losBrosNFTs || []);
        
        if (data.losBrosNFTs.length === 0) {
          setError('No Los Bros NFTs found in your wallet');
        }
      } else {
        setError(data.error || 'Failed to load Los Bros NFTs');
      }
    } catch (err: any) {
      console.error('Error loading Los Bros NFTs:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
          <span className="text-gray-300">Loading Los Bros NFTs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500">
            📦 Los Bros collection coming soon! Mint your Los Bros NFT to use it as your profile picture.
          </p>
        </div>
      </div>
    );
  }

  if (losBrosNFTs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <p className="text-gray-300 mb-2">
            No Los Bros NFTs found
          </p>
          <p className="text-sm text-gray-500">
            Mint a Los Bros NFT to use it as your profile picture!
          </p>
          <button
            onClick={() => onSelect(null)}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Use Default Image Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
        <h3 className="text-xl font-bold text-white mb-4">
          🎨 Select Your Los Bros PFP
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Choose a Los Bros NFT from your wallet to use as your profile picture. 
          The rarity and traits will be inherited by your Profile NFT!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Option: Use default (no Los Bros) */}
          <button
            onClick={() => onSelect(null)}
            className={`relative rounded-lg border-2 p-4 transition-all ${
              selectedNFT === null
                ? 'border-green-400 bg-green-900/20'
                : 'border-gray-600 bg-gray-800/40 hover:border-gray-400'
            }`}
          >
            <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-4xl">🎭</span>
            </div>
            <p className="text-sm text-white font-medium text-center">
              Default Image
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Matrix style
            </p>
          </button>

          {/* Los Bros NFTs */}
          {losBrosNFTs.map((nft) => (
            <button
              key={nft.mint}
              onClick={() => onSelect(nft)}
              className={`relative rounded-lg border-2 p-2 transition-all ${
                selectedNFT?.mint === nft.mint
                  ? 'border-purple-400 bg-purple-900/20'
                  : 'border-gray-600 bg-gray-800/40 hover:border-purple-400/50'
              }`}
            >
              {/* Rarity Badge */}
              <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold border ${getRarityColor(nft.rarityTier)}`}>
                {formatRarity(nft.rarityTier)}
              </div>

              {/* NFT Image */}
              <div className="aspect-square bg-gray-900 rounded-lg mb-2 overflow-hidden">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🎨</span>
                  </div>
                )}
              </div>

              {/* NFT Info */}
              <div className="text-left">
                <p className="text-sm text-white font-medium truncate">
                  {nft.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    Score: {nft.rarityScore}
                  </p>
                  {selectedNFT?.mint === nft.mint && (
                    <span className="text-xs text-green-400">✓ Selected</span>
                  )}
                </div>
              </div>

              {/* Trait Count */}
              <div className="mt-2 text-xs text-gray-500">
                {nft.traits.length} traits
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected NFT Details */}
      {selectedNFT && (
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
          <h4 className="text-lg font-bold text-white mb-3">
            📋 Selected NFT Details
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Name:</p>
              <p className="text-white font-medium">{selectedNFT.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Rarity:</p>
              <p className={`font-bold ${getRarityColor(selectedNFT.rarityTier)}`}>
                {formatRarity(selectedNFT.rarityTier)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Rarity Score:</p>
              <p className="text-white font-medium">{selectedNFT.rarityScore}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Traits:</p>
              <p className="text-white font-medium">{selectedNFT.traits.length}</p>
            </div>
          </div>

          {/* Traits List */}
          {selectedNFT.traits.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Trait Details:</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedNFT.traits.map((trait, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/60 rounded-lg p-2 border border-gray-700"
                  >
                    <p className="text-xs text-gray-400">{trait.trait_type}</p>
                    <p className="text-sm text-white font-medium">{trait.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-400/30">
            <p className="text-sm text-purple-200">
              ✨ Your Profile NFT will inherit this rarity tier and display your Los Bros image!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

