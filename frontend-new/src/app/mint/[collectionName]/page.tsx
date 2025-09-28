'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// import { ClientWalletProvider } from '../../components/ClientWalletProvider';

interface CollectionInfo {
  name: string;
  description: string;
  image: string;
  price: number;
  maxSupply: number;
  currentSupply: number;
  feePercentage: number;
  symbol: string;
  externalUrl: string;
  isActive: boolean;
}

export default function CollectionMintPage() {
  const { publicKey, connected } = useWallet();
  const params = useParams();
  const collectionName = params.collectionName as string;
  
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mintQuantity, setMintQuantity] = useState(1);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collections/${collectionName}`);
        if (response.ok) {
          const data = await response.json();
          setCollection(data);
        } else {
          setMintStatus('Collection not found');
        }
      } catch (error) {
        setMintStatus('Failed to load collection');
        console.error('Error fetching collection:', error);
      } finally {
        setLoading(false);
      }
    };

    if (collectionName) {
      fetchCollection();
    }
  }, [collectionName]);

  const handleMint = async () => {
    if (!connected || !publicKey) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    if (!collection) {
      setMintStatus('Collection not loaded');
      return;
    }

    if (!collection.isActive) {
      setMintStatus('Minting is not active for this collection');
      return;
    }

    if (collection.currentSupply >= collection.maxSupply) {
      setMintStatus('Collection is sold out');
      return;
    }

    setMinting(true);
    setMintStatus('Preparing mint transaction...');

    try {
      // Calculate total cost
      const totalCost = collection.price * mintQuantity;
      
      // Create mint transaction
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          quantity: mintQuantity,
          userWallet: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create mint transaction');
      }

      const { transaction } = await response.json();
      
      setMintStatus('Please sign the transaction in your wallet...');
      
      // Here you would normally sign and send the transaction
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setMintStatus(`Successfully minted ${mintQuantity} NFT(s) for ${totalCost} $LOS!`);
      
      // Refresh collection data
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collections/${collectionName}`);
      if (refreshResponse.ok) {
        const updatedCollection = await refreshResponse.json();
        setCollection(updatedCollection);
      }
      
    } catch (error) {
      setMintStatus('Minting failed. Please try again.');
      console.error('Minting error:', error);
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Collection not found</div>
      </div>
    );
  }

  const remainingSupply = collection.maxSupply - collection.currentSupply;
  const totalCost = collection.price * mintQuantity;
  const platformFee = (totalCost * collection.feePercentage) / 100;
  const creatorRevenue = totalCost - platformFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Collection Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h1 className="text-3xl font-bold text-white mb-2">{collection.name}</h1>
                <p className="text-white/80 mb-4">{collection.description}</p>
                <div className="flex justify-center space-x-4 text-sm text-white/60">
                  <span>Symbol: {collection.symbol}</span>
                  <span>•</span>
                  <span>Supply: {collection.currentSupply}/{collection.maxSupply}</span>
                </div>
              </div>

              {collection.externalUrl && (
                <div className="text-center">
                  <a
                    href={collection.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    View Collection Website
                  </a>
                </div>
              )}
            </div>

            {/* Minting Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Mint NFT</h2>
              
              {/* Wallet Connection */}
              <div className="text-center mb-6">
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
                {connected && (
                  <p className="text-white/60 mt-2 text-sm">
                    Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                )}
              </div>

              {/* Collection Status */}
              <div className="mb-6 p-4 bg-white/10 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/80">Status:</span>
                  <span className={`font-semibold ${collection.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {collection.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/80">Remaining:</span>
                  <span className="text-white font-semibold">{remainingSupply}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Price:</span>
                  <span className="text-white font-semibold">{collection.price} $LOS</span>
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                    disabled={mintQuantity <= 1}
                    className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(10, remainingSupply)}
                    value={mintQuantity}
                    onChange={(e) => setMintQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setMintQuantity(Math.min(10, remainingSupply, mintQuantity + 1))}
                    disabled={mintQuantity >= Math.min(10, remainingSupply)}
                    className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mb-6 p-4 bg-white/10 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Cost Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>Price per NFT:</span>
                    <span>{collection.price} $LOS</span>
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
                disabled={!connected || !collection.isActive || remainingSupply === 0 || minting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {minting ? 'Minting...' : 
                 !collection.isActive ? 'Minting Inactive' :
                 remainingSupply === 0 ? 'Sold Out' :
                 `Mint ${mintQuantity} NFT${mintQuantity > 1 ? 's' : ''} for ${totalCost} $LOS`}
              </button>

              {mintStatus && (
                <div className="mt-6 p-4 bg-white/20 rounded-lg">
                  <p className="text-white text-center">{mintStatus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
