'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// import { ClientWalletProvider } from '../components/ClientWalletProvider';

interface Collection {
  name: string;
  description: string;
  image: string;
  price: number;
  maxSupply: number;
  currentSupply: number;
  symbol: string;
  isActive: boolean;
}

export default function MintPage() {
  const { publicKey, connected } = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/collections`);
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
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
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      <div className="mb-4">
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2">{collection.name}</h3>
                        <p className="text-white/80 text-sm mb-3 line-clamp-2">{collection.description}</p>
                        <div className="flex justify-between items-center text-sm text-white/60">
                          <span>Symbol: {collection.symbol}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            collection.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {collection.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Price:</span>
                          <span className="text-white font-semibold">{collection.price} $LOS</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Supply:</span>
                          <span className="text-white font-semibold">
                            {collection.currentSupply}/{collection.maxSupply}
                          </span>
                        </div>

                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-white/60">
                            {remainingSupply} remaining
                          </span>
                          <span className="text-white/60">
                            {progressPercentage.toFixed(1)}% minted
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="text-center">
                          <span className="text-purple-400 font-semibold">
                            {collection.isActive && remainingSupply > 0 ? 'Mint Now' : 'View Collection'}
                          </span>
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
