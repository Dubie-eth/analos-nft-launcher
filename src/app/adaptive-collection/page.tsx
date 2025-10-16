/**
 * ADAPTIVE COLLECTION PAGE
 * Showcase the 2222 adaptive NFT collection
 */

'use client';

import React, { useState, useEffect } from 'react';
import AdaptiveNFTCard from '@/components/AdaptiveNFTCard';
import SecurityConsent from '@/components/SecurityConsent';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AdaptiveCollectionPage() {
  const { publicKey, connected } = useWallet();
  const [hasConsented, setHasConsented] = useState(false);
  const [collectionStats, setCollectionStats] = useState({
    totalSupply: 2222,
    minted: 156,
    floorPrice: 0.5,
    totalVolume: 1250,
    holders: 89
  });
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [showWalletInput, setShowWalletInput] = useState(false);

  // Sample adaptive NFTs
  const sampleNFTs = [
    {
      tokenId: '1',
      holderWallet: publicKey?.toString() || 'DemoWallet11111111111111111111111111111111',
      mintedAt: '2024-01-15',
      currentVersion: '3.2',
      adaptations: 8
    },
    {
      tokenId: '42',
      holderWallet: 'AnotherWallet22222222222222222222222222222222',
      mintedAt: '2024-01-20',
      currentVersion: '2.7',
      adaptations: 5
    },
    {
      tokenId: '1337',
      holderWallet: 'EliteWallet33333333333333333333333333333333',
      mintedAt: '2024-01-25',
      currentVersion: '4.1',
      adaptations: 12
    }
  ];

  useEffect(() => {
    // Check if user has previously consented
    const consent = localStorage.getItem('adaptive_nft_consent');
    if (consent === 'true') {
      setHasConsented(true);
    }
  }, []);

  const handleConsent = () => {
    localStorage.setItem('adaptive_nft_consent', 'true');
    setHasConsented(true);
  };

  const handleDecline = () => {
    alert('You must consent to use Adaptive NFTs. Your wallet is completely safe - we only read public blockchain data.');
  };

  const handleWalletAnalysis = () => {
    if (!selectedWallet.trim()) return;
    
    // In production, this would analyze the wallet and show results
    console.log('Analyzing wallet:', selectedWallet);
    alert(`Analyzing wallet: ${selectedWallet.slice(0, 8)}...`);
  };

  // Show security consent first
  if (connected && !hasConsented) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <SecurityConsent 
            onAccept={handleConsent} 
            onDecline={handleDecline} 
          />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🧬 Adaptive Collection</h1>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to view and create adaptive NFTs
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet Required</h2>
            <p className="text-gray-300 mb-6">
              Please connect your wallet to access the adaptive NFT system.
            </p>
            <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🧬 Adaptive Collection</h1>
          <p className="text-xl text-gray-300 mb-6">
            NFTs that evolve and adapt to their holder's wallet composition
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Mint Adaptive NFT
            </button>
            <button 
              onClick={() => setShowWalletInput(!showWalletInput)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze Wallet
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              View Collection
            </button>
          </div>

          {/* Wallet Analysis Input */}
          {showWalletInput && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-md mx-auto mb-8">
              <h3 className="text-white font-semibold mb-4">Analyze Wallet Composition</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  placeholder="Enter wallet address..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleWalletAnalysis}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Analyze Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.minted}</div>
            <div className="text-gray-400 text-sm">Minted</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.totalSupply}</div>
            <div className="text-gray-400 text-sm">Total Supply</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.floorPrice} SOL</div>
            <div className="text-gray-400 text-sm">Floor Price</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.totalVolume} SOL</div>
            <div className="text-gray-400 text-sm">Volume</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-white">{collectionStats.holders}</div>
            <div className="text-gray-400 text-sm">Holders</div>
          </div>
        </div>

        {/* Adaptive NFTs Grid */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-white text-center">Live Adaptive NFTs</h2>
          
          {sampleNFTs.map((nft) => (
            <AdaptiveNFTCard
              key={nft.tokenId}
              tokenId={nft.tokenId}
              holderWallet={nft.holderWallet}
              className="w-full"
            />
          ))}
        </div>

        {/* How It Works Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How Adaptive NFTs Work</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Wallet Analysis</h3>
              <p className="text-gray-300">
                Each NFT analyzes its holder's wallet composition, including NFT collections, 
                token holdings, and trading patterns to understand their preferences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Adaptation</h3>
              <p className="text-gray-300">
                Using advanced AI, the NFT generates personalized content that reflects 
                the holder's style, risk profile, and interests from their portfolio.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Continuous Evolution</h3>
              <p className="text-gray-300">
                NFTs automatically update when transferred to new holders or when 
                the current holder's portfolio composition changes significantly.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Technical Implementation</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">🔗 Webhook System</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Real-time wallet monitoring via Solana RPC</li>
                <li>• Automatic webhook triggers on NFT transfers</li>
                <li>• Scheduled updates based on holder preferences</li>
                <li>• Batch processing for collection-wide updates</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">🤖 AI Integration</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• OpenAI DALL-E for image generation</li>
                <li>• Runway ML for 6.9-second evolution videos</li>
                <li>• Personality analysis from wallet data</li>
                <li>• Trait generation based on portfolio composition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
