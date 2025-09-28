'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [collectionData, setCollectionData] = useState({
    name: 'My Analos Collection',
    description: 'A unique NFT collection on the Analos blockchain',
    imageUrl: 'https://picsum.photos/500/500?random=1',
    totalSupply: 1000,
    mintPrice: 100,
    currency: '$LOS'
  });

  const handleDeploy = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your admin wallet first');
      return;
    }

    setIsDeploying(true);
    setError(null);
    setDeployResult(null);

    try {
      const payload = {
        name: collectionData.name.trim(),
        description: collectionData.description.trim(),
        imageUrl: collectionData.imageUrl.trim(),
        totalSupply: Number(collectionData.totalSupply),
        mintPrice: Number(collectionData.mintPrice),
        currency: collectionData.currency.trim(),
        adminWallet: publicKey.toString(),
      };

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/deploy-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy collection');
      }

      setDeployResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy collection');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              👑 Admin Dashboard
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
              Deploy NFT collections for public minting on the Analos blockchain
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  🔐 Admin Wallet
                </h2>
                <p className="text-gray-300 text-lg">
                  Connect your wallet to deploy collections
                </p>
              </div>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !rounded-xl !px-6 !py-3 !text-lg !font-semibold" />
            </div>
            {connected && publicKey && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                <p className="text-green-200 text-sm">
                  ✅ Connected as: <span className="font-mono text-green-100">{publicKey.toBase58()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Collection Creation Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              🎨 Create Collection
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Collection Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-200 mb-3">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={collectionData.name}
                    onChange={(e) => setCollectionData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    placeholder="Enter collection name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-200 mb-3">
                    Description
                  </label>
                  <textarea
                    value={collectionData.description}
                    onChange={(e) => setCollectionData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg resize-none"
                    placeholder="Describe your collection..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-medium text-gray-200 mb-3">
                      Total Supply
                    </label>
                    <input
                      type="number"
                      value={collectionData.totalSupply}
                      onChange={(e) => setCollectionData(prev => ({ ...prev, totalSupply: parseInt(e.target.value) || 0 }))}
                      className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      placeholder="1000"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-200 mb-3">
                      Mint Price ($LOS)
                    </label>
                    <input
                      type="number"
                      value={collectionData.mintPrice}
                      onChange={(e) => setCollectionData(prev => ({ ...prev, mintPrice: parseInt(e.target.value) || 0 }))}
                      className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      placeholder="100"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Image Selection */}
              <div className="space-y-6">
                <label className="block text-lg font-medium text-gray-200 mb-3">
                  Collection Image
                </label>
                
                {/* Image URL Input */}
                <div>
                  <input
                    type="url"
                    value={collectionData.imageUrl}
                    onChange={(e) => setCollectionData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    placeholder="Enter image URL"
                  />
                </div>

                {/* Random Image Button */}
                <button
                  onClick={() => setCollectionData(prev => ({ ...prev, imageUrl: `https://picsum.photos/500/500?random=${Math.floor(Math.random() * 1000) + 1}` }))}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-lg"
                >
                  🎲 Generate Random Image
                </button>

                {/* Image Preview */}
                {collectionData.imageUrl && (
                  <div className="relative">
                    <img
                      src={collectionData.imageUrl}
                      alt="Collection preview"
                      className="w-full h-64 object-cover rounded-2xl border-2 border-white/20"
                      onError={(e) => {
                        e.currentTarget.src = 'https://picsum.photos/500/500?random=error';
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                      Preview
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deploy Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleDeploy}
              disabled={!connected || isDeploying || !collectionData.name.trim()}
              className={`px-16 py-6 rounded-2xl font-bold text-2xl transition-all duration-200 transform ${
                connected && !isDeploying && collectionData.name.trim()
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isDeploying ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                  Deploying Collection...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-3 text-3xl">🚀</span>
                  Deploy Collection
                </div>
              )}
            </button>
            
            {!connected && (
              <p className="text-gray-400 text-lg mt-4">
                Connect your wallet to deploy collections
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-8">
              <p className="text-red-200 text-lg text-center">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {deployResult && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8">
              <h3 className="text-3xl font-semibold text-green-200 mb-6 text-center">
                🎉 Collection Deployed Successfully!
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-300 text-lg">Collection ID:</span>
                  <span className="text-white ml-2 font-mono text-sm block mt-1">
                    {deployResult.collectionId}
                  </span>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-300 text-lg">Mint Page URL:</span>
                  <a
                    href={deployResult.mintPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 ml-2 underline text-lg block mt-1"
                  >
                    {deployResult.mintPageUrl}
                  </a>
                </div>

                <p className="text-green-300 text-lg mt-4 text-center">
                  Share the Mint Page URL with your community!
                </p>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 mt-8 border border-white/10">
            <div className="text-center text-gray-400 text-lg space-y-2">
              <p>🌐 Network: Analos</p>
              <p>🔗 RPC: https://rpc.analos.io</p>
              <p>🔍 Explorer: https://explorer.analos.io</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
