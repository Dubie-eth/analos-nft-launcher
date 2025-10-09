'use client';

import React, { useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  collectionMint: string;
  creatorAddress: string;
  totalSupply: number;
  currentSupply: number;
  isActive: boolean;
  mintingEnabled: boolean;
  isTestMode: boolean;
  mintPrice: number;
  paymentToken: string;
  paymentTokens?: PaymentToken[];
  whitelist?: WhitelistConfig;
  maxMintsPerWallet?: number;
  delayedReveal?: DelayedRevealConfig;
  bondingCurveEnabled?: boolean;
  bondingCurveConfig?: BondingCurveConfig;
  stats?: {
    totalSupply: number;
    currentSupply: number;
    remaining: number;
  };
  activeWhitelistPhase?: WhitelistPhase;
}

interface PaymentToken {
  mint: string;
  symbol: string;
  decimals: number;
  pricePerNFT: number;
  minBalanceForWhitelist?: number;
  accepted: boolean;
}

interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number;
  maxMintsPerWallet: number;
  description: string;
  requirements: {
    tokenMint?: string;
    minBalance?: number;
    tokenSymbol?: string;
  };
}

interface WhitelistConfig {
  enabled: boolean;
  addresses: string[];
  phases: WhitelistPhase[];
}

interface DelayedRevealConfig {
  enabled: boolean;
  type: 'manual' | 'automatic' | 'completion';
  revealTime: string;
  revealAtCompletion: boolean;
  placeholderImage: string;
}

interface BondingCurveConfig {
  initialPrice: number;
  priceIncrement: number;
  maxPrice: number;
  curveType: 'linear' | 'exponential' | 'logarithmic';
}

export default function CollectionAdminDashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'whitelist' | 'payment' | 'minting' | 'delayed-reveal' | 'bonding-curve'>('overview');
  const [adminWallet, setAdminWallet] = useState('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW');

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await fetch('https://analos-nft-launcher-production-f3da.up.railway.app/api/collections');
      const data = await response.json();
      if (data.success) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const loadCollectionAdminData = async (collectionId: string) => {
    try {
      const response = await fetch(`https://analos-nft-launcher-production-f3da.up.railway.app/api/admin/collections/${collectionId}`, {
        headers: {
          'x-admin-wallet': adminWallet
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedCollection(data.collection);
      }
    } catch (error) {
      console.error('Error loading collection admin data:', error);
    }
  };

  const updateWhitelist = async (whitelist: WhitelistConfig) => {
    if (!selectedCollection) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://analos-nft-launcher-production-f3da.up.railway.app/api/admin/collections/${selectedCollection.id}/whitelist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': adminWallet
        },
        body: JSON.stringify({ whitelist })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Whitelist configuration updated successfully!');
        loadCollectionAdminData(selectedCollection.id);
      } else {
        alert('Failed to update whitelist: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating whitelist:', error);
      alert('Error updating whitelist');
    } finally {
      setLoading(false);
    }
  };

  const updateMintingSettings = async (settings: {
    mintingEnabled?: boolean;
    mintPrice?: number;
    maxMintsPerWallet?: number;
    isTestMode?: boolean;
  }) => {
    if (!selectedCollection) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://analos-nft-launcher-production-f3da.up.railway.app/api/admin/collections/${selectedCollection.id}/minting`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': adminWallet
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Minting settings updated successfully!');
        loadCollectionAdminData(selectedCollection.id);
      } else {
        alert('Failed to update minting settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating minting settings:', error);
      alert('Error updating minting settings');
    } finally {
      setLoading(false);
    }
  };

  const checkWhitelistStatus = async (wallet: string) => {
    if (!selectedCollection) return;
    
    try {
      const response = await fetch(`https://analos-nft-launcher-production-f3da.up.railway.app/api/admin/collections/${selectedCollection.id}/whitelist-check/${wallet}`, {
        headers: {
          'x-admin-wallet': adminWallet
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Wallet ${wallet}:\nWhitelisted: ${data.isWhitelisted}\nActive Phase: ${data.activePhase?.name || 'None'}\nMint Price: ${data.mintPrice}\nCan Mint: ${data.canMint}`);
      } else {
        alert('Failed to check whitelist status: ' + data.error);
      }
    } catch (error) {
      console.error('Error checking whitelist status:', error);
      alert('Error checking whitelist status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🛠️ Collection Admin Dashboard
      </h1>

      {/* Admin Wallet Input */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Admin Wallet Address
        </label>
        <input
          type="text"
          value={adminWallet}
          onChange={(e) => setAdminWallet(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your admin wallet address"
        />
        <p className="text-sm text-gray-500 mt-1">
          This wallet must be authorized to perform admin operations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              📚 Collections
            </h2>
            
            {collections.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No collections found
              </p>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCollection?.id === collection.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedCollection(collection);
                      loadCollectionAdminData(collection.id);
                    }}
                  >
                    <h3 className="font-bold">{collection.name}</h3>
                    <p className="text-sm text-gray-600">Symbol: {collection.symbol}</p>
                    <p className="text-sm text-gray-600">
                      Supply: {collection.currentSupply} / {collection.totalSupply}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className={`px-2 py-1 rounded text-xs ${
                        collection.mintingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {collection.mintingEnabled ? 'Minting ON' : 'Minting OFF'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        collection.isTestMode ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {collection.isTestMode ? 'Test Mode' : 'Live Mode'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collection Admin Panel */}
        <div className="lg:col-span-2">
          {selectedCollection ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCollection.name} Admin Panel
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadCollectionAdminData(selectedCollection.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 border-b">
                {[
                  { id: 'overview', label: '📊 Overview' },
                  { id: 'whitelist', label: '👥 Whitelist' },
                  { id: 'payment', label: '💳 Payment' },
                  { id: 'minting', label: '🎨 Minting' },
                  { id: 'delayed-reveal', label: '🎭 Delayed Reveal' },
                  { id: 'bonding-curve', label: '📈 Bonding Curve' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-bold text-blue-800">Total Supply</h3>
                      <p className="text-2xl font-bold text-blue-600">{selectedCollection.totalSupply}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-bold text-green-800">Minted</h3>
                      <p className="text-2xl font-bold text-green-600">{selectedCollection.currentSupply}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-bold text-purple-800">Remaining</h3>
                      <p className="text-2xl font-bold text-purple-600">{selectedCollection.stats?.remaining || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-bold text-yellow-800">Mint Price</h3>
                      <p className="text-2xl font-bold text-yellow-600">{selectedCollection.mintPrice} {selectedCollection.paymentToken}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold mb-3">Collection Info</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>ID:</strong> <code className="bg-gray-100 px-1 rounded">{selectedCollection.id}</code></p>
                        <p><strong>Mint:</strong> <code className="bg-gray-100 px-1 rounded">{selectedCollection.collectionMint}</code></p>
                        <p><strong>Creator:</strong> <code className="bg-gray-100 px-1 rounded">{selectedCollection.creatorAddress}</code></p>
                        <p><strong>Max per Wallet:</strong> {selectedCollection.maxMintsPerWallet || 'Unlimited'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-3">Status</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Minting:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedCollection.mintingEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedCollection.mintingEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Test Mode:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedCollection.isTestMode ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedCollection.isTestMode ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Whitelist:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedCollection.whitelist?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedCollection.whitelist?.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonding Curve:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedCollection.bondingCurveEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedCollection.bondingCurveEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCollection.activeWhitelistPhase && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-bold text-green-800 mb-2">Active Whitelist Phase</h3>
                      <p><strong>Name:</strong> {selectedCollection.activeWhitelistPhase.name}</p>
                      <p><strong>Description:</strong> {selectedCollection.activeWhitelistPhase.description}</p>
                      <p><strong>Price Multiplier:</strong> {selectedCollection.activeWhitelistPhase.priceMultiplier}x</p>
                      <p><strong>Max per Wallet:</strong> {selectedCollection.activeWhitelistPhase.maxMintsPerWallet}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'minting' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Minting Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minting Enabled
                      </label>
                      <button
                        onClick={() => updateMintingSettings({ mintingEnabled: !selectedCollection.mintingEnabled })}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded font-semibold ${
                          selectedCollection.mintingEnabled
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        } disabled:opacity-50`}
                      >
                        {selectedCollection.mintingEnabled ? 'Disable Minting' : 'Enable Minting'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Mode
                      </label>
                      <button
                        onClick={() => updateMintingSettings({ isTestMode: !selectedCollection.isTestMode })}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded font-semibold ${
                          selectedCollection.isTestMode
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        } disabled:opacity-50`}
                      >
                        {selectedCollection.isTestMode ? 'Disable Test Mode' : 'Enable Test Mode'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mint Price
                      </label>
                      <input
                        type="number"
                        defaultValue={selectedCollection.mintPrice}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Mints per Wallet
                      </label>
                      <input
                        type="number"
                        defaultValue={selectedCollection.maxMintsPerWallet || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0 = unlimited"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const mintPrice = parseFloat((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || '0');
                      const maxMintsPerWallet = parseInt((document.querySelectorAll('input[type="number"]')[1] as HTMLInputElement)?.value || '0');
                      updateMintingSettings({ mintPrice, maxMintsPerWallet });
                    }}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Minting Settings'}
                  </button>
                </div>
              )}

              {activeTab === 'whitelist' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold">Whitelist Management</h3>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-800 mb-2">Quick Whitelist Check</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter wallet address to check"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="whitelist-check-input"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('whitelist-check-input') as HTMLInputElement;
                          if (input.value) {
                            checkWhitelistStatus(input.value);
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Check
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-2">Whitelist Configuration</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Advanced whitelist configuration with phases, token requirements, and pricing will be available in the full admin interface.
                    </p>
                    <div className="space-y-2">
                      <p><strong>Current Status:</strong> {selectedCollection.whitelist?.enabled ? 'Enabled' : 'Disabled'}</p>
                      <p><strong>Addresses:</strong> {selectedCollection.whitelist?.addresses.length || 0}</p>
                      <p><strong>Phases:</strong> {selectedCollection.whitelist?.phases.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs would be implemented similarly */}
              {activeTab === 'payment' && (
                <div className="text-center py-8 text-gray-500">
                  Payment configuration interface coming soon...
                </div>
              )}

              {activeTab === 'delayed-reveal' && (
                <div className="text-center py-8 text-gray-500">
                  Delayed reveal configuration interface coming soon...
                </div>
              )}

              {activeTab === 'bonding-curve' && (
                <div className="text-center py-8 text-gray-500">
                  Bonding curve configuration interface coming soon...
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Select a Collection
              </h2>
              <p className="text-gray-500">
                Choose a collection from the list to view and manage its settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
