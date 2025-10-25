'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import Link from 'next/link';
import UnifiedNFTCard from '@/components/UnifiedNFTCard';

/**
 * PUBLIC PROFILE PAGE
 * Anyone can view any wallet's NFTs and profile
 */
export default function PublicProfilePage() {
  const params = useParams();
  const walletAddress = params?.wallet as string;
  
  const [solBalance, setSolBalance] = useState(0);
  const [losBalance, setLosBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);

  useEffect(() => {
    if (walletAddress) {
      loadProfileData();
      loadBalances();
      loadNFTs();
    }
  }, [walletAddress]);

  const loadProfileData = async () => {
    try {
      const response = await fetch(`/api/user-profiles/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setUserProfile(data);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    try {
      // Load SOL balance
      const connection = new (await import('@solana/web3.js')).Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://rpc.analos.io',
        'confirmed'
      );
      const balance = await connection.getBalance(
        new (await import('@solana/web3.js')).PublicKey(walletAddress)
      );
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Load LOS balance
      const { tokenGatingService } = await import('@/lib/token-gating-service');
      const tokenCheck = await tokenGatingService.checkEligibility(walletAddress);
      setLosBalance(tokenCheck.tokenBalance || 0);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadNFTs = async () => {
    try {
      const response = await fetch(`/api/user-nfts?wallet=${walletAddress}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setNfts(data.nfts || []);
          console.log(`✅ Loaded ${data.nfts?.length || 0} NFTs for wallet ${walletAddress}`);
        }
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
    }
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Profile Header */}
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
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {userProfile?.username ? `@${userProfile.username}` : shortenAddress(walletAddress)}
                  </h1>
                  <div className="bg-purple-500/30 border border-purple-400 px-3 py-1 rounded-full text-xs text-purple-200">
                    Public Profile
                  </div>
                </div>
                <p className="text-gray-300 mb-4 font-mono text-sm">
                  {walletAddress}
                </p>
                {userProfile?.bio && (
                  <p className="text-gray-300 mb-4">{userProfile.bio}</p>
                )}

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
                    <div className="text-lg font-bold text-purple-400">{nfts.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Collection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">🖼️ NFT Collection ({nfts.length})</h2>
          
          {nfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-400">This wallet doesn't have any NFTs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft, index) => (
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
    </div>
  );
}

