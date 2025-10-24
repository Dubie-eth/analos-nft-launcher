'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import ProfileNFTDisplay from './ProfileNFTDisplay';
import MarketplaceActions from './MarketplaceActions';

interface MarketplaceNFTCardProps {
  nft: any;
  showUSD?: boolean;
  onViewDetails?: (nftId: string) => void;
  onFavorite?: (nftId: string) => void;
  onMarketplaceAction?: () => void;
}

export default function MarketplaceNFTCard({
  nft,
  showUSD = false,
  onViewDetails,
  onFavorite,
  onMarketplaceAction
}: MarketplaceNFTCardProps) {
  const { publicKey } = useWallet();
  const [listingInfo, setListingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListingInfo();
  }, [nft.id]);

  const loadListingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/nft-details/${nft.id}`);
      const result = await response.json();
      
      if (result.success) {
        setListingInfo(result.data);
      }
    } catch (error) {
      console.error('Error loading listing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = publicKey?.toString() === nft.owner;
  const activeListing = listingInfo?.listings?.find((l: any) => l.status === 'active');
  const isListed = !!activeListing;
  const currentPrice = activeListing?.list_price;

  return (
    <div className="relative group">
      {/* NFT Display */}
      <ProfileNFTDisplay
        nft={nft}
        showUSD={showUSD}
        onViewDetails={onViewDetails}
        onFavorite={onFavorite}
      />
      
      {/* Marketplace Actions Overlay */}
      <div className="mt-4">
        <MarketplaceActions
          nftMint={nft.id}
          nftName={nft.name}
          nftImage={nft.image}
          nftType="profile_nft"
          isOwner={isOwner}
          currentPrice={currentPrice}
          isListed={isListed}
          onAction={(action) => {
            console.log(`Marketplace action: ${action}`);
            loadListingInfo(); // Refresh listing info
            onMarketplaceAction?.(); // Notify parent
          }}
        />
      </div>

      {/* Listing Badge */}
      {isListed && currentPrice && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            🏷️ {currentPrice} LOS
          </div>
        </div>
      )}

      {/* Owner Badge */}
      {isOwner && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            👤 Your NFT
          </div>
        </div>
      )}
    </div>
  );
}

