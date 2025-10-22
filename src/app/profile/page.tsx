'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
// import CompleteProfileManager from '@/components/CompleteProfileManager'; // Temporarily disabled to fix build
import PublicProfileDisplay from '@/components/PublicProfileDisplay';
import SimpleProfileEditor from '@/components/SimpleProfileEditor';
import NFTCard from '@/components/NFTCard';
import { getFreshExample } from '@/lib/wallet-examples';

interface UserNFT {
  mint: string;
  collection: string;
  name: string;
  image: string;
  price?: number;
  rarity?: string;
}

interface UserCollection {
  name: string;
  symbol: string;
  description: string;
  image: string;
  floorPrice: number;
  volume24h: number;
  totalSupply: number;
  ownedCount: number;
}

interface CreatorReward {
  id: string;
  reward_type: string;
  amount: number;
  token_symbol: string;
  status: string;
  created_at: string;
  saved_collections: {
    collection_name: string;
    collection_symbol: string;
  };
}

interface RewardsSummary {
  total_claimable: number;
  total_claimed: number;
  pending_rewards: number;
}

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [uiNFTs, setUiNFTs] = useState<UserNFT[]>([]);
  const [uiCollections, setUiCollections] = useState<UserCollection[]>([]);
  const [rewards, setRewards] = useState<CreatorReward[]>([]);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary>({
    total_claimable: 0,
    total_claimed: 0,
    pending_rewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile-nft' | 'overview' | 'nfts' | 'collections' | 'rewards' | 'activity' | 'edit'>('profile-nft');
  const [exampleData, setExampleData] = useState<any>(null);
  const [pageAccessConfig, setPageAccessConfig] = useState<any>(null);
  const [isPublicAccess, setIsPublicAccess] = useState(false);
  const [useSimpleEditor, setUseSimpleEditor] = useState(true);

  // Check page access configuration
  useEffect(() => {
    const checkPageAccess = async () => {
      try {
        const response = await fetch('/api/page-access/profile');
        if (response.ok) {
          const config = await response.json();
          setPageAccessConfig(config);
          setIsPublicAccess(config.publicAccess && !config.isLocked);
        }
      } catch (error) {
        console.error('Error checking page access:', error);
        // Default to requiring wallet if we can't check
        setIsPublicAccess(false);
      }
    };

    checkPageAccess();
  }, []);

  // Load user data
  useEffect(() => {
    // Generate fresh example data each time
    setExampleData(getFreshExample(publicKey?.toString()));
    
    const loadUserData = async () => {
      // If public access is allowed and no wallet connected, show public view
      if (isPublicAccess && (!publicKey || !connected)) {
        setLoading(false);
        return;
      }

      // If wallet is required but not connected, show connect prompt
      if (!isPublicAccess && (!publicKey || !connected)) {
        setLoading(false);
        return;
      }

      try {
        // Load LOS balance (using SOL balance for now, will be updated to LOS token)
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        console.log('🔍 Loading user NFTs from API...');
        
        // Load user NFTs from API
        try {
          const nftsResponse = await fetch(`/api/user-nfts/${publicKey.toString()}`);
          const nftsData = await nftsResponse.json();
          
          if (nftsData.nfts && nftsData.nfts.length > 0) {
            console.log(`✅ Loaded ${nftsData.nfts.length} NFTs from blockchain`);
            setUiNFTs(nftsData.nfts.map((nft: any) => ({
              mint: nft.mint,
              collection: nft.collectionName || 'Unknown Collection',
              name: nft.name || 'Unnamed NFT',
              image: nft.uri || '/api/placeholder/400/400',
              collectionAddress: nft.collectionAddress,
              description: nft.description
            })));
          } else {
            console.log('ℹ️ No NFTs found for this wallet');
            setUiNFTs([]);
          }
        } catch (error) {
          console.error('❌ Error loading NFTs:', error);
          setUiNFTs([]);
        }

        // Load collections from blockchain
        console.log('📦 Loading collections from blockchain...');
        const collectionProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
        console.log('🔗 NFT Launchpad Program:', collectionProgramId.toString());

        try {
          const collectionAccounts = await connection.getProgramAccounts(collectionProgramId);
          console.log('✅ Loaded', collectionAccounts.length, 'collections from blockchain');
          
          // Process collections (this would need to be implemented based on your program structure)
          setUiCollections([]);
        } catch (error) {
          console.error('❌ Error loading collections:', error);
          setUiCollections([]);
        }

        // Load saved collections
        const collectionsResponse = await fetch(`/api/collections/save?userWallet=${publicKey.toString()}`);
        const collectionsData = await collectionsResponse.json();
        
        if (collectionsData.success) {
          setUiCollections(collectionsData.collections.map((col: any) => ({
            name: col.collection_name,
            symbol: col.collection_symbol,
            description: col.description,
            image: '/default-collection.png',
            floorPrice: 0,
            volume24h: 0,
            totalSupply: col.total_supply,
            ownedCount: 0
          })));
        }

        // Load creator rewards
        const rewardsResponse = await fetch(`/api/rewards?userWallet=${publicKey.toString()}`);
        const rewardsData = await rewardsResponse.json();
        
        if (rewardsData.success) {
          setRewards(rewardsData.rewards);
          setRewardsSummary(rewardsData.summary);
        }

      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [publicKey, connected, connection, isPublicAccess]);

  // Show connect wallet prompt only if wallet is required and not connected
  if (!isPublicAccess && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-8">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  const handleClaimRewards = async () => {
    if (!publicKey) return;

    setClaiming(true);
    try {
      const claimableRewards = rewards.filter(r => r.status === 'claimable');
      const rewardIds = claimableRewards.map(r => r.id);

      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          rewardIds: rewardIds,
          txSignature: 'placeholder-tx-signature' // In real implementation, this would be the actual transaction signature
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully claimed ${result.totalClaimed} tokens!`);
        // Reload data
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  };

  const tabs = connected ? [
    { id: 'profile-nft', label: 'Profile NFT', icon: '🎭' },
    { id: 'overview', label: 'Overview', icon: '⭐' },
    { id: 'nfts', label: `NFTs (${uiNFTs.length})`, icon: '🎨' },
    { id: 'collections', label: `Collections (${uiCollections.length})`, icon: '📦' },
    { id: 'rewards', label: `Rewards (${rewards.length})`, icon: '💰' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'edit', label: 'Edit Profile', icon: '✏️' }
  ] : [
    { id: 'overview', label: 'Community Overview', icon: '⭐' },
    { id: 'nfts', label: 'Public NFTs', icon: '🎨' },
    { id: 'collections', label: 'Public Collections', icon: '📦' },
    { id: 'activity', label: 'Public Activity', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎨 Your Profile
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Manage your profile, showcase your NFTs, and connect with the community
          </p>
        </div>

        {/* Wallet Info Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {connected ? publicKey?.toString().slice(0, 2).toUpperCase() : '👤'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {connected ? 'Your Profile' : 'Public Profile View'}
                </h2>
                <div className="text-gray-300 space-y-1">
                  {connected ? (
                    <>
                      <div>Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</div>
                      <div>LOS Balance: {solBalance.toFixed(4)} LOS</div>
                      <div>Member Since: {new Date().toLocaleDateString()}</div>
                    </>
                  ) : (
                    <>
                      <div>Connect your wallet to view your personal profile</div>
                      <div>Public access enabled - view community profiles</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {connected && (
              <button
                onClick={disconnect}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">🎨</div>
            <div className="text-2xl font-bold text-white">{uiNFTs.length}</div>
            <div className="text-gray-300">Total NFTs</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">📦</div>
            <div className="text-2xl font-bold text-white">{uiCollections.length}</div>
            <div className="text-gray-300">Collections Created</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-white">$0</div>
            <div className="text-gray-300">Total Spent</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-white">None</div>
            <div className="text-gray-300">Favorite Collection</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-8">
          <nav className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'profile-nft' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">🎭 Your Profile NFT</h2>
                <p className="text-gray-300 text-lg">
                  Create your unique profile NFT that represents you in the Analos ecosystem
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Profile NFT Minting Card */}
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎭</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Mint Your Profile NFT</h3>
                    <p className="text-gray-300">
                      Create a unique NFT that represents your identity on Analos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">✨ Features</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Unique profile representation</li>
                        <li>• Custom traits and attributes</li>
                        <li>• On-chain metadata storage</li>
                        <li>• Tradeable on marketplace</li>
                        <li>• Community recognition</li>
                      </ul>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">💰 Cost</h4>
                      <div className="text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>Minting Fee:</span>
                          <span className="text-green-400">100 LOS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span className="text-gray-400">10 LOS</span>
                        </div>
                        <div className="flex justify-between font-semibold text-white border-t border-gray-600 pt-2 mt-2">
                          <span>Total:</span>
                          <span className="text-green-400">110 LOS</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // TODO: Implement profile NFT minting
                        alert('Profile NFT minting coming soon! This will create your unique profile NFT.');
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      🎭 Mint Profile NFT
                    </button>
                  </div>
                </div>

                {/* Profile NFT Preview */}
                <div className="bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl p-6 border border-blue-500/30">
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">Preview</h3>
                  
                  <div className="bg-black/30 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🎭</span>
                      </div>
                      <h4 className="text-white font-semibold text-lg">Your Profile NFT</h4>
                      <p className="text-gray-300 text-sm">Unique #1</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <h5 className="text-white font-semibold mb-2">Traits</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rarity:</span>
                          <span className="text-yellow-400">Legendary</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Type:</span>
                          <span className="text-blue-400">Profile</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Power:</span>
                          <span className="text-green-400">100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Status:</span>
                          <span className="text-purple-400">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3">
                      <h5 className="text-white font-semibold mb-2">Benefits</h5>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Exclusive community access</li>
                        <li>• Special marketplace privileges</li>
                        <li>• Governance voting rights</li>
                        <li>• Early feature access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile NFT Status */}
              <div className="mt-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">🎉 Ready to Create Your Profile NFT?</h3>
                  <p className="text-gray-300 mb-4">
                    Your profile NFT will be your unique identity in the Analos ecosystem. 
                    It's more than just an NFT - it's your digital passport to exclusive features and community benefits.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        // TODO: Implement profile NFT minting
                        alert('Profile NFT minting coming soon!');
                      }}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      🚀 Start Minting
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Show more info about profile NFTs
                        alert('Learn more about Profile NFTs coming soon!');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
                    >
                      📚 Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <PublicProfileDisplay
              userWallet={publicKey?.toString() || ''}
              className="profile-display"
            />
          )}

          {activeTab === 'nfts' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">My NFTs</h2>
                <button
                  onClick={() => {
                    // Reload NFTs
                    if (publicKey) {
                      fetch(`/api/user-nfts/${publicKey.toString()}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.nfts && data.nfts.length > 0) {
                            setUiNFTs(data.nfts.map((nft: any) => ({
                              mint: nft.mint,
                              collection: nft.collectionName || 'Unknown Collection',
                              name: nft.name || 'Unnamed NFT',
                              image: nft.uri || '/api/placeholder/400/400',
                              collectionAddress: nft.collectionAddress,
                              description: nft.description
                            })));
                          }
                        });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading your NFTs...</p>
                </div>
              ) : uiNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uiNFTs.map((nft) => (
                    <NFTCard
                      key={nft.mint}
                      nft={{
                        mint: nft.mint,
                        name: nft.name,
                        image: nft.image,
                        collectionName: nft.collection,
                        collectionAddress: (nft as any).collectionAddress,
                        description: (nft as any).description
                      }}
                      showListButton={true}
                      onListed={() => {
                        alert('NFT has been listed! View it on the marketplace.');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
                  <p className="text-gray-300 mb-4">Start collecting NFTs to see them here!</p>
                  <p className="text-gray-400 text-sm">
                    NFTs you mint or purchase will appear here. Make sure you've minted from a collection!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">My Collections</h2>
              {uiCollections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uiCollections.map((collection, index) => (
                    <div key={index} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={collection.image} 
                        alt={collection.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-1">{collection.name}</h3>
                        <p className="text-gray-300 text-sm mb-2">{collection.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            {collection.ownedCount} owned
                          </span>
                          <span className="text-white font-medium">
                            ${collection.floorPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Collections Yet</h3>
                  <p className="text-gray-300">Create your first collection to get started!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Rewards Summary */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">💰 Creator Rewards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {rewardsSummary.total_claimable.toFixed(2)}
                    </div>
                    <div className="text-gray-300">Claimable (LOS)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      {rewardsSummary.total_claimed.toFixed(2)}
                    </div>
                    <div className="text-gray-300">Total Claimed (LOS)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400 mb-2">
                      {rewardsSummary.pending_rewards.toFixed(2)}
                    </div>
                    <div className="text-gray-300">Pending (LOS)</div>
                  </div>
                </div>
                
                {rewardsSummary.total_claimable > 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleClaimRewards}
                      disabled={claiming}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claiming ? 'Claiming...' : `Claim ${rewardsSummary.total_claimable.toFixed(2)} LOS`}
                    </button>
                  </div>
                )}
              </div>

              {/* Rewards List */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Rewards History</h3>
                {rewards.length > 0 ? (
                  <div className="space-y-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                              <span className="text-2xl">💰</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white capitalize">
                                {reward.reward_type.replace('_', ' ')} Reward
                              </h4>
                              <p className="text-sm text-gray-300">
                                From: {reward.saved_collections.collection_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              {reward.amount.toFixed(4)} {reward.token_symbol}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              reward.status === 'claimable' 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                : reward.status === 'claimed'
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {reward.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          Created: {new Date(reward.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="text-lg font-semibold text-white mb-2">No Rewards Yet</h4>
                    <p className="text-gray-300">Rewards will appear here when your collections generate sales and fees.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Activity History</h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
                <p className="text-gray-300">Your activity history will appear here as you interact with the platform.</p>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {/* Editor Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Editor
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Simple</span>
                  <button
                    onClick={() => setUseSimpleEditor(!useSimpleEditor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useSimpleEditor ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useSimpleEditor ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Advanced</span>
                </div>
              </div>

              {/* Editor Content */}
              {useSimpleEditor ? (
                <SimpleProfileEditor
                  onProfileSaved={(profile) => {
                    console.log('Profile saved:', profile);
                    // Refresh the page or update state
                  }}
                  onNFTCreated={(nft) => {
                    console.log('NFT created:', nft);
                    // Handle NFT creation success
                  }}
                />
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Advanced Editor Temporarily Disabled</h3>
                  <p className="text-gray-300">The advanced profile editor is temporarily disabled to fix build issues. Please use the simple editor above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
