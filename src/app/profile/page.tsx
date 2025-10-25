'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import Link from 'next/link';
import SimpleProfileEditor from '@/components/SimpleProfileEditor';
import UnifiedNFTCard from '@/components/UnifiedNFTCard';

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState(0);
  const [losBalance, setLosBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [myNFTs, setMyNFTs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'nfts' | 'activity'>('profile');

  useEffect(() => {
    if (connected && publicKey) {
      loadProfileData();
      loadBalances();
      loadUserNFTs();
    }
  }, [connected, publicKey]);

  const loadProfileData = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`/api/user-profiles/${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    if (!publicKey) return;

    try {
      // Load SOL balance
      const connection = new (await import('@solana/web3.js')).Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://rpc.analos.io',
        'confirmed'
      );
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Load LOS balance
      const { tokenGatingService } = await import('@/lib/token-gating-service');
      const tokenCheck = await tokenGatingService.checkEligibility(publicKey.toString());
      setLosBalance(tokenCheck.tokenBalance || 0);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadUserNFTs = async () => {
    if (!publicKey) return;

    try {
      // Use unified API to get both Profile NFTs and Los Bros NFTs
      const response = await fetch(`/api/user-nfts-unified/${publicKey.toString()}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setMyNFTs(data.nfts || []);
          console.log(`✅ Loaded ${data.nfts?.length || 0} NFTs (${data.profileNFTs?.length || 0} Profile + ${data.losBrosNFTs?.length || 0} Los Bros)`);
        } else {
          console.error('❌ API returned HTML instead of JSON');
          setMyNFTs([]);
        }
      } else {
        console.error(`❌ API error: ${response.status} ${response.statusText}`);
        setMyNFTs([]);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setMyNFTs([]);
    }
  };

  const handleProfileSaved = (profile: any) => {
    setUserProfile(profile);
    loadProfileData(); // Reload to get latest
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to view and edit your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Profile Header with Banner */}
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-64 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
          style={{
            backgroundImage: userProfile?.banner_url ? `url(${userProfile.banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                      👤
                    </div>
                  )}
                </div>
              </div>

              {/* Username and Stats */}
              <div className="flex-1 pb-4">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {userProfile?.username ? `@${userProfile.username}` : 'Set Your Username'}
                </h1>
                <p className="text-gray-300 mb-4">
                  {userProfile?.bio || 'Edit your profile to add a bio'}
                </p>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <div className="text-sm text-gray-400">SOL Balance</div>
                    <div className="text-lg font-bold text-white">{solBalance.toFixed(4)}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <div className="text-sm text-gray-400">$LOL Balance</div>
                    <div className="text-lg font-bold text-yellow-400">{losBalance.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <div className="text-sm text-gray-400">NFTs Owned</div>
                    <div className="text-lg font-bold text-purple-400">{myNFTs.length}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Link
                  href="/collections/los-bros"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  🎨 Mint Los Bro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ✏️ Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'nfts'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🖼️ My NFTs ({myNFTs.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'activity'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            📊 Activity
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <SimpleProfileEditor 
              onProfileSaved={handleProfileSaved}
            />
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">🖼️ My NFT Collection</h2>
              
              {myNFTs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-gray-400 mb-6">No NFTs yet. Start by minting a Los Bro!</p>
                  <Link
                    href="/collections/los-bros"
                    className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-bold transition-all"
                  >
                    🎨 Mint Los Bro NFT
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myNFTs.map((nft, index) => (
                    <UnifiedNFTCard
                      key={nft.mint || index}
                      nft={nft}
                      showOwner={false}
                      showPrice={false}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Recent Activity</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏱️</div>
              <p className="text-gray-400">Activity tracking coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
