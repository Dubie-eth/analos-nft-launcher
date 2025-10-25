'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ExternalLink, User, Tag, DollarSign, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';

interface CleanMarketplaceCardProps {
  nft: any;
  showUSD?: boolean;
  onViewDetails?: (nftId: string) => void;
  onMarketplaceAction?: () => void;
}

export default function CleanMarketplaceCard({
  nft,
  showUSD = false,
  onViewDetails,
  onMarketplaceAction
}: CleanMarketplaceCardProps) {
  const { publicKey, connected } = useWallet();
  const [imageError, setImageError] = useState(false);
  const [listingInfo, setListingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const isOwner = publicKey?.toString() === nft.owner;
  const isLosBros = nft.type === 'losbros' || nft.collectionType === 'losbros';

  // Load listing info
  useEffect(() => {
    if (connected) {
      loadListingInfo();
    }
  }, [nft.id, connected]);

  const loadListingInfo = async () => {
    try {
      // Use mint address instead of UUID for the API call
      const mintAddress = nft.mintAddress || nft.mint_address || nft.id;
      const response = await fetch(`/api/marketplace/nft-details/${mintAddress}`);
      if (!response.ok) {
        // Silently fail if API doesn't exist yet
        return;
      }
      const result = await response.json();
      if (result.success) {
        setListingInfo(result.data);
      }
    } catch (error) {
      // Silently fail - marketplace listing features are optional
      console.debug('Listing info not available:', error);
    }
  };

  const activeListing = listingInfo?.listings?.find((l: any) => l.status === 'active');
  const isListed = !!activeListing;
  const currentPrice = activeListing?.list_price;
  
  // Determine the image to display
  const displayImage = isLosBros && nft.los_bros_token_id 
    ? `/api/los-bros/composite-image?tokenId=${nft.los_bros_token_id}`
    : nft.image;

  // Format price
  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) return 'Not Listed';
    if (showUSD) return `$${(price * 0.0018).toFixed(2)}`;
    return `${price.toFixed(2)} LOS`;
  };

  // Get collection link
  const collectionLink = isLosBros ? '/collections/los-bros' : '/collections/analos-profiles';

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-400/50 transition-all hover:shadow-2xl hover:shadow-purple-500/20 group relative">
      
      {/* Collection Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Link href={collectionLink}>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm cursor-pointer transition-transform hover:scale-105 ${
            isLosBros 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
          }`}>
            {isLosBros ? '🎨 Los Bros' : '👤 Profile'}
          </div>
        </Link>
      </div>

      {/* Owner Badge */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            👤 Yours
          </div>
        </div>
      )}

      {/* NFT Image */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900 cursor-pointer" onClick={() => onViewDetails?.(nft.id)}>
        {isLosBros && displayImage.includes('/api/los-bros/composite-image') ? (
          // Use iframe for Los Bros composite HTML images
          <iframe
            src={displayImage}
            className="w-full h-full border-0 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            title={nft.name}
            sandbox="allow-same-origin"
            loading="lazy"
          />
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🖼️</div>
              <div className="text-sm">Image unavailable</div>
            </div>
          </div>
        ) : (
          <img
            src={displayImage}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
            onError={(e) => {
              if (!imageError) {
                setImageError(true);
              }
            }}
          />
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <button className="w-full bg-white/10 backdrop-blur-md text-white py-2 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-4 space-y-3">
        {/* Name and Token ID */}
        <div>
          <h3 className="text-white font-bold text-lg truncate">{nft.name}</h3>
          {isLosBros && nft.los_bros_token_id && (
            <p className="text-gray-400 text-xs">Token ID: #{nft.los_bros_token_id}</p>
          )}
        </div>

        {/* Traits Preview (for Los Bros) */}
        {isLosBros && nft.traits && nft.traits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nft.traits.slice(0, 3).map((trait: any, index: number) => (
              <div key={index} className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
                <span className="text-gray-500">{trait.trait_type}:</span>{' '}
                <span className="text-white font-semibold">{trait.value}</span>
              </div>
            ))}
            {nft.traits.length > 3 && (
              <div className="bg-purple-500/20 px-2 py-1 rounded text-xs text-purple-300 font-semibold">
                +{nft.traits.length - 3} more
              </div>
            )}
          </div>
        )}

        {/* Rarity (for Los Bros) */}
        {isLosBros && nft.rarity && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Rarity:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              nft.rarity === 'Legendary' ? 'bg-yellow-500/20 text-yellow-300' :
              nft.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
              nft.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {nft.rarity}
            </span>
            {nft.rarityScore && (
              <span className="text-gray-400 text-xs">({nft.rarityScore.toFixed(1)})</span>
            )}
          </div>
        )}

        {/* Owner Info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-500 text-xs">Owner</p>
              <p className="text-gray-300 text-xs font-mono">
                {nft.owner ? `${nft.owner.slice(0, 4)}...${nft.owner.slice(-4)}` : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Listed Status */}
          {nft.floorPrice && nft.floorPrice > 0 ? (
            <div className="text-right">
              <p className="text-gray-500 text-xs">Listed</p>
              <p className="text-green-400 font-bold text-sm flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {formatPrice(nft.floorPrice)}
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-gray-500 text-xs">Status</p>
              <p className="text-gray-400 text-sm">Not Listed</p>
            </div>
          )}
        </div>

        {/* Sales Count (if available) */}
        {nft.sales1d !== undefined && nft.sales1d > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
            <p className="text-green-300 text-xs font-semibold">
              🔥 {nft.sales1d} sale{nft.sales1d !== 1 ? 's' : ''} today
            </p>
          </div>
        )}

        {/* Description (if available and not Los Bros) */}
        {!isLosBros && nft.description && (
          <p className="text-gray-400 text-xs line-clamp-2">{nft.description}</p>
        )}

        {/* Marketplace Actions */}
        {connected && (
          <div className="pt-3 border-t border-white/10 flex gap-2">
            {isOwner ? (
              // Owner actions
              <>
                {isListed ? (
                  <button
                    onClick={handleDelist}
                    disabled={loading}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    {loading ? 'Delisting...' : 'Delist'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowListModal(true)}
                    disabled={loading}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    List for Sale
                  </button>
                )}
              </>
            ) : (
              // Non-owner actions
              <>
                {isListed ? (
                  <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {loading ? 'Buying...' : `Buy for ${currentPrice} LOS`}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Make Offer
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* List Modal */}
      {showListModal && (
        <ListingModal
          nft={nft}
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            setShowListModal(false);
            loadListingInfo();
            onMarketplaceAction?.();
          }}
        />
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <OfferModal
          nft={nft}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            setShowOfferModal(false);
            onMarketplaceAction?.();
          }}
        />
      )}
    </div>
  );

  // Handler functions
  async function handleDelist() {
    if (!publicKey || !activeListing) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/delist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: activeListing.id,
          seller: publicKey.toString()
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadListingInfo();
        onMarketplaceAction?.();
      } else {
        alert(`Failed to delist: ${result.error}`);
      }
    } catch (error) {
      console.error('Error delisting:', error);
      alert('Failed to delist NFT');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    if (!publicKey || !activeListing) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: activeListing.id,
          buyer: publicKey.toString()
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadListingInfo();
        onMarketplaceAction?.();
        alert('NFT purchased successfully!');
      } else {
        alert(`Failed to buy: ${result.error}`);
      }
    } catch (error) {
      console.error('Error buying:', error);
      alert('Failed to buy NFT');
    } finally {
      setLoading(false);
    }
  }
}

// Listing Modal Component
function ListingModal({ nft, onClose, onSuccess }: any) {
  const { publicKey } = useWallet();
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleList = async () => {
    if (!publicKey || !price || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint: nft.id,
          price: parseFloat(price),
          seller: publicKey.toString()
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
      } else {
        alert(`Failed to list: ${result.error}`);
      }
    } catch (error) {
      console.error('Error listing:', error);
      alert('Failed to list NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white text-xl font-bold mb-4">List {nft.name} for Sale</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-2">Price (LOS)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleList}
              disabled={loading || !price}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Listing...' : 'List NFT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offer Modal Component
function OfferModal({ nft, onClose, onSuccess }: any) {
  const { publicKey } = useWallet();
  const [offerPrice, setOfferPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOffer = async () => {
    if (!publicKey || !offerPrice || parseFloat(offerPrice) <= 0) {
      alert('Please enter a valid offer price');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/make-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint: nft.id,
          offerPrice: parseFloat(offerPrice),
          buyer: publicKey.toString()
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Offer submitted successfully!');
        onSuccess();
      } else {
        alert(`Failed to make offer: ${result.error}`);
      }
    } catch (error) {
      console.error('Error making offer:', error);
      alert('Failed to make offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 border border-blue-500/30 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white text-xl font-bold mb-4">Make Offer on {nft.name}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-2">Offer Price (LOS)</label>
            <input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
              step="0.01"
              min="0"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-200 text-xs">
              💡 Your offer will be visible to the owner. They can accept, counter, or decline.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOffer}
              disabled={loading || !offerPrice}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

