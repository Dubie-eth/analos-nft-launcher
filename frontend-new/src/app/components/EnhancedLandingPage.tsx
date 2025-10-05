'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collectionStatsService, CollectionStats } from '@/lib/collection-stats-service';
import { isAuthorizedAdmin } from '@/lib/admin-config';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletDownloadSection from './WalletDownloadSection';
import { adminControlService } from '@/lib/admin-control-service';
import { feeManagementService } from '@/lib/fee-management-service';
import { blockchainDataService } from '@/lib/blockchain-data-service';

export default function EnhancedLandingPage() {
  const { publicKey, connected } = useWallet();
  const isAdmin = connected && publicKey && isAuthorizedAdmin(publicKey.toString());
  
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentRoadmapItem, setCurrentRoadmapItem] = useState(0);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [featuredCollection, setFeaturedCollection] = useState({
    name: 'LosBros Collection',
    totalSupply: 2222,
    mintPrice: 4200.69,
    paymentToken: 'LOS',
    currentSupply: 0
  });

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

  // Fetch collection statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await collectionStatsService.getCollectionStats();
        setCollectionStats(stats);
      } catch (error) {
        console.error('Error fetching collection stats:', error);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const statsInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(statsInterval);
  }, []);

  // Fetch featured collection data
  useEffect(() => {
    const fetchFeaturedCollection = async () => {
      try {
        console.log('📊 Fetching featured collection data for landing page...');
        
        // Get "The LosBros" featured collection data from admin control service
        const collection = await adminControlService.getCollection('The LosBros');
        if (collection) {
          const feeBreakdown = feeManagementService.getFeeBreakdown('The LosBros');
          
          // Try to get current supply from blockchain
          let currentSupply = 0;
          try {
            const blockchainData = await blockchainDataService.getCollectionData('The LosBros');
            currentSupply = blockchainData?.currentSupply || 0;
          } catch (error) {
            console.warn('Failed to fetch blockchain supply for featured collection:', error);
          }
          
          setFeaturedCollection({
            name: collection.displayName,
            totalSupply: collection.totalSupply,
            mintPrice: feeBreakdown.totalPrice,
            paymentToken: collection.paymentToken,
            currentSupply: currentSupply
          });
          
          console.log('✅ Featured collection data updated:', {
            name: collection.displayName,
            totalSupply: collection.totalSupply,
            mintPrice: feeBreakdown.totalPrice,
            currentSupply
          });
        }
      } catch (error) {
        console.error('Error fetching featured collection data:', error);
      }
    };

    fetchFeaturedCollection();
    
    // Refresh every 60 seconds
    const collectionInterval = setInterval(fetchFeaturedCollection, 60000);
    return () => clearInterval(collectionInterval);
  }, []);

  const features = [
    {
      title: "🎨 NFT Generator",
      description: "Create unique NFT collections with custom traits and rarity",
      image: "/features/launch.png",
      details: [
        "Upload trait folders for automatic processing",
        "Set custom rarity percentages",
        "Real-time preview generation",
        "Batch processing for thousands of NFTs"
      ]
    },
    {
      title: "🔍 NFT Explorer",
      description: "Discover, explore, and analyze NFT collections on Analos",
      image: "/features/explorer.png",
      details: [
        "Advanced collection browsing",
        "Real-time metadata viewing",
        "Holder analytics and insights",
        "Collection performance tracking"
      ]
    },
    {
      title: "🏪 Marketplace",
      description: "Trade NFTs with integrated marketplace features",
      image: "/features/marketplace.png",
      details: [
        "Buy and sell NFTs directly",
        "Auction and fixed-price listings",
        "Collection-based trading",
        "Integrated payment systems"
      ]
    },
    {
      title: "🚀 Launchpad",
      description: "Professional NFT launch platform with advanced features",
      image: "/features/launchpad.png",
      details: [
        "Versatile minting options",
        "Whitelist management",
        "Bonding curve launches",
        "Collection editing tools"
      ]
    },
    {
      title: "💰 Multi-Token Payments",
      description: "Pay with any Analos token + small $LOS fee",
      image: "/features/payments.png",
      details: [
        "Support for USDC, SOL, and other tokens",
        "Automatic token detection",
        "Optimized gas fees",
        "Secure payment processing"
      ]
    },
    {
      title: "🛡️ Advanced Security",
      description: "Enterprise-grade security with comprehensive fail-safes",
      image: "/features/security.png",
      details: [
        "Blockchain verification",
        "Smart contract references",
        "Transaction retry systems",
        "Real-time monitoring"
      ]
    }
  ];

  const tokenIncentives = [
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
  ];

  const roadmapItems = [
    {
      quarter: "Week 1-2",
      status: "Completed",
      features: [
        "✅ Core NFT Minting System",
        "✅ Wallet Integration (Backpack)",
        "✅ Basic Collection Management",
        "✅ $LOL Token Integration"
      ],
      color: "green"
    },
    {
      quarter: "Week 3-4", 
      status: "Completed",
      features: [
        "✅ Advanced NFT Generator",
        "✅ Multi-token Payment System",
        "✅ Priority-based Whitelist System",
        "✅ Real-time Blockchain Analytics"
      ],
      color: "green"
    },
    {
      quarter: "Week 5-6",
      status: "In Progress", 
      features: [
        "🔄 NFT Explorer v2.0",
        "🔄 Bonding Curve Launcher",
        "🔄 Advanced Collection Settings",
        "🔄 Token Metadata Verification"
      ],
      color: "blue"
    },
    {
      quarter: "Week 7-8",
      status: "Planned",
      features: [
        "📋 Marketplace Integration",
        "📋 Mobile App (iOS/Android)",
        "📋 Cross-chain Bridging",
        "📋 Enterprise APIs"
      ],
      color: "purple"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Download Backpack Wallet",
      description: "The recommended wallet for Analos blockchain",
      details: [
        "Visit backpack.app to download",
        "Install browser extension",
        "Create or import wallet",
        "Add Analos custom RPC"
      ],
      link: "https://backpack.app",
      linkText: "Download Backpack"
    },
    {
      step: "2", 
      title: "Configure Analos Network",
      description: "Add Analos as a custom network",
      details: [
        "Network Name: Analos",
        "RPC URL: https://rpc.analos.io",
        "Chain ID: 204",
        "Currency Symbol: LOS"
      ],
      code: `Network Name: Analos
RPC URL: https://rpc.analos.io
Chain ID: 204
Currency Symbol: LOS
Block Explorer: https://explorer.analos.io`
    },
    {
      step: "3",
      title: "Bridge Tokens",
      description: "Transfer tokens from Ethereum to Analos",
      details: [
        "Visit bridge.analos.io",
        "Connect your wallet",
        "Select tokens to bridge",
        "Confirm transaction"
      ],
      links: [
        { url: "https://bridge.analos.io", text: "Bridge Tokens" },
        { url: "https://app.analos.io/dex", text: "Buy $LOS on DEX" }
      ]
    },
    {
      step: "4",
      title: "Start Creating",
      description: "Create and deploy your NFT collection",
      details: [
        "Connect your Backpack wallet",
        "Upload trait folders", 
        "Configure rarity and pricing",
        "Deploy to Analos blockchain"
      ],
      link: "/admin",
      linkText: "Start Creating"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Beta Tab - Moved to top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full shadow-lg border border-white/20">
          <div className="flex items-center space-x-1">
            <span className="text-xs">🚀</span>
            <span className="text-xs font-semibold">BETA</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                LosLauncher
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-200 mb-6 max-w-4xl mx-auto font-light">
              The Complete <span className="text-orange-400 font-semibold">NFT Ecosystem</span>
            </p>
            <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create, explore, trade, and launch professional NFT collections with advanced features, 
              multi-token payments, and comprehensive analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAdmin ? (
                <Link 
                  href="/admin"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  🎨 Start Creating
                </Link>
              ) : (
                <Link 
                  href="/launch-collection"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  🚀 Launch Collection
                </Link>
              )}
              <Link 
                href="/collections"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🎨 Browse Collections
              </Link>
              <Link 
                href="/explorer"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🔍 Explore NFTs
              </Link>
              <Link 
                href="#features"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
              >
                ✨ View Features
              </Link>
            </div>

            {/* Token Burn Banner */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-400/30 rounded-2xl p-6 max-w-xl mx-auto backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <span className="text-red-400 text-xl">🔥</span>
                <span className="text-white font-bold text-lg">25% Token Burn</span>
                <span className="text-red-400 text-xl">🔥</span>
              </div>
              <p className="text-gray-300 text-sm">
                25% of all collected $LOS is burned for the culture, supporting the Analos ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Holder Incentives */}
      <section className="py-24 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              💎 $LOL Holder Benefits
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Hold $LOL tokens to unlock exclusive benefits, discounts, and most importantly - <strong className="text-purple-400">governance voting rights</strong> to help shape our platform's future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {tokenIncentives.map((incentive, index) => (
              <div
                key={index}
                className={`bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
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

      {/* Featured Upcoming Mint */}
      <section className="py-24 bg-gradient-to-b from-gray-900/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🌟 Featured Upcoming Mint
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Don't miss out on exclusive collections launching on our platform
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-400/20 rounded-3xl p-12 backdrop-blur-sm">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">{featuredCollection.name}</h3>
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
                    <div className="text-3xl font-bold text-white mb-2">{featuredCollection.totalSupply.toLocaleString()}</div>
                    <div className="text-gray-400">Total Supply</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="text-3xl font-bold text-white mb-2">{featuredCollection.mintPrice.toFixed(2)}</div>
                    <div className="text-gray-400">${featuredCollection.paymentToken} Mint Price</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/collections"
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

      {/* Wallet Download & Beta Warning Section */}
      <section className="py-8 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <WalletDownloadSection />
        </div>
      </section>

      {/* Platform Features */}
      <section id="features" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🌟 Complete Platform Ecosystem
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade tools for creating, deploying, exploring, and trading NFTs
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                    currentFeature === index
                      ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-400">
                        <span className="text-green-400 mr-2">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">{features[currentFeature].title.split(' ')[0]}</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {features[currentFeature].title}
                </h3>
                <p className="text-gray-300 text-lg mb-6">
                  {features[currentFeature].description}
                </p>
                
                {/* Special content for different features */}
                {currentFeature === 0 && (
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-xl p-6">
                    <h4 className="text-white font-bold mb-4">Pricing Tiers</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-white font-semibold">Starter</div>
                        <div className="text-purple-400">87 $LOS</div>
                        <div className="text-gray-400">$0.12/NFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">Professional</div>
                        <div className="text-purple-400">108 $LOS</div>
                        <div className="text-gray-400">$0.15/NFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">Enterprise</div>
                        <div className="text-purple-400">130 $LOS</div>
                        <div className="text-gray-400">$0.18/NFT</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentFeature === 1 && (
                  <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/50 rounded-xl p-6">
                    <h4 className="text-white font-bold mb-4">Explorer Features</h4>
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between mb-2">
                        <span>Collections:</span>
                        <span className="text-green-400">50+</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>NFTs Tracked:</span>
                        <span className="text-green-400">10,000+</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Real-time Updates:</span>
                        <span className="text-green-400">✓</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 Development Roadmap
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From concept to production in just 4 weeks - Building the future of NFT minting on Analos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmapItems.map((item, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  currentRoadmapItem === index
                    ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                    : 'border-white/20 bg-white/10'
                }`}
                onClick={() => setCurrentRoadmapItem(index)}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 ${
                    item.color === 'green' ? 'bg-green-500' :
                    item.color === 'blue' ? 'bg-blue-500' :
                    item.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}>
                    {item.quarter.split(' ')[0]}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.quarter}</h3>
                  <p className={`text-sm font-semibold mb-4 ${
                    item.color === 'green' ? 'text-green-400' :
                    item.color === 'blue' ? 'text-blue-400' :
                    item.color === 'purple' ? 'text-purple-400' : 'text-orange-400'
                  }`}>
                    {item.status}
                  </p>
                  
                  <ul className="space-y-2 text-sm">
                    {item.features.map((feature, i) => (
                      <li key={i} className="text-gray-300">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          {/* Development Speed Highlight */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                ⚡ Lightning Fast Development
              </h3>
              <p className="text-lg text-gray-300 mb-4">
                From concept to a fully functional NFT ecosystem in just <span className="text-green-400 font-bold">4 weeks</span>
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">100+</div>
                  <div className="text-sm text-gray-300">Features Implemented</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">15+</div>
                  <div className="text-sm text-gray-300">Components Built</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">5+</div>
                  <div className="text-sm text-gray-300">Services Integrated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              💰 Tokenomics & Economics
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Sustainable tokenomics designed for long-term ecosystem growth
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white/10 rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Revenue Distribution</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Platform Operations</span>
                  <span className="text-white font-semibold">40%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Community Rewards</span>
                  <span className="text-white font-semibold">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Development Fund</span>
                  <span className="text-white font-semibold">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Liquidity Pool</span>
                  <span className="text-white font-semibold">15%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Burn Mechanism</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Platform Fees</span>
                  <span className="text-red-400 font-semibold">25% Burned</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Generation Services</span>
                  <span className="text-red-400 font-semibold">25% Burned</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Marketplace Fees</span>
                  <span className="text-red-400 font-semibold">25% Burned</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Burn Rate</span>
                  <span className="text-red-400 font-semibold">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 How to Get Started
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Follow these simple steps to start creating NFT collections on Analos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`bg-white/10 rounded-2xl p-6 border transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-400 text-sm">
                        <span className="text-green-400 mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {step.code && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <pre className="text-green-400 text-xs whitespace-pre-wrap">{step.code}</pre>
                    </div>
                  )}

                  {step.link && (
                    <a
                      href={step.link}
                      target={step.link.startsWith('http') ? '_blank' : '_self'}
                      rel={step.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      {step.linkText}
                    </a>
                  )}

                  {step.links && (
                    <div className="space-y-2">
                      {step.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Launch Your NFT Collection?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators building on Analos blockchain
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAdmin ? (
              <Link 
                href="/admin"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
              >
                🎨 Start Creating Now
              </Link>
            ) : (
              <Link 
                href="/launch-collection"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
              >
                🎨 Start Minting Now
              </Link>
            )}
            <Link 
              href="/explorer"
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
            >
              🔍 Explore Collections
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">
                {collectionStats ? collectionStatsService.formatCollectionCount(collectionStats.collectionsLaunched) : '1+'}
              </div>
              <div className="text-gray-400">Collections Launched</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {collectionStats ? collectionStatsService.formatNFTCount(collectionStats.totalNFTsMinted) : '50+'}
              </div>
              <div className="text-gray-400">NFTs Minted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {collectionStats ? `${collectionStats.losBurned}K` : '25K'}
              </div>
              <div className="text-gray-400">$LOS Burned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {collectionStats ? collectionStats.platformUptime : '99.9%'}
              </div>
              <div className="text-gray-400">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">LosLauncher</h3>
              <p className="text-gray-400">
                The complete NFT ecosystem for Analos blockchain. Built with ❤️ for the community.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                {isAdmin && <li><Link href="/admin" className="text-gray-400 hover:text-white">Admin Panel</Link></li>}
                <li><Link href="/explorer" className="text-gray-400 hover:text-white">NFT Explorer</Link></li>
                <li><Link href="/collections" className="text-gray-400 hover:text-white">Browse Collections</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2">
                <li><a href="https://discord.gg/analos" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Discord</a></li>
                <li><a href="https://twitter.com/AnalosNetwork" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                <li><a href="https://github.com/Dubie-eth/analos-nft-launcher" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://bridge.analos.io" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Bridge Tokens</a></li>
                <li><a href="https://app.analos.io/dex" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Analos DEX</a></li>
                <li><a href="https://explorer.analos.io" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Block Explorer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LosLauncher. Built for the Analos ecosystem. All rights reserved.</p>
            <p className="mt-2 text-sm">
              🚀 <strong>Beta Version:</strong> We're continuously improving LosLauncher. Thank you for being part of our journey!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
