'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Edit3, RefreshCw, Plus, Eye, EyeOff, Settings, Share2, MoreHorizontal, Star, Heart, MessageCircle, Globe } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  walletAddress: string;
  username: string;
  customName?: string;
  referralLink?: string;
  bio?: string;
  email?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
  };
  profilePicture?: string;
  bannerImage?: string;
  privacyLevel: 'public' | 'private' | 'friends';
  allowDataExport: boolean;
  allowAnalytics: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileStats {
  totalItems: number;
  totalValue: number;
  followers: number;
  following: number;
  activeSince: string;
}

interface NFTItem {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: string;
  value?: number;
}

const MagicEdenStyleProfile: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalItems: 0,
    totalValue: 0,
    followers: 0,
    following: 0,
    activeSince: ''
  });
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);
  const [activeTab, setActiveTab] = useState('showcase');
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadProfile();
      setIsOwnProfile(true);
    } else {
      // For public profiles, we'd get the wallet address from URL params
      // For now, just show the structure
      setLoading(false);
    }
  }, [connected, publicKey]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user-profile/check?walletAddress=${publicKey?.toString()}`);
      const data = await response.json();
      
      if (data.success && data.profile) {
        setProfile(data.profile);
        // Load additional stats and NFTs
        loadProfileStats();
        loadNFTItems();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileStats = async () => {
    try {
      // Mock stats for now - would come from blockchain data
      setStats({
        totalItems: 12,
        totalValue: 1567,
        followers: 234,
        following: 89,
        activeSince: '2024-01-15'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadNFTItems = async () => {
    try {
      // Mock NFT items for now - would come from blockchain/API
      setNftItems([
        {
          id: '1',
          name: 'Analos OG #420',
          image: '/images/placeholder-nft-1.png',
          collection: 'Analos Legends',
          rarity: 'Legendary',
          value: 1250
        },
        {
          id: '2',
          name: 'Drip King #69',
          image: '/images/placeholder-nft-2.png',
          collection: 'Analos Drip',
          rarity: 'Epic',
          value: 350
        },
        {
          id: '3',
          name: 'Los Gang #1337',
          image: '/images/placeholder-nft-3.png',
          collection: 'Los Gang',
          rarity: 'Rare',
          value: 890
        },
        {
          id: '4',
          name: 'Analos Alpha #1',
          image: '/images/placeholder-nft-4.png',
          collection: 'Analos Alphas',
          rarity: 'Mythic',
          value: 2500
        },
        {
          id: '5',
          name: 'Drip Queen #777',
          image: '/images/placeholder-nft-5.png',
          collection: 'Analos Royals',
          rarity: 'Legendary',
          value: 1800
        },
        {
          id: '6',
          name: 'Los Legend #999',
          image: '/images/placeholder-nft-6.png',
          collection: 'Los Legends',
          rarity: 'Epic',
          value: 1200
        }
      ]);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  const tabs = [
    { id: 'showcase', label: 'Showcase', icon: '🎨' },
    { id: 'items', label: 'All Items', icon: '📦' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'offers', label: 'Offers', icon: '💼' },
    { id: 'collections', label: 'Collections', icon: '🏛️' },
    { id: 'favorites', label: 'Favorites', icon: '❤️' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Similar to Magic Eden */}
      <div className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-white font-bold text-xl">ANALOS</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Trade</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Mint</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Create</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Launchpad</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Profile</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search collections on Analos"
                  className="w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
          {profile?.bannerImage ? (
            <Image
              src={profile.bannerImage}
              alt="Profile banner"
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900"></div>
          )}
          
          {/* Banner overlay text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">LAUNCH ON ANALOS</h1>
              <p className="text-xl text-gray-300">The Future of NFT Creation</p>
            </div>
          </div>

          {/* Banner controls */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4 flex space-x-2">
              <button className="px-3 py-1 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors text-sm">
                Change Banner
              </button>
              {profile?.privacyLevel === 'private' && (
                <button className="px-3 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center space-x-1">
                  <EyeOff className="w-3 h-3" />
                  <span>Profile Not Public</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-gray-800 overflow-hidden">
                {profile?.profilePicture ? (
                  <Image
                    src={profile.profilePicture}
                    alt="Profile picture"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {profile?.customName || profile?.username || 'Analos Legend'}
                </h1>
                {profile?.customName && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    @{profile.username}
                  </span>
                )}
                {isOwnProfile && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Referral Link */}
              {profile?.referralLink && (
                <div className="mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Referral Link:</span>
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1">
                      <span className="text-blue-400 text-sm">{profile.referralLink}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(profile.referralLink!)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Total Items</div>
                  <div className="text-white font-semibold">{stats.totalItems}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Total Value</div>
                  <div className="text-white font-semibold">${stats.totalValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Followers</div>
                  <div className="text-white font-semibold">{stats.followers}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Following</div>
                  <div className="text-white font-semibold">{stats.following}</div>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex space-x-4">
                {profile?.socials.website && (
                  <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {profile?.socials.twitter && (
                  <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
                {profile?.socials.telegram && (
                  <a href={`https://t.me/${profile.socials.telegram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'showcase' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">New Cross-Chain Showcase View!</h2>
                  <p className="text-gray-400 mb-4">Create custom groups that show off your favorite collectibles across all chains.</p>
                  <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto">
                    <Plus className="w-5 h-5" />
                    <span>Create first group</span>
                  </button>
                </div>

                {/* NFT Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {nftItems.map((nft) => (
                    <div key={nft.id} className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                      <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-2xl">🎨</span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-semibold text-sm truncate">{nft.name}</h3>
                        <p className="text-gray-400 text-xs">{nft.collection}</p>
                        {nft.value && (
                          <p className="text-green-400 text-xs font-semibold">${nft.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">All Items</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {nftItems.map((nft) => (
                    <div key={nft.id} className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                      <div className="aspect-square bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-2xl">📦</span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-semibold text-sm truncate">{nft.name}</h3>
                        <p className="text-gray-400 text-xs">{nft.rarity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Activity</h3>
                <div className="text-gray-400 text-center py-8">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                </div>
              </div>
            )}

            {/* Other tabs would have similar content */}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>$0.0018 LOS</span>
              <span>•</span>
              <span>TPS: 2,500</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Analos Network</span>
              <span>•</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicEdenStyleProfile;
