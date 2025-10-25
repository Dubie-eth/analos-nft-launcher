'use client';

import React from 'react';
import Link from 'next/link';

interface UnifiedNFTCardProps {
  nft: any;
  showOwner?: boolean;
  showPrice?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export default function UnifiedNFTCard({
  nft,
  showOwner = true,
  showPrice = false,
  showActions = true,
  compact = false
}: UnifiedNFTCardProps) {
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const isLosBros = nft.type === 'losbros' || nft.los_bros_token_id;
  const isProfile = nft.type === 'profile' || (!nft.los_bros_token_id && nft.username);

  return (
    <div className="group relative bg-black/40 rounded-xl overflow-hidden border-2 border-cyan-400/30 hover:border-cyan-400/60 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
      {/* Collection Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
          isLosBros
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
        }`}>
          {isLosBros ? '🎨 Los Bros' : '👤 Profile'}
        </div>
      </div>

      {/* Rarity Badge (Los Bros only) */}
      {isLosBros && nft.los_bros_rarity && (
        <div className="absolute top-3 right-3 z-10">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            nft.los_bros_rarity === 'LEGENDARY' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
            nft.los_bros_rarity === 'EPIC' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
            nft.los_bros_rarity === 'RARE' ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white' :
            'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
          }`}>
            {nft.los_bros_rarity || nft.rarity}
          </div>
        </div>
      )}

      {/* NFT Image */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900">
        {isLosBros && nft.traits ? (
          // Use iframe for trait-based composite images
          <iframe
            src={nft.image}
            className="w-full h-full border-0"
            style={{ imageRendering: 'pixelated' }}
            title={nft.name}
          />
        ) : (
          // Use regular img for Profile NFTs or fallback SVGs
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/400/400';
            }}
          />
        )}
      </div>

      {/* NFT Info */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            {isLosBros 
              ? `Los Bros #${nft.los_bros_token_id || nft.tokenId || shortenAddress(nft.mint)}`
              : `@${nft.username || 'Unknown'}`
            }
          </h3>
          
          {/* Owner/Minter */}
          {showOwner && (
            <p className="text-sm text-gray-400">
              {isLosBros ? 'Minted by ' : 'Owned by '}
              <Link 
                href={`/profile/${nft.owner || nft.wallet_address}`}
                className="text-purple-400 hover:text-purple-300 underline font-mono"
              >
                {shortenAddress(nft.owner || nft.wallet_address)}
              </Link>
            </p>
          )}
        </div>

        {!compact && (
          <>
            {/* Token ID / Rarity Score */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {isLosBros ? 'Token ID:' : 'Mint:'}
              </span>
              <span className="text-white font-mono">
                {isLosBros 
                  ? (nft.los_bros_token_id || nft.tokenId)
                  : shortenAddress(nft.mint || nft.mint_address)
                }
              </span>
            </div>

            {/* Rarity Score (Los Bros only) */}
            {isLosBros && (nft.los_bros_rarity_score || nft.rarityScore) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Rarity Score:</span>
                <span className="text-white font-bold">
                  {typeof (nft.los_bros_rarity_score || nft.rarityScore) === 'number' 
                    ? (nft.los_bros_rarity_score || nft.rarityScore).toFixed(1)
                    : (nft.los_bros_rarity_score || nft.rarityScore)}
                </span>
              </div>
            )}

            {/* Price (if available) */}
            {showPrice && nft.floorPrice && nft.floorPrice > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Price:</span>
                <span className="text-green-400 font-bold">
                  {(nft.floorPrice || 0).toFixed(2)} LOS
                </span>
              </div>
            )}

            {/* Mint Date */}
            {(nft.created_at || nft.createdAt) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Minted:</span>
                <span className="text-gray-300">
                  {new Date(nft.created_at || nft.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {showActions && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <Link
              href={`/nft/${nft.mint || nft.mint_address}`}
              className="block w-full text-center bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-300 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              📄 View Details
            </Link>
            
            <Link
              href={`/explorer/mints?search=${nft.mint || nft.mint_address}`}
              className="block w-full text-center bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 text-cyan-300 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              🔍 View in Explorer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

