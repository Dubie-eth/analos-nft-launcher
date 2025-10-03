'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import RealMintButton from './RealMintButton';
import PaymentSelector from './PaymentSelector';
import LOLBalanceChecker from './LOLBalanceChecker';
import WhitelistStatus from './WhitelistStatus';
import SupplyDisplay from './SupplyDisplay';
import StandardLayout from './StandardLayout';

interface MintPagePreviewProps {
  collectionData: {
    name: string;
    description: string;
    imageUrl: string;
    mintPrice: number;
    totalSupply: number;
    currentSupply: number;
    symbol: string;
    externalUrl?: string;
  };
  onClose: () => void;
}

export default function MintPagePreview({ collectionData, onClose }: MintPagePreviewProps) {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [whitelistPrice, setWhitelistPrice] = useState<number | null>(null);
  const [whitelistMultiplier, setWhitelistMultiplier] = useState(1.0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading preview...</div>
      </div>
    );
  }

  const remainingSupply = collectionData.totalSupply - collectionData.currentSupply;
  const effectivePrice = whitelistPrice !== null ? whitelistPrice : collectionData.mintPrice;
  const totalCost = effectivePrice * mintQuantity;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎭 Mint Page Preview</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">Preview Mode</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <StandardLayout>
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">Mint NFTs</h1>
                <WalletMultiButton />
              </div>

              {/* Collection Details */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Collection Image */}
                <div className="relative">
                  <img
                    src={collectionData.imageUrl || 'https://picsum.photos/500/500?random=preview'}
                    alt={collectionData.name}
                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-white text-sm font-medium">Preview</span>
                  </div>
                </div>

                {/* Collection Info */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{collectionData.name}</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {collectionData.description || 'A unique NFT collection with amazing traits and rarity.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Price:</span>
                      <span className="text-2xl font-bold text-white">
                        {collectionData.mintPrice.toFixed(2)} $LOS
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Symbol:</span>
                      <span className="text-xl font-bold text-purple-400">
                        {collectionData.symbol || 'N/A'}
                      </span>
                    </div>

                    {collectionData.externalUrl && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Website:</span>
                        <a
                          href={collectionData.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Visit Site
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Supply Progress */}
              <div className="mb-6">
                <SupplyDisplay collectionName={collectionData.name} />
              </div>

              {/* Whitelist Status */}
              <WhitelistStatus
                collectionId={`collection_${collectionData.name.toLowerCase().replace(/\s+/g, '_')}`}
                collectionName={collectionData.name}
                basePrice={collectionData.mintPrice}
                onWhitelistPriceChange={(price, multiplier, rule) => {
                  setWhitelistPrice(price);
                  setWhitelistMultiplier(multiplier);
                }}
              />

              {/* LOL Balance Checker */}
              <div className="mb-6">
                <LOLBalanceChecker />
              </div>

              {/* Mint Interface */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Mint NFTs</h2>
                
                {connected ? (
                  <div>
                    {/* Quantity Selector */}
                    <div className="mb-6">
                      <label className="block text-lg font-semibold text-white mb-3">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                          className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold text-white min-w-[3rem] text-center">
                          {mintQuantity}
                        </span>
                        <button
                          onClick={() => setMintQuantity(Math.min(10, mintQuantity + 1))}
                          className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Cost Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-white/80">
                          <span>Price per NFT:</span>
                          <span>
                            {whitelistPrice !== null ? (
                              <span className="flex items-center space-x-2">
                                <span>{effectivePrice.toFixed(2)} $LOS</span>
                                <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                                  WHITELIST {whitelistMultiplier === 0 ? 'FREE' : `${whitelistMultiplier}x`}
                                </span>
                              </span>
                            ) : (
                              `${effectivePrice.toFixed(2)} $LOS`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Quantity:</span>
                          <span>{mintQuantity}</span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Subtotal:</span>
                          <span>{(effectivePrice * mintQuantity).toFixed(2)} $LOS</span>
                        </div>
                        <div className="flex justify-between text-white/80">
                          <span>Platform Fee (2.5%):</span>
                          <span>{(totalCost * 0.025).toFixed(2)} $LOS</span>
                        </div>
                        <div className="border-t border-white/20 pt-2 mt-2">
                          <div className="flex justify-between text-white font-semibold">
                            <span>Total Cost:</span>
                            <span>{(totalCost * 1.025).toFixed(2)} $LOS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Selector */}
                    <div className="mb-6">
                      <PaymentSelector />
                    </div>

                    {/* Preview Mint Button */}
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg">
                        🎭 PREVIEW MODE - Mint {mintQuantity} NFT{mintQuantity > 1 ? 's' : ''} for {(totalCost * 1.025).toFixed(2)} $LOS
                      </div>
                      <p className="text-gray-400 text-sm mt-2">
                        This is a preview. No actual minting will occur.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/80 text-lg mb-4">
                      Connect your wallet to preview the minting experience
                    </p>
                    <WalletMultiButton />
                  </div>
                )}
              </div>
            </div>
          </StandardLayout>
        </div>
      </div>
    </div>
  );
}
