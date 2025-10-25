'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_PROGRAMS, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';
import LOLWhitelistPromo from '@/components/LOLWhitelistPromo';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

const HomePage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [stats, setStats] = useState({
    totalMints: 0,
    totalRevenueLOS: 0,
    uniqueHolders: 0,
    last24hMints: 0,
    totalCollections: 0,
    totalTransactions: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Profile NFT specific stats
  const [profileNFTStats, setProfileNFTStats] = useState({
    minted: 0,
    remaining: 2222,
    whitelistEligible: 0,
    loading: true
  });

  // Load real platform stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/analytics/platform');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.analytics) {
            setStats(data.analytics);
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []);
  
  // Load Profile NFT stats
  useEffect(() => {
    const loadProfileNFTStats = async () => {
      try {
        // Get mint count
        const mintResponse = await fetch('/api/profile-nft/mint-count');
        if (mintResponse.ok) {
          const mintData = await mintResponse.json();
          // Get holder count
          const holderResponse = await fetch('/api/whitelist/holder-count');
          if (holderResponse.ok) {
            const holderData = await holderResponse.json();
            setProfileNFTStats({
              minted: mintData.minted || 0,
              remaining: mintData.remaining || 2222,
              whitelistEligible: holderData.whitelistEligible || 0,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error loading Profile NFT stats:', error);
        setProfileNFTStats(prev => ({ ...prev, loading: false }));
      }
    };
    loadProfileNFTStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadProfileNFTStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Admin wallet addresses - only these wallets can access admin
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
    // Add more admin wallets here if needed
  ];
  
  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  const programs = [
    {
      name: 'Mega NFT Launchpad Core',
      id: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
      description: 'Complete NFT launchpad with all features integrated',
      status: 'Active',
      color: 'purple'
    },
    {
      name: 'Price Oracle',
      id: ANALOS_PROGRAMS.PRICE_ORACLE.toString(),
      description: 'Real-time LOS price data for USD-pegged pricing',
      status: 'Active',
      color: 'blue'
    },
    {
      name: 'Token Launch',
      id: ANALOS_PROGRAMS.TOKEN_LAUNCH.toString(),
      description: 'Token launches with bonding curves and trading',
      status: 'Active',
      color: 'green'
    },
    {
      name: 'Rarity Oracle',
      id: ANALOS_PROGRAMS.RARITY_ORACLE.toString(),
      description: 'NFT rarity calculation and trait distribution',
      status: 'Active',
      color: 'orange'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgramColor = (color: string) => {
    switch (color) {
      case 'purple': return 'from-purple-500 to-purple-700';
      case 'blue': return 'from-blue-500 to-blue-700';
      case 'green': return 'from-green-500 to-green-700';
      case 'orange': return 'from-orange-500 to-orange-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Launch NFTs on 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}Analos
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Complete NFT launchpad ecosystem with token integration, staking rewards, 
            whitelist management, and democratic governance on the Analos blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/how-it-works" 
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Learn How It Works
            </Link>
            {isAdmin && (
              <Link 
                href="/admin-login" 
                className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured: Los Bros NFT Launch */}
      <section className="py-16 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-orange-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 md:p-12 border-2 border-purple-400/30 backdrop-blur-sm">
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* Left: Featured Los Bro PFP - Full Pixel Art */}
              <div className="md:w-1/2">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-cyan-400 relative group" style={{imageRendering: 'pixelated'}}>
                  {/* Vaporwave Horizontal Striped Background (matching actual PFP) */}
                  <div className="absolute inset-0" style={{
                    background: 'repeating-linear-gradient(0deg, #00BFFF 0px, #00BFFF 12px, #87CEEB 12px, #87CEEB 24px, #FF1493 24px, #FF1493 36px, #BA55D3 36px, #BA55D3 48px, #4B0082 48px, #4B0082 60px)'
                  }}></div>
                  
                  {/* Pixel Art Los Bro Character */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
                    
                    {/* Baseball Cap with LOL */}
                    <div className="mb-3">
                      <div className="bg-white px-6 py-3 border-4 border-black inline-block" style={{imageRendering: 'pixelated'}}>
                        <div className="text-4xl font-black text-black tracking-wider" style={{fontFamily: 'monospace'}}>
                          LOL
                        </div>
                      </div>
                      <div className="w-24 h-3 bg-cyan-400 border-4 border-black mx-auto -mt-1"></div>
                    </div>
                    
                    {/* Head with vaporwave gradient */}
                    <div className="w-48 h-48 bg-gradient-to-br from-cyan-400 via-blue-500 to-pink-500 border-4 border-black relative mb-4">
                      {/* Yellow square eyes */}
                      <div className="absolute top-16 left-10 w-10 h-10 bg-yellow-400 border-4 border-black">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black"></div>
                      </div>
                      <div className="absolute top-16 right-10 w-10 h-10 bg-yellow-400 border-4 border-black">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black"></div>
                      </div>
                      {/* Simple mouth line */}
                      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black"></div>
                    </div>
                    
                    {/* Pink/Purple Jacket */}
                    <div className="w-56 h-20 bg-gradient-to-r from-pink-500 to-purple-500 border-4 border-black relative">
                      {/* Checkered zipper down middle */}
                      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-6 flex flex-col">
                        <div className="h-5 bg-white border border-black"></div>
                        <div className="h-5 bg-blue-400 border border-black"></div>
                        <div className="h-5 bg-white border border-black"></div>
                        <div className="h-5 bg-blue-400 border border-black"></div>
                      </div>
                      {/* White/cyan shoulder stripes */}
                      <div className="absolute top-0 left-4 w-8 h-full bg-white border-2 border-black"></div>
                      <div className="absolute top-0 left-12 w-4 h-full bg-cyan-400"></div>
                      <div className="absolute top-0 right-4 w-8 h-full bg-white border-2 border-black"></div>
                      <div className="absolute top-0 right-12 w-4 h-full bg-cyan-400"></div>
                    </div>
                    
                    {/* Los Bros Title */}
                    <div className="mt-6 text-center">
                      <div className="text-4xl font-black text-white mb-1" style={{
                        textShadow: '3px 3px 0px rgba(138, 43, 226, 0.8), -1px -1px 0px rgba(0,0,0,0.5)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.15em'
                      }}>
                        LOS BROS
                      </div>
                      <div className="text-sm text-cyan-300 font-bold">#VAPORWAVE • 2,222 SUPPLY</div>
                    </div>
                  </div>
                  
                  {/* Pixel Badge */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 border-4 border-black px-8 py-3 animate-pulse">
                    <span className="text-black text-lg font-black tracking-wider" style={{fontFamily: 'monospace'}}>⚡ LIVE NOW ⚡</span>
                  </div>
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              {/* Right: Info */}
              <div className="md:w-1/2 space-y-6">
                <div>
                  <div className="inline-block bg-yellow-400/20 border border-yellow-400 rounded-full px-4 py-1 text-yellow-300 text-sm font-semibold mb-4">
                    🔥 FEATURED LAUNCH
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Los Bros NFT Collection
                  </h2>
                  <p className="text-lg text-gray-300 mb-6">
                    2,222 unique generative PFPs launching on Analos blockchain. Over 10,000 possible trait combinations with dynamic rarity system.
                  </p>
                </div>

                {/* Pricing Tiers */}
                <div className="bg-black/40 rounded-xl p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white mb-4">💎 Whitelist Pricing</h3>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-900/30 border border-yellow-400/30 rounded-lg">
                    <div>
                      <div className="text-yellow-300 font-semibold">🎖️ Team</div>
                      <div className="text-xs text-gray-400">50 mints</div>
                    </div>
                    <div className="text-green-400 font-bold">FREE</div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-900/30 border border-green-400/30 rounded-lg">
                    <div>
                      <div className="text-green-300 font-semibold">🎁 Community (1M+ $LOL)</div>
                      <div className="text-xs text-gray-400">500 mints • {profileNFTStats.whitelistEligible} eligible</div>
                    </div>
                    <div className="text-green-400 font-bold">290 LOS</div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-900/30 border border-blue-400/30 rounded-lg">
                    <div>
                      <div className="text-blue-300 font-semibold">💎 Early (100k+ $LOL)</div>
                      <div className="text-xs text-gray-400">150 mints</div>
                    </div>
                    <div className="text-blue-400 font-bold">2,100 LOS</div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-900/30 border border-purple-400/30 rounded-lg">
                    <div>
                      <div className="text-purple-300 font-semibold">🌍 Public Sale</div>
                      <div className="text-xs text-gray-400">1,522 mints</div>
                    </div>
                    <div className="text-white font-bold">4,200.69 LOS</div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/mint"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl text-center"
                  >
                    🎨 Mint Los Bro NFT
                  </Link>
                  <Link 
                    href="/marketplace"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-lg font-bold text-lg transition-all text-center"
                  >
                    🏪 View Marketplace
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profileNFTStats.minted}</div>
                    <div className="text-xs text-gray-400">Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{profileNFTStats.remaining}</div>
                    <div className="text-xs text-gray-400">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">69%</div>
                    <div className="text-xs text-gray-400">Rare+</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* LOL Token Holder Benefits */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LOLWhitelistPromo />
        </div>
      </section>

      {/* Live Platform Stats */}
      <section className="py-12 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            📊 Live Platform Stats from Analos Blockchain
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-green-400">
                {loadingStats ? '...' : stats.totalMints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 mt-1">Total Mints</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {loadingStats ? '...' : stats.uniqueHolders.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 mt-1">Unique Holders</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {loadingStats ? '...' : stats.last24hMints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 mt-1">24h Mints</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {loadingStats ? '...' : stats.totalCollections.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 mt-1">Collections</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-pink-400">
                {loadingStats ? '...' : stats.totalRevenueLOS.toFixed(2)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Total LOS Volume</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <div className="text-3xl font-bold text-orange-400">
                {loadingStats ? '...' : stats.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-300 mt-1">Transactions</div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/explorer" className="text-blue-400 hover:text-blue-300 text-sm">
              View Explorer →
            </Link>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Complete NFT Launchpad Platform
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-3">NFT Collections</h3>
              <p className="text-gray-300">
                Launch NFT collections with whitelist stages, rarity systems, and creator verification.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-white mb-3">Token Integration</h3>
              <p className="text-gray-300">
                NFT-to-Token mode with bonding curves, token claims, and burn mechanisms.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-3">Staking Rewards</h3>
              <p className="text-gray-300">
                Stake NFTs and LOS tokens to earn rewards from platform fees automatically.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-3">Whitelist System</h3>
              <p className="text-gray-300">
                3-tier whitelist system with incremental pricing and supply limits.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="text-xl font-bold text-white mb-3">Democratic Governance</h3>
              <p className="text-gray-300">
                CTO voting system allows community to democratically elect platform administrators.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-3">Admin Controls</h3>
              <p className="text-gray-300">
                Comprehensive admin controls for platform management and emergency protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Deployed Programs on Analos
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((program, index) => (
              <div key={program.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{program.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{program.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                        {program.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs text-white bg-gray-800/90 px-2 py-1 rounded font-bold border border-gray-600">
                    {program.id.slice(0, 8)}...{program.id.slice(-8)}
                  </code>
                  <a
                    href={ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD_CORE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Model Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Sustainable Revenue Model
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
              <div className="text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-xl font-bold text-white mb-3">NFT Minting Fees</h3>
                <p className="text-2xl font-bold text-purple-400 mb-2">2.5%</p>
                <p className="text-gray-300 text-sm">On all NFT mints</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-lg p-6 border border-blue-500/30">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-white mb-3">Token Launch Fees</h3>
                <p className="text-2xl font-bold text-blue-400 mb-2">5%</p>
                <p className="text-gray-300 text-sm">On token launches</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-600/20 to-orange-600/20 rounded-lg p-6 border border-green-500/30">
              <div className="text-center">
                <div className="text-4xl mb-4">💱</div>
                <h3 className="text-xl font-bold text-white mb-3">Trading Fees</h3>
                <p className="text-2xl font-bold text-green-400 mb-2">1%</p>
                <p className="text-gray-300 text-sm">On secondary trading</p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg p-6 border border-emerald-500/30 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">30% of All Fees → LOS Holders</h3>
              <p className="text-gray-300">
                Automatic distribution to staked LOS holders creates sustainable passive income
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Contract Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Official Collection Contract
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">LaunchOnLos Collection</h3>
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <code className="text-green-400 text-lg font-mono break-all">
                ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6
              </code>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              This is the official contract address for the LaunchOnLos NFT collection on Analos.
            </p>
            <a
              href="https://explorer.analos.io/address/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View on Explorer →
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Launch Your Collection?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the future of NFT launches on the Analos blockchain with our complete platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/how-it-works" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Learn How It Works
            </Link>
            {isAdmin && (
              <Link 
                href="/admin-login" 
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold transition-colors border border-white/20"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Analos NFT Launchpad</h3>
              <p className="text-gray-300 text-sm">
                Complete NFT launchpad ecosystem on the Analos blockchain with integrated token economics, 
                staking rewards, and democratic governance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
                {isAdmin && (
                  <li><Link href="/admin-login" className="text-gray-300 hover:text-white transition-colors">Admin Dashboard</Link></li>
                )}
                <li><a href="https://github.com/Dubie-eth/analos-programs" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">Verify Programs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Security: support@launchonlos.fun</li>
                <li><a href="https://x.com/launchonlos" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter: @launchonlos</a></li>
                <li><a href="https://t.me/launchonlos" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Telegram: t.me/launchonlos</a></li>
                <li><a href="https://analos.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Analos Network: analos.io</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Important Disclaimer</h4>
              <p className="text-gray-300 text-sm">
                This platform is for educational and entertainment purposes. Cryptocurrency and NFT investments carry significant risk. 
                Past performance does not guarantee future results. Always do your own research and never invest more than you can afford to lose. 
                The Analos NFT Launchpad platform and LaunchOnLos collection are experimental technologies. Use at your own risk.
              </p>
            </div>
            <div className="text-center text-sm text-gray-400">
              <p>&copy; 2025 Analos NFT Launchpad. All rights reserved.</p>
              <p className="mt-2">
                Built on <a href="https://analos.io" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Analos Network</a> • 
                Powered by <a href="https://github.com/Dubie-eth/analos-programs" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Open Source</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;