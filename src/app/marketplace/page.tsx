'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Search, Filter, Star, TrendingUp, TrendingDown, Eye, Users, Coins, Clock } from 'lucide-react';
import CleanMarketplaceCard from '@/components/CleanMarketplaceCard';
import PlatformActivityFeed from '@/components/PlatformActivityFeed';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ProfileNFT {
  id: string;
  name: string;
  image: string;
  description: string;
  owner: string;
  mintNumber?: number;
  floorPrice?: number;
  volume?: number;
  marketCap?: number;
  topOffer?: number;
  floorChange1d?: number;
  volumeChange1d?: number;
  sales1d?: number;
  listed?: number;
  listedPercentage?: number;
  owners?: number;
  ownersPercentage?: number;
  lastSale?: {
    price: number;
    time: string;
  } | null;
  attributes?: {
    background?: string;
    rarity?: string;
    tier?: string;
    core?: string;
    dripGrade?: string;
    dripScore?: string;
    earring?: string;
    eyeColor?: string;
    eyes?: string;
    faceDecoration?: string;
    glasses?: string;
  };
  verified?: boolean;
  chain?: string;
}

const MarketplacePage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [profileNFTs, setProfileNFTs] = useState<ProfileNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('1D');
  const [sortBy, setSortBy] = useState('volume');
  const [showUSD, setShowUSD] = useState(false);
  const [showBadged, setShowBadged] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState('all'); // 'all', 'profile', 'losbros'
  const [collections, setCollections] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, profile: 0, losbros: 0 });

  useEffect(() => {
    loadProfileNFTs();
  }, [collectionFilter, searchTerm]);

  const loadProfileNFTs = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        limit: '50',
        type: collectionFilter,
        search: searchTerm
      });
      
      const response = await fetch(`/api/marketplace-unified?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setProfileNFTs(result.nfts);
        setCollections(result.collections);
        setStats(result.stats);
        console.log(`✅ Loaded ${result.nfts.length} NFTs (${result.stats.profile} Profile + ${result.stats.losbros} Los Bros)`);
      } else {
        console.error('Error loading marketplace NFTs:', result.error);
        setProfileNFTs([]);
        setCollections([]);
        setStats({ total: 0, profile: 0, losbros: 0 });
      }
    } catch (error) {
      console.error('Error loading marketplace NFTs:', error);
      setProfileNFTs([]);
      setCollections([]);
      setStats({ total: 0, profile: 0, losbros: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = profileNFTs.filter(nft => 
    nft.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price === 0) {
      return 'Not Listed';
    }
    if (showUSD) {
      return `$${(price * 0.0018).toFixed(2)}`;
    }
    return `${price.toFixed(3)} LOS`;
  };

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-white">Analos Marketplace</h1>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
                  Top
                </button>
                <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Watchlist
                </button>
          </div>
        </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                  placeholder="Search collections"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none w-64"
              />
            </div>
              <button className="p-2 bg-white/10 border border-white/20 rounded-lg text-gray-400 hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="badged"
                  checked={showBadged}
                  onChange={(e) => setShowBadged(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded"
                />
                <label htmlFor="badged" className="text-gray-300">Badged</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usd"
                  checked={showUSD}
                  onChange={(e) => setShowUSD(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded"
                />
                <label htmlFor="usd" className="text-gray-300">USD</label>
                  </div>
                </div>

            <div className="flex items-center space-x-4">
              <select
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">All Collections</option>
                <option value="profile">Profile NFTs</option>
                <option value="losbros">Los Bros</option>
              </select>
              <div className="flex items-center space-x-2">
                {['10M', '1H', '6H', '1D', '7D', '30D'].map((time) => (
                    <button
                    key={time}
                    onClick={() => setTimeFilter(time)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      timeFilter === time
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {time}
                    </button>
                ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* NFT Grid - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredNFTs.map((nft) => (
                <CleanMarketplaceCard
                  key={nft.id}
                  nft={nft}
                  showUSD={showUSD}
                  onViewDetails={(nftId) => {
                    // Navigate to NFT details page
                    window.location.href = `/nft/${nftId}`;
                  }}
                  onMarketplaceAction={() => {
                    // Refresh marketplace after any action
                    loadProfileNFTs();
                  }}
                />
              ))}
            </div>
          </div>

          {/* Activity Feed Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <PlatformActivityFeed limit={15} />
            </div>
          </div>
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">A</span>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No Profile NFTs Found</h3>
            <p className="text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;