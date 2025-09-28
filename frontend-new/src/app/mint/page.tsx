'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Collection {
  name: string;
  description: string;
  image: string;
  price: number;
  maxSupply: number;
  currentSupply: number;
  feePercentage: number;
  symbol: string;
  externalUrl: string;
}

function MintPageContent() {
  const { publicKey, connected } = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const response = await fetch(`${backendUrl}/api/collections`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Available NFT Collections
            </h1>
            <p className="text-white/80 mb-6">
              Choose a collection to mint NFTs on the Analos blockchain
            </p>
            
            <div className="mb-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
              {connected && (
                <p className="text-white/60 mt-2">
                  Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
              )}
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">No Collections Available</h2>
                <p className="text-white/80 mb-6">
                  No NFT collections have been deployed yet. Create one in the admin panel!
                </p>
                <Link
                  href="/admin"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Create Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => {
                const remainingSupply = collection.maxSupply - collection.currentSupply;
                const progressPercentage = (collection.currentSupply / collection.maxSupply) * 100;
                
                return (
                  <Link
                    key={collection.name}
                    href={`/mint/${encodeURIComponent(collection.name)}`}
                    className="block"
                  >
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <div className="mb-4">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{collection.name}</h3>
                      <p className="text-white/80 text-sm mb-4 line-clamp-2">{collection.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-white/80 text-sm">
                          <span>Price:</span>
                          <span className="font-semibold">{collection.price} $LOS</span>
                        </div>
                        
                        <div className="flex justify-between text-white/80 text-sm">
                          <span>Supply:</span>
                          <span>{collection.currentSupply}/{collection.maxSupply}</span>
                        </div>
                        
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-white/60 text-xs">
                          <span>{progressPercentage.toFixed(1)}% minted</span>
                          <span>{remainingSupply} remaining</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MintPage() {
  return <MintPageContent />;
}