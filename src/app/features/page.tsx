'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';

export default function FeaturesPage() {
  const { theme } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'NFT Collection Creation',
      description: 'Create and deploy your own NFT collections with custom traits, rarity systems, and metadata.',
      icon: '🎨',
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
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeFeature === index
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{feature.icon}</span>
              {feature.title}
            </button>
          ))}
        </div>

        {/* Active Feature Display */}
        <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{features[activeFeature].icon}</div>
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {features[activeFeature].title}
            </h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {features[activeFeature].description}
            </p>
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
            
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-6`}>
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Coming Soon
              </h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                This feature is currently in development and will be available soon. 
                Connect your wallet to get early access when it launches.
              </p>
              <div className="mt-4">
                <div className={`w-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-2`}>
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  75% Complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ready to Get Started?
          </h3>
          <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Connect your wallet to access these powerful features and start building your NFT empire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </div>
      </div>
    </div>
  );
}
