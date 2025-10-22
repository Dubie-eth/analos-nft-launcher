'use client';

import React from 'react';
import Image from 'next/image';

interface ProfileNFTProps {
  nft: {
    mint: string;
    name: string;
    image: string;
    description: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  onView?: () => void;
  onTrade?: () => void;
}

export default function ProfileNFTDisplay({ nft, onView, onTrade }: ProfileNFTProps) {
  // Extract attributes
  const username = nft.attributes.find(attr => attr.trait_type === 'Username')?.value || 'Unknown';
  const tier = nft.attributes.find(attr => attr.trait_type === 'Tier')?.value || 'Unknown';
  const pricePaid = nft.attributes.find(attr => attr.trait_type === 'Price Paid')?.value || 'N/A';
  const mintDate = nft.attributes.find(attr => attr.trait_type === 'Mint Date')?.value;

  // Determine tier styling
  const getTierStyles = (tierName: string) => {
    switch (tierName) {
      case '3-digit':
        return {
          gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
          border: 'border-yellow-400',
          glow: 'shadow-yellow-500/50',
          badge: 'bg-yellow-500',
          text: 'text-yellow-400',
          emoji: '👑',
          name: 'LEGENDARY'
        };
      case '4-digit':
        return {
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          border: 'border-gray-400',
          glow: 'shadow-gray-400/50',
          badge: 'bg-gray-400',
          text: 'text-gray-300',
          emoji: '⭐',
          name: 'RARE'
        };
      case '5-plus':
        return {
          gradient: 'from-orange-600 via-orange-700 to-orange-800',
          border: 'border-orange-600',
          glow: 'shadow-orange-600/50',
          badge: 'bg-orange-600',
          text: 'text-orange-500',
          emoji: '🎖️',
          name: 'STANDARD'
        };
      default:
        return {
          gradient: 'from-blue-500 via-purple-500 to-pink-500',
          border: 'border-purple-500',
          glow: 'shadow-purple-500/50',
          badge: 'bg-purple-500',
          text: 'text-purple-400',
          emoji: '🎭',
          name: 'PROFILE'
        };
    }
  };

  const tierStyles = getTierStyles(tier);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="relative group">
      {/* Outer glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${tierStyles.gradient} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
      
      {/* Main card */}
      <div className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border-2 ${tierStyles.border} shadow-2xl ${tierStyles.glow}`}>
        
        {/* Tier badge */}
        <div className="absolute -top-3 -right-3 z-10">
          <div className={`${tierStyles.badge} text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2`}>
            <span>{tierStyles.emoji}</span>
            <span>{tierStyles.name}</span>
          </div>
        </div>

        {/* Profile NFT label */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-white/30">
            🎭 PROFILE NFT
          </div>
        </div>

        {/* NFT Image */}
        <div className="relative mb-6 mt-8">
          <div className={`relative aspect-square rounded-xl overflow-hidden border-2 ${tierStyles.border} bg-gradient-to-br ${tierStyles.gradient}`}>
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
            {/* Shine effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>

        {/* Username */}
        <div className="text-center mb-4">
          <h3 className={`text-3xl font-bold bg-gradient-to-r ${tierStyles.gradient} bg-clip-text text-transparent mb-1`}>
            @{username}
          </h3>
          <p className="text-gray-400 text-sm">{nft.description}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/30 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Username Length</div>
            <div className={`text-lg font-bold ${tierStyles.text}`}>{username.length} characters</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 border border-white/10">
            <div className="text-xs text-gray-400 mb-1">Price Paid</div>
            <div className={`text-lg font-bold ${tierStyles.text}`}>{pricePaid}</div>
          </div>
        </div>

        {/* Mint info */}
        <div className="bg-black/30 rounded-lg p-3 border border-white/10 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Minted:</span>
            <span className="text-white font-medium">{formatDate(mintDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-400">Mint Address:</span>
            <span className="text-white font-mono text-xs">
              {nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          {onView && (
            <button
              onClick={onView}
              className={`bg-gradient-to-r ${tierStyles.gradient} hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm`}
            >
              🔍 View Details
            </button>
          )}
          {onTrade && (
            <button
              onClick={onTrade}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              💰 Trade
            </button>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none">
          <div className={`absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r ${tierStyles.gradient} opacity-10 blur-3xl`}></div>
          <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l ${tierStyles.gradient} opacity-10 blur-3xl`}></div>
        </div>
      </div>
    </div>
  );
}

