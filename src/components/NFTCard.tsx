'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface NFTCardProps {
  nft: {
    mint: string;
    name: string;
    image?: string;
    collectionName?: string;
    collectionAddress?: string;
    description?: string;
    attributes?: any[];
  };
  showListButton?: boolean;
  onListed?: () => void;
}

export default function NFTCard({ nft, showListButton = true, onListed }: NFTCardProps) {
  const { publicKey } = useWallet();
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [listing, setListing] = useState(false);

  const handleList = async () => {
    if (!publicKey || !listPrice || parseFloat(listPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setListing(true);

    try {
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftMint: nft.mint,
          collectionAddress: nft.collectionAddress,
          collectionName: nft.collectionName,
          nftName: nft.name,
          nftImage: nft.image,
          seller: publicKey.toString(),
          price: parseFloat(listPrice),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('🎉 NFT listed successfully on marketplace!');
        setShowListModal(false);
        setListPrice('');
        if (onListed) onListed();
      } else {
        alert(`Failed to list NFT: ${data.error}`);
      }
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('Failed to list NFT. Please try again.');
    } finally {
      setListing(false);
    }
  };

  return (
    <>
      <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-200 group">
        {/* NFT Image */}
        <div className="relative aspect-square bg-gray-800/50 overflow-hidden">
          {nft.image ? (
            <img 
              src={nft.image} 
              alt={nft.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🎨
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-white font-semibold text-lg truncate">{nft.name}</h3>
          
          {nft.collectionName && (
            <p className="text-gray-300 text-sm truncate">
              Collection: {nft.collectionName}
            </p>
          )}

          {nft.description && (
            <p className="text-gray-400 text-xs line-clamp-2">
              {nft.description}
            </p>
          )}

          <div className="pt-2">
            <div className="text-xs text-gray-400 mb-1">Mint Address:</div>
            <div className="font-mono text-xs text-gray-300 truncate">
              {nft.mint}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            {showListButton && publicKey && (
              <button
                onClick={() => setShowListModal(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm"
              >
                💰 List for Sale
              </button>
            )}
            
            <Link
              href={`https://explorer.analos.io/address/${nft.mint}`}
              target="_blank"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20 text-sm flex items-center justify-center"
            >
              🔍
            </Link>
          </div>
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              💰 List NFT for Sale
            </h3>
            
            <div className="space-y-4">
              {/* NFT Preview */}
              <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  {nft.image ? (
                    <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{nft.name}</div>
                  <div className="text-gray-400 text-sm truncate">{nft.collectionName}</div>
                </div>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-white mb-2 font-semibold">
                  Price (LOS)
                </label>
                <input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
                <p className="text-gray-400 text-xs mt-1">
                  You'll receive {listPrice ? (parseFloat(listPrice) * 0.97).toFixed(4) : '0'} LOS after 3% marketplace fee
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowListModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  disabled={listing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleList}
                  disabled={listing || !listPrice || parseFloat(listPrice) <= 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {listing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Listing...
                    </div>
                  ) : (
                    'List NFT'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

