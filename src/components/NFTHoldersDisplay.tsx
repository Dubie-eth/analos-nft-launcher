'use client';

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Holder {
  wallet: string;
  nftCount: number;
  percentage: number;
  totalValue?: number;
  rank: number;
}

interface NFTHoldersDisplayProps {
  collectionType: 'losbros' | 'profile' | 'all';
  limit?: number;
}

export default function NFTHoldersDisplay({ collectionType, limit = 20 }: NFTHoldersDisplayProps) {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [stats, setStats] = useState({
    totalHolders: 0,
    totalNFTs: 0,
    avgPerHolder: 0,
    topHolderPercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolders();
  }, [collectionType]);

  const loadHolders = async () => {
    try {
      const response = await fetch(`/api/nft/holders?collection=${collectionType}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setHolders(data.holders || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading holders:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getHolderBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getHolderColor = (rank: number) => {
    if (rank === 1) return 'border-yellow-500/50 bg-yellow-500/10';
    if (rank === 2) return 'border-gray-400/50 bg-gray-400/10';
    if (rank === 3) return 'border-orange-500/50 bg-orange-500/10';
    return 'border-white/10 bg-black/20';
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Top Holders
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4 text-sm">Loading holders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      {/* Header */}
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Top Holders
      </h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <p className="text-purple-400 text-xs mb-1">Total Holders</p>
          <p className="text-white text-xl font-bold">{stats.totalHolders}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-400 text-xs mb-1">Total NFTs</p>
          <p className="text-white text-xl font-bold">{stats.totalNFTs}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400 text-xs mb-1">Avg/Holder</p>
          <p className="text-white text-xl font-bold">{stats.avgPerHolder.toFixed(1)}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <p className="text-orange-400 text-xs mb-1">Top Holder</p>
          <p className="text-white text-xl font-bold">{stats.topHolderPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Holders List */}
      {holders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No holders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {holders.map((holder) => (
            <div 
              key={holder.wallet}
              className={`rounded-lg p-4 border ${getHolderColor(holder.rank)} hover:border-purple-400/50 transition-all`}
            >
              <div className="flex items-center justify-between">
                {/* Rank & Wallet */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {getHolderBadge(holder.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/profile/${holder.wallet}`}
                      className="text-white font-mono text-sm hover:text-purple-400 transition-colors block truncate"
                    >
                      {shortenAddress(holder.wallet)}
                    </Link>
                    <p className="text-gray-400 text-xs">Rank #{holder.rank}</p>
                  </div>
                </div>

                {/* Holdings */}
                <div className="text-right">
                  <p className="text-white font-bold text-lg">{holder.nftCount}</p>
                  <p className="text-gray-400 text-xs">{holder.percentage.toFixed(2)}%</p>
                </div>

                {/* View Profile Link */}
                <Link
                  href={`/profile/${holder.wallet}`}
                  className="ml-3 p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                </Link>
              </div>

              {/* Value Display (if available) */}
              {holder.totalValue && holder.totalValue > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-green-400 text-sm font-semibold">
                    Est. Value: {holder.totalValue.toFixed(2)} LOS
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View All Link */}
      {holders.length >= limit && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            href={`/explorer/holders?collection=${collectionType}`}
            className="text-center block text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
          >
            View All Holders →
          </Link>
        </div>
      )}
    </div>
  );
}

