'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  Coins, 
  Clock,
  Zap,
  Share2,
  Info,
  ChevronDown,
  Grid3X3,
  Grid4X4,
  List,
  RefreshCw,
  ShoppingCart,
  Settings,
  Moon,
  Monitor,
  Sun,
  Heart,
  ExternalLink
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ProfileNFT {
  id: string;
  name: string;
  image: string;
  description: string;
  owner: string;
  mintNumber: number;
  floorPrice: number;
  volume: number;
  marketCap: number;
  topOffer: number;
  floorChange1d: number;
  volumeChange1d: number;
  sales1d: number;
  listed: number;
  listedPercentage: number;
  owners: number;
  ownersPercentage: number;
  lastSale: {
    price: number;
    time: string;
  };
  attributes: {
    background: string;
    rarity: string;
    tier: string;
    core: string;
    dripGrade: string;
    dripScore: string;
    earring: string;
    eyeColor: string;
    eyes: string;
    faceDecoration: string;
    glasses: string;
  };
  verified: boolean;
  chain: string;
  rank?: number;
}

interface CollectionStats {
  name: string;
  description: string;
  image: string;
  verified: boolean;
  floorPrice: number;
  floorChange1d: number;
  topOffer: number;
  volume24h: number;
  sales24h: number;
  volumeAll: number;
  marketCap: number;
  listed: number;
  supply: number;
  owners: number;
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
}

const CollectionPage: React.FC = () => {
  const { slug } = useParams();
  const { publicKey, connected } = useWallet();
  const [collection, setCollection] = useState<CollectionStats | null>(null);
  const [nfts, setNfts] = useState<ProfileNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price-low');
  const [viewMode, setViewMode] = useState('grid4');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');

  useEffect(() => {
    loadCollectionData();
  }, [slug]);

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      
      // Mock collection data
      const mockCollection: CollectionStats = {
        name: 'Analos Profile NFTs',
        description: 'Unique profile NFTs for the Analos ecosystem',
        image: '/api/placeholder/200/200',
        verified: true,
        floorPrice: 0.5,
        floorChange1d: 5.2,
        topOffer: 0.48,
        volume24h: 12.5,
        sales24h: 25,
        volumeAll: 250.0,
        marketCap: 1000.0,
        listed: 15,
        supply: 1000,
        owners: 45,
        socialLinks: {
          twitter: 'https://twitter.com/analos',
          discord: 'https://discord.gg/analos',
          website: 'https://analos.fun'
        }
      };

      // Mock NFT data
      const mockNFTs: ProfileNFT[] = Array.from({ length: 24 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Analos Profile #${String(i + 1).padStart(3, '0')}`,
        image: `/api/placeholder/400/400?text=${i + 1}`,
        description: `Analos Profile NFT #${i + 1}`,
        owner: `AnalosUser...${String(i + 1).padStart(4, '0')}`,
        mintNumber: i + 1,
        floorPrice: 0.5 + (i * 0.1),
        volume: 1.2 + (i * 0.05),
        marketCap: 1000.0,
        topOffer: 0.48 + (i * 0.1),
        floorChange1d: (Math.random() - 0.5) * 20,
        volumeChange1d: (Math.random() - 0.5) * 30,
        sales1d: Math.floor(Math.random() * 10),
        listed: Math.floor(Math.random() * 5),
        listedPercentage: 0.5,
        owners: Math.floor(Math.random() * 50) + 10,
        ownersPercentage: 5.0,
        lastSale: {
          price: 0.5 + (i * 0.1),
          time: `${Math.floor(Math.random() * 24)}h ago`
        },
        attributes: {
          background: ['Matrix Drip', 'Galaxy', 'LOS Drip', 'Neon'][i % 4],
          rarity: ['Legendary', 'Mythic', 'Rare', 'Uncommon'][i % 4],
          tier: ['Diamond', 'Gold', 'Silver', 'Bronze'][i % 4],
          core: ['Analos Core', 'Matrix Core', 'LOS Core'][i % 3],
          dripGrade: ['A+', 'A', 'B+', 'B'][i % 4],
          dripScore: String(Math.floor(Math.random() * 100)),
          earring: ['Gold Hoop', 'Diamond Stud', 'Silver Chain'][i % 3],
          eyeColor: ['Blue', 'Green', 'Purple', 'Red'][i % 4],
          eyes: ['Laser Eyes', 'Normal', 'Glowing'][i % 3],
          faceDecoration: ['Tattoo', 'Scar', 'None'][i % 3],
          glasses: ['Sunglasses', 'Reading Glasses', 'None'][i % 3]
        },
        verified: true,
        chain: 'Analos',
        rank: i + 1
      }));

      setCollection(mockCollection);
      setNfts(mockNFTs);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(3)} LOS`;
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTraits = selectedTraits.length === 0 || selectedTraits.some(trait => 
      Object.values(nft.attributes).includes(trait)
    );
    const matchesPrice = nft.floorPrice >= priceRange.min && nft.floorPrice <= priceRange.max;
    return matchesSearch && matchesTraits && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Collection not found</h1>
          <p className="text-gray-300">The collection you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">Analos NFT Marketplace</h1>
              <div className="flex items-center space-x-4">
                <a href="/marketplace" className="text-gray-300 hover:text-white transition-colors">Trade</a>
                <a href="/mint" className="text-gray-300 hover:text-white transition-colors">Mint</a>
                <a href="/create" className="text-gray-300 hover:text-white transition-colors">Create</a>
                <a href="/swap" className="text-gray-300 hover:text-white transition-colors">Swap</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collections on Analos"
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none w-64"
                />
              </div>
              <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
                Rewards
              </button>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="text-gray-300">0 LOS</span>
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <img
                src={collection.image}
                alt={collection.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              {collection.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                  <Star className="w-6 h-6" />
                </button>
                <button className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
                  <Info className="w-4 h-4 mr-1 inline" />
                  Info
                </button>
                <button className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
                  <Share2 className="w-4 h-4 mr-1 inline" />
                  Share Stats
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <a href={collection.socialLinks.twitter} className="text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a href={collection.socialLinks.discord} className="text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a href={collection.socialLinks.website} className="text-gray-400 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              {/* Collection Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="text-center">
                  <div className="text-white font-semibold">{formatPrice(collection.floorPrice)}</div>
                  <div className="text-gray-400 text-sm">Floor Price</div>
                  {formatChange(collection.floorChange1d)}
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{formatPrice(collection.topOffer)}</div>
                  <div className="text-gray-400 text-sm">Top Offer</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{formatPrice(collection.volume24h)}</div>
                  <div className="text-gray-400 text-sm">24h Vol</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{collection.sales24h}</div>
                  <div className="text-gray-400 text-sm">24h Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{formatPrice(collection.volumeAll)}</div>
                  <div className="text-gray-400 text-sm">All Vol</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">${(collection.marketCap * 0.0018).toFixed(2)}M</div>
                  <div className="text-gray-400 text-sm">Market Cap</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{collection.listed} / {collection.supply}</div>
                  <div className="text-gray-400 text-sm">Listed / Supply</div>
                  <div className="text-gray-400 text-xs">({(collection.listed / collection.supply * 100).toFixed(1)}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{collection.owners}</div>
                  <div className="text-gray-400 text-sm">Owners</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6">
            <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
              Items
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Offers
            </button>
            <div className="flex items-center space-x-2 ml-auto">
              <button className="px-3 py-1 text-gray-400 hover:text-white transition-colors">Chart</button>
              <button className="px-3 py-1 text-gray-400 hover:text-white transition-colors">Analytics</button>
              <button className="px-3 py-1 text-gray-400 hover:text-white transition-colors">Activity</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Filters</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Status</h4>
                  <div className="space-y-2">
                    {['all', 'listed', 'not-listed'].map((status) => (
                      <label key={status} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={statusFilter === status}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded"
                        />
                        <span className="text-gray-300 capitalize">{status.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Price</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>0 LOS</span>
                      <span>{priceRange.max} LOS</span>
                    </div>
                  </div>
                </div>

                {/* Rarity Filter */}
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Rarity</h4>
                  <div className="space-y-2">
                    {['all', 'legendary', 'mythic', 'rare', 'uncommon'].map((rarity) => (
                      <label key={rarity} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="rarity"
                          value={rarity}
                          checked={rarityFilter === rarity}
                          onChange={(e) => setRarityFilter(e.target.value)}
                          className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded"
                        />
                        <span className="text-gray-300 capitalize">{rarity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Traits Filter */}
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Traits</h4>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Traits"
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[
                      { name: 'Background', count: 16 },
                      { name: 'Core', count: 15 },
                      { name: 'Drip Grade', count: 6 },
                      { name: 'Drip Score', count: 54 },
                      { name: 'Earring', count: 16 },
                      { name: 'Eye Color', count: 8 },
                      { name: 'Eyes', count: 10 },
                      { name: 'Face Decoration', count: 12 },
                      { name: 'Glasses', count: 10 }
                    ].map((trait) => (
                      <div key={trait.name} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{trait.name}</span>
                        <span className="text-gray-400 text-sm">({trait.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {!showFilters && (
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid3')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid3' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid4')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid4' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid4X4 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none w-64"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="recent">Recently Listed</option>
                  <option value="rarity">Rarity</option>
                </select>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instant Sell Card */}
            {connected && (
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-white font-semibold">Instant Sell</h3>
                    <p className="text-gray-300 text-sm">{formatPrice(collection.topOffer)}</p>
                  </div>
                  <button className="ml-auto bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                    Sell Now
                  </button>
                </div>
                <button className="text-purple-300 text-sm hover:text-purple-200 transition-colors mt-2">
                  View All Offers
                </button>
              </div>
            )}

            {/* NFT Grid */}
            <div className={`grid gap-4 ${
              viewMode === 'grid3' ? 'grid-cols-3' : 
              viewMode === 'grid4' ? 'grid-cols-4' : 
              'grid-cols-1'
            }`}>
              {filteredNFTs.map((nft) => (
                <div key={nft.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 group">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {nft.rank && (
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
                        <span className="text-white text-sm font-bold">#{nft.rank}</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{nft.name}</h3>
                      <span className="text-gray-400 text-sm">#{nft.mintNumber}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Current Price</span>
                        <span className="text-white font-semibold">{formatPrice(nft.floorPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Last Sale</span>
                        <span className="text-white font-semibold">{formatPrice(nft.lastSale.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-white font-semibold">${(collection.marketCap * 0.0018).toFixed(2)}</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Live Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                Make Offer
              </button>
              {!connected ? (
                <button className="px-6 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors">
                  Connect Wallet
                </button>
              ) : (
                <button className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                  <ShoppingCart className="w-4 h-4 mr-2 inline" />
                  Cart
                </button>
              )}
              <span className="text-gray-300">Standard</span>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Moon className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Monitor className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Sun className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
