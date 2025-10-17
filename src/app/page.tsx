'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_PROGRAMS, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

const HomePage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  
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
                  <code className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
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