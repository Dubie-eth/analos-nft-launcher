'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface NFT {
  mintAddress: string;
  tokenId: number;
  name: string;
  description: string;
  image: string;
  collection: string;
  owner: string;
  metadata?: string;
  masterEdition?: string;
  transactionSignature: string;
  explorerUrl: string;
  mintedAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  currency: string;
  mintAddress?: string;
  metadataAddress?: string;
  masterEditionAddress?: string;
}

function NFTViewerContent() {
  const { publicKey, connected } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchNFTs();
    fetchCollections();
  }, []);

  const fetchNFTs = async () => {
    try {
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const response = await fetch(`${backendUrl}/api/nfts`);
      if (response.ok) {
        const data = await response.json();
        setNfts(data.nfts || []);
      }
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  };

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

  const filteredNFTs = selectedCollection === 'all' 
    ? nfts 
    : nfts.filter(nft => nft.collection.toLowerCase() === selectedCollection.toLowerCase());

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading NFTs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Analos NFT Explorer
            </h1>
            <p className="text-white/80 mb-6">
              Discover and explore NFTs minted on the Analos blockchain
            </p>
            
            {connected && (
              <p className="text-white/60">
                Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Total NFTs</h3>
              <p className="text-3xl font-bold text-white">{nfts.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Collections</h3>
              <p className="text-3xl font-bold text-white">{collections.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Total Supply</h3>
              <p className="text-3xl font-bold text-white">
                {collections.reduce((sum, col) => sum + col.currentSupply, 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Network</h3>
              <p className="text-3xl font-bold text-white">Analos</p>
            </div>
          </div>

          {/* Collection Filter */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Filter by Collection</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCollection('all')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    selectedCollection === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  All Collections
                </button>
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection.name)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedCollection === collection.name
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NFTs Grid */}
          {filteredNFTs.length === 0 ? (
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">No NFTs Found</h2>
                <p className="text-white/80 mb-6">
                  {selectedCollection === 'all' 
                    ? 'No NFTs have been minted yet. Be the first to mint an NFT!'
                    : `No NFTs found in the ${selectedCollection} collection.`
                  }
                </p>
                <Link
                  href="/mint"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Mint NFTs
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                <div
                  key={nft.mintAddress}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="mb-4">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/500/500?random=' + Math.random();
                      }}
                    />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{nft.name}</h3>
                  <p className="text-white/80 text-sm mb-2">{nft.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/80">
                      <span>Collection:</span>
                      <span className="font-semibold">{nft.collection}</span>
                    </div>
                    
                    <div className="flex justify-between text-white/80">
                      <span>Token ID:</span>
                      <span className="font-semibold">#{nft.tokenId}</span>
                    </div>
                    
                    <div className="flex justify-between text-white/80">
                      <span>Owner:</span>
                      <span className="font-semibold">
                        {nft.owner.slice(0, 8)}...{nft.owner.slice(-8)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-white/80">
                      <span>Minted:</span>
                      <span className="font-semibold">
                        {new Date(nft.mintedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <a
                      href={nft.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-center font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      View on Explorer
                    </a>
                    
                    <div className="text-xs text-white/60">
                      <p>Mint: {nft.mintAddress.slice(0, 8)}...{nft.mintAddress.slice(-8)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NFTViewer() {
  return <NFTViewerContent />;
}
