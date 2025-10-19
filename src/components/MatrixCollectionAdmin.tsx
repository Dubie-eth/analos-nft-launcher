/**
 * MATRIX COLLECTION ADMIN PANEL
 * Monitor and manage the Matrix variant NFT collection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Activity, 
  Users, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Eye,
  Settings,
  RefreshCw,
  Download,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import ProfileNFTPricingConfig from './ProfileNFTPricingConfig';

interface CollectionStats {
  totalMinted: number;
  normalMints: number;
  matrixHackers: number;
  neoVariants: number;
  oracleChosen: number;
  totalRevenue: number;
  last24Hours: number;
  uniqueHolders: number;
}

interface MatrixCollectionAdminProps {
  onClose?: () => void;
}

type AdminTab = 'overview' | 'pricing';

export default function MatrixCollectionAdmin({ onClose }: MatrixCollectionAdminProps) {
  const { theme } = useTheme();
  const [stats, setStats] = useState<CollectionStats>({
    totalMinted: 0,
    normalMints: 0,
    matrixHackers: 0,
    neoVariants: 0,
    oracleChosen: 0,
    totalRevenue: 0,
    last24Hours: 0,
    uniqueHolders: 0
  });
  const [loading, setLoading] = useState(true);
  const [minUsernameLength, setMinUsernameLength] = useState(4);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  useEffect(() => {
    loadCollectionStats();
    const interval = setInterval(loadCollectionStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadCollectionStats = async () => {
    try {
      const response = await fetch('/api/admin/matrix-collection/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setMinUsernameLength(data.config?.minUsernameLength || 4);
      }
    } catch (error) {
      console.error('Failed to load collection stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMinUsernameLength = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/matrix-collection/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minUsernameLength })
      });
      
      if (response.ok) {
        alert('Username length requirement updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const exportCollectionData = async () => {
    try {
      const response = await fetch('/api/admin/matrix-collection/export');
      const data = await response.json();
      
      // Create and download CSV
      const csv = convertToCSV(data.nfts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matrix-collection-${new Date().toISOString()}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  if (loading) {
    return (
      <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const rarityPercentage = (count: number) => 
    stats.totalMinted > 0 ? ((count / stats.totalMinted) * 100).toFixed(3) : '0.000';

  return (
    <div className={`p-6 rounded-lg ${
      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Matrix Collection Admin</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Master Open Edition Collection Monitoring
          </p>
        </div>
        <button
          onClick={loadCollectionStats}
          className={`p-2 rounded ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded font-semibold transition-all ${
            activeTab === 'pricing'
              ? 'bg-blue-600 text-white'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Pricing Config
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Minted */}
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Minted
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.totalMinted}</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            +{stats.last24Hours} last 24h
          </div>
        </div>

        {/* Total Revenue */}
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Revenue
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} LOS</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            @ 4.20 LOS each
          </div>
        </div>

        {/* Unique Holders */}
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Unique Holders
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.uniqueHolders}</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Community members
          </div>
        </div>

        {/* Matrix Variants */}
        <div className={`p-4 rounded-lg bg-gradient-to-br from-green-900 to-black border-2 border-green-500`}>
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">
              Matrix Variants
            </span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {stats.matrixHackers + stats.neoVariants + stats.oracleChosen}
          </div>
          <div className="text-xs text-green-400">
            Ultra-rare mints
          </div>
        </div>
      </div>

      {/* Rarity Breakdown */}
      <div className={`p-6 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Rarity Breakdown
        </h3>
        
        <div className="space-y-4">
          {/* Normal */}
          <div>
            <div className="flex justify-between mb-2">
              <span>Standard Profile Cards</span>
              <span className="font-mono">{stats.normalMints} ({rarityPercentage(stats.normalMints)}%)</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${rarityPercentage(stats.normalMints)}%` }}
              />
            </div>
          </div>

          {/* Matrix Hacker */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-green-400">🔓 Matrix Hacker (0.1% target)</span>
              <span className="font-mono text-green-400">{stats.matrixHackers} ({rarityPercentage(stats.matrixHackers)}%)</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(parseFloat(rarityPercentage(stats.matrixHackers)) * 10, 100)}%` }}
              />
            </div>
          </div>

          {/* Neo Variant */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-pink-400">⚡ Neo Variant (0.01% target)</span>
              <span className="font-mono text-pink-400">{stats.neoVariants} ({rarityPercentage(stats.neoVariants)}%)</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(parseFloat(rarityPercentage(stats.neoVariants)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Oracle Chosen */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-yellow-400">👁️ Oracle Chosen (0.001% target)</span>
              <span className="font-mono text-yellow-400">{stats.oracleChosen} ({rarityPercentage(stats.oracleChosen)}%)</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(parseFloat(rarityPercentage(stats.oracleChosen)) * 1000, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className={`p-6 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Collection Configuration
        </h3>

        <div className="space-y-4">
          {/* Minimum Username Length */}
          <div>
            <label className="block mb-2 font-medium">
              Minimum Username Length
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="3"
                max="10"
                value={minUsernameLength}
                onChange={(e) => setMinUsernameLength(parseInt(e.target.value))}
                className={`flex-1 px-4 py-2 rounded border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={updateMinUsernameLength}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Currently set to {minUsernameLength} characters minimum
            </p>
          </div>

          {/* Collection Info */}
          <div className={`p-4 rounded border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <h4 className="font-bold mb-2">Collection Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-mono">Analos Profile Cards</span>
              </div>
              <div className="flex justify-between">
                <span>Symbol:</span>
                <span className="font-mono">APC</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-mono">Master Open Edition</span>
              </div>
              <div className="flex justify-between">
                <span>Mint Price:</span>
                <span className="font-mono">4.20 LOS</span>
              </div>
              <div className="flex justify-between">
                <span>Royalty:</span>
                <span className="font-mono">2.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={exportCollectionData}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
        
        <button
          onClick={() => window.open('https://explorer.analos.io', '_blank')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          View on Explorer
        </button>
      </div>

          {/* Alert */}
          <div className={`mt-6 p-4 rounded border flex gap-3 ${
            theme === 'dark'
              ? 'bg-yellow-900/20 border-yellow-600 text-yellow-400'
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Matrix Variant Distribution</p>
              <p className="text-sm mt-1">
                Matrix variants are automatically distributed by the rarity oracle. 
                The percentages shown are actual distribution rates and may vary from target rates.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Pricing Configuration Tab */}
      {activeTab === 'pricing' && (
        <ProfileNFTPricingConfig />
      )}
    </div>
  );
}
