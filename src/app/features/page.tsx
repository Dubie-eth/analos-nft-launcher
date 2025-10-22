'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@solana/wallet-adapter-react';

interface Feature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  icon: string;
  completion_percentage: number;
  access_level: 'locked' | 'beta' | 'public';
  status: 'development' | 'testing' | 'live' | 'deprecated';
  is_visible: boolean;
  details: string[];
  deployment_info?: any;
}

export default function FeaturesPage() {
  const { theme } = useTheme();
  const { publicKey, connected } = useWallet();
  const [activeFeature, setActiveFeature] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'tracking'>('features');
  const [betaStats, setBetaStats] = useState<any>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch beta stats
  useEffect(() => {
    const fetchBetaStats = async () => {
      try {
        const response = await fetch('/api/beta-signup');
        if (response.ok) {
          const data = await response.json();
          setBetaStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching beta stats:', error);
      }
    };

    fetchBetaStats();
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Fallback features if API fails
  const fallbackFeatures: Feature[] = [
    {
      id: '1',
      feature_key: 'triple_redundancy_metadata',
      feature_name: '🛡️ Triple Redundancy Metadata Storage',
      description: 'Enterprise-grade metadata storage with triple redundancy: Blockchain + IPFS + On-chain backup. Your NFT data survives forever.',
      icon: '🛡️',
      completion_percentage: 100,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Layer 1: Analos Blockchain (PERMANENT) - Core data lives forever',
        'Layer 2: IPFS/Pinata (FAST) - Full metadata JSON, globally distributed',
        'Layer 3: On-Chain Backup (SURVIVES INTERNET OUTAGES) - Complete fallback',
        'Metaplex standard compatibility - Works with all wallets',
        'Auto-metadata creation on every mint',
        'Backfill script for existing NFTs'
      ]
    },
    {
      id: '2',
      feature_key: 'nft_collection_creation',
      feature_name: 'NFT Collection Creation',
      description: 'Create and deploy your own NFT collections with custom traits, rarity systems, and metadata.',
      icon: '🎨',
      completion_percentage: 95, // NFT Launchpad Core is deployed and functional
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Custom trait layers and rarity weights',
        'Automated metadata generation',
        'On-chain collection deployment',
        'Royalty management',
        'Batch minting capabilities'
      ]
    },
    {
      id: '3',
      feature_key: 'advanced_marketplace',
      feature_name: 'Advanced Marketplace',
      description: 'Trade NFTs with advanced features including auctions, offers, and OTC trading.',
      icon: '🏪',
      completion_percentage: 85,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Auction and fixed-price listings',
        'Make offers and counter-offers',
        'OTC (Over-the-Counter) trading',
        'Collection-based trading',
        'Advanced filtering and search'
      ]
    },
    {
      id: '4',
      feature_key: 'token_swapping',
      feature_name: 'Token Swapping',
      description: 'Swap between different tokens with our integrated DEX functionality.',
      icon: '🔄',
      completion_percentage: 70,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Multi-token support',
        'Slippage protection',
        'Price impact warnings',
        'Liquidity pool integration',
        'Real-time price feeds'
      ]
    },
    {
      id: '5',
      feature_key: 'nft_staking',
      feature_name: 'NFT Staking',
      description: 'Stake your NFTs to earn rewards and participate in governance.',
      icon: '💰',
      completion_percentage: 90,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Flexible staking periods',
        'Reward calculation algorithms',
        'Governance participation',
        'Auto-compounding rewards',
        'Risk-free unstaking'
      ]
    },
    {
      id: '6',
      feature_key: 'token_vesting',
      feature_name: 'Token Vesting',
      description: 'Manage token vesting schedules for team members and investors.',
      icon: '⏰',
      completion_percentage: 80,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Custom vesting schedules',
        'Cliff periods and linear release',
        'Multi-recipient support',
        'Vesting contract deployment',
        'Real-time vesting tracking'
      ]
    },
    {
      id: '7',
      feature_key: 'token_locking',
      feature_name: 'Token Locking',
      description: 'Lock tokens for security, governance, or liquidity provision.',
      icon: '🔒',
      completion_percentage: 75,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Flexible lock periods',
        'Multi-token support',
        'Governance integration',
        'Liquidity lock features',
        'Emergency unlock mechanisms'
      ]
    },
    {
      id: '8',
      feature_key: 'evolving_nfts',
      feature_name: 'Evolving NFTs',
      description: 'Create NFTs that evolve and change based on external data and user interactions.',
      icon: '🧬',
      completion_percentage: 40,
      access_level: 'locked',
      status: 'development',
      is_visible: true,
      details: [
        'Dynamic metadata updates',
        'External data integration',
        'User interaction triggers',
        'Evolutionary algorithms',
        'Real-time NFT transformation'
      ]
    },
    {
      id: '9',
      feature_key: 'living_portfolio',
      feature_name: 'Living Portfolio',
      description: 'Track your NFT and token portfolio with real-time updates and analytics.',
      icon: '📊',
      completion_percentage: 60,
      access_level: 'locked',
      status: 'development',
      is_visible: true,
      details: [
        'Real-time portfolio tracking',
        'Performance analytics',
        'P&L calculations',
        'Historical data',
        'Portfolio optimization suggestions'
      ]
    },
    {
      id: '10',
      feature_key: 'airdrop_system',
      feature_name: 'Airdrop System',
      description: 'Distribute tokens and NFTs to your community with our airdrop platform.',
      icon: '🎁',
      completion_percentage: 85,
      access_level: 'public',
      status: 'live',
      is_visible: true,
      details: [
        'Whitelist management',
        'Batch distribution',
        'Conditional airdrops',
        'Community verification',
        'Distribution analytics'
      ]
    }
  ];

  // Fetch features from API - DISABLED to prevent errors
  useEffect(() => {
    // Use fallback features immediately to prevent API errors
    setFeatures(fallbackFeatures);
    setLoading(false);
  }, [mounted]);

  // Filter features based on completion and access level
  const getFilteredFeatures = () => {
    const availableFeatures = features.length > 0 ? features : fallbackFeatures;
    return availableFeatures.filter(feature => feature.is_visible);
  };

  const filteredFeatures = getFilteredFeatures();

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

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === 'features'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-6 py-3 rounded-md font-semibold transition-all ${
                activeTab === 'tracking'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feature Tracking
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'features' && (
          <>
            {/* Feature Navigation */}
            {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading features...
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filteredFeatures.map((feature, index) => (
              <button
                key={feature.id}
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
                <span className="text-sm sm:text-base">{feature.feature_name}</span>
                {feature.access_level === 'public' && feature.status === 'live' && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    theme === 'dark' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    LIVE
                  </span>
                )}
                {feature.access_level === 'beta' && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    theme === 'dark' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    BETA
                  </span>
                )}
                {feature.access_level === 'locked' && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    DEV
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Active Feature Display */}
        {!loading && filteredFeatures.length > 0 && (
          <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{filteredFeatures[activeFeature]?.icon}</div>
              <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {filteredFeatures[activeFeature]?.feature_name}
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {filteredFeatures[activeFeature]?.description}
              </p>
              
              {/* Status Badge */}
              <div className="mt-4">
                {filteredFeatures[activeFeature]?.access_level === 'public' && filteredFeatures[activeFeature]?.status === 'live' ? (
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    theme === 'dark' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    LIVE ON ANALOS BLOCKCHAIN
                  </span>
                ) : filteredFeatures[activeFeature]?.access_level === 'beta' ? (
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    theme === 'dark' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    🧪 BETA ACCESS
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-500 text-white'
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
                  {filteredFeatures[activeFeature]?.details.map((detail, index) => (
                    <li key={index} className={`flex items-start ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-green-500 mr-3 mt-1">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {filteredFeatures[activeFeature]?.status === 'live' ? 'Deployment Status' : 'Development Progress'}
                </h3>
                
                {filteredFeatures[activeFeature]?.status === 'live' ? (
                  <div>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      This feature is fully deployed on the Analos blockchain and ready for use.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Deployment Status</span>
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                          {filteredFeatures[activeFeature]?.completion_percentage}% Complete
                        </span>
                      </div>
                      <div className={`w-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-3`}>
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${filteredFeatures[activeFeature]?.completion_percentage}%` }}
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
                          {filteredFeatures[activeFeature]?.completion_percentage}% Complete
                        </span>
                      </div>
                      <div className={`w-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-3`}>
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${filteredFeatures[activeFeature]?.completion_percentage}%` }}
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
        )}

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
            {!loading && filteredFeatures.length > 0 && (
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-medium ${
                theme === 'dark' 
                  ? 'bg-green-900/30 text-green-300 border border-green-700' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="mr-2">
                  {filteredFeatures.filter(f => f.access_level === 'public' && f.status === 'live').length} Features Live
                </span>
                <span className="text-xs opacity-75">
                  • {filteredFeatures.filter(f => f.access_level === 'beta').length} Beta
                </span>
                <span className="text-xs opacity-75">
                  • {filteredFeatures.filter(f => f.access_level === 'locked').length} In Development
                </span>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Feature Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Feature Request Tracking
              </h2>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                See what features our community is most excited about and track development progress.
              </p>
            </div>

            {/* Stats Overview */}
            {betaStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">{betaStats.totalSignups}</div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Beta Users</div>
                  </div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">{betaStats.uniqueFeatures.length}</div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Feature Requests</div>
                  </div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500 mb-2">
                      {Object.values(betaStats.featureVotes).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)}
                    </div>
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Votes</div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Votes */}
            {betaStats && betaStats.featureVotes && (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Feature Request Votes
                </h3>
                <div className="space-y-4">
                  {Object.entries(betaStats.featureVotes)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([feature, votes]) => {
                      const totalVotes = Object.values(betaStats.featureVotes).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0);
                      const percentage = totalVotes > 0 ? ((votes as number) / totalVotes) * 100 : 0;
                      
                      return (
                        <div key={feature} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {votes} votes ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Recent Signups */}
            {betaStats && betaStats.recentSignups && betaStats.recentSignups.length > 0 && (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mt-6`}>
                <h3 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Recent Beta Signups
                </h3>
                <div className="space-y-3">
                  {betaStats.recentSignups.map((signup: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-mono text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {signup.walletAddress.slice(0, 8)}...{signup.walletAddress.slice(-4)}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(signup.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {signup.requestedFeatures.map((feature: string) => (
                          <span key={feature} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                            {feature.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="text-center mt-8">
              <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Want to influence what we build next?
              </p>
              <a 
                href="/beta-signup"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Join Beta Program
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
