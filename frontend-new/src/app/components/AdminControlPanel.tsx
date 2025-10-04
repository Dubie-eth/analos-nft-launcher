'use client';

import { useState, useEffect } from 'react';
import { adminControlService, CollectionConfig, AdminSettings } from '@/lib/admin-control-service';
import { blockchainFailSafeService } from '@/lib/blockchain-failsafe-service';
import { whitelistMonitoringService, WhitelistStats, WhitelistPhase } from '@/lib/whitelist-monitoring-service';
import BlockchainCollectionService from '@/lib/blockchain-collection-service';
import BondingCurveAdminPanel from './BondingCurveAdminPanel';
import MasterBondingCurveDashboard from './MasterBondingCurveDashboard';
import BondingCurveRevealManager from './BondingCurveRevealManager';
import SecureEscrowWalletManager from './SecureEscrowWalletManager';
import CollectionDeployment from './CollectionDeployment';
import GeneratorWhitelistManager from './GeneratorWhitelistManager';

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
  const [showDeployment, setShowDeployment] = useState(false);
  const [selectedCollectionForDeployment, setSelectedCollectionForDeployment] = useState<string>('');
  const [whitelistStats, setWhitelistStats] = useState<WhitelistStats | null>(null);
  const [activePhases, setActivePhases] = useState<WhitelistPhase[]>([]);
  const [blockchainCollections, setBlockchainCollections] = useState<any[]>([]);
  const [hiddenCollections, setHiddenCollections] = useState<any[]>([]);

  // New collection form state
  const [newCollection, setNewCollection] = useState({
    name: '',
    displayName: '',
    totalSupply: 1000,
    mintPrice: 50.00,
    paymentToken: 'LOL',
    description: '',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
    launchType: 'regular' as 'regular' | 'bonding_curve'
  });

  // Bonding curve configuration state
  const [bondingCurveConfig, setBondingCurveConfig] = useState({
    bondingCap: 10000000, // 10M $LOS
    startingPrice: 100,
    maxPrice: 1000,
    revealTriggers: {
      marketCapTrigger: 8000000,
      nftSoldTrigger: 8000,
      timeTrigger: 30 // days
    },
    tokenHolderRewards: {
      enabled: true,
      rewardPercentage: 15,
      minimumHoldings: 100000
    }
  });

  useEffect(() => {
    if (isAuthorized) {
      loadAdminData();
    }
  }, [isAuthorized]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const blockchainService = new BlockchainCollectionService();
      const [collectionsData, settingsData, statusData, whitelistStatsData, activePhasesData, blockchainCollectionsData, hiddenCollectionsData] = await Promise.all([
        adminControlService.getCollections(),
        adminControlService.getAdminSettings(),
        adminControlService.getSystemStatus(),
        whitelistMonitoringService.getWhitelistStats(),
        whitelistMonitoringService.getActivePhases(),
        blockchainService.getAllCollectionsFromBlockchain(),
        blockchainService.getHiddenCollections()
      ]);

      setCollections(collectionsData);
      setAdminSettings(settingsData);
      setSystemStatus(statusData);
      setWhitelistStats(whitelistStatsData);
      setActivePhases(activePhasesData);
      setBlockchainCollections(blockchainCollectionsData);
      setHiddenCollections(hiddenCollectionsData);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGlobalMinting = async (enabled: boolean) => {
    try {
      setLoading(true);
      await adminControlService.toggleGlobalMinting(enabled);
      await loadAdminData();
      console.log(`✅ Global minting ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling global minting:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async (enabled: boolean) => {
    try {
      setLoading(true);
      await adminControlService.toggleMaintenanceMode(enabled);
      await loadAdminData();
      console.log(`✅ Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const emergencyStop = async () => {
    if (!confirm('🚨 EMERGENCY STOP: This will disable ALL operations across the platform. Are you sure?')) {
      return;
    }
    
    try {
      setLoading(true);
      await adminControlService.emergencyStop();
      await loadAdminData();
      console.log('🚨 EMERGENCY STOP ACTIVATED');
      alert('🚨 EMERGENCY STOP ACTIVATED - All operations disabled');
    } catch (error) {
      console.error('❌ Error during emergency stop:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollectionVisibility = async (collectionId: string) => {
    try {
      setLoading(true);
      const blockchainService = new BlockchainCollectionService();
      blockchainService.toggleCollectionVisibility(collectionId);
      await loadAdminData(); // Refresh data
      console.log(`✅ Collection visibility toggled: ${collectionId}`);
    } catch (error) {
      console.error('❌ Error toggling collection visibility:', error);
    } finally {
      setLoading(false);
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
      const collectionData = {
        ...newCollection,
        isActive: false,
        mintingEnabled: false,
        isTestMode: false,
        // Add bonding curve configuration if selected
        ...(newCollection.launchType === 'bonding_curve' && {
          isDLMMBondingCurve: true,
          bondingCurveConfig: bondingCurveConfig
        })
      };

      const success = await adminControlService.createCollection(collectionData);

      if (success) {
        setShowCreateCollection(false);
        setNewCollection({
          name: '',
          displayName: '',
          totalSupply: 1000,
          mintPrice: 50.00,
          paymentToken: 'LOL',
          description: '',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          launchType: 'regular'
        });
        setBondingCurveConfig({
          bondingCap: 10000000,
          startingPrice: 100,
          maxPrice: 1000,
          revealTriggers: {
            marketCapTrigger: 8000000,
            nftSoldTrigger: 8000,
            timeTrigger: 30
          },
          tokenHolderRewards: {
            enabled: true,
            rewardPercentage: 15,
            minimumHoldings: 100000
          }
        });
        await loadAdminData();
        console.log(`✅ New ${newCollection.launchType} collection created`);
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
    <div className="space-y-6 pb-8">
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
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.globalMintingEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '...' : (adminSettings?.globalMintingEnabled ? 'ENABLED' : 'DISABLED')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Maintenance Mode</h4>
              <p className="text-gray-400 text-sm">Temporarily disable all operations</p>
            </div>
            <button
              onClick={() => toggleMaintenanceMode(!adminSettings?.maintenanceMode)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.maintenanceMode
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '...' : (adminSettings?.maintenanceMode ? 'ON' : 'OFF')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Emergency Stop</h4>
              <p className="text-gray-400 text-sm">Immediately halt all operations</p>
            </div>
            <button
              onClick={emergencyStop}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                adminSettings?.emergencyStop
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '...' : (adminSettings?.emergencyStop ? 'ACTIVE' : 'EMERGENCY STOP')}
            </button>
          </div>
        </div>
      </div>

      {/* Whitelist Phase Monitoring */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 Whitelist Phase Monitoring</h3>
        
        {whitelistStats && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{whitelistStats.totalPhases}</div>
                <div className="text-sm text-gray-400">Total Phases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{whitelistStats.activePhases}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{whitelistStats.completedPhases}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{whitelistStats.upcomingPhases}</div>
                <div className="text-sm text-gray-400">Upcoming</div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Overall Progress</span>
                <span className="text-green-400 font-bold">{whitelistStats.totalMinted}/{whitelistStats.totalMaxMints}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${whitelistStats.overallProgress}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-400 mt-1">
                {whitelistStats.overallProgress.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Active Phases */}
        <div className="space-y-4">
          <h4 className="text-white font-medium text-lg">Active Phases</h4>
          {activePhases.length > 0 ? (
            activePhases.map((phase) => (
              <div key={phase.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-white font-medium">{phase.name}</h5>
                    <p className="text-gray-400 text-sm">{phase.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      phase.priceMultiplier === 0 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {phase.priceMultiplier === 0 ? 'FREE' : `${phase.priceMultiplier}x`}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-600 text-white">
                      {phase.minimumLolBalance.toLocaleString()}+ $LOL
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{phase.mintedCount}</div>
                    <div className="text-xs text-gray-400">Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{phase.maxMints}</div>
                    <div className="text-xs text-gray-400">Max Mints</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{phase.remainingMints}</div>
                    <div className="text-xs text-gray-400">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">{phase.eligibleWallets}</div>
                    <div className="text-xs text-gray-400">Eligible</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(phase.mintedCount / phase.maxMints) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progress: {((phase.mintedCount / phase.maxMints) * 100).toFixed(1)}%</span>
                  <span>{phase.maxMintsPerWallet} max per wallet</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No active whitelist phases</p>
            </div>
          )}
        </div>
      </div>

      {/* Collection Visibility Management */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">👁️ Collection Visibility Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visible Collections */}
          <div>
            <h4 className="text-white font-medium text-lg mb-3">Visible Collections ({blockchainCollections.length})</h4>
            <div className="space-y-3">
              {blockchainCollections.length > 0 ? (
                blockchainCollections.map((collection) => (
                  <div key={collection.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-white font-medium">{collection.name}</h5>
                        <p className="text-gray-400 text-sm">{collection.id}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-600 text-white">
                            VISIBLE
                          </span>
                          <span className="text-gray-400 text-xs">
                            {collection.currentSupply}/{collection.totalSupply} minted
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCollectionVisibility(collection.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {loading ? '...' : 'Hide'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p>No visible collections</p>
                </div>
              )}
            </div>
          </div>

          {/* Hidden Collections */}
          <div>
            <h4 className="text-white font-medium text-lg mb-3">Hidden Collections ({hiddenCollections.length})</h4>
            <div className="space-y-3">
              {hiddenCollections.length > 0 ? (
                hiddenCollections.map((collection) => (
                  <div key={collection.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-white font-medium">{collection.name}</h5>
                        <p className="text-gray-400 text-sm">{collection.id}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white">
                            HIDDEN
                          </span>
                          <span className="text-gray-400 text-xs">
                            {collection.currentSupply}/{collection.totalSupply} minted
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCollectionVisibility(collection.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {loading ? '...' : 'Show'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p>No hidden collections</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Tip:</strong> Hidden collections won't appear on the mint page but can still be accessed directly via URL. 
            Use this to temporarily hide collections from public view.
          </p>
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

                <button
                  onClick={() => {
                    setSelectedCollectionForDeployment(collection.name);
                    setShowDeployment(true);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
                >
                  🚀 Deploy
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-6">Create New Collection</h3>
              
              <div className="space-y-6">
                {/* Basic Collection Info */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">📋 Basic Collection Information</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name</label>
                        <input
                          type="text"
                          value={newCollection.name}
                          onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="new-collection"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={newCollection.displayName}
                          onChange={(e) => setNewCollection({...newCollection, displayName: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="New Collection"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Total Supply</label>
                        <input
                          type="number"
                          value={newCollection.totalSupply}
                          onChange={(e) => setNewCollection({...newCollection, totalSupply: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="1000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Payment Token</label>
                        <select
                          value={newCollection.paymentToken}
                          onChange={(e) => setNewCollection({...newCollection, paymentToken: e.target.value as 'LOS' | 'LOL'})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        >
                          <option value="LOL">$LOL</option>
                          <option value="LOS">$LOS</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={newCollection.description}
                        onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        rows={3}
                        placeholder="Collection description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Launch Type Selection */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">🚀 Launch Type</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        newCollection.launchType === 'regular' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setNewCollection({...newCollection, launchType: 'regular'})}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                          <div className="text-white font-medium">Regular NFT</div>
                          <div className="text-gray-400 text-sm">Fixed price minting</div>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        newCollection.launchType === 'bonding_curve' 
                          ? 'border-purple-500 bg-purple-900/20' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setNewCollection({...newCollection, launchType: 'bonding_curve'})}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📈</div>
                        <div>
                          <div className="text-white font-medium">Bonding Curve</div>
                          <div className="text-gray-400 text-sm">Progressive pricing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Regular NFT Configuration */}
                  {newCollection.launchType === 'regular' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mint Price ({newCollection.paymentToken})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCollection.mintPrice}
                        onChange={(e) => setNewCollection({...newCollection, mintPrice: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="50.00"
                      />
                    </div>
                  )}
                </div>

                {/* Bonding Curve Configuration */}
                {newCollection.launchType === 'bonding_curve' && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h4 className="text-purple-400 font-medium mb-4">📈 Bonding Curve Configuration</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Bonding Cap</label>
                          <input
                            type="number"
                            value={bondingCurveConfig.bondingCap}
                            onChange={(e) => setBondingCurveConfig({...bondingCurveConfig, bondingCap: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="10000000"
                          />
                          <div className="text-xs text-gray-400 mt-1">Total $LOS to raise</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Starting Price</label>
                          <input
                            type="number"
                            value={bondingCurveConfig.startingPrice}
                            onChange={(e) => setBondingCurveConfig({...bondingCurveConfig, startingPrice: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="100"
                          />
                          <div className="text-xs text-gray-400 mt-1">Initial price per NFT</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
                          <input
                            type="number"
                            value={bondingCurveConfig.maxPrice}
                            onChange={(e) => setBondingCurveConfig({...bondingCurveConfig, maxPrice: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="1000"
                          />
                          <div className="text-xs text-gray-400 mt-1">Peak price per NFT</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-3">🎁 Token Holder Rewards</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reward Percentage</label>
                            <input
                              type="number"
                              value={bondingCurveConfig.tokenHolderRewards.rewardPercentage}
                              onChange={(e) => setBondingCurveConfig({
                                ...bondingCurveConfig, 
                                tokenHolderRewards: {
                                  ...bondingCurveConfig.tokenHolderRewards,
                                  rewardPercentage: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                              placeholder="15"
                            />
                            <div className="text-xs text-gray-400 mt-1">% of mint funds returned</div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Holdings</label>
                            <input
                              type="number"
                              value={bondingCurveConfig.tokenHolderRewards.minimumHoldings}
                              onChange={(e) => setBondingCurveConfig({
                                ...bondingCurveConfig, 
                                tokenHolderRewards: {
                                  ...bondingCurveConfig.tokenHolderRewards,
                                  minimumHoldings: parseInt(e.target.value) || 0
                                }
                              })}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                              placeholder="100000"
                            />
                            <div className="text-xs text-gray-400 mt-1">Minimum $LOL to qualify</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateCollection(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewCollection}
                  disabled={loading || !newCollection.name || !newCollection.displayName}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : `Create ${newCollection.launchType === 'bonding_curve' ? 'Bonding Curve' : 'Regular'} Collection`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Escrow Wallet Manager */}
      <SecureEscrowWalletManager />

      {/* Generator Whitelist Manager */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-6">🎨 NFT Generator Access Control</h3>
        <GeneratorWhitelistManager isAdmin={isAuthorized} />
      </div>

      {/* Master Bonding Curve Dashboard */}
      <MasterBondingCurveDashboard isAuthorized={isAuthorized} />

      {/* Individual Collection Bonding Curve Controls */}
      {blockchainCollections.map((collection) => (
        <div key={collection.id} className="space-y-6">
          <BondingCurveAdminPanel
            collectionId={collection.id}
            collectionName={collection.name}
            isAuthorized={isAuthorized}
          />
          <BondingCurveRevealManager
            collectionId={collection.id}
            collectionName={collection.name}
            isAuthorized={isAuthorized}
          />
        </div>
      ))}

      {/* Collection Deployment Modal */}
      {showDeployment && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">🚀 Deploy Collection</h2>
                <button
                  onClick={() => setShowDeployment(false)}
                  className="text-white/60 hover:text-white text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <CollectionDeployment
                collectionName={selectedCollectionForDeployment}
                onDeploymentComplete={(success, result) => {
                  if (success) {
                    console.log('✅ Deployment completed successfully:', result);
                    setShowDeployment(false);
                    loadCollections(); // Refresh collections list
                  } else {
                    console.error('❌ Deployment failed:', result);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
