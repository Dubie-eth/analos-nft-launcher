'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import CompleteProfileManager from '@/components/CompleteProfileManager';
import PublicProfileDisplay from '@/components/PublicProfileDisplay';
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

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [uiNFTs, setUiNFTs] = useState<UserNFT[]>([]);
  const [uiCollections, setUiCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'collections' | 'activity' | 'edit'>('overview');
  const [exampleData, setExampleData] = useState<any>(null);

  // Load user data
  useEffect(() => {
    // Generate fresh example data each time
    setExampleData(getFreshExample(publicKey?.toString()));
    
    const loadUserData = async () => {
      if (!publicKey || !connected) {
        setLoading(false);
        return;
      }

      try {
        // Load SOL balance
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        // Load user NFTs
        const nftAccounts = await connection.getTokenAccountsByOwner(publicKey, {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        });

        console.log('📊 Found', nftAccounts.value.length, 'potential NFTs for user');

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

        // Process NFTs (this would need to be implemented based on your program structure)
        setUiNFTs([]);
        console.log('✅ Processed', 0, 'NFTs from our program');

      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [publicKey, connected, connection]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-8">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '⭐' },
    { id: 'nfts', label: `NFTs (${uiNFTs.length})`, icon: '🎨' },
    { id: 'collections', label: `Collections (${uiCollections.length})`, icon: '📦' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'edit', label: 'Edit Profile', icon: '✏️' }
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
                  {publicKey?.toString().slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                <div className="text-gray-300 space-y-1">
                  <div>Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</div>
                  <div>SOL Balance: {solBalance.toFixed(4)} SOL</div>
                  <div>Member Since: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <button
              onClick={disconnect}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Disconnect Wallet
            </button>
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
          {activeTab === 'overview' && (
            <PublicProfileDisplay
              userWallet={publicKey?.toString() || ''}
              className="profile-display"
            />
          )}

          {activeTab === 'nfts' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">My NFTs</h2>
              {uiNFTs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uiNFTs.map((nft) => (
                    <div key={nft.mint} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={nft.image} 
                        alt={nft.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-1">{nft.name}</h3>
                        <p className="text-gray-300 text-sm mb-2">{nft.collection}</p>
                        {nft.price && (
                          <div className="text-white font-medium">${nft.price.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
                  <p className="text-gray-300">Start collecting NFTs to see them here!</p>
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
            <CompleteProfileManager
              userWallet={publicKey?.toString() || ''}
              className="profile-manager"
            />
          )}
        </div>
      </div>
    </div>
  );
}
