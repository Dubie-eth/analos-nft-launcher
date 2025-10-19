'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useWallet } from '@solana/wallet-adapter-react';

export default function FeaturesPage() {
  const { theme } = useTheme();
  const { publicKey, connected } = useWallet();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'NFT Collection Creation',
      description: 'Create and deploy your own NFT collections with custom traits, rarity systems, and metadata.',
      icon: '🎨',
      completion: 95, // NFT Launchpad Core is deployed and functional
      status: 'live',
      details: [
        'Custom trait layers and rarity weights',
        'Automated metadata generation',
        'On-chain collection deployment',
        'Royalty management',
        'Batch minting capabilities'
      ]
    },
    {
      title: 'Advanced Marketplace',
      description: 'Trade NFTs with advanced features including auctions, offers, and OTC trading.',
      icon: '🏪',
      completion: 85, // OTC Enhanced program is deployed
      status: 'live',
      details: [
        'Auction and fixed-price listings',
        'Make offers and counter-offers',
        'OTC (Over-the-Counter) trading',
        'Collection-based trading',
        'Advanced filtering and search'
      ]
    },
    {
      title: 'Token Swapping',
      description: 'Swap between different tokens with our integrated DEX functionality.',
      icon: '🔄',
      completion: 70, // Token Launch program is deployed
      status: 'live',
      details: [
        'Multi-token support',
        'Slippage protection',
        'Price impact warnings',
        'Liquidity pool integration',
        'Real-time price feeds'
      ]
    },
    {
      title: 'NFT Staking',
      description: 'Stake your NFTs to earn rewards and participate in governance.',
      icon: '💰',
      completion: 90, // Built into NFT Launchpad Core
      status: 'live',
      details: [
        'Flexible staking periods',
        'Reward calculation algorithms',
        'Governance participation',
        'Auto-compounding rewards',
        'Risk-free unstaking'
      ]
    },
    {
      title: 'Token Vesting',
      description: 'Manage token vesting schedules for team members and investors.',
      icon: '⏰',
      completion: 80, // Vesting Enhanced program is deployed
      status: 'live',
      details: [
        'Custom vesting schedules',
        'Cliff periods and linear release',
        'Multi-recipient support',
        'Vesting contract deployment',
        'Real-time vesting tracking'
      ]
    },
    {
      title: 'Token Locking',
      description: 'Lock tokens for security, governance, or liquidity provision.',
      icon: '🔒',
      completion: 75, // Token Lock Enhanced program is deployed
      status: 'live',
      details: [
        'Flexible lock periods',
        'Multi-token support',
        'Governance integration',
        'Liquidity lock features',
        'Emergency unlock mechanisms'
      ]
    },
    {
      title: 'Evolving NFTs',
      description: 'Create NFTs that evolve and change based on external data and user interactions.',
      icon: '🧬',
      completion: 40, // In development
      status: 'development',
      details: [
        'Dynamic metadata updates',
        'External data integration',
        'User interaction triggers',
        'Evolutionary algorithms',
        'Real-time NFT transformation'
      ]
    },
    {
      title: 'Living Portfolio',
      description: 'Track your NFT and token portfolio with real-time updates and analytics.',
      icon: '📊',
      completion: 60, // Basic implementation exists
      status: 'development',
      details: [
        'Real-time portfolio tracking',
        'Performance analytics',
        'P&L calculations',
        'Historical data',
        'Portfolio optimization suggestions'
      ]
    },
    {
      title: 'Airdrop System',
      description: 'Distribute tokens and NFTs to your community with our airdrop platform.',
      icon: '🎁',
      completion: 85, // Airdrop Enhanced program is deployed
      status: 'live',
      details: [
        'Whitelist management',
        'Batch distribution',
        'Conditional airdrops',
        'Community verification',
        'Distribution analytics'
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Platform Features
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Discover the powerful features that make our NFT platform the ultimate destination for creators, collectors, and traders.
          </p>
        </div>

        {/* Feature Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 border ${
                activeFeature === index
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                    : 'bg-blue-500 text-white border-blue-400 shadow-lg'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
              }`}
            >
              <span className="mr-2">{feature.icon}</span>
              <span className="text-sm sm:text-base">{feature.title}</span>
              {feature.status === 'live' && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  theme === 'dark' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  LIVE
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Feature Display */}
        <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{features[activeFeature].icon}</div>
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {features[activeFeature].title}
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {features[activeFeature].description}
            </p>
            
            {/* Status Badge */}
            <div className="mt-4">
              {features[activeFeature].status === 'live' ? (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  theme === 'dark' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  LIVE ON ANALOS BLOCKCHAIN
                </span>
              ) : (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  theme === 'dark' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-500 text-white'
                }`}>
                  🚧 IN DEVELOPMENT
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Key Features
              </h3>
              <ul className="space-y-3">
                {features[activeFeature].details.map((detail, index) => (
                  <li key={index} className={`flex items-start ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {features[activeFeature].status === 'live' ? 'Deployment Status' : 'Development Progress'}
              </h3>
              
              {features[activeFeature].status === 'live' ? (
                <div>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    This feature is fully deployed on the Analos blockchain and ready for use.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Deployment Status</span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        {features[activeFeature].completion}% Complete
                      </span>
                    </div>
                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-3`}>
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${features[activeFeature].completion}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      ✅ Program deployed and verified on Analos mainnet
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    This feature is currently in development and will be available soon.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Development Progress</span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {features[activeFeature].completion}% Complete
                      </span>
                    </div>
                    <div className={`w-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-3`}>
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${features[activeFeature].completion}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      🚧 In active development
                    </p>
                  </div>
                </div>
              )}
              
              {!connected && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 Connect your wallet to access this feature when available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ready to Get Started?
          </h3>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {connected 
              ? 'Your wallet is connected! Explore our live features on the Analos blockchain.'
              : 'Connect your wallet to access these powerful features and start building your NFT empire.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {connected ? (
              <>
                <button className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}>
                  🚀 Launch Collection
                </button>
                <button className={`px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-blue-500 text-blue-400 hover:bg-blue-900/20'
                    : 'border-blue-400 text-blue-600 hover:bg-blue-50'
                }`}>
                  📊 View Portfolio
                </button>
              </>
            ) : (
              <>
                <button className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  Connect Wallet
                </button>
                <button className={`px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  Learn More
                </button>
              </>
            )}
          </div>
          
          {/* Live Features Summary */}
          <div className="mt-12">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-medium ${
              theme === 'dark' 
                ? 'bg-green-900/30 text-green-300 border border-green-700' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="mr-2">7 Features Live</span>
              <span className="text-xs opacity-75">• 2 In Development</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
