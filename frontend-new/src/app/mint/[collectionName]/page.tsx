'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CollectionInfo {
  name: string;
  description: string;
  imageUrl: string;
  mintPrice: number;
  totalSupply: number;
  currentSupply: number;
  feePercentage: number;
  symbol: string;
  externalUrl: string;
}

function CollectionMintContent() {
  const { publicKey, connected } = useWallet();
  const params = useParams();
  const collectionName = decodeURIComponent(params.collectionName as string);
  
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const fetchCollectionInfo = useCallback(async () => {
    try {
      // Fixed backend URL for collection lookup - v3.3.0 - bypassing env vars
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const fullUrl = `${backendUrl}/api/collections/${encodeURIComponent(collectionName)}`;
      console.log('Fetching collection from:', fullUrl);
      const response = await fetch(fullUrl);
      if (response.ok) {
        const data = await response.json();
        setCollection(data.collection);
      } else {
        setMintStatus('Collection not found');
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      setMintStatus('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    setMounted(true);
    if (collectionName) {
      fetchCollectionInfo();
    }
  }, [collectionName, fetchCollectionInfo]);

  const handleMint = async () => {
    if (!connected || !publicKey) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    if (!collection) {
      setMintStatus('Collection not found');
      return;
    }

    if (mintQuantity < 1 || mintQuantity > 10) {
      setMintStatus('Quantity must be between 1 and 10');
      return;
    }

    setMinting(true);
    setMintStatus('Minting NFTs...');

    try {
      // Fixed backend URL for minting - v3.3.0 - bypassing env vars
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const mintUrl = `${backendUrl}/api/mint`;
      console.log('Minting from:', mintUrl);
      const response = await fetch(mintUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: collection.name,
          quantity: mintQuantity,
          walletAddress: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mint NFT');
      }

      const result = await response.json();
      
      if (result.success) {
        setMintStatus(`Successfully minted ${mintQuantity} NFT(s)! Transaction: ${result.transactionSignature}`);
        // Refresh collection info to update supply
        fetchCollectionInfo();
      } else {
        setMintStatus(`Minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Minting error:', error);
      setMintStatus('Minting failed. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-white/80 mb-6">{mintStatus}</p>
          <Link 
            href="/mint" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const remainingSupply = collection.totalSupply - collection.currentSupply;
  const totalCost = collection.mintPrice * mintQuantity;
  const platformFee = (totalCost * collection.feePercentage) / 100;
  const creatorRevenue = totalCost - platformFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Mint NFTs</h1>
            <WalletMultiButton />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Collection Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h1 className="text-3xl font-bold text-white mb-2">{collection.name}</h1>
                <p className="text-white/80 mb-4">{collection.description}</p>
                <div className="flex justify-center space-x-4 text-sm text-white/60">
                  <span>Symbol: {collection.symbol}</span>
                  <span>•</span>
                  <span>Supply: {collection.currentSupply}/{collection.totalSupply}</span>
                </div>
              </div>

              {/* Supply Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-white/80 text-sm mb-2">
                  <span>Minted</span>
                  <span>{collection.currentSupply}/{collection.totalSupply}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(collection.currentSupply / collection.totalSupply) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>{((collection.currentSupply / collection.totalSupply) * 100).toFixed(1)}% minted</span>
                  <span>{remainingSupply} remaining</span>
                </div>
              </div>

              {collection.externalUrl && (
                <div className="text-center">
                  <a
                    href={collection.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View Collection Website
                  </a>
                </div>
              )}
            </div>

            {/* Mint Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Mint NFTs</h2>
              
              {connected ? (
                <div>
                  <div className="mb-6">
                    <p className="text-white/80 text-sm mb-2">Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-white/80 text-sm mb-2">Quantity (1-10)</label>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                        className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-lg transition-colors"
                        disabled={mintQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-white text-xl font-semibold min-w-[3rem] text-center">
                        {mintQuantity}
                      </span>
                      <button
                        onClick={() => setMintQuantity(Math.min(10, mintQuantity + 1))}
                        className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-lg transition-colors"
                        disabled={mintQuantity >= 10}
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
                        <span>{collection.mintPrice} $LOS</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Quantity:</span>
                        <span>{mintQuantity}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Subtotal:</span>
                        <span>{totalCost} $LOS</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Platform Fee ({collection.feePercentage}%):</span>
                        <span>{platformFee.toFixed(2)} $LOS</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Creator Revenue:</span>
                        <span>{creatorRevenue.toFixed(2)} $LOS</span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between text-white font-semibold">
                        <span>Total Cost:</span>
                        <span>{totalCost} $LOS</span>
                      </div>
                    </div>
                  </div>

                  {/* Mint Button */}
                  <button
                    onClick={handleMint}
                    disabled={minting || !connected || remainingSupply < mintQuantity}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {minting ? 'Minting...' : `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''} for ${totalCost} $LOS`}
                  </button>

                  {mintStatus && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      <p className="text-white text-sm">{mintStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white/80 mb-6">Connect your wallet to mint NFTs</p>
                  <WalletMultiButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionMintPage() {
  return <CollectionMintContent />;
}
