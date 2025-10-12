'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

export default function EnhancedLandingPage() {
  const { publicKey, connected } = useWallet();
  
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentRoadmapItem, setCurrentRoadmapItem] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoadmapItem((prev) => (prev + 1) % roadmapItems.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "🏷️ On-Chain Ticker Collision Prevention",
      description: "Blockchain-enforced ticker uniqueness with real-time validation",
      image: "/features/launch.png",
      details: [
        "Global ticker registry stored on-chain",
        "Real-time availability checking via smart contract",
        "Case-insensitive matching (MAC = mac = Mac)",
        "Reserved ticker protection (SOL, BTC, ETH, LOS, etc.)",
        "Automatic registration on collection deployment"
      ]
    },
    {
      title: "💰 Automatic Fee Distribution",
      description: "Integrated fee system automatically distributes minting proceeds",
      image: "/features/fees.png",
      details: [
        "2.5% Platform Fee - Platform operations and development",
        "1.5% Buyback Fee - LOS token buyback and burning",
        "1.0% Developer Fee - Core development team",
        "95.0% Creator Fee - Collection creators receive the majority",
        "Automatic distribution on every mint transaction"
      ]
    },
    {
      title: "📊 Real-Time Supply Tracking",
      description: "Monitor your collection's minted supply with live updates",
      image: "/features/supply.png",
      details: [
        "30-second blockchain monitoring for new mints",
        "Accurate, up-to-date supply statistics",
        "No more manual refreshes or delays",
        "Reliable data for users and creators",
        "Integration with collection config accounts"
      ]
    },
    {
      title: "🎲 Blind Mint & Reveal System",
      description: "Launch mystery box collections with fair reveal mechanisms",
      image: "/features/reveal.png",
      details: [
        "Configurable reveal dates or supply triggers",
        "Placeholder image management",
        "Fair randomness for NFT distribution",
        "Enhances minting excitement and engagement",
        "Creator-controlled reveal timing"
      ]
    },
  ];

  const roadmapItems = [
    {
      phase: "Phase 1",
      title: "Core Launchpad Infrastructure",
      status: "✅ Completed",
      items: [
        "Smart contract deployment with fee distribution",
        "Ticker collision prevention system",
        "Basic minting and collection management",
        "Admin dashboard for collection oversight"
      ]
    },
    {
      phase: "Phase 2", 
      title: "Advanced Features & Integration",
      status: "🚧 In Progress",
      items: [
        "Real-time supply tracking implementation",
        "Blind mint and reveal system",
        "Enhanced marketplace functionality",
        "Advanced analytics and reporting"
      ]
    },
    {
      phase: "Phase 3",
      title: "Community & Ecosystem",
      status: "📋 Planned",
      items: [
        "Community governance features",
        "Creator rewards and incentives",
        "Cross-chain compatibility",
        "Advanced trading features"
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-5xl md:text-7xl font-bold text-white mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              🚀 Enterprise-Grade NFT Launchpad v4.2.2
            </h1>
            <p className={`text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              On-chain ticker collision prevention • Automatic fee distribution • Real-time supply tracking • Blind mint & reveal
            </p>
            
            {/* Program Information Section */}
            <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 max-w-6xl mx-auto transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                🔗 Smart Contract v4.2.2
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
                Deployed on Analos Mainnet with enterprise-grade features
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Program ID */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-2xl mb-3">🔗</div>
                    <h3 className="text-lg font-bold text-white mb-2">Program ID</h3>
                    <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-300 break-all">
                      5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
                    </div>
                    <a
                      href="https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View on Explorer →
                    </a>
                  </div>
                </div>

                {/* Fee Structure */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-2xl mb-3">💰</div>
                    <h3 className="text-lg font-bold text-white mb-2">Fee Structure</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="text-green-400 font-bold">2.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buyback:</span>
                        <span className="text-blue-400 font-bold">1.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Developer:</span>
                        <span className="text-purple-400 font-bold">1.0%</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-2">
                        <span>Creator:</span>
                        <span className="text-orange-400 font-bold">95.0%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-2xl mb-3">✨</div>
                    <h3 className="text-lg font-bold text-white mb-2">New Features</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-center">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Ticker Collision Prevention</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Automatic Fee Distribution</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Real-Time Supply Tracking</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-green-400 mr-2">✓</span>
                        <span>Blind Mint & Reveal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-2xl mb-3">🌐</div>
                    <h3 className="text-lg font-bold text-white mb-2">Network</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        <span>Analos Mainnet</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-3">
                        RPC: rpc.analos.io
                      </div>
                      <div className="text-xs text-gray-400">
                        Explorer: explorer.analos.io
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <Link
                href="/launch-collection"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Launch Your Collection
              </Link>
              <Link
                href="/marketplace"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 border border-white/20"
              >
                🏪 Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🚀 Enterprise Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for creators who demand the best in blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 transition-all duration-500 ${
                  currentFeature === index ? 'ring-2 ring-purple-500 shadow-xl' : ''
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
                <ul className="space-y-3">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start">
                      <span className="text-green-400 mr-3 mt-1">✓</span>
                      <span className="text-gray-300">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Programs Section */}
      <section className="py-20 bg-gradient-to-r from-green-600/5 to-teal-600/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🚀 Enhanced Programs
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced blockchain programs for professional trading, airdrops, vesting, and token management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* OTC Marketplace */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💱</div>
                <h3 className="text-xl font-bold text-white mb-3">OTC Trading</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Peer-to-peer trading with enhanced security and multi-signature support
                </p>
                <ul className="text-xs text-gray-400 space-y-1 mb-4">
                  <li>• Emergency pause functions</li>
                  <li>• Rate limiting protection</li>
                  <li>• Enhanced logging</li>
                  <li>• Multi-signature support</li>
                </ul>
                <Link
                  href="/otc-marketplace"
                  className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Start Trading
                </Link>
              </div>
            </div>

            {/* Airdrops */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎁</div>
                <h3 className="text-xl font-bold text-white mb-3">Airdrops</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Claim tokens via Merkle tree verification with enhanced security
                </p>
                <ul className="text-xs text-gray-400 space-y-1 mb-4">
                  <li>• Merkle tree verification</li>
                  <li>• Gasless claiming</li>
                  <li>• Batch processing</li>
                  <li>• Anti-bot protection</li>
                </ul>
                <Link
                  href="/airdrops"
                  className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Claim Tokens
                </Link>
              </div>
            </div>

            {/* Vesting */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⏰</div>
                <h3 className="text-xl font-bold text-white mb-3">Vesting</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Create and manage token vesting schedules with flexible parameters
                </p>
                <ul className="text-xs text-gray-400 space-y-1 mb-4">
                  <li>• Linear & cliff vesting</li>
                  <li>• Multi-recipient support</li>
                  <li>• Pausable schedules</li>
                  <li>• Emergency recovery</li>
                </ul>
                <Link
                  href="/vesting"
                  className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Manage Vesting
                </Link>
              </div>
            </div>

            {/* Token Lock */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-300 group">
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
                <h3 className="text-xl font-bold text-white mb-3">Token Lock</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Lock and unlock tokens with time-based restrictions and monitoring
                </p>
                <ul className="text-xs text-gray-400 space-y-1 mb-4">
                  <li>• Time-based locks</li>
                  <li>• Multi-signature control</li>
                  <li>• Lock extensions</li>
                  <li>• Real-time monitoring</li>
                </ul>
                <Link
                  href="/token-lock"
                  className="inline-block bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Lock Tokens
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Programs CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">
              All enhanced programs include advanced security features, monitoring, and emergency controls
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/explorer"
                className="bg-white text-green-900 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                🔍 View All Programs
              </Link>
              <Link
                href="/admin"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 border border-white/20"
              >
                🎛️ Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* $LOL Token Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-600/5 to-orange-600/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              💰 $LOL Token
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The governance and utility token powering the Analos NFT Launchpad ecosystem
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Token Info */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-400/20 rounded-3xl p-12 backdrop-blur-sm">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">💎</div>
                <h3 className="text-3xl font-bold text-white mb-4">$LOL Token</h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Hold $LOL tokens to unlock exclusive benefits, governance voting rights, and platform discounts
                </p>
              </div>

              {/* Contract Address */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
                <h4 className="text-white font-bold mb-3">Contract Address</h4>
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <code className="text-yellow-400 font-mono text-sm break-all">
                    ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6')}
                    className="ml-3 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-semibold transition-colors duration-200"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="https://app.analos.io/dex/9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
                >
                  <div className="text-xl mb-1">💱</div>
                  <div>Buy $LOL</div>
                </a>
                <a
                  href="https://losscreener.com/token/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
                >
                  <div className="text-xl mb-1">📊</div>
                  <div>View Chart</div>
                </a>
              </div>

              {/* Social Links */}
              <div className="mt-6 flex justify-center space-x-4">
                <a
                  href="https://x.com/launchonlos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black hover:bg-gray-800 text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-xl">🐦</span>
                </a>
                <a
                  href="https://t.me/launchonlos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-xl">📱</span>
                </a>
              </div>
            </div>

            {/* Swap Component */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-2xl font-bold text-white mb-2">Direct Swap</h3>
                <p className="text-gray-300">
                  Trade tokens directly on our platform using your wallet
                </p>
              </div>

              {/* Simple Swap Interface */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm">From</span>
                    <span className="text-gray-400 text-xs">Balance: 0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="bg-transparent text-white text-xl font-semibold outline-none flex-1"
                    />
                    <select className="bg-white/10 text-white rounded-lg px-3 py-2 border border-white/20">
                      <option value="los">$LOS</option>
                      <option value="sol">$SOL</option>
                      <option value="usdc">$USDC</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors duration-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm">To</span>
                    <span className="text-gray-400 text-xs">Balance: 0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="number"
                      placeholder="0.0"
                      className="bg-transparent text-white text-xl font-semibold outline-none flex-1"
                    />
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg px-3 py-2 font-bold">
                      $LOL
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const userConfirmed = window.confirm(
                      '🔒 SECURITY WARNING 🔒\n\n' +
                      'Please ensure you are using a BURNER WALLET with minimal funds before swapping.\n\n' +
                      'This feature requires wallet connection. Do you want to continue?'
                    );
                    if (userConfirmed) {
                      // This would trigger wallet connection and swap
                      alert('Swap functionality requires wallet connection. Please connect your wallet first.');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>🔄</span>
                    <span>Swap Tokens</span>
                  </div>
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Powered by Analos DEX • Slippage: 0.5%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Stats */}
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-2xl mb-2">💎</div>
              <div className="text-2xl font-bold text-white mb-1">$LOL</div>
              <div className="text-gray-400 text-sm">Governance Token</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-2xl mb-2">🗳️</div>
              <div className="text-2xl font-bold text-white mb-1">Voting</div>
              <div className="text-gray-400 text-sm">Governance Rights</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-2xl mb-2">🎁</div>
              <div className="text-2xl font-bold text-white mb-1">Rewards</div>
              <div className="text-gray-400 text-sm">Platform Benefits</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-2xl font-bold text-white mb-1">Utility</div>
              <div className="text-gray-400 text-sm">Fee Discounts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🌟 Featured Collections
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover amazing NFT collections launching on our platform
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-400/20 rounded-3xl p-12 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">Los Bros Collection</h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  An exclusive collection featuring 126 unique traits across 6 categories: 
                  Background, Clothes, Eyes, Hats, Mouth, and Skin. Each NFT is carefully 
                  crafted with professional-grade rarity distribution.
                </p>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">126</div>
                    <div className="text-gray-400">Unique Traits</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">6</div>
                    <div className="text-gray-400">Trait Categories</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">2,222</div>
                    <div className="text-gray-400">Total Supply</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">42.00</div>
                    <div className="text-gray-400">$LOS Mint Price</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/marketplace"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    🎨 View Collection
                  </Link>
                  <Link 
                    href="/explorer"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm"
                  >
                    🔍 Explore All NFTs
                  </Link>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl p-12 text-center border border-white/10">
                <div className="text-8xl mb-6">🎨</div>
                <h4 className="text-2xl font-bold text-white mb-4">Professional Quality</h4>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Each trait is professionally designed and optimized for rarity distribution
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Holder Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              💎 $LOL Holder Benefits
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Hold $LOL tokens to unlock exclusive benefits, discounts, and most importantly - <strong className="text-purple-400">governance voting rights</strong> to help shape our platform's future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {[
              {
                tier: "Bronze",
                requirement: "100,000+ $LOL",
                benefits: [
                  "Governance voting rights",
                  "Early access to new collections",
                  "5% discount on generation fees",
                  "Priority customer support"
                ],
                color: "from-amber-500 to-orange-500"
              },
              {
                tier: "Silver", 
                requirement: "500,000+ $LOL",
                benefits: [
                  "All Bronze benefits",
                  "10% discount on all services",
                  "Beta feature access",
                  "Free collection consultations"
                ],
                color: "from-gray-400 to-gray-600"
              },
              {
                tier: "Gold",
                requirement: "2,500,000+ $LOL", 
                benefits: [
                  "All Silver benefits",
                  "15% discount on all services",
                  "White-label solutions",
                  "Custom development support"
                ],
                color: "from-yellow-400 to-yellow-600"
              },
              {
                tier: "Diamond",
                requirement: "10,000,000+ $LOL",
                benefits: [
                  "All Gold benefits", 
                  "20% discount on all services",
                  "Revenue sharing opportunities",
                  "Direct team communication"
                ],
                color: "from-blue-400 to-blue-600"
              },
              {
                tier: "Whale",
                requirement: "20,000,000+ $LOL",
                benefits: [
                  "All Diamond benefits",
                  "25% discount on all services", 
                  "Exclusive partnership opportunities",
                  "Priority governance proposal rights"
                ],
                color: "from-purple-500 to-pink-500"
              }
            ].map((incentive, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 transition-all duration-700 hover:scale-105 hover:shadow-2xl"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${incentive.color} mx-auto mb-6 flex items-center justify-center`}>
                    <span className="text-2xl">
                      {incentive.tier === 'Bronze' && '🥉'}
                      {incentive.tier === 'Silver' && '🥈'}
                      {incentive.tier === 'Gold' && '🥇'}
                      {incentive.tier === 'Diamond' && '💎'}
                      {incentive.tier === 'Whale' && '🐋'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{incentive.tier}</h3>
                  <p className="text-purple-400 font-semibold mb-6">{incentive.requirement}</p>
                  
                  <ul className="space-y-3 text-sm">
                    {incentive.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start text-gray-300">
                        <span className="text-green-400 mr-3 mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet Download & Beta Warning Section */}
      <section className="py-8 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-300 mb-3">
                  🚨 BETA PLATFORM WARNING
                </h3>
                <div className="space-y-3 text-sm text-orange-200">
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                    <h4 className="font-bold text-red-300 mb-2">🔥 CRITICAL SAFETY REMINDER</h4>
                    <p className="mb-2">
                      <strong>ALWAYS USE A BURNER WALLET</strong> when interacting with new or experimental platforms like this one.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-red-200">
                      <li>Never use your main wallet with significant funds</li>
                      <li>Create a new wallet specifically for testing</li>
                      <li>Only transfer small amounts for testing purposes</li>
                      <li>This platform is in BETA - use at your own risk</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-300 mb-2">💼 Recommended Wallet</h4>
                    <p className="mb-3">
                      We support <strong>Phantom Wallet</strong> and encourage using <strong>Backpack Wallet</strong> for the best experience on Analos:
                    </p>
                    <a
                      href="https://backpack.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <span className="text-xl">🎒</span>
                      <span>Download Backpack Wallet</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-300 mb-2">⚙️ Wallet Setup Instructions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-yellow-200">
                      <li>Download Phantom Wallet from phantom.app or Backpack Wallet from backpack.app</li>
                      <li>Create a new wallet (don't import your main wallet)</li>
                      <li>Set up custom RPC: <code className="bg-black/20 px-1 rounded">https://rpc.analos.io</code></li>
                      <li>Fund with small amount of $LOS for testing</li>
                      <li>Start minting and exploring!</li>
                    </ol>
                  </div>
                  
                  <div className="text-center pt-2">
                    <p className="text-xs text-orange-300/80">
                      By using this platform, you acknowledge that this is experimental software and you assume all risks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🗺️ Development Roadmap
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our journey to building the ultimate NFT launchpad
            </p>
          </div>

          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 transition-all duration-500 ${
                  currentRoadmapItem === index ? 'ring-2 ring-blue-500 shadow-xl' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-sm font-semibold text-purple-400 mb-2 block">{item.phase}</span>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  </div>
                  <span className="text-sm font-semibold px-4 py-2 rounded-full bg-white/10 text-white">
                    {item.status}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {item.items.map((roadmapItem, itemIndex) => (
                    <div key={itemIndex} className="flex items-start">
                      <span className="text-blue-400 mr-3 mt-1">•</span>
                      <span className="text-gray-300">{roadmapItem}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links & Community Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🌐 Join Our Community
            </h2>
            <p className="text-xl text-gray-300">
              Connect with us and stay updated on the latest developments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://discord.gg/analos" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">💬</span>
                    <span>Discord</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://x.com/launchonlos" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">🐦</span>
                    <span>X (Twitter)</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://t.me/launchonlos" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">📱</span>
                    <span>Telegram</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Dubie-eth/analos-nft-launcher" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">💻</span>
                    <span>GitHub</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://bridge.analos.io" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">🌉</span>
                    <span>Bridge Tokens</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://app.analos.io/dex" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">💱</span>
                    <span>Analos DEX</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://explorer.analos.io" 
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="text-xl">🔍</span>
                    <span>Block Explorer</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">🏪</span>
                    <span>Marketplace</span>
                  </Link>
                </li>
                <li>
                  <Link href="/explorer" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">🔍</span>
                    <span>Explorer</span>
                  </Link>
                </li>
                <li>
                  <Link href="/launch-collection" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">🚀</span>
                    <span>Launch Collection</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <h4 className="text-white font-semibold mb-4">Enhanced Features</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/otc-marketplace" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">💱</span>
                    <span>OTC Trading</span>
                  </Link>
                </li>
                <li>
                  <Link href="/airdrops" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">🎁</span>
                    <span>Airdrops</span>
                  </Link>
                </li>
                <li>
                  <Link href="/vesting" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span className="text-xl">⏰</span>
                    <span>Vesting</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Token Burn Banner */}
          <div className="mt-12 bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-2xl p-6 max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <span className="text-red-400 text-2xl">🔥</span>
              <span className="text-white font-bold text-xl">25% Token Burn</span>
              <span className="text-red-400 text-2xl">🔥</span>
            </div>
            <p className="text-gray-300">
              25% of all collected $LOS is burned for the culture, supporting the Analos ecosystem
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Launch Your NFT Collection?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the next generation of NFT creators on Analos blockchain
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/launch-collection"
              className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
              🚀 Start Building Now
            </Link>
            <Link
              href="/explorer"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 border border-white/20"
            >
              🔍 Explore Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}