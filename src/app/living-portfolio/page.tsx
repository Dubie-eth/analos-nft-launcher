/**
 * LIVING PORTFOLIO NFT COLLECTION PAGE
 * Showcase the revolutionary auto-investing, self-evolving NFTs
 */

'use client';

import React, { useState, useEffect } from 'react';
import LivingPortfolioNFT from '@/components/LivingPortfolioNFT';
import { useWallet } from '@solana/wallet-adapter-react';

export default function LivingPortfolioPage() {
  const { publicKey, connected } = useWallet();
  const [collectionStats, setCollectionStats] = useState({
    totalSupply: 222,
    minted: 0,
    floorPrice: 0.5,
    totalVolume: 0,
    averageReturn: 0,
    activePortfolios: 0
  });
  const [featuredPortfolios, setFeaturedPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollectionData();
  }, []);

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - in production this would come from your backend
      setCollectionStats({
        totalSupply: 222,
        minted: 12,
        floorPrice: 0.5,
        totalVolume: 156.7,
        averageReturn: 23.4,
        activePortfolios: 12
      });

      // Create some featured portfolios for demo
      setFeaturedPortfolios([
        {
          tokenId: '1',
          ownerAddress: publicKey?.toString() || '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          initialInvestment: 0.1,
          performance: '+45.2%',
          tier: 'hot_streak'
        },
        {
          tokenId: '2',
          ownerAddress: publicKey?.toString() || '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
          initialInvestment: 0.1,
          performance: '+18.7%',
          tier: 'growing'
        },
        {
          tokenId: '3',
          ownerAddress: publicKey?.toString() || '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          initialInvestment: 0.1,
          performance: '+8.3%',
          tier: 'stable'
        }
      ]);

    } catch (error) {
      console.error('Error loading collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintPortfolioNFT = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // In production, this would trigger the actual minting process
      alert('Minting functionality will be implemented with your existing NFT launchpad program');
    } catch (error) {
      console.error('Error minting portfolio NFT:', error);
      alert('Failed to mint portfolio NFT');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-white">Loading Living Portfolio Collection...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Living Portfolio NFTs
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            The World's First Auto-Investing, Self-Evolving NFTs
          </p>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 max-w-4xl mx-auto">
            <p className="text-white text-lg">
              Your NFT analyzes your wallet, automatically invests in tokens, and evolves its appearance based on performance. 
              <span className="font-bold"> Never been done before!</span>
            </p>
          </div>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-purple-400">{collectionStats.totalSupply}</p>
            <p className="text-sm text-gray-300">Total Supply</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-blue-400">{collectionStats.minted}</p>
            <p className="text-sm text-gray-300">Minted</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-green-400">{collectionStats.floorPrice} SOL</p>
            <p className="text-sm text-gray-300">Floor Price</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-yellow-400">{collectionStats.totalVolume} SOL</p>
            <p className="text-sm text-gray-300">Total Volume</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-pink-400">+{collectionStats.averageReturn}%</p>
            <p className="text-sm text-gray-300">Avg Return</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg shadow text-center">
            <p className="text-2xl font-bold text-indigo-400">{collectionStats.activePortfolios}</p>
            <p className="text-sm text-gray-300">Active</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-800/70 rounded-lg shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Revolutionary Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">Auto-Investment</h3>
              <p className="text-gray-300 text-sm">Analyzes your trading patterns and automatically invests in tokens that match your strategy</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">Self-Evolution</h3>
              <p className="text-gray-300 text-sm">Changes appearance based on portfolio performance, creating unique visual experiences</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Live P&L</h3>
              <p className="text-gray-300 text-sm">Shows real-time profit/loss directly in the NFT metadata and visual design</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💎</div>
              <h3 className="text-xl font-bold text-white mb-2">Rarity Evolution</h3>
              <p className="text-gray-300 text-sm">NFT rarity increases with performance, creating a dynamic rarity system</p>
            </div>
          </div>
        </div>

        {/* Mint Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Mint Your Living Portfolio NFT</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect your wallet to mint a Living Portfolio NFT that will analyze your trading patterns, 
            automatically invest in tokens, and evolve based on performance.
          </p>
          
          {connected ? (
            <div className="space-y-4">
              <button
                onClick={handleMintPortfolioNFT}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105"
              >
                🚀 Mint Living Portfolio NFT (0.5 SOL)
              </button>
              <p className="text-gray-400 text-sm">
                Your wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-4)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                disabled
                className="bg-gray-600 text-gray-300 font-bold py-4 px-8 rounded-lg text-xl cursor-not-allowed"
              >
                Connect Wallet to Mint
              </button>
              <p className="text-gray-400 text-sm">
                Connect your wallet to start your Living Portfolio NFT journey
              </p>
            </div>
          )}
        </div>

        {/* Featured Portfolios */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Featured Portfolios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPortfolios.map((portfolio) => (
              <LivingPortfolioNFT
                key={portfolio.tokenId}
                tokenId={portfolio.tokenId}
                ownerAddress={portfolio.ownerAddress}
                initialInvestment={portfolio.initialInvestment}
              />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/70 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How Living Portfolio NFTs Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">1. Wallet Analysis</h3>
              <p className="text-gray-300">
                Your NFT analyzes your trading patterns, favorite tokens, and risk tolerance to create a personalized investment strategy.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">2. Auto-Investment</h3>
              <p className="text-gray-300">
                Based on the analysis, your NFT automatically invests in tokens that match your trading style and risk profile.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">3. Evolution</h3>
              <p className="text-gray-300">
                As your investments perform, your NFT evolves its appearance, rarity, and traits to reflect your portfolio's success.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
