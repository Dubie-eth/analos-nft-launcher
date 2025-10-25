'use client';

import React, { useState } from 'react';
import { Star, Eye, Users, Coins, Clock, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface ProfileNFTCardProps {
  nft: {
    id: string;
    name: string;
    image: string;
    description: string;
    owner: string;
    mintNumber: number;
    floorPrice: number;
    volume: number;
    marketCap: number;
    topOffer: number;
    floorChange1d: number;
    volumeChange1d: number;
    sales1d: number;
    listed: number;
    listedPercentage: number;
    owners: number;
    ownersPercentage: number;
    lastSale: {
      price: number;
      time: string;
    };
    attributes: {
      background: string;
      rarity: string;
      tier: string;
    };
    verified: boolean;
    chain: string;
  };
  showUSD?: boolean;
  onViewDetails?: (nftId: string) => void;
}

const ProfileNFTCard: React.FC<ProfileNFTCardProps> = ({ 
  nft, 
  showUSD = false, 
  onViewDetails 
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) {
      return 'Not Listed';
    }
    if (showUSD) {
      return `$${(price * 0.0018).toFixed(2)}`;
    }
    return `${price.toFixed(3)} LOS`;
  };

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'mythic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'uncommon':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'gold':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'silver':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden">
        {!imageError ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <p className="text-gray-400 text-sm">Analos Profile NFT</p>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => onViewDetails?.(nft.id)}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-3 right-3 p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/40 transition-colors"
        >
          <Star className={`w-4 h-4 ${isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
        </button>

        {/* Verification Badge */}
        {nft.verified && (
          <div className="absolute top-3 left-3 p-2 bg-blue-500/20 backdrop-blur-sm rounded-full">
            <span className="text-blue-300 text-xs font-bold">✓</span>
          </div>
        )}

        {/* Chain Badge */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-white text-xs">{nft.chain}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Name and Mint Number */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">{nft.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{nft.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
              #{nft.mintNumber}
            </span>
          </div>
        </div>

        {/* Attributes */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded border ${getRarityColor(nft.attributes.rarity)}`}>
            {nft.attributes.rarity}
          </span>
          <span className={`text-xs px-2 py-1 rounded border ${getTierColor(nft.attributes.tier)}`}>
            {nft.attributes.tier}
          </span>
          <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded border border-gray-500/30">
            {nft.attributes.background}
          </span>
        </div>

        {/* Price and Stats */}
        <div className="space-y-3">
          {/* Floor Price */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Floor</span>
            <div className="text-right">
              <div className="text-white font-semibold">{formatPrice(nft.floorPrice)}</div>
              {!showUSD && nft.floorPrice && (
                <div className="text-gray-400 text-xs">${((nft.floorPrice || 0) * 0.0018).toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Volume</span>
            <div className="text-right">
              <div className="text-white font-semibold">{formatPrice(nft.volume)}</div>
              {!showUSD && nft.volume && (
                <div className="text-gray-400 text-xs">${((nft.volume || 0) * 0.0018).toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* Market Cap */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Market Cap</span>
            <div className="text-right">
              <div className="text-white font-semibold">{formatPrice(nft.marketCap)}</div>
              {!showUSD && nft.marketCap && (
                <div className="text-gray-400 text-xs">${((nft.marketCap || 0) * 0.0018).toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* 1D Changes */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Floor 1d</div>
              {formatChange(nft.floorChange1d)}
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">Volume 1d</div>
              {formatChange(nft.volumeChange1d)}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-400 mb-1">
                <Users className="w-3 h-3 mr-1" />
                <span className="text-xs">Owners</span>
              </div>
              <div className="text-white text-sm font-semibold">{nft.owners}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-400 mb-1">
                <Coins className="w-3 h-3 mr-1" />
                <span className="text-xs">Listed</span>
              </div>
              <div className="text-white text-sm font-semibold">{nft.listed}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-400 mb-1">
                <Clock className="w-3 h-3 mr-1" />
                <span className="text-xs">Sales</span>
              </div>
              <div className="text-white text-sm font-semibold">{nft.sales1d}</div>
            </div>
          </div>

          {/* Last Sale */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Last Sale</span>
              <div className="text-right">
                <div className="text-white text-sm font-semibold">{formatPrice(nft.lastSale?.price)}</div>
                <div className="text-gray-400 text-xs">{nft.lastSale?.time || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onViewDetails?.(nft.id)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button className="bg-white/10 text-white py-2 px-4 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileNFTCard;
