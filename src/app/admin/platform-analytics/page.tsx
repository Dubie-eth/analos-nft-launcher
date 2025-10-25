'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TrendingUp, Users, Coins, Activity, DollarSign, Percent } from 'lucide-react';

/**
 * PLATFORM ANALYTICS ADMIN DASHBOARD
 * Shows comprehensive revenue and mint statistics across all collections
 */
export default function PlatformAnalyticsPage() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('all'); // all, 24h, 7d, 30d

  useEffect(() => {
    if (publicKey) {
      loadAnalytics();
    }
  }, [publicKey, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/platform-analytics?range=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        console.log('📊 Platform analytics loaded:', data.analytics);
      }
    } catch (error) {
      console.error('Error loading platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
          <p className="text-gray-300">Connect your admin wallet to view platform analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading platform analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            💰 Platform Analytics
          </h1>
          <p className="text-gray-300">
            Comprehensive revenue and mint statistics across all collections
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          {['all', '24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Mints */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-400" />
              <div className="text-3xl font-bold text-white">{analytics?.totalMints || 0}</div>
            </div>
            <div className="text-gray-400 text-sm">Total Mints</div>
            {analytics?.last24hMints > 0 && (
              <div className="text-green-400 text-xs mt-1">+{analytics.last24hMints} last 24h</div>
            )}
          </div>

          {/* Total Revenue */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-8 h-8 text-yellow-400" />
              <div className="text-3xl font-bold text-white">
                {analytics?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="text-gray-400 text-sm">Total Revenue (LOS)</div>
            <div className="text-yellow-400 text-xs mt-1">
              ${((analytics?.totalRevenue || 0) * 0.0018).toFixed(2)} USD
            </div>
          </div>

          {/* Platform Fees Collected */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-8 h-8 text-cyan-400" />
              <div className="text-3xl font-bold text-white">
                {analytics?.platformFees?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="text-gray-400 text-sm">Platform Fees (LOS)</div>
            <div className="text-cyan-400 text-xs mt-1">
              ~{((analytics?.platformFees || 0) / (analytics?.totalRevenue || 1) * 100).toFixed(1)}% of revenue
            </div>
          </div>

          {/* Unique Users */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-400" />
              <div className="text-3xl font-bold text-white">{analytics?.uniqueUsers || 0}</div>
            </div>
            <div className="text-gray-400 text-sm">Unique Users</div>
            <div className="text-green-400 text-xs mt-1">Community members</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Collection Revenue */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue by Collection
            </h2>
            <div className="space-y-3">
              {analytics?.collections?.map((collection: any) => (
                <div key={collection.name} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div>
                    <div className="text-white font-semibold">{collection.name}</div>
                    <div className="text-gray-400 text-sm">{collection.mints} mints</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{collection.revenue.toFixed(2)} LOS</div>
                    <div className="text-gray-400 text-xs">${(collection.revenue * 0.0018).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Fee Breakdown
            </h2>
            <div className="space-y-3">
              {/* Mint Fees */}
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Mint Platform Fees</div>
                  <div className="text-gray-400 text-sm">From NFT minting</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">{analytics?.fees?.mint?.toFixed(2) || '0.00'} LOS</div>
                  <div className="text-gray-400 text-xs">${((analytics?.fees?.mint || 0) * 0.0018).toFixed(2)}</div>
                </div>
              </div>

              {/* Marketplace Fees */}
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Marketplace Fees</div>
                  <div className="text-gray-400 text-sm">From NFT sales</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">{analytics?.fees?.marketplace?.toFixed(2) || '0.00'} LOS</div>
                  <div className="text-gray-400 text-xs">${((analytics?.fees?.marketplace || 0) * 0.0018).toFixed(2)}</div>
                </div>
              </div>

              {/* Launchpad Fees */}
              <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                <div>
                  <div className="text-white font-semibold">Launchpad/LP Fees</div>
                  <div className="text-gray-400 text-sm">From collection launches</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold">{analytics?.fees?.launchpad?.toFixed(2) || '0.00'} LOS</div>
                  <div className="text-gray-400 text-xs">${((analytics?.fees?.launchpad || 0) * 0.0018).toFixed(2)}</div>
                </div>
              </div>

              {/* Total Fees */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg border border-purple-400/50">
                <div>
                  <div className="text-white font-bold text-lg">Total Platform Fees</div>
                  <div className="text-gray-300 text-sm">All revenue streams</div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-bold text-xl">{analytics?.platformFees?.toFixed(2) || '0.00'} LOS</div>
                  <div className="text-gray-300 text-xs">${((analytics?.platformFees || 0) * 0.0018).toFixed(2)} USD</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Mints
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Collection</th>
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Token ID</th>
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Minter</th>
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Price</th>
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Platform Fee</th>
                  <th className="text-left text-gray-400 text-sm font-semibold py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentMints?.map((mint: any, index: number) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          mint.collection === 'Los Bros' ? 'bg-orange-400' : 'bg-blue-400'
                        }`}></div>
                        <span className="text-white font-medium">{mint.collection}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-purple-400 font-mono">#{mint.tokenId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <a 
                        href={`/profile/${mint.minter}`}
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                      >
                        {mint.minter.slice(0, 4)}...{mint.minter.slice(-4)}
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-400 font-semibold">
                        {mint.price.toFixed(2)} LOS
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-semibold">
                        {mint.platformFee.toFixed(2)} LOS
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(mint.date).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

