'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Coins, Users, TrendingUp, DollarSign, Percent } from 'lucide-react';

interface PlatformFeeAnalyticsProps {
  className?: string;
}

const PlatformFeeAnalytics: React.FC<PlatformFeeAnalyticsProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
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

  const formatTokenAmount = (amount: number, decimals: number = 9) => {
    return (amount / Math.pow(10, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white border border-purple-400">
        <h2 className="text-3xl font-bold mb-2">💰 Platform Analytics</h2>
        <p className="text-purple-100">
          Comprehensive revenue tracking across all collections, marketplace, and launchpad
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
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
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Mints */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-4xl font-bold text-white">{analytics.totalMints || 0}</div>
                  {analytics.last24hMints > 0 && (
                    <div className="text-green-400 text-sm">+{analytics.last24hMints} last 24h</div>
                  )}
                </div>
              </div>
              <div className="text-gray-400 text-sm">Total Mints</div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Coins className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-4xl font-bold text-white">
                    {analytics.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-yellow-400 text-sm">
                    ${((analytics.totalRevenue || 0) * 0.0018).toFixed(2)} USD
                  </div>
                </div>
              </div>
              <div className="text-gray-400 text-sm">Total Revenue (LOS)</div>
            </div>

            {/* Platform Fees */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Percent className="w-8 h-8 text-cyan-400" />
                <div>
                  <div className="text-4xl font-bold text-white">
                    {analytics.platformFees?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-cyan-400 text-sm">
                    ~{((analytics.platformFees || 0) / (analytics.totalRevenue || 1) * 100).toFixed(1)}% rate
                  </div>
                </div>
              </div>
              <div className="text-gray-400 text-sm">Platform Fees (LOS)</div>
            </div>

            {/* Unique Users */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-4xl font-bold text-white">{analytics.uniqueUsers || 0}</div>
                  <div className="text-green-400 text-sm">Community</div>
                </div>
              </div>
              <div className="text-gray-400 text-sm">Unique Users</div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Collection Revenue */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue by Collection
              </h3>
              <div className="space-y-3">
                {analytics.collections?.map((collection: any) => (
                  <div key={collection.name} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
                    <div>
                      <div className="text-white font-semibold">{collection.name}</div>
                      <div className="text-gray-400 text-sm">{collection.mints} mints @ {collection.avgPrice.toFixed(2)} LOS avg</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold text-lg">{collection.revenue.toFixed(2)} LOS</div>
                      <div className="text-gray-400 text-xs">${(collection.revenue * 0.0018).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Fee Breakdown
              </h3>
              <div className="space-y-3">
                {/* Mint Fees */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-400/30">
                  <div>
                    <div className="text-white font-semibold">Mint Platform Fees</div>
                    <div className="text-gray-400 text-sm">From NFT minting</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold text-lg">{analytics.fees?.mint?.toFixed(2) || '0.00'} LOS</div>
                    <div className="text-gray-400 text-xs">${((analytics.fees?.mint || 0) * 0.0018).toFixed(2)}</div>
                  </div>
                </div>

                {/* Marketplace Fees */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-400/30">
                  <div>
                    <div className="text-white font-semibold">Marketplace Fees</div>
                    <div className="text-gray-400 text-sm">From NFT sales (Coming soon)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold text-lg">{analytics.fees?.marketplace?.toFixed(2) || '0.00'} LOS</div>
                    <div className="text-gray-400 text-xs">${((analytics.fees?.marketplace || 0) * 0.0018).toFixed(2)}</div>
                  </div>
                </div>

                {/* Launchpad Fees */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-400/30">
                  <div>
                    <div className="text-white font-semibold">Launchpad/LP Fees</div>
                    <div className="text-gray-400 text-sm">From launches (Coming soon)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-bold text-lg">{analytics.fees?.launchpad?.toFixed(2) || '0.00'} LOS</div>
                    <div className="text-gray-400 text-xs">${((analytics.fees?.launchpad || 0) * 0.0018).toFixed(2)}</div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg border-2 border-purple-400">
                  <div>
                    <div className="text-white font-bold text-lg">Total Platform Fees</div>
                    <div className="text-purple-200 text-sm">All revenue streams</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold text-2xl">{analytics.platformFees?.toFixed(2) || '0.00'} LOS</div>
                    <div className="text-purple-200 text-xs">${((analytics.platformFees || 0) * 0.0018).toFixed(2)} USD</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Mints Activity */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Mints
            </h3>
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
                  {analytics.recentMints?.map((mint: any, index: number) => (
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
        </>
      )}
    </div>
  );
};

export default PlatformFeeAnalytics;
