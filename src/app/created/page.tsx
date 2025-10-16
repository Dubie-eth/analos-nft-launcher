'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Eye, Edit, Trash2, DollarSign, TrendingUp, Users, Calendar, ExternalLink, Download } from 'lucide-react';

interface SavedCollection {
  id: string;
  collection_name: string;
  collection_symbol: string;
  description: string;
  total_supply: number;
  mint_price: number;
  reveal_type: string;
  whitelist_enabled: boolean;
  bonding_curve_enabled: boolean;
  layers: any[];
  status: string;
  created_at: string;
  updated_at: string;
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

export default function CreatedPage() {
  const { publicKey, connected } = useWallet();
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [rewards, setRewards] = useState<CreatorReward[]>([]);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary>({
    total_claimable: 0,
    total_claimed: 0,
    pending_rewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'rewards'>('collections');

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey]);

  const loadUserData = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      // Load collections
      const collectionsResponse = await fetch(`/api/collections/save?userWallet=${publicKey.toString()}`);
      const collectionsData = await collectionsResponse.json();
      
      if (collectionsData.success) {
        setCollections(collectionsData.collections);
      }

      // Load rewards
      const rewardsResponse = await fetch(`/api/rewards?userWallet=${publicKey.toString()}`);
      const rewardsData = await rewardsResponse.json();
      
      if (rewardsData.success) {
        setRewards(rewardsData.rewards);
        setRewardsSummary(rewardsData.summary);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        loadUserData(); // Reload data
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 dark:text-yellow-400';
      case 'deployed': return 'text-green-600 dark:text-green-400';
      case 'active': return 'text-blue-600 dark:text-blue-400';
      case 'paused': return 'text-orange-600 dark:text-orange-400';
      case 'completed': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'creator_fee': return <DollarSign className="w-4 h-4" />;
      case 'royalty': return <TrendingUp className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      case 'airdrop': return <Download className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold theme-text-primary mb-4">Connect Your Wallet</h1>
          <p className="text-xl theme-text-secondary">Please connect your wallet to view your created collections and rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold theme-text-primary mb-4">
            🎨 My Collections & Rewards
          </h1>
          <p className="text-xl theme-text-secondary max-w-3xl mx-auto">
            Manage your created collections and claim your creator rewards
          </p>
        </div>

        {/* Rewards Summary Card */}
        <div className="theme-card rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold theme-text-primary mb-6">💰 Creator Rewards Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {rewardsSummary.total_claimable.toFixed(2)}
              </div>
              <div className="theme-text-secondary">Claimable (LOS)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {rewardsSummary.total_claimed.toFixed(2)}
              </div>
              <div className="theme-text-secondary">Total Claimed (LOS)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {rewardsSummary.pending_rewards.toFixed(2)}
              </div>
              <div className="theme-text-secondary">Pending (LOS)</div>
            </div>
          </div>
          
          {rewardsSummary.total_claimable > 0 && (
            <div className="mt-6 text-center">
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

        {/* Tabs */}
        <div className="theme-card rounded-xl p-2 mb-8">
          <nav className="flex justify-center gap-2">
            <button
              onClick={() => setActiveTab('collections')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'collections' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' 
                  : 'theme-text-secondary hover:bg-white/10'
              }`}
            >
              <span>📦</span>
              <span>My Collections ({collections.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'rewards' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' 
                  : 'theme-text-secondary hover:bg-white/10'
              }`}
            >
              <span>💰</span>
              <span>Rewards ({rewards.length})</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-semibold theme-text-primary">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'collections' && (
              <div className="space-y-6">
                {collections.length === 0 ? (
                  <div className="theme-card rounded-xl p-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold theme-text-primary mb-2">No Collections Yet</h3>
                    <p className="theme-text-secondary mb-6">Create your first NFT collection to get started!</p>
                    <a
                      href="/launch-collection"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                    >
                      Create Collection
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                      <div key={collection.id} className="theme-card rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold theme-text-primary mb-1">{collection.collection_name}</h3>
                            <p className="theme-text-secondary text-sm">{collection.collection_symbol}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(collection.status)}`}>
                            {collection.status}
                          </span>
                        </div>
                        
                        <p className="theme-text-secondary text-sm mb-4 line-clamp-2">{collection.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="theme-text-secondary">Supply:</span>
                            <span className="theme-text-primary">{collection.total_supply}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="theme-text-secondary">Price:</span>
                            <span className="theme-text-primary">{collection.mint_price} SOL</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="theme-text-secondary">Layers:</span>
                            <span className="theme-text-primary">{collection.layers.length}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                        
                        <div className="mt-3 text-xs theme-text-muted">
                          Created: {new Date(collection.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-6">
                {rewards.length === 0 ? (
                  <div className="theme-card rounded-xl p-12 text-center">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold theme-text-primary mb-2">No Rewards Yet</h3>
                    <p className="theme-text-secondary">Rewards will appear here when your collections generate sales and fees.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="theme-card rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                              {getRewardTypeIcon(reward.reward_type)}
                            </div>
                            <div>
                              <h4 className="font-semibold theme-text-primary capitalize">
                                {reward.reward_type.replace('_', ' ')} Reward
                              </h4>
                              <p className="text-sm theme-text-secondary">
                                From: {reward.saved_collections.collection_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold theme-text-primary">
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
                        
                        <div className="mt-4 text-xs theme-text-muted">
                          Created: {new Date(reward.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
