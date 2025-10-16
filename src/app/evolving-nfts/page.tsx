/**
 * EVOLVING NFTS PAGE
 * Showcase AI-powered evolving NFTs
 */

'use client';

import React, { useState } from 'react';
import EvolvingNFT from '@/components/EvolvingNFT';
import { useWallet } from '@solana/wallet-adapter-react';

export default function EvolvingNFTsPage() {
  const { publicKey, connected } = useWallet();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNFTPrompt, setNewNFTPrompt] = useState('');

  // Sample evolving NFTs (in production, these would come from the blockchain)
  const sampleNFTs = [
    {
      tokenId: '1',
      ownerWallet: publicKey?.toString() || '',
      initialPrompt: 'A cosmic dragon that learns and evolves through time, becoming more wise and powerful',
      evolutionStage: 3
    },
    {
      tokenId: '2', 
      ownerWallet: publicKey?.toString() || '',
      initialPrompt: 'An abstract geometric form that morphs and grows more complex with each evolution',
      evolutionStage: 1
    },
    {
      tokenId: '3',
      ownerWallet: publicKey?.toString() || '',
      initialPrompt: 'A digital forest spirit that adapts and changes with the seasons',
      evolutionStage: 5
    }
  ];

  const handleCreateNFT = async () => {
    if (!newNFTPrompt.trim()) return;
    
    // In production, this would mint a new NFT on the blockchain
    console.log('Creating new evolving NFT with prompt:', newNFTPrompt);
    setNewNFTPrompt('');
    setShowCreateForm(false);
    
    // Show success message
    alert('Evolving NFT created! It will start evolving automatically.');
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">🧬 Evolving NFTs</h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to view and create AI-powered evolving NFTs
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
              <p className="text-gray-300 mb-6">
                Please connect your wallet to access the evolving NFT system.
              </p>
              <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🧬 Evolving NFTs</h1>
          <p className="text-xl text-gray-300 mb-6">
            AI-powered NFTs that learn, grow, and evolve over time
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Evolving NFT
            </button>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              View Collection
            </button>
          </div>
        </div>

        {/* Create NFT Form */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Evolving NFT</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Initial Prompt
                </label>
                <textarea
                  value={newNFTPrompt}
                  onChange={(e) => setNewNFTPrompt(e.target.value)}
                  placeholder="Describe your evolving NFT... (e.g., 'A cosmic dragon that learns and grows wiser each day')"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleCreateNFT}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create NFT
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NFT Grid */}
        <div className="grid gap-8">
          {sampleNFTs.map((nft) => (
            <EvolvingNFT
              key={nft.tokenId}
              tokenId={nft.tokenId}
              ownerWallet={nft.ownerWallet}
              initialPrompt={nft.initialPrompt}
              className="w-full"
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">How Evolving NFTs Work</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">🤖 AI-Powered Evolution</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Each NFT evolves daily with AI-generated content</li>
                <li>• 6.9-second videos show the evolution process</li>
                <li>• Traits and metadata change over time</li>
                <li>• Each evolution is unique and unrepeatable</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">🎨 Creative Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Multiple evolution styles (artistic, abstract, realistic)</li>
                <li>• Custom prompts guide the evolution direction</li>
                <li>• Evolution history is permanently recorded</li>
                <li>• Interactive evolution controls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
