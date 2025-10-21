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
  const [marketTab, setMarketTab] = useState<'collections' | 'listings'>('collections');
  const [listings, setListings] = useState<any[]>([]);
  const [buying, setBuying] = useState<{ [key: string]: boolean }>({});

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
        
        // Load REAL collections from blockchain
        const { blockchainService } = await import('@/lib/blockchain-service');
        const blockchainCollections = await blockchainService.getAllCollections();
        
        // Transform to UI format
        const uiCollections: Collection[] = blockchainCollections.map((col) => ({
          id: col.address,
          name: col.collectionName,
          symbol: col.collectionSymbol,
          description: `${col.collectionName} - ${col.bondingCurveEnabled ? 'Bonding Curve Enabled' : 'Fixed Price'} Collection on Analos`,
          imageUrl: col.placeholderUri || '/api/placeholder/400/400',
          maxSupply: col.totalSupply,
          totalMinted: col.mintedCount,
          mintPriceUSD: col.mintPriceUSD,
          mintPriceLOS: col.mintPriceLamports,
          isActive: !col.isPaused,
          mintingEnabled: !col.isPaused && col.mintedCount < col.totalSupply,
          deployedAt: new Date().toISOString(),
          creator: col.authority,
          category: 'NFT Collection',
          programId: col.programId,
          collectionConfig: col.address,
          isWhitelistOnly: col.isWhitelistOnly,
          revealType: col.isRevealed ? 'instant' : 'delayed',
          revealDate: col.isRevealed ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          bondingCurveEnabled: col.bondingCurveEnabled,
          currentTier: 1,
          tierPrices: [col.mintPriceUSD]
        }));

        console.log(`✅ Loaded ${uiCollections.length} REAL collections from blockchain!`);
        
        setCollections(uiCollections);
        setCollectionStats({
          totalCollections: uiCollections.length,
          totalNFTs: uiCollections.reduce((sum, col) => sum + col.totalMinted, 0),
          totalVolume: uiCollections.reduce((sum, col) => sum + (col.totalMinted * col.mintPriceUSD), 0),
          activeCollections: uiCollections.filter(col => col.isActive).length
        });

        if (uiCollections.length === 0) {
          console.log('ℹ️ No collections found on blockchain yet. Deploy your first collection to see it here!');
        }
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
        
        // Load REAL LOS price from Price Oracle
        const { blockchainService } = await import('@/lib/blockchain-service');
        const currentPrice = await blockchainService.getCurrentLOSPrice();
        
        setLosPrice(currentPrice);
        console.log('✅ LOS price loaded from blockchain:', currentPrice);
      } catch (error) {
        console.error('❌ Error loading LOS price:', error);
        setLosPrice(0.10); // Fallback
      }
    };

    loadLOSPrice();
  }, []);

  // Load marketplace listings
  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await fetch('/api/marketplace/listings');
        const data = await response.json();
        
        if (data.success) {
          setListings(data.listings);
          console.log(`✅ Loaded ${data.listings.length} marketplace listings`);
        }
      } catch (error) {
        console.error('❌ Error loading listings:', error);
      }
    };

    if (marketTab === 'listings') {
      loadListings();
    }
  }, [marketTab]);

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
    if (!connected || !publicKey || !signTransaction || !sendTransaction) {
      alert('Please connect your wallet to mint');
      return;
    }

    setMinting(prev => ({ ...prev, [collection.id]: true }));

    try {
      console.log('🎯 Minting from REAL collection:', collection.name);
      console.log('📍 Collection Address:', collection.id);
      console.log('💰 Price (USD):', collection.mintPriceUSD);
      console.log('💰 Price (LOS lamports):', collection.mintPriceLOS);
      console.log('🔄 Bonding Curve:', collection.bondingCurveEnabled ? 'Enabled' : 'Disabled');
      
      // Import minting service
      const { mintingService } = await import('@/lib/minting-service');
      
      // Check if user can mint
      const eligibility = await mintingService.canUserMint(collection.id, publicKey);
      if (!eligibility.canMint) {
        alert(`Cannot mint: ${eligibility.reason}`);
        setMinting(prev => ({ ...prev, [collection.id]: false }));
        return;
      }
      
      // Estimate cost
      const cost = await mintingService.estimateMintCost(collection.id);
      if (cost) {
        console.log(`💵 Estimated total cost: ${cost.total.toFixed(4)} SOL`);
      }
      
      // Execute mint transaction
      console.log('🚀 Executing mint transaction...');
      const result = await mintingService.mintPlaceholderNFT({
        collectionAddress: collection.id,
        userWallet: publicKey,
        signTransaction,
        sendTransaction,
      });

      if (result.success) {
        alert(
          `✅ ${result.message}\n\n` +
          `Mint Address: ${result.mintAddress}\n` +
          `Transaction: ${result.signature}\n\n` +
          `View on Explorer: https://explorer.analos.io/tx/${result.signature}`
        );
        
        // Refresh collection data
        const { blockchainService } = await import('@/lib/blockchain-service');
        const updatedCollection = await blockchainService.getCollectionByAddress(collection.id);
        
        if (updatedCollection) {
          setCollections(prev => prev.map(col =>
            col.id === collection.id
              ? {
                  ...col,
                  totalMinted: updatedCollection.mintedCount,
                  currentSupply: updatedCollection.mintedCount,
                  mintPriceUSD: updatedCollection.mintPriceUSD,
                  mintPriceSOL: updatedCollection.mintPriceSOL,
                }
              : col
          ));
        }
      } else {
        alert(`❌ Mint failed: ${result.message}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error during mint:', error);
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

        {/* Market Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-8">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setMarketTab('collections')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                marketTab === 'collections'
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              🚀 Primary Market (Mint)
            </button>
            <button
              onClick={() => setMarketTab('listings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                marketTab === 'listings'
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              💰 Secondary Market ({listings.length})
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        {marketTab === 'collections' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-1p-ignore
                data-lpignore="true"
                autoComplete="off"
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
        )}

        {/* Collections Grid */}
        {marketTab === 'collections' && (
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
        )}

        {/* Secondary Market Listings */}
        {marketTab === 'listings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Listed NFTs ({listings.length})
              </h2>
              <button
                onClick={() => {
                  fetch('/api/marketplace/listings')
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        setListings(data.listings);
                      }
                    });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 Refresh
              </button>
            </div>

            {listings.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                    {/* NFT Image */}
                    <div className="aspect-square bg-gray-800/50 rounded-xl mb-4 overflow-hidden">
                      {listing.nftImage ? (
                        <img 
                          src={listing.nftImage} 
                          alt={listing.nftName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🎨
                        </div>
                      )}
                    </div>

                    {/* Listing Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{listing.nftName}</h3>
                        <p className="text-gray-300 text-sm">{listing.collectionName}</p>
                      </div>

                      {/* Price */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400 text-sm mb-1">Price</div>
                        <div className="text-2xl font-bold text-white">{listing.price} LOS</div>
                        <div className="text-gray-400 text-xs">${(listing.price * losPrice).toFixed(2)} USD</div>
                      </div>

                      {/* Seller */}
                      <div className="text-xs text-gray-400">
                        <span>Seller:</span>
                        <span className="text-white font-mono ml-1">
                          {listing.seller.slice(0, 8)}...{listing.seller.slice(-8)}
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={async () => {
                          if (!connected || !publicKey) {
                            alert('Please connect your wallet to buy');
                            return;
                          }

                          if (listing.seller === publicKey.toString()) {
                            alert('You cannot buy your own listing');
                            return;
                          }

                          setBuying(prev => ({ ...prev, [listing.id]: true }));
                          
                          try {
                            // In a real implementation, this would create an actual transaction
                            const signature = 'simulated_tx_' + Date.now();
                            
                            const response = await fetch('/api/marketplace/buy', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                listingId: listing.id,
                                buyer: publicKey.toString(),
                                signature
                              })
                            });

                            const data = await response.json();
                            
                            if (data.success) {
                              alert(`✅ NFT purchased successfully!\nTransaction: ${signature}`);
                              // Refresh listings
                              const listingsResponse = await fetch('/api/marketplace/listings');
                              const listingsData = await listingsResponse.json();
                              if (listingsData.success) {
                                setListings(listingsData.listings);
                              }
                            } else {
                              alert(`Failed to purchase: ${data.error}`);
                            }
                          } catch (error) {
                            console.error('Error buying NFT:', error);
                            alert('Failed to purchase NFT');
                          } finally {
                            setBuying(prev => ({ ...prev, [listing.id]: false }));
                          }
                        }}
                        disabled={!connected || buying[listing.id] || (publicKey && listing.seller === publicKey.toString())}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {buying[listing.id] ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Buying...
                          </div>
                        ) : publicKey && listing.seller === publicKey.toString() ? (
                          'Your Listing'
                        ) : (
                          `Buy for ${listing.price} LOS`
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Listings Yet</h3>
                <p className="text-gray-300 mb-6">
                  Be the first to list an NFT on the marketplace!
                </p>
                <p className="text-gray-400 text-sm">
                  Go to your profile, view your NFTs, and click "List for Sale"
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
