'use client';

import { useState, useEffect } from 'react';
import { bondingCurveCollectionManager, BondingCurveCollectionConfig } from '@/lib/bonding-curve-collection-manager';

interface BondingCurveRevealManagerProps {
  collectionId: string;
  collectionName: string;
  isAuthorized: boolean;
}

export default function BondingCurveRevealManager({ 
  collectionId, 
  collectionName, 
  isAuthorized 
}: BondingCurveRevealManagerProps) {
  const [collection, setCollection] = useState<BondingCurveCollectionConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reveal' | 'metadata' | 'tokenSet'>('overview');
  const [revealProgress, setRevealProgress] = useState(0);
  const [mintHistory, setMintHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthorized) {
      loadCollectionData();
    }
  }, [isAuthorized, collectionId]);

  const loadCollectionData = async () => {
    setLoading(true);
    try {
      const collectionData = bondingCurveCollectionManager.getCollection(collectionId);
      const history = bondingCurveCollectionManager.getMintHistory(collectionId);
      
      setCollection(collectionData);
      setMintHistory(history);
      
      if (collectionData) {
        // Calculate reveal progress
        const totalRaised = collectionData.collection.currentSupply * 4200.69; // Estimated
        const progress = Math.min((totalRaised / collectionData.collection.revealThreshold) * 100, 100);
        setRevealProgress(progress);
      }
    } catch (error) {
      console.error('❌ Error loading collection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualReveal = async () => {
    if (!confirm('🎉 MANUAL REVEAL: This will reveal all NFTs in the collection. Are you sure?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await bondingCurveCollectionManager.forceReveal(collectionId);
      if (success) {
        await loadCollectionData();
        alert('🎉 Manual reveal triggered successfully!');
      } else {
        alert('❌ Failed to trigger manual reveal');
      }
    } catch (error) {
      console.error('❌ Error triggering manual reveal:', error);
      alert('❌ Error triggering manual reveal');
    } finally {
      setLoading(false);
    }
  };

  const updateTokenSetSettings = async (updates: any) => {
    setLoading(true);
    try {
      const success = bondingCurveCollectionManager.updateTokenSet(collectionId, updates);
      if (success) {
        await loadCollectionData();
        alert('✅ Token set settings updated successfully!');
      } else {
        alert('❌ Failed to update token set settings');
      }
    } catch (error) {
      console.error('❌ Error updating token set settings:', error);
      alert('❌ Error updating token set settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-2">🚫 Unauthorized Access</h3>
        <p className="text-red-300">You don't have permission to access bonding curve reveal controls.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-2">🎯 Bonding Curve Collection Manager</h3>
        <p className="text-gray-400">No bonding curve collection found for this collection.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🎯 Bonding Curve Collection Manager - {collectionName}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reveal')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'reveal' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Reveal
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'metadata' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Metadata
          </button>
          <button
            onClick={() => setActiveTab('tokenSet')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'tokenSet' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Token Set
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Collection Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{collection.collection.currentSupply}</div>
              <div className="text-sm text-gray-400">Minted</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{collection.collection.totalSupply}</div>
              <div className="text-sm text-gray-400">Total Supply</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {collection.status.revealTriggered ? 'YES' : 'NO'}
              </div>
              <div className="text-sm text-gray-400">Revealed</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {revealProgress.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Progress</div>
            </div>
          </div>

          {/* Bonding Curve Status */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium text-lg mb-3">Bonding Curve Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${collection.status.bondingCurveActive ? 'text-green-400' : 'text-red-400'}`}>
                  {collection.status.bondingCurveActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonding Cap:</span>
                <span className="text-white font-medium">{collection.bondingCurve.bondingCap.toLocaleString()} $LOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reveal Threshold:</span>
                <span className="text-white font-medium">{collection.collection.revealThreshold.toLocaleString()} $LOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reveal Method:</span>
                <span className="text-white font-medium capitalize">{collection.reveal.revealMethod}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to Reveal</span>
                <span>{revealProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${revealProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Recent Mint History */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium text-lg mb-3">Recent Mint History</h4>
            <div className="space-y-2">
              {mintHistory.slice(-5).map((mint, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <div>
                    <span className="text-white font-medium">Token #{mint.tokenId}</span>
                    <span className="text-gray-400 text-sm ml-2">{mint.price?.toFixed(2)} $LOS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-sm">✅</span>
                    <span className="text-gray-400 text-xs">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {mintHistory.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p>No mint history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reveal' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Reveal Management</h4>
          
          {/* Reveal Status */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-white font-medium">Reveal Status</h5>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                collection.status.revealTriggered 
                  ? 'bg-green-600 text-white' 
                  : 'bg-yellow-600 text-white'
              }`}>
                {collection.status.revealTriggered ? 'REVEALED' : 'PENDING'}
              </span>
            </div>

            {collection.status.revealTriggered ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Revealed At:</span>
                  <span className="text-white">{collection.status.revealDate?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reveal Images:</span>
                  <span className="text-white">{collection.reveal.revealImages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reveal Metadata:</span>
                  <span className="text-white">{collection.reveal.revealMetadata.length}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress to Auto-Reveal:</span>
                  <span className="text-white">{revealProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${revealProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-400">
                  Auto-reveal will trigger when bonding cap is reached or after {collection.collection.maxRevealDelay} days.
                </div>
              </div>
            )}
          </div>

          {/* Manual Reveal Controls */}
          {!collection.status.revealTriggered && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h5 className="text-yellow-400 font-medium mb-3">🚨 Manual Reveal Controls</h5>
              <p className="text-yellow-300 text-sm mb-4">
                You can manually trigger the reveal before the bonding cap is reached. 
                This will reveal all NFTs and update their metadata.
              </p>
              <button
                onClick={triggerManualReveal}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Triggering...' : '🎉 Trigger Manual Reveal'}
              </button>
            </div>
          )}

          {/* Reveal Data Preview */}
          {collection.status.revealTriggered && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h5 className="text-white font-medium mb-3">Reveal Data</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="text-gray-400 text-sm mb-2">Sample Revealed Images:</h6>
                  <div className="space-y-2">
                    {collection.reveal.revealImages.slice(0, 3).map((image, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <img src={image} alt={`Revealed ${index + 1}`} className="w-8 h-8 rounded" />
                        <span className="text-white text-sm">Token #{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h6 className="text-gray-400 text-sm mb-2">Sample Metadata:</h6>
                  <div className="space-y-2">
                    {collection.reveal.revealMetadata.slice(0, 3).map((metadata, index) => (
                      <div key={index} className="text-white text-sm">
                        <div className="font-medium">{metadata.name}</div>
                        <div className="text-gray-400 text-xs">
                          {metadata.attributes.length} attributes
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Metadata Management</h4>
          
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Current Metadata Configuration</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Base URI</label>
                <input
                  type="text"
                  value={collection.collection.metadataBaseUri}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Arweave URI</label>
                <input
                  type="text"
                  value={collection.collection.arweaveUri || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Placeholder Image</label>
                <input
                  type="text"
                  value={collection.reveal.placeholderImage}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Metadata Update Status</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Tokens:</span>
                <span className="text-white">{collection.collection.totalSupply}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minted Tokens:</span>
                <span className="text-white">{collection.collection.currentSupply}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Metadata Updated:</span>
                <span className={`font-medium ${collection.status.revealTriggered ? 'text-green-400' : 'text-yellow-400'}`}>
                  {collection.status.revealTriggered ? 'YES' : 'PENDING REVEAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tokenSet' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Token Set Management</h4>
          
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Token Set Configuration</h5>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Controlled Collection:</span>
                <span className={`font-medium ${collection.tokenSet.isControlled ? 'text-green-400' : 'text-red-400'}`}>
                  {collection.tokenSet.isControlled ? 'YES' : 'NO'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Set ID</label>
                <input
                  type="text"
                  value={collection.tokenSet.tokenSetId || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Permissions</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Can Update Metadata:</span>
                <span className={`font-medium ${collection.tokenSet.canUpdateMetadata ? 'text-green-400' : 'text-red-400'}`}>
                  {collection.tokenSet.canUpdateMetadata ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Can Reveal:</span>
                <span className={`font-medium ${collection.tokenSet.canReveal ? 'text-green-400' : 'text-red-400'}`}>
                  {collection.tokenSet.canReveal ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Can Burn:</span>
                <span className={`font-medium ${collection.tokenSet.canBurn ? 'text-green-400' : 'text-red-400'}`}>
                  {collection.tokenSet.canBurn ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3">Token Set Actions</h5>
            <div className="space-y-3">
              <button
                onClick={() => updateTokenSetSettings({ canUpdateMetadata: !collection.tokenSet.canUpdateMetadata })}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Toggle Metadata Updates
              </button>
              <button
                onClick={() => updateTokenSetSettings({ canReveal: !collection.tokenSet.canReveal })}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Toggle Reveal Permission
              </button>
              <button
                onClick={() => updateTokenSetSettings({ canBurn: !collection.tokenSet.canBurn })}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Toggle Burn Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
