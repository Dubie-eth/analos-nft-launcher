'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import CompleteProfileManager from '@/components/CompleteProfileManager';
import { getFreshExample } from '@/lib/wallet-examples';

interface UserNFT {
  mint: string;
  collection: string;
  name: string;
  image: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  rarityScore: number;
  tier: string;
}

interface UserCollection {
  name: string;
  symbol: string;
  totalSupply: number;
  minted: number;
  deployedAt: string;
  status: 'active' | 'paused' | 'completed';
}

interface UserStats {
  totalNFTs: number;
  collectionsCreated: number;
  totalSpent: number;
  favoriteCollection: string;
  joinDate: string;
}

export default function ProfilePage() {
  const { connected, publicKey, signTransaction, disconnect } = useWallet();
  const { connection } = useConnection();
  
  // State management
  const [balance, setBalance] = useState<number>(0);
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userCollections, setUserCollections] = useState<UserCollection[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalNFTs: 0,
    collectionsCreated: 0,
    totalSpent: 0,
    favoriteCollection: '',
    joinDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'collections' | 'activity' | 'profile'>('overview');
  const [exampleData, setExampleData] = useState<any>(null);

  // Load user data
  useEffect(() => {
    // Generate fresh example data each time
    setExampleData(getFreshExample(publicKey?.toString()));
    
    const loadUserData = async () => {
      if (!connected || !publicKey) {
        setLoading(false);
        return;
      }

      try {
        console.log('👤 Loading user profile data...');
        console.log('🔗 User wallet:', publicKey?.toString() || 'Not connected');
        
        // Load SOL balance
        const solBalance = await connection.getBalance(publicKey);
        setBalance(solBalance / LAMPORTS_PER_SOL);

        // Load REAL user data from blockchain
        const { blockchainService } = await import('@/lib/blockchain-service');
        
        // Load user's NFTs
        const nfts = await blockchainService.getUserNFTs(publicKey?.toString() || '');
        const uiNFTs: UserNFT[] = nfts.map(nft => ({
          mint: nft.mint,
          collection: 'Collection', // Would need to lookup collection name
          name: `NFT #${nft.mintNumber}`,
          image: '/api/placeholder/300/300',
          traits: [], // Would need to load metadata
          rarityScore: nft.rarityScore,
          tier: nft.tier === 0 ? 'Common' : `Tier ${nft.tier}`
        }));

        // Load collections created by user
        const allCollections = await blockchainService.getAllCollections();
        const userCreatedCollections = allCollections.filter(
          col => col.authority === (publicKey?.toString() || '')
        );
        
        const uiCollections: UserCollection[] = userCreatedCollections.map(col => ({
          name: col.collectionName,
          symbol: col.collectionSymbol,
          totalSupply: col.totalSupply,
          minted: col.mintedCount,
          deployedAt: new Date().toISOString(),
          status: col.isPaused ? 'paused' : (col.mintedCount >= col.totalSupply ? 'completed' : 'active')
        }));

        setUserNFTs(uiNFTs);
        setUserCollections(uiCollections);
        setUserStats({
          totalNFTs: uiNFTs.length,
          collectionsCreated: uiCollections.length,
          totalSpent: 0, // Would need to calculate from transaction history
          favoriteCollection: uiCollections.length > 0 ? uiCollections[0].name : '',
          joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        console.log('✅ REAL user profile data loaded from blockchain');
        console.log(`📊 User has ${uiNFTs.length} NFTs and created ${uiCollections.length} collections`);
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [connected, publicKey, connection]);

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'legendary': return 'text-purple-400';
      case 'epic': return 'text-pink-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      case 'common': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Connect your wallet to view your profile, NFTs, and collection statistics
          </p>
          <div className="text-gray-400">
            Your wallet connection is required to access profile features
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Loading Profile...</div>
          <div className="text-gray-300 mt-2">Fetching your data from the blockchain</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {publicKey ? publicKey.toString().slice(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                <div className="space-y-1">
                  <div className="text-gray-300">
                    <span className="font-medium">Wallet:</span>
                    <code className="ml-2 font-mono text-sm bg-gray-800/50 px-2 py-1 rounded wallet-address">
                      {exampleData?.wallet || (publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Not connected')}
                    </code>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-medium">SOL Balance:</span>
                    <span className="ml-2 text-white font-semibold">{balance.toFixed(4)} SOL</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="font-medium">Member Since:</span>
                    <span className="ml-2 text-white">{new Date(userStats.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0">
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-1">Total NFTs</h3>
            <p className="text-2xl font-bold text-purple-400">{userStats.totalNFTs}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-lg font-semibold text-white mb-1">Collections Created</h3>
            <p className="text-2xl font-bold text-blue-400">{userStats.collectionsCreated}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">💎</div>
            <h3 className="text-lg font-semibold text-white mb-1">Total Spent</h3>
            <p className="text-2xl font-bold text-green-400">${userStats.totalSpent}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-lg font-semibold text-white mb-1">Favorite Collection</h3>
            <p className="text-lg font-bold text-orange-400">{userStats.favoriteCollection || 'None'}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-8">
          <div className="flex space-x-2 nav-tabs overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'nfts', label: 'My NFTs', icon: '🎨' },
              { id: 'collections', label: 'My Collections', icon: '📦' },
              { id: 'activity', label: 'Activity', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <CompleteProfileManager
            userWallet={publicKey?.toString() || ''}
            className="profile-manager"
          />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Account Overview</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">Address:</span>
                      <code className="text-white font-mono text-sm wallet-address text-right break-all max-w-[65%] sm:max-w-none">
                        {exampleData?.wallet || (publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-4)}` : 'Not connected')}
                      </code>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">Network:</span>
                      <span className="text-white">Analos Mainnet</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">RPC Endpoint:</span>
                      <span className="text-white text-sm">rpc.analos.io</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">First Mint:</span>
                      <span className="text-white">-</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">Last Activity:</span>
                      <span className="text-white">-</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-300">Total Transactions:</span>
                      <span className="text-white">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My NFTs</h2>
              <span className="text-gray-300">Total: {userNFTs.length}</span>
            </div>
            
            {userNFTs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold text-white mb-2">No NFTs Yet</h3>
                <p className="text-gray-300 mb-6">Start collecting NFTs by minting from our marketplace</p>
                <a
                  href="/marketplace"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Browse Marketplace
                </a>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userNFTs.map((nft) => (
                  <div key={nft.mint} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                    <div className="aspect-square bg-gray-800/50 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-4xl">🎨</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{nft.name}</h3>
                        <p className="text-gray-300 text-sm">{nft.collection}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Tier:</span>
                        <span className={`font-semibold ${getTierColor(nft.tier)}`}>{nft.tier}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Rarity:</span>
                        <span className="text-white font-semibold">{nft.rarityScore}/100</span>
                      </div>
                      
                      <div className="pt-3 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Traits:</h4>
                        <div className="space-y-1">
                          {nft.traits.slice(0, 2).map((trait, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-gray-400">{trait.trait_type}:</span>
                              <span className="text-white">{trait.value}</span>
                            </div>
                          ))}
                          {nft.traits.length > 2 && (
                            <div className="text-xs text-gray-400">+{nft.traits.length - 2} more...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Collections</h2>
              <a
                href="/launch-collection"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Create Collection
              </a>
            </div>
            
            {userCollections.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Collections Created</h3>
                <p className="text-gray-300 mb-6">Launch your first NFT collection on the Analos blockchain</p>
                <a
                  href="/launch-collection"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Launch Collection
                </a>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {userCollections.map((collection) => (
                  <div key={collection.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                        <p className="text-gray-300">Symbol: {collection.symbol}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(collection.status)}`}>
                        {collection.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Minted:</span>
                        <span className="text-white font-semibold">{collection.minted}/{collection.totalSupply}</span>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(collection.minted / collection.totalSupply) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-300">Deployed:</span>
                        <span className="text-white">{new Date(collection.deployedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 mt-6">
                      <button className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 border border-white/20">
                        Manage
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Activity History</h2>
            
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Activity Yet</h3>
              <p className="text-gray-300">Your transaction history will appear here once you start using the platform</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
