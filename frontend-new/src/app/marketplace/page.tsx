'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import StandardLayout from '@/app/components/StandardLayout';
import VerificationBadge from '@/app/components/VerificationBadge';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  maxSupply: number;
  totalMinted: number;
  mintPrice: number;
  pricingToken: string;
  mintType: string;
  revealType: string;
  isActive: boolean;
  mintingEnabled: boolean;
  deployedAt: string;
  creator: string;
  category: string;
  website?: string;
  twitter?: string;
  discord?: string;
  source?: string;
}

export default function MarketplacePage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'supply'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'minting'>('all');
  const [minting, setMinting] = useState<{ [key: string]: boolean }>({});

  // Load collections from multiple sources
  useEffect(() => {
    const loadCollections = async () => {
      try {
        let allCollections: Collection[] = [];
        
        // 1. Load from localStorage (deployed collections) - but filter out old/duplicate data
        const savedCollections = localStorage.getItem('launched_collections');
        if (savedCollections) {
          try {
            const parsedCollections = JSON.parse(savedCollections);
            console.log('📦 Found collections in localStorage:', parsedCollections.length);
            
            // Filter to only show collections with actual deployment data
            const filteredCollections = parsedCollections.filter((col: any) => {
              // Only keep collections that have actual blockchain deployment data
              const hasDeploymentData = col.signature && col.signature !== 'Unknown' && col.signature.length > 20;
              
              if (!hasDeploymentData) {
                console.log(`🗑️ Filtering out "${col.name}" - no deployment data (signature: ${col.signature})`);
                return false;
              }
              
              // Also filter out old Los Bros collections that might conflict with admin service
              const isLosBros = col.name === 'Los Bros' || col.name === 'The LosBros';
              if (isLosBros) {
                console.log(`🗑️ Filtering out old cached "${col.name}" collection (will use admin service data instead)`);
                return false;
              }
              
              return true;
            });
            
            const localStorageCollections = filteredCollections.map((col: any) => ({ ...col, source: 'localStorage' }));
            allCollections = [...allCollections, ...localStorageCollections];
            console.log('📦 Added filtered localStorage collections:', localStorageCollections.length);
          } catch (error) {
            console.error('Error parsing localStorage collections:', error);
          }
        }
        
        // 2. Load from admin control service
        try {
          const { adminControlService } = await import('@/lib/admin-control-service');
          const allAdminCollections = await adminControlService.getAllCollections();
          console.log('🎛️ Found collections in admin service:', allAdminCollections.length);
          
          // Filter to only show collections that are truly deployed to the blockchain
          const adminCollections = allAdminCollections.filter(collection => 
            collection.isActive && 
            collection.mintingEnabled && 
            collection.deployed && 
            collection.contractAddresses?.mint && 
            collection.creator
          );
          console.log('🎛️ Deployed collections in admin service:', adminCollections.length);
          
          const adminCollectionsFormatted: Collection[] = adminCollections.map(collection => ({
            id: `admin_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: collection.name,
            symbol: collection.name.substring(0, 4).toUpperCase(),
            description: collection.description || 'No description available',
            imageUrl: collection.imageUrl || '/api/placeholder/300/300',
            maxSupply: collection.totalSupply,
            totalMinted: 0,
            mintPrice: collection.mintPrice, // Use actual collection price
            pricingToken: collection.paymentToken,
            mintType: collection.isTestMode ? 'Test' : 'Production',
            revealType: 'Instant',
            isActive: collection.isActive,
            mintingEnabled: collection.mintingEnabled,
            deployedAt: new Date().toISOString(),
            creator: collection.creator || 'Admin',
            category: 'NFT Collection',
            website: '',
            twitter: '',
            discord: '',
            source: 'admin'
          }));
          
          allCollections = [...allCollections, ...adminCollectionsFormatted];
        } catch (error) {
          console.error('Error loading admin service collections:', error);
        }
        
        // 3. Discover collections from blockchain (only truly deployed collections)
        try {
          const { blockchainDataService } = await import('@/lib/blockchain-data-service');
          const blockchainCollections = await blockchainDataService.discoverBlockchainCollections();
          console.log('🔗 Found collections on blockchain:', blockchainCollections.length);
          
          // Filter to only show collections with actual blockchain deployment data
          const deployedBlockchainCollections = blockchainCollections.filter(collection => 
            collection.mintAddress && 
            collection.mintAddress !== 'Unknown' && 
            collection.mintAddress !== 'Admin Managed'
          );
          console.log('🔗 Truly deployed blockchain collections:', deployedBlockchainCollections.length);
          
          const blockchainCollectionsFormatted: Collection[] = deployedBlockchainCollections.map(collection => ({
            id: `blockchain_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: collection.name,
            symbol: collection.name.substring(0, 4).toUpperCase(),
            description: 'Collection discovered on blockchain',
            imageUrl: '/api/placeholder/300/300',
            maxSupply: collection.totalSupply,
            totalMinted: collection.currentSupply,
            mintPrice: collection.mintPrice,
            pricingToken: collection.paymentToken,
            mintType: 'Production',
            revealType: 'Instant',
            isActive: collection.isActive,
            mintingEnabled: true,
            deployedAt: new Date().toISOString(),
            creator: 'Blockchain',
            category: 'NFT Collection',
            website: '',
            twitter: '',
            discord: '',
            source: 'blockchain'
          }));
          
          allCollections = [...allCollections, ...blockchainCollectionsFormatted];
        } catch (error) {
          console.error('Error discovering blockchain collections:', error);
        }
        
        // Remove duplicates and prefer admin service collections (which have correct pricing)
        const collectionsMap = new Map<string, Collection>();
        
        // Sort collections by priority: admin > blockchain > localStorage
        const sortedCollections = allCollections.sort((a, b) => {
          const priority = { 'admin': 3, 'blockchain': 2, 'localStorage': 1 };
          const aPriority = priority[a.source as keyof typeof priority] || 0;
          const bPriority = priority[b.source as keyof typeof priority] || 0;
          return bPriority - aPriority;
        });
        
        sortedCollections.forEach(collection => {
          const key = collection.name.toLowerCase();
          const existing = collectionsMap.get(key);
          
          if (!existing) {
            collectionsMap.set(key, collection);
            console.log(`➕ Added collection "${collection.name}" from ${collection.source || 'unknown'} (price: ${collection.mintPrice} ${collection.pricingToken})`);
          } else {
            console.log(`🚫 Skipping duplicate "${collection.name}" from ${collection.source || 'unknown'} (already have from ${existing.source || 'unknown'})`);
          }
        });
        
        const uniqueCollections = Array.from(collectionsMap.values());
        console.log('✅ Total unique collections found:', uniqueCollections.length);
        console.log('📋 Final collections:', uniqueCollections.map(c => `${c.name} (${c.source || 'unknown'}) - Price: ${c.mintPrice} ${c.pricingToken}`));
        setCollections(uniqueCollections);
        
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  // Filter and sort collections
  const filteredCollections = collections
    .filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'active' && collection.isActive) ||
                           (filterBy === 'minting' && collection.mintingEnabled);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
        case 'oldest':
          return new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime();
        case 'price-low':
          return a.mintPrice - b.mintPrice;
        case 'price-high':
          return b.mintPrice - a.mintPrice;
        case 'supply':
          return b.maxSupply - a.maxSupply;
        default:
          return 0;
      }
    });

  const handleMint = async (collection: Collection) => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet to mint NFTs');
      return;
    }

    setMinting(prev => ({ ...prev, [collection.id]: true }));

    try {
      console.log(`🎯 Minting NFT from collection: ${collection.name}`);
      
      // Use the same minting logic as the main mint page
      const { DirectNFTMintService } = await import('@/lib/direct-nft-mint');
      const directMintService = new DirectNFTMintService();
      
      const collectionData = {
        name: collection.name,
        symbol: collection.symbol || collection.name.substring(0, 4),
        description: collection.description || '',
        image: collection.imageUrl || '',
        mintPrice: collection.mintPrice || 4200.69,
        paymentToken: 'LOS'
      };
      
      // Create real NFT mint transaction
      const { transaction, mintKeypairs } = await directMintService.createRealNFTMintTransaction(
        collection.name,
        1, // quantity
        publicKey.toString(),
        collectionData
      );
      
      // Sign transaction with wallet
      const signedTransaction = await signTransaction!(transaction);
      
      // Submit transaction
      const signature = await directMintService.submitTransaction(signedTransaction);
      
      console.log(`✅ NFT minted successfully: ${signature}`);
      
      // Track the minted NFT using blockchain-first system
      try {
        const { blockchainFirstNFTService } = await import('@/lib/blockchain-first-nft-service');
        const { whitelistPhaseService } = await import('@/lib/whitelist-phase-service');
        
        const activePhase = whitelistPhaseService.getCurrentActivePhase();
        
        // Generate next token ID from blockchain-first system
        const tokenIdResult = await blockchainFirstNFTService.getNextTokenId(collection.name);
        const tokenId = tokenIdResult.success ? tokenIdResult.nextTokenId! : 1;
        
        // Create NFT with full blockchain metadata
        const createResult = await blockchainFirstNFTService.createNFTWithFullMetadata(
          collection.name,
          tokenId,
          publicKey.toString(),
          activePhase?.id || 'phase_3_public',
          collection.mintPrice || 4200.69,
          collection.paymentToken || 'LOS',
          collection.creator || publicKey.toString(),
          [
            { trait_type: 'Minted From', value: 'Marketplace' },
            { trait_type: 'Platform', value: 'Analos NFT Launcher' }
          ]
        );
        
        const tracked = createResult.success;
        
        if (tracked) {
          console.log('✅ NFT created with blockchain-first metadata:', createResult.mint);
        } else {
          console.error('❌ Failed to create blockchain-first NFT:', createResult.error);
        }
        
      } catch (error) {
        console.error('Error tracking minted NFT from marketplace:', error);
      }
      
      alert(`✅ Successfully minted NFT from ${collection.name}! Transaction: ${signature}`);
      
      // Refresh collection data
      const updatedCollections = collections.map(c => 
        c.id === collection.id 
          ? { ...c, currentSupply: (c.currentSupply || 0) + 1 }
          : c
      );
      setCollections(updatedCollections);
      
    } catch (error) {
      console.error('Error minting NFT from marketplace:', error);
      alert(`❌ Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setMinting(prev => ({ ...prev, [collection.id]: false }));
    }
  };

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🏪 NFT Marketplace
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Discover, mint, and trade NFTs on the Analos blockchain
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="supply">Supply: High to Low</option>
              </select>

              {/* Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Collections</option>
                <option value="active">Active Only</option>
                <option value="minting">Minting Enabled</option>
              </select>
            </div>
          </div>

          {/* Collections Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-300 mt-4">Loading collections...</p>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Collections Found</h3>
              <p className="text-gray-300">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollections.map((collection) => (
                <div key={collection.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-200">
                  {/* Collection Image */}
                  <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={collection.imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/300/300';
                      }}
                    />
                  </div>

                  {/* Collection Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                      <VerificationBadge 
                        collectionId={collection.id}
                        collectionName={collection.name}
                        size="medium"
                        showTooltip={true}
                        className="group"
                      />
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{collection.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">{collection.mintPrice} {collection.pricingToken}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Supply:</span>
                        <span className="text-white">{collection.totalMinted}/{collection.maxSupply}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          collection.mintingEnabled && collection.isActive 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {collection.mintingEnabled && collection.isActive ? 'Minting' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {collection.mintingEnabled && collection.isActive ? (
                      <button
                        onClick={() => handleMint(collection)}
                        disabled={minting[collection.id] || !connected}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {minting[collection.id] ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Minting...
                          </div>
                        ) : (
                          `🎯 Mint NFT`
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-600 text-gray-400 font-bold py-3 px-4 rounded-lg cursor-not-allowed"
                      >
                        Minting Disabled
                      </button>
                    )}
                    
                    <Link
                      href={`/mint/${encodeURIComponent(collection.name)}`}
                      className="block w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-center"
                    >
                      View Collection Page
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && collections.length > 0 && (
            <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">📊 Marketplace Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-300">{collections.length}</div>
                  <div className="text-sm text-gray-400">Total Collections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">
                    {collections.filter(c => c.mintingEnabled && c.isActive).length}
                  </div>
                  <div className="text-sm text-gray-400">Active Minting</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-300">
                    {collections.reduce((sum, c) => sum + c.totalMinted, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total Minted</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-300">
                    {collections.reduce((sum, c) => sum + c.maxSupply, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Total Supply</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
}
