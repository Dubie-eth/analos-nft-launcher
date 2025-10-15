'use client';

import React, { useState, useEffect } from 'react';
import { creatorAirdropService } from '@/services/creator-airdrop-service';

interface PlatformFeeAnalyticsProps {
  className?: string;
}

const PlatformFeeAnalytics: React.FC<PlatformFeeAnalyticsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<any>(null);
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const feeStats = creatorAirdropService.getPlatformFeeStats();
      const records = creatorAirdropService.getFeeRecords();
      
      setStats(feeStats);
      setFeeRecords(records);
    } catch (error) {
      console.error('Error loading platform fee data:', error);
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
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">💰 Platform Fee Analytics</h2>
        <p className="text-green-100">
          Monitor platform revenue from creator airdrop campaigns and fee collection.
        </p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Fees Collected</p>
              <div className="text-green-400">💰</div>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatTokenAmount(stats.totalFeesCollected)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Tokens</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Active Campaigns</p>
              <div className="text-blue-400">📊</div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalCampaigns}</p>
            <p className="text-xs text-gray-500 mt-1">Paying Fees</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Avg Fee per Campaign</p>
              <div className="text-purple-400">📈</div>
            </div>
            <p className="text-3xl font-bold text-white">
              {formatTokenAmount(stats.averageFeePerCampaign)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Tokens</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Fee Rate</p>
              <div className="text-orange-400">⚡</div>
            </div>
            <p className="text-3xl font-bold text-white">2.5%</p>
            <p className="text-xs text-gray-500 mt-1">Platform Fee</p>
          </div>
        </div>
      )}

      {/* Monthly Revenue Chart */}
      {stats && stats.monthlyRevenue && Object.keys(stats.monthlyRevenue).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {Object.entries(stats.monthlyRevenue)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 12)
              .map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (amount as number / Math.max(...Object.values(stats.monthlyRevenue) as number[])) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {formatTokenAmount(amount as number)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Fee Collections */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Fee Collections</h3>
        </div>
        <div className="p-6">
          {feeRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💰</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Fee Collections Yet</h4>
              <p className="text-gray-600">
                Platform fees will appear here once creators start activating their campaigns.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feeRecords
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">💰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Campaign: {record.campaignId.slice(-8)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Creator: {record.creatorWallet.slice(0, 8)}...{record.creatorWallet.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        +{formatTokenAmount(record.amount)}
                      </p>
                      <p className="text-xs text-gray-500">Platform Fee</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Fee Policy Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📋 Platform Fee Policy</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Fee Rate:</span>
            <span>2.5% of total airdrop amount</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Payment:</span>
            <span>Required before campaign activation</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Purpose:</span>
            <span>Platform maintenance, development, and sustainability</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Transparency:</span>
            <span>All fee collections are recorded and publicly auditable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeeAnalytics;
