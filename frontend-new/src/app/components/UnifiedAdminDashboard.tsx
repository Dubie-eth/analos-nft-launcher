'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { adminControlService } from '@/lib/admin-control-service';
import { feeManagementService } from '@/lib/fee-management-service';
import { blockchainDataService } from '@/lib/blockchain-data-service';
import { isAuthorizedAdmin } from '@/lib/admin-config';
import { pageAnalyticsService } from '@/lib/page-analytics-service';
import { partnerAccessService } from '@/lib/partner-access-service';
import { pageAccessControlService } from '@/lib/page-access-control-service';
import ManualRevealInterface from './ManualRevealInterface';
import MetadataManagementDashboard from './MetadataManagementDashboard';
import DataBackupPanel from './DataBackupPanel';
import BlockchainRecovery from './BlockchainRecovery';
import BlockchainFirstAdmin from './BlockchainFirstAdmin';

interface CollectionStats {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintedPercentage: number;
  floorPrice: number;
  volumeTraded: number;
  isActive: boolean;
  mintingEnabled: boolean;
}

interface AdminStats {
  totalCollections: number;
  activeCollections: number;
  totalNFTsMinted: number;
  totalVolume: number;
  platformFees: number;
}

export default function UnifiedAdminDashboard() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'reveal' | 'metadata' | 'backup' | 'recovery' | 'blockchain-first' | 'analytics' | 'partners' | 'access-control' | 'settings'>('overview');
  const [collections, setCollections] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const isAdmin = connected && publicKey && isAuthorizedAdmin(publicKey.toString());

  useEffect(() => {
    if (connected && isAdmin) {
      loadAdminData();
    }
  }, [connected, isAdmin]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading admin data...');
      
      let allCollections: any[] = [];
      
      // 1. Load collections from localStorage (deployed collections)
      const storedCollections = localStorage.getItem('launched_collections');
      if (storedCollections) {
        try {
          const collectionsData = JSON.parse(storedCollections);
          console.log('📦 Found collections in localStorage:', collectionsData.length);
          allCollections = [...allCollections, ...collectionsData];
        } catch (error) {
          console.error('Error parsing localStorage collections:', error);
        }
      }
      
      // 2. Load collections from admin control service
      try {
        const adminCollections = await adminControlService.getAllCollections();
        console.log('🎛️ Found collections in admin service:', adminCollections.length);
        
        // Convert admin service collections to the format expected by the dashboard
        const adminCollectionsFormatted = adminCollections.map(collection => ({
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
          platformFees: 0,
          volumeTraded: 0
        }));
        
        allCollections = [...allCollections, ...adminCollectionsFormatted];
      } catch (error) {
        console.error('Error loading admin service collections:', error);
      }
      
      // 3. Discover collections from blockchain
      try {
        const blockchainCollections = await blockchainDataService.discoverBlockchainCollections();
        console.log('🔗 Found collections on blockchain:', blockchainCollections.length);
        
        // Convert blockchain collections to the format expected by the dashboard
        const blockchainCollectionsFormatted = blockchainCollections.map(collection => ({
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
          platformFees: 0,
          volumeTraded: 0,
          source: 'blockchain'
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
      
      // Calculate admin stats
      const stats: AdminStats = {
        totalCollections: uniqueCollections.length,
        activeCollections: uniqueCollections.filter((c: any) => c.isActive).length,
        totalNFTsMinted: uniqueCollections.reduce((sum: number, c: any) => sum + (c.totalMinted || 0), 0),
        totalVolume: uniqueCollections.reduce((sum: number, c: any) => sum + (c.volumeTraded || 0), 0),
        platformFees: uniqueCollections.reduce((sum: number, c: any) => sum + (c.platformFees || 0), 0)
      };
      setAdminStats(stats);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollectionStatus = async (collectionId: string, field: 'isActive' | 'mintingEnabled') => {
    try {
      // Update in localStorage (in a real app, this would be an API call)
      const updatedCollections = collections.map(collection => 
        collection.id === collectionId 
          ? { ...collection, [field]: !collection[field] }
          : collection
      );
      
      localStorage.setItem('launched_collections', JSON.stringify(updatedCollections));
      setCollections(updatedCollections);
      
      // Update admin stats
      if (adminStats) {
        const newStats = { ...adminStats };
        if (field === 'isActive') {
          newStats.activeCollections = updatedCollections.filter(c => c.isActive).length;
        }
        setAdminStats(newStats);
      }
    } catch (error) {
      console.error('Error updating collection status:', error);
    }
  };

  const deleteCollection = async (collectionId: string, collectionName: string) => {
    if (!confirm(`Are you sure you want to delete the collection "${collectionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Remove from localStorage (in a real app, this would be an API call)
      const updatedCollections = collections.filter(collection => collection.id !== collectionId);
      
      localStorage.setItem('launched_collections', JSON.stringify(updatedCollections));
      setCollections(updatedCollections);
      
      // Update admin stats
      if (adminStats) {
        const newStats = {
          ...adminStats,
          totalCollections: updatedCollections.length,
          activeCollections: updatedCollections.filter(c => c.isActive).length
        };
        setAdminStats(newStats);
      }
      
      alert(`Collection "${collectionName}" has been deleted successfully.`);
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection. Please try again.');
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Required</h2>
          <p className="text-gray-300">Please connect your wallet to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">You don't have admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎛️ Admin Dashboard</h1>
          <p className="text-gray-300">Comprehensive collection management and platform administration</p>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">🚀 Quick Page Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { name: 'Home', path: '/', icon: '🏠' },
              { name: 'Launch', path: '/launch-collection', icon: '🚀' },
              { name: 'Marketplace', path: '/marketplace', icon: '🏪' },
              { name: 'Explorer', path: '/explorer', icon: '🔍' },
              { name: 'Collections', path: '/collections', icon: '🎨' },
              { name: 'Profile', path: '/profile', icon: '👤' },
            ].map((page) => (
              <a
                key={page.path}
                href={page.path}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl mb-1">{page.icon}</div>
                <div className="text-white text-sm font-medium">{page.name}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 rounded-xl p-2 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'collections', label: 'Collections', icon: '🎨' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'partners', label: 'Partners', icon: '🤝' },
              { id: 'access-control', label: 'Access Control', icon: '🔐' },
              { id: 'reveal', label: 'Manual Reveal', icon: '🎭' },
              { id: 'metadata', label: 'Metadata', icon: '📝' },
              { id: 'backup', label: 'Data Backup', icon: '💾' },
              { id: 'recovery', label: 'Blockchain Recovery', icon: '🔍' },
              { id: 'blockchain-first', label: 'Blockchain-First', icon: '🔗' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Admin Stats */}
            {adminStats && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold text-white mb-4">Platform Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-500/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-300">{adminStats.totalCollections}</div>
                    <div className="text-sm text-blue-200">Total Collections</div>
                  </div>
                  <div className="bg-green-500/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-300">{adminStats.activeCollections}</div>
                    <div className="text-sm text-green-200">Active Collections</div>
                  </div>
                  <div className="bg-purple-500/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-300">{adminStats.totalNFTsMinted.toLocaleString()}</div>
                    <div className="text-sm text-purple-200">NFTs Minted</div>
                  </div>
                  <div className="bg-yellow-500/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-300">${adminStats.totalVolume.toLocaleString()}</div>
                    <div className="text-sm text-yellow-200">Total Volume</div>
                  </div>
                  <div className="bg-red-500/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-300">${adminStats.platformFees.toLocaleString()}</div>
                    <div className="text-sm text-red-200">Platform Fees</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('collections')}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 p-4 rounded-lg transition-all"
                >
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-semibold">Manage Collections</div>
                  <div className="text-sm opacity-75">View and update collection settings</div>
                </button>
                <button
                  onClick={() => setActiveTab('reveal')}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-300 p-4 rounded-lg transition-all"
                >
                  <div className="text-2xl mb-2">🎭</div>
                  <div className="font-semibold">Manual Reveal</div>
                  <div className="text-sm opacity-75">Reveal NFTs and manage metadata</div>
                </button>
                <button
                  onClick={() => setActiveTab('metadata')}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 p-4 rounded-lg transition-all"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-semibold">Metadata Management</div>
                  <div className="text-sm opacity-75">Edit and export NFT metadata</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Collection Management</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading collections...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <div key={collection.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white font-semibold">{collection.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCollectionStatus(collection.id, 'isActive')}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            collection.isActive 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {collection.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => toggleCollectionStatus(collection.id, 'mintingEnabled')}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            collection.mintingEnabled 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {collection.mintingEnabled ? 'Minting' : 'Paused'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                      <div>Supply: {collection.maxSupply?.toLocaleString() || 'N/A'}</div>
                      <div>Minted: {collection.totalMinted || 0}</div>
                      <div>Price: {collection.mintPrice || 'N/A'} {collection.pricingToken || 'SOL'}</div>
                      <div>Type: {collection.mintType || 'Standard'}</div>
                      <div>Reveal: {collection.revealType || 'Instant'}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCollection(collection)}
                          className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => window.open(`/mint/${collection.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                          className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded transition-all"
                        >
                          View Mint Page
                        </button>
                      </div>
                      <button
                        onClick={() => deleteCollection(collection.id, collection.name)}
                        className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded transition-all"
                      >
                        Delete Collection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">📈 Page Analytics & Traffic</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Overview */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Platform Overview</h3>
                <div className="space-y-3">
                  {(() => {
                    const platformStats = pageAnalyticsService.getPlatformAnalytics();
                    return Object.entries(platformStats).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-white font-semibold">
                          {typeof value === 'number' ? value.toFixed(1) : value}
                          {key.includes('Rate') || key.includes('Score') ? '%' : ''}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Page Performance */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Page Performance</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pageAnalyticsService.getAllPageAnalytics().map((page) => (
                    <div key={page.pageId} className="bg-white/5 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
                        >
                          {page.pageName}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <span className={`px-2 py-1 rounded text-xs ${
                          page.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {page.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Views:</span>
                          <span className="text-white ml-1">{page.totalViews}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Visitors:</span>
                          <span className="text-white ml-1">{page.uniqueVisitors}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Bounce:</span>
                          <span className="text-white ml-1">{page.bounceRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white ml-1">{page.sustainabilityScore}/100</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {page.path}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  const data = pageAnalyticsService.exportAnalytics();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📊 Export Analytics
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all analytics data?')) {
                    pageAnalyticsService.resetAnalytics();
                    alert('Analytics data has been reset.');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🗑️ Reset Analytics
              </button>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">🤝 Partner Access Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Partner Stats */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Partner Statistics</h3>
                <div className="space-y-3">
                  {(() => {
                    const stats = partnerAccessService.getPartnerStats();
                    return Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-white font-semibold">
                          {typeof value === 'object' ? Object.values(value).reduce((a: number, b: number) => a + b, 0) : value}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Add New Partner */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Partner</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const walletAddress = formData.get('walletAddress') as string;
                  const partnerName = formData.get('partnerName') as string;
                  const accessLevel = formData.get('accessLevel') as any;
                  
                  const partner = partnerAccessService.addPartner(
                    walletAddress,
                    partnerName,
                    { twitter: { username: '', verified: false } },
                    accessLevel,
                    partnerAccessService.getDefaultPermissions(accessLevel),
                    publicKey?.toString() || 'admin',
                    formData.get('notes') as string
                  );
                  
                  alert(`Partner ${partner.partnerName} added successfully!`);
                  e.currentTarget.reset();
                }}>
                  <div className="space-y-3">
                    <input
                      name="walletAddress"
                      type="text"
                      placeholder="Wallet Address"
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                      required
                    />
                    <input
                      name="partnerName"
                      type="text"
                      placeholder="Partner Name"
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                      required
                    />
                    <select
                      name="accessLevel"
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white"
                      required
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <textarea
                      name="notes"
                      placeholder="Notes (optional)"
                      className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-400"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors"
                    >
                      Add Partner
                    </button>
                  </div>
                </form>
              </div>

              {/* Partner List */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Active Partners</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {partnerAccessService.getAllPartners().map((partner) => (
                    <div key={partner.id} className="bg-white/5 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{partner.partnerName}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          partner.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {partner.accessLevel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {partner.walletAddress.slice(0, 8)}...{partner.walletAddress.slice(-8)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            partnerAccessService.togglePartnerStatus(partner.id);
                            alert(`Partner ${partner.partnerName} status toggled.`);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          {partner.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${partner.partnerName}?`)) {
                              partnerAccessService.removePartner(partner.id);
                              alert('Partner removed.');
                            }
                          }}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access-control' && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">🔐 Page Access Control</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Access Control Stats */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Access Statistics</h3>
                <div className="space-y-3">
                  {(() => {
                    const stats = pageAccessControlService.getAccessControlStats();
                    return Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-white font-semibold">{value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Page Controls */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Page Access Settings</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pageAccessControlService.getAllPageConfigs().map((config) => (
                    <div key={config.pageId} className="bg-white/5 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <a
                          href={config.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
                        >
                          {config.pageName}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              pageAccessControlService.togglePageVisibility(config.pageId, publicKey?.toString() || 'admin');
                              alert(`${config.pageName} visibility toggled. The page will reload to apply changes.`);
                              // Reload the page to apply changes
                              setTimeout(() => window.location.reload(), 1000);
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              config.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {config.isPublic ? 'Public' : 'Private'}
                          </button>
                          {config.requiresPartnerAccess && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                              Partner
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {config.path} • Levels: {config.allowedAccessLevels.join(', ') || 'All'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  const data = pageAccessControlService.exportAccessControl();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `access_control_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                📊 Export Config
              </button>
              <button
                onClick={() => {
                  if (confirm('Reset all access control settings to defaults?')) {
                    pageAccessControlService.resetToDefaults(publicKey?.toString() || 'admin');
                    alert('Access control settings reset to defaults.');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reveal' && (
          <div>
            <ManualRevealInterface />
          </div>
        )}

        {activeTab === 'metadata' && (
          <div>
            <MetadataManagementDashboard />
          </div>
        )}

        {activeTab === 'backup' && (
          <div>
            <DataBackupPanel />
          </div>
        )}

        {activeTab === 'recovery' && (
          <div>
            <BlockchainRecovery />
          </div>
        )}

        {activeTab === 'blockchain-first' && (
          <div>
            <BlockchainFirstAdmin />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Platform Settings</h2>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Global Settings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Platform Maintenance Mode</span>
                    <button className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-3 py-1 rounded text-sm transition-all">
                      Disabled
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Global Minting</span>
                    <button className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded text-sm transition-all">
                      Enabled
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Test Mode</span>
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded text-sm transition-all">
                      Enabled
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Fee Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Platform Fee</span>
                    <span className="text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Creator Fee</span>
                    <span className="text-white">2.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Community Fee</span>
                    <span className="text-white">1%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Security Settings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Rate Limiting</span>
                    <button className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded text-sm transition-all">
                      Enabled
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Admin Authentication</span>
                    <button className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded text-sm transition-all">
                      Required
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
