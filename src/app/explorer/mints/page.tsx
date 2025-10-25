'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

export default function MintsExplorerPage() {
  const [mints, setMints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all'); // 'all', 'profile', 'losbros'

  useEffect(() => {
    loadMints();
  }, [collectionFilter]);

  const loadMints = async () => {
    try {
      setLoading(true);
      
      // Use unified marketplace API to get all mints
      const params = new URLSearchParams({
        limit: '100',
        type: collectionFilter,
      });
      
      const response = await fetch(`/api/marketplace-unified?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setMints(result.nfts);
      }
    } catch (error) {
      console.error('Error loading mints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMints = mints.filter(mint => 
    mint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mint.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mint.mint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading mints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">🔍 NFT Mints Explorer</h1>
          <p className="text-gray-400">View all NFT mints across collections</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, wallet, or mint address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none w-full"
              />
            </div>

            {/* Collection Filter */}
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="all">All Collections</option>
              <option value="profile">Profile NFTs</option>
              <option value="losbros">Los Bros</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Total Mints</div>
            <div className="text-2xl font-bold text-white">{filteredMints.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Profile NFTs</div>
            <div className="text-2xl font-bold text-cyan-400">
              {filteredMints.filter(m => m.type === 'profile').length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-gray-400 text-sm mb-1">Los Bros NFTs</div>
            <div className="text-2xl font-bold text-orange-400">
              {filteredMints.filter(m => m.type === 'losbros').length}
            </div>
          </div>
        </div>

        {/* Mints Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">NFT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Minter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Mint Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMints.map((mint) => (
                  <tr key={mint.mint} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={mint.image}
                          alt={mint.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="text-white font-medium">{mint.name}</div>
                          <div className={`text-xs ${
                            mint.type === 'losbros' 
                              ? 'text-orange-400' 
                              : 'text-cyan-400'
                          }`}>
                            {mint.type === 'losbros' ? '🎨 Los Bros' : '👤 Profile'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{mint.collection}</td>
                    <td className="px-4 py-3">
                      <a 
                        href={`/profile/${mint.owner}`}
                        className="text-purple-400 hover:text-purple-300 underline font-mono"
                      >
                        {shortenAddress(mint.owner)}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://explorer.analos.io/tx/${mint.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline font-mono"
                      >
                        {shortenAddress(mint.mint)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {new Date(mint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/nft/${mint.mint}`}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        View Details →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMints.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-white text-xl font-semibold mb-2">No Mints Found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

