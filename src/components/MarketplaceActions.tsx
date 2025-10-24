'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Tag, Heart, ShoppingCart, TrendingUp } from 'lucide-react';

interface MarketplaceActionsProps {
  nftMint: string;
  nftName: string;
  nftImage: string;
  nftType: 'profile_nft' | 'los_bros' | 'collection_nft';
  isOwner: boolean;
  currentPrice?: number;
  isListed?: boolean;
  onAction?: (action: 'list' | 'delist' | 'buy' | 'offer') => void;
}

export default function MarketplaceActions({
  nftMint,
  nftName,
  nftImage,
  nftType,
  isOwner,
  currentPrice,
  isListed = false,
  onAction
}: MarketplaceActionsProps) {
  const { publicKey, connected } = useWallet();
  const [showListModal, setShowListModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleList = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!listPrice || parseFloat(listPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/marketplace/list-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint,
          nftType,
          sellerWallet: publicKey.toString(),
          listPrice: parseFloat(listPrice),
          nftName,
          nftImage
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${nftName} listed for ${listPrice} LOS!`);
        setShowListModal(false);
        setListPrice('');
        onAction?.('list');
      } else {
        alert(`❌ Failed to list: ${result.error}`);
      }
    } catch (error: any) {
      console.error('List error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelist = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${nftName} from the marketplace?`)) {
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/marketplace/list-nft', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint,
          sellerWallet: publicKey.toString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${nftName} removed from marketplace!`);
        onAction?.('delist');
      } else {
        alert(`❌ Failed to delist: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Delist error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      alert('Please enter a valid offer amount');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/marketplace/make-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint,
          nftType,
          buyerWallet: publicKey.toString(),
          offerPrice: parseFloat(offerPrice)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Offer of ${offerPrice} LOS submitted!`);
        setShowOfferModal(false);
        setOfferPrice('');
        onAction?.('offer');
      } else {
        alert(`❌ Failed to make offer: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Offer error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!currentPrice) {
      alert('Price not available');
      return;
    }

    // TODO: Get seller wallet from listing data
    // For now, showing a detailed message
    const message = `
🛒 Buy ${nftName}

💰 Price: ${currentPrice} LOS
💵 Platform Fee (6.9%): ${(currentPrice * 0.069).toFixed(3)} LOS
💸 Total: ${currentPrice} LOS

⚠️  Note: Full Solana transaction integration requires:
1. Seller wallet address from listing
2. LOS token transfer approval
3. NFT escrow or program authority

The transaction infrastructure is ready in:
src/lib/marketplace-transactions.ts

Proceed to record the sale?`;

    if (!confirm(message)) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Record the sale in database
      // In production, this would happen AFTER the blockchain transaction
      const response = await fetch('/api/marketplace/execute-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftMint,
          nftType,
          nftName,
          sellerWallet: 'SELLER_WALLET', // TODO: Get from listing
          buyerWallet: publicKey.toString(),
          salePrice: currentPrice,
          currency: 'LOS',
          saleType: 'direct',
          transactionSignature: 'PENDING_BLOCKCHAIN_TX'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Sale recorded! In production, this would complete with blockchain payment.\n\n💡 Transaction service ready at:\nsrc/lib/marketplace-transactions.ts`);
        onAction?.('buy');
      } else {
        alert(`❌ Failed to record sale: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('Buy error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Action Buttons */}
      <div className="flex gap-2">
        {isOwner && !isListed && (
          <button
            onClick={() => setShowListModal(true)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <Tag className="w-4 h-4" />
            List for Sale
          </button>
        )}

        {isOwner && isListed && (
          <button
            onClick={handleDelist}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <Tag className="w-4 h-4" />
            Remove Listing
          </button>
        )}

        {!isOwner && isListed && currentPrice && (
          <button
            onClick={handleBuyNow}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now {currentPrice} LOS
          </button>
        )}

        {!isOwner && (
          <button
            onClick={() => setShowOfferModal(true)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4" />
            Make Offer
          </button>
        )}
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">List {nftName}</h3>
            
            <div className="mb-4">
              <label className="block text-white mb-2 font-medium">Price (LOS)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="Enter price in LOS"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              <p className="text-gray-400 text-sm mt-2">
                Platform fee: 6.9% ({(parseFloat(listPrice) * 0.069).toFixed(3)} LOS)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowListModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleList}
                disabled={isLoading || !listPrice}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Listing...' : 'List NFT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">Make Offer for {nftName}</h3>
            
            <div className="mb-4">
              <label className="block text-white mb-2 font-medium">Offer Amount (LOS)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Enter your offer in LOS"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
              {currentPrice && (
                <p className="text-gray-300 text-sm mt-2">
                  Current listing: {currentPrice} LOS
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeOffer}
                disabled={isLoading || !offerPrice}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

