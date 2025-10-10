'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import Link from 'next/link';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  maxSupply: number;
  totalMinted: number;
  mintPriceUSD: number;
  mintPriceLOS: number;
  isActive: boolean;
  mintingEnabled: boolean;
  deployedAt: string;
  creator: string;
  category: string;
  website?: string;
  twitter?: string;
  discord?: string;
  programId: string;
  collectionConfig: string; // PDA address
  isWhitelistOnly: boolean;
  revealType: 'instant' | 'delayed';
  revealDate?: string;
  bondingCurveEnabled: boolean;
  currentTier: number;
  tierPrices: number[];
}

interface CollectionStats {
  totalCollections: number;
  totalNFTs: number;
  totalVolume: number;
  activeCollections: number;
}

export default function MarketplacePage() {
  const { connected, publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  // State management
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    totalCollections: 0,
    totalNFTs: 0,
    totalVolume: 0,
    activeCollections: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'supply'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'minting' | 'revealed' | 'whitelist'>('all');
  const [minting, setMinting] = useState<{ [key: string]: boolean }>({});
  const [losPrice, setLosPrice] = useState<number>(0);

  // Load collections from smart contract
  useEffect(() => {
    const loadCollections = async () => {
      try {
        console.log('📊 Loading collections from Analos blockchain...');
        console.log('🔗 NFT Launchpad Program:', ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString());
        
        // TODO: Implement actual smart contract integration
        // This would:
        // 1. Query the NFT_LAUNCHPAD program for all collection configs
        // 2. For each collection, get metadata from Price Oracle
        // 3. Calculate current LOS prices using Price Oracle
        // 4. Get rarity data from Rarity Oracle
        // 5. Get bonding curve data from Token Launch program
        
        // For now, simulate with demo data
        const demoCollections: Collection[] = [
          {
            id: 'demo-1',
            name: 'Los Bros Collection',
            symbol: 'LOSBROS',
            description: 'The legendary Los Bros NFT collection on Analos',
            imageUrl: '/api/placeholder/400/400',
            maxSupply: 2222,
            totalMinted: 0,
            mintPriceUSD: 42.00,
            mintPriceLOS: 4200000000, // Will be calculated from Price Oracle
            isActive: true,
            mintingEnabled: true,
            deployedAt: new Date().toISOString(),
            creator: '4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q',
            category: 'PFP',
            programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString(),
            collectionConfig: 'DemoCollectionConfigPDA',
            isWhitelistOnly: false,
            revealType: 'delayed',
            revealDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            bondingCurveEnabled: true,
            currentTier: 1,
            tierPrices: [42.00, 44.00, 46.00, 48.00, 50.00]
          }
        ];

        setCollections(demoCollections);
        setCollectionStats({
          totalCollections: demoCollections.length,
          totalNFTs: demoCollections.reduce((sum, col) => sum + col.totalMinted, 0),
          totalVolume: demoCollections.reduce((sum, col) => sum + (col.totalMinted * col.mintPriceUSD), 0),
          activeCollections: demoCollections.filter(col => col.isActive).length
        });

        console.log('✅ Loaded collections:', demoCollections.length);
      } catch (error) {
        console.error('❌ Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  // Load LOS price from Price Oracle
  useEffect(() => {
    const loadLOSPrice = async () => {
      try {
        console.log('💰 Loading LOS price from Price Oracle...');
        console.log('🔗 Price Oracle Program:', ANALOS_PROGRAMS.PRICE_ORACLE.toString());
        
        // TODO: Implement actual Price Oracle integration
        // This would call the Price Oracle program to get current LOS price
        
        // For now, simulate
        setLosPrice(0.10); // $0.10 per LOS
        console.log('✅ LOS price loaded:', 0.10);
      } catch (error) {
        console.error('❌ Error loading LOS price:', error);
      }
    };

    loadLOSPrice();
  }, []);

  // Filter and sort collections
  const filteredCollections = collections
    .filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = (() => {
        switch (filterBy) {
          case 'active': return collection.isActive;
          case 'minting': return collection.mintingEnabled;
          case 'revealed': return collection.revealType === 'instant';
          case 'whitelist': return collection.isWhitelistOnly;
          default: return true;
        }
      })();

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
        case 'oldest': return new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime();
        case 'price-low': return a.mintPriceUSD - b.mintPriceUSD;
        case 'price-high': return b.mintPriceUSD - a.mintPriceUSD;
        case 'supply': return b.totalMinted - a.totalMinted;
        default: return 0;
      }
    });

  const handleMint = async (collection: Collection) => {
    if (!connected || !publicKey || !signTransaction) {
      alert('Please connect your wallet to mint');
      return;
    }

    setMinting(prev => ({ ...prev, [collection.id]: true }));

    try {
      console.log('🎯 Minting from collection:', collection.name);
      console.log('💰 Price (USD):', collection.mintPriceUSD);
      console.log('💰 Price (LOS):', collection.mintPriceLOS);
      
      // TODO: Implement actual minting with smart contract
      // This would:
      // 1. Calculate exact LOS amount needed using Price Oracle
      // 2. Call NFT_LAUNCHPAD.mint_placeholder()
      // 3. Handle bonding curve logic if enabled
      // 4. Handle whitelist checks if whitelist only
      // 5. Sign and send transaction
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully minted from ${collection.name}! (Demo mode)`);
      
      // Refresh collection data
      setCollections(prev => prev.map(col => 
        col.id === collection.id 
          ? { ...col, totalMinted: col.totalMinted + 1 }
          : col
      ));
      
    } catch (error: any) {
      console.error('❌ Error minting:', error);
      alert(`Failed to mint: ${error.message}`);
    } finally {
      setMinting(prev => ({ ...prev, [collection.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Loading Collections...</div>
          <div className="text-gray-300 mt-2">Fetching data from Analos blockchain</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏪 NFT Marketplace
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover and mint NFTs from collections deployed on the Analos blockchain
          </p>
        </div>

        {/* Smart Contract Integration Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">🔗 Smart Contract Integration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-lg font-bold text-white mb-2">NFT Launchpad</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">Price Oracle</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.PRICE_ORACLE.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">🎲</div>
              <h3 className="text-lg font-bold text-white mb-2">Rarity Oracle</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.RARITY_ORACLE.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="text-lg font-bold text-white mb-2">Token Launch</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.TOKEN_LAUNCH.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
          </div>
        </div>

        {/* Market Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-lg font-semibold text-white mb-1">Total Collections</h3>
            <p className="text-2xl font-bold text-purple-400">{collectionStats.totalCollections}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-1">Total NFTs</h3>
            <p className="text-2xl font-bold text-blue-400">{collectionStats.totalNFTs.toLocaleString()}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">💎</div>
            <h3 className="text-lg font-semibold text-white mb-1">Total Volume</h3>
            <p className="text-2xl font-bold text-green-400">${collectionStats.totalVolume.toLocaleString()}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-1">Active</h3>
            <p className="text-2xl font-bold text-orange-400">{collectionStats.activeCollections}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="supply">Supply: High to Low</option>
              </select>
              
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Collections</option>
                <option value="active">Active Only</option>
                <option value="minting">Minting Enabled</option>
                <option value="revealed">Instant Reveal</option>
                <option value="whitelist">Whitelist Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollections.map((collection) => (
            <div key={collection.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
              {/* Collection Image */}
              <div className="aspect-square bg-gray-800/50 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-6xl">🎨</div>
              </div>

              {/* Collection Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                  <p className="text-gray-300 text-sm">{collection.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Minted:</span>
                    <span className="text-white font-semibold ml-2">{collection.totalMinted}/{collection.maxSupply}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-semibold ml-2">${collection.mintPriceUSD}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(collection.totalMinted / collection.maxSupply) * 100}%` }}
                  ></div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {collection.isWhitelistOnly && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">Whitelist</span>
                  )}
                  {collection.revealType === 'delayed' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">Delayed Reveal</span>
                  )}
                  {collection.bondingCurveEnabled && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">Bonding Curve</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleMint(collection)}
                    disabled={!collection.mintingEnabled || !connected || minting[collection.id]}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {minting[collection.id] ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Minting...
                      </div>
                    ) : (
                      `Mint for $${collection.mintPriceUSD}`
                    )}
                  </button>
                  
                  <Link
                    href={`/mint/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20"
                  >
                    View
                  </Link>
                </div>

                {/* Creator Info */}
                <div className="pt-3 border-t border-white/10">
                  <div className="text-xs text-gray-400">
                    <span>Creator:</span>
                    <span className="text-white font-mono ml-1">
                      {collection.creator.slice(0, 8)}...{collection.creator.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCollections.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Collections Found</h3>
            <p className="text-gray-300 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to launch a collection!'}
            </p>
            <Link
              href="/launch-collection"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              🚀 Launch Collection
            </Link>
          </div>
        )}

        {/* Wallet Connection Notice */}
        {!connected && (
          <div className="fixed bottom-6 right-6 bg-yellow-900/90 backdrop-blur-sm border border-yellow-500 rounded-xl p-4 max-w-sm">
            <div className="flex items-start">
              <span className="text-xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-300">Connect Your Wallet</p>
                <p className="text-yellow-200 text-sm mt-1">
                  Connect your wallet to mint NFTs and access all marketplace features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
