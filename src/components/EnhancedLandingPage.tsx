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
                      7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
                    </div>
                    <a
                      href="https://explorer.analos.io/address/7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk"
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