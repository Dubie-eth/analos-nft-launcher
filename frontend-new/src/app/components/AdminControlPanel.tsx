'use client';

import { useState, useEffect } from 'react';
import { adminControlService, CollectionConfig, AdminSettings } from '@/lib/admin-control-service';
import { blockchainFailSafeService } from '@/lib/blockchain-failsafe-service';

interface AdminControlPanelProps {
  isAuthorized: boolean;
}

export default function AdminControlPanel({ isAuthorized }: AdminControlPanelProps) {
  const [collections, setCollections] = useState<CollectionConfig[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  // New collection form state
  const [newCollection, setNewCollection] = useState({
    name: '',
    displayName: '',
    totalSupply: 1000,
    mintPrice: 50.00,
    paymentToken: 'LOL',
    description: '',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
  });

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData();
    }
  }, [isAuthorized]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [collectionsData, settingsData, statusData] = await Promise.all([
        adminControlService.getCollections(),
        adminControlService.getAdminSettings(),
        adminControlService.getSystemStatus()
      ]);

      setCollections(collectionsData);
      setAdminSettings(settingsData);
      setSystemStatus(statusData);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGlobalMinting = async (enabled: boolean) => {
    try {
      await adminControlService.toggleGlobalMinting(enabled);
      await loadAdminData();
      console.log(`✅ Global minting ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling global minting:', error);
    }
  };

  const toggleCollectionMinting = async (collectionName: string, enabled: boolean) => {
    try {
      await adminControlService.toggleCollectionMinting(collectionName, enabled);
      await loadAdminData();
      console.log(`✅ Collection minting ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling collection minting:', error);
    }
  };

  const createNewCollection = async () => {
    try {
      const success = await adminControlService.createCollection({
        ...newCollection,
        isActive: false,
        mintingEnabled: false,
        isTestMode: false
      });

      if (success) {
        setShowCreateCollection(false);
        setNewCollection({
          name: '',
          displayName: '',
          totalSupply: 1000,
          mintPrice: 50.00,
          paymentToken: 'LOL',
          description: '',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
        });
        await loadAdminData();
        console.log('✅ New collection created');
      }
    } catch (error) {
      console.error('❌ Error creating collection:', error);
    }
  };

  const forceRefreshCollection = async (collectionName: string) => {
    try {
      await blockchainFailSafeService.forceRefreshCollectionData(collectionName);
      await loadAdminData();
      console.log(`✅ Collection data refreshed: ${collectionName}`);
    } catch (error) {
      console.error('❌ Error refreshing collection:', error);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-2">🚫 Unauthorized Access</h3>
        <p className="text-red-300">You don't have permission to access admin controls.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-blue-300">Loading admin controls...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 System Status</h3>
        {systemStatus && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{systemStatus.totalCollections}</div>
              <div className="text-sm text-gray-400">Total Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemStatus.activeCollections}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{systemStatus.mintingEnabledCollections}</div>
              <div className="text-sm text-gray-400">Minting Enabled</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${systemStatus.globalMintingEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {systemStatus.globalMintingEnabled ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-gray-400">Global Minting</div>
            </div>
          </div>
        )}
      </div>

      {/* Global Controls */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">🎛️ Global Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Global Minting</h4>
              <p className="text-gray-400 text-sm">Enable/disable all minting across the platform</p>
            </div>
            <button
              onClick={() => toggleGlobalMinting(!adminSettings?.globalMintingEnabled)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.globalMintingEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {adminSettings?.globalMintingEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Maintenance Mode</h4>
              <p className="text-gray-400 text-sm">Temporarily disable all operations</p>
            </div>
            <button
              onClick={() => adminControlService.updateAdminSettings({ maintenanceMode: !adminSettings?.maintenanceMode })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.maintenanceMode
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {adminSettings?.maintenanceMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Emergency Stop</h4>
              <p className="text-gray-400 text-sm">Immediately halt all operations</p>
            </div>
            <button
              onClick={() => adminControlService.updateAdminSettings({ emergencyStop: !adminSettings?.emergencyStop })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.emergencyStop
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {adminSettings?.emergencyStop ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
        </div>
      </div>

      {/* Collections Management */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">📚 Collections Management</h3>
          <button
            onClick={() => setShowCreateCollection(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + New Collection
          </button>
        </div>

        <div className="space-y-4">
          {collections.map((collection) => (
            <div key={collection.name} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">{collection.displayName}</h4>
                  <p className="text-gray-400 text-sm">{collection.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    collection.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {collection.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    collection.mintingEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {collection.mintingEnabled ? 'MINTING' : 'DISABLED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Total Supply</div>
                  <div className="text-white font-medium">{collection.totalSupply}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Mint Price</div>
                  <div className="text-white font-medium">{collection.mintPrice} {collection.paymentToken}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Test Mode</div>
                  <div className="text-white font-medium">{collection.isTestMode ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Last Modified</div>
                  <div className="text-white font-medium text-xs">
                    {new Date(collection.lastModified).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleCollectionMinting(collection.name, !collection.mintingEnabled)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    collection.mintingEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {collection.mintingEnabled ? 'Disable Minting' : 'Enable Minting'}
                </button>
                
                <button
                  onClick={() => forceRefreshCollection(collection.name)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Refresh Data
                </button>

                {collection.isTestMode && (
                  <button
                    onClick={() => adminControlService.deleteCollection(collection.name)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Create New Collection</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Collection Name</label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="new-collection"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newCollection.displayName}
                  onChange={(e) => setNewCollection({...newCollection, displayName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  placeholder="New Collection"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Total Supply</label>
                  <input
                    type="number"
                    value={newCollection.totalSupply}
                    onChange={(e) => setNewCollection({...newCollection, totalSupply: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Mint Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCollection.mintPrice}
                    onChange={(e) => setNewCollection({...newCollection, mintPrice: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Token</label>
                <select
                  value={newCollection.paymentToken}
                  onChange={(e) => setNewCollection({...newCollection, paymentToken: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="LOS">LOS</option>
                  <option value="LOL">LOL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Collection description..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button
                onClick={createNewCollection}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Collection
              </button>
              <button
                onClick={() => setShowCreateCollection(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
