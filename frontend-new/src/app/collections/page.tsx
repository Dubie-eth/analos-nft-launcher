'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StandardLayout from '../components/StandardLayout';
import VerificationBadge from '../components/VerificationBadge';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  externalUrl?: string;
  maxSupply: number;
  mintPrice: number;
  pricingToken: 'LOS' | 'SOL' | 'CUSTOM';
  customTokenSymbol?: string;
  royalty: number;
  creatorAddress: string;
  mintAddress: string;
  collectionAddress: string;
  mintPageUrl: string;
  shareUrl: string;
  referralCode: string;
  deployedAt: string;
  mintType: 'standard' | 'bonding-curve';
  revealType: 'instant' | 'delayed';
  stats: {
    totalMinted: number;
    totalHolders: number;
    floorPrice: number;
    volumeTraded: number;
  };
  socials: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
}

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'supply'>('newest');

  // Load collections from multiple sources
  useEffect(() => {
    const loadCollections = async () => {
      try {
        let allCollections: Collection[] = [];
        
        // 1. Load from localStorage (deployed collections)
        const savedCollections = localStorage.getItem('launched_collections');
        if (savedCollections) {
          try {
            const parsedCollections = JSON.parse(savedCollections);
            console.log('📦 Found collections in localStorage:', parsedCollections.length);
            allCollections = [...allCollections, ...parsedCollections];
          } catch (error) {
            console.error('Error parsing localStorage collections:', error);
          }
        }
        
        // 2. Load from admin control service
        try {
          const { adminControlService } = await import('@/lib/admin-control-service');
          const adminCollections = await adminControlService.getAllCollections();
          console.log('🎛️ Found collections in admin service:', adminCollections.length);
          
          // Convert admin service collections to Collection format
          const adminCollectionsFormatted: Collection[] = adminCollections.map(collection => ({
            id: `admin_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: collection.name,
            symbol: collection.name.substring(0, 4).toUpperCase(),
            description: collection.description || 'No description available',
            imageUrl: collection.imageUrl || '/api/placeholder/300/300',
            maxSupply: collection.totalSupply,
            totalMinted: 0, // This would come from blockchain data
            mintPrice: collection.mintPrice,
            pricingToken: collection.paymentToken,
            mintType: collection.isTestMode ? 'Test' : 'Production',
            revealType: 'Instant',
            isActive: collection.isActive,
            mintingEnabled: collection.mintingEnabled,
            deployedAt: new Date().toISOString(),
            creator: 'Admin',
            category: 'NFT Collection',
            website: '',
            twitter: '',
            discord: ''
          }));
          
          allCollections = [...allCollections, ...adminCollectionsFormatted];
        } catch (error) {
          console.error('Error loading admin service collections:', error);
        }
        
        // 3. Discover collections from blockchain
        try {
          const { blockchainDataService } = await import('@/lib/blockchain-data-service');
          const blockchainCollections = await blockchainDataService.discoverBlockchainCollections();
          console.log('🔗 Found collections on blockchain:', blockchainCollections.length);
          
          // Convert blockchain collections to Collection format
          const blockchainCollectionsFormatted: Collection[] = blockchainCollections.map(collection => ({
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
            discord: ''
          }));
          
          allCollections = [...allCollections, ...blockchainCollectionsFormatted];
        } catch (error) {
          console.error('Error discovering blockchain collections:', error);
        }
        
        // 3. Remove duplicates based on collection name
        const uniqueCollections = allCollections.filter((collection, index, self) => 
          index === self.findIndex(c => c.name.toLowerCase() === collection.name.toLowerCase())
        );
        
        console.log('✅ Total unique collections found:', uniqueCollections.length);
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
    .filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (collection: Collection) => {
    return Math.round((collection.stats.totalMinted / collection.maxSupply) * 100);
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading collections...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-4">
                🎨 Featured Collections
              </h1>
              <p className="text-gray-300 text-xl max-w-3xl mx-auto">
                Discover and mint from the amazing NFT collections launched on Analos blockchain
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="supply">Supply: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Collections Grid */}
            {filteredCollections.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🎨</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {searchTerm ? 'No collections found' : 'No collections launched yet'}
                </h2>
                <p className="text-gray-300 mb-8">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Be the first to launch a collection on Analos!'
                  }
                </p>
                {!searchTerm && (
                  <Link
                    href="/launch-collection"
                    className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
                  >
                    🚀 Launch Your Collection
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                  >
                    {/* Collection Image */}
                    <div className="relative">
                      <img
                        src={collection.imageUrl || '/placeholder-collection.png'}
                        alt={collection.name}
                        className="w-full h-48 object-cover rounded-t-xl"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvbGxlY3Rpb248L3RleHQ+PC9zdmc+';
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-sm font-medium">
                          {collection.mintPrice} {collection.pricingToken === 'CUSTOM' ? collection.customTokenSymbol : collection.pricingToken}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-sm font-medium">
                          {collection.stats.totalMinted} / {collection.maxSupply}
                        </span>
                      </div>
                    </div>

                    {/* Collection Info */}
                    <div className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            {collection.name}
                          </h3>
                          <VerificationBadge 
                            collectionId={collection.id}
                            collectionName={collection.name}
                            size="medium"
                            showTooltip={true}
                            className="group"
                          />
                        </div>
                        <p className="text-gray-300 text-sm mb-2">
                          {collection.description.length > 100 
                            ? `${collection.description.substring(0, 100)}...`
                            : collection.description
                          }
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            collection.mintType === 'standard' 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {collection.mintType === 'standard' ? '🎨 Standard' : '📈 Bonding Curve'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            collection.revealType === 'instant' 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {collection.revealType === 'instant' ? '⚡ Instant' : '🔒 Delayed'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Symbol: {collection.symbol} • Launched {formatDate(collection.deployedAt)}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-300 mb-1">
                          <span>Mint Progress</span>
                          <span>{getProgressPercentage(collection)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(collection)}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-white font-bold">{collection.stats.totalHolders}</div>
                          <div className="text-gray-400 text-xs">Holders</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white font-bold">{collection.royalty}%</div>
                          <div className="text-gray-400 text-xs">Royalty</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Link
                          href={collection.mintPageUrl}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg text-center transition-all duration-200"
                        >
                          🎨 Mint NFT
                        </Link>
                        <button
                          onClick={() => window.open(`https://explorer.analos.io/account/${collection.mintAddress}`, '_blank')}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-all duration-200"
                          title="View on Explorer"
                        >
                          🔍
                        </button>
                      </div>

                      {/* Social Links */}
                      {collection.socials && (
                        <div className="flex justify-center space-x-4 mt-4 pt-4 border-t border-white/10">
                          {collection.socials.twitter && (
                            <a
                              href={collection.socials.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-400 transition-colors"
                              title="Twitter"
                            >
                              🐦
                            </a>
                          )}
                          {collection.socials.discord && (
                            <a
                              href={collection.socials.discord}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-purple-400 transition-colors"
                              title="Discord"
                            >
                              💬
                            </a>
                          )}
                          {collection.socials.website && (
                            <a
                              href={collection.socials.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-green-400 transition-colors"
                              title="Website"
                            >
                              🌐
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Launch Collection CTA */}
            {!searchTerm && (
              <div className="text-center mt-16">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Ready to Launch Your Own Collection?
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Join the creators who have already launched their NFT collections on Analos blockchain
                  </p>
                  <Link
                    href="/launch-collection"
                    className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200"
                  >
                    🚀 Launch Collection Wizard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default CollectionsPage;
