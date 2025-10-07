'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  metadataManagementService, 
  MetadataState, 
  CollectionMetadataConfig,
  NFTMetadata 
} from '../../lib/metadata-management-service';

export default function MetadataManagementDashboard() {
  const { publicKey, connected } = useWallet();
  
  const [collections, setCollections] = useState<CollectionMetadataConfig[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionMetadataConfig | null>(null);
  const [nftStates, setNftStates] = useState<MetadataState[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'unrevealed' | 'revealed' | 'export'>('overview');
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'reveal' | 'update' | 'export'>('update');
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [editingNFT, setEditingNFT] = useState<MetadataState | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      loadCollections();
    }
  }, [connected, publicKey]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      
      // Load collections from localStorage
      const storedCollections = localStorage.getItem('launched_collections');
      if (storedCollections) {
        const collections = JSON.parse(storedCollections);
        const metadataCollections = collections.map((collection: any) => ({
          collectionId: collection.id,
          collectionName: collection.name,
          totalSupply: collection.maxSupply,
          placeholderImage: collection.delayedReveal?.placeholderImage || '',
          placeholderDescription: 'This NFT will be revealed soon!',
          revealMessage: collection.delayedReveal?.revealMessage || 'Collection will be revealed soon!',
          baseMetadata: {
            external_url: collection.externalUrl,
            animation_url: collection.animationUrl,
            background_color: '#000000'
          },
          rarityConfig: {
            common: { min: 1, max: 40, weight: 0.4 },
            uncommon: { min: 41, max: 70, weight: 0.25 },
            rare: { min: 71, max: 85, weight: 0.15 },
            epic: { min: 86, max: 95, weight: 0.15 },
            legendary: { min: 96, max: 100, weight: 0.05 }
          }
        }));
        
        setCollections(metadataCollections);
        
        // Initialize collections in metadata service
        metadataCollections.forEach((config: CollectionMetadataConfig) => {
          metadataManagementService.initializeCollection(config);
        });
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionNFTs = (collectionId: string) => {
    const nfts = metadataManagementService.getCollectionNFTs(collectionId);
    setNftStates(nfts);
  };

  const updateNFTMetadata = (mintAddress: string, updates: Partial<NFTMetadata>) => {
    try {
      metadataManagementService.updatePreRevealMetadata(mintAddress, updates);
      loadCollectionNFTs(selectedCollection!.collectionId);
    } catch (error) {
      console.error('Error updating NFT metadata:', error);
    }
  };

  const toggleNFTSelection = (mintAddress: string) => {
    setSelectedNFTs(prev => 
      prev.includes(mintAddress) 
        ? prev.filter(addr => addr !== mintAddress)
        : [...prev, mintAddress]
    );
  };

  const selectAllNFTs = () => {
    const allMintAddresses = nftStates.map(nft => nft.mintAddress);
    setSelectedNFTs(allMintAddresses);
  };

  const clearSelection = () => {
    setSelectedNFTs([]);
  };

  const exportMetadata = () => {
    if (!selectedCollection) return;
    
    const exportData = metadataManagementService.exportCollectionMetadata(selectedCollection.collectionId);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCollection.collectionName}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredNFTs = () => {
    switch (activeTab) {
      case 'unrevealed':
        return nftStates.filter(nft => !nft.isRevealed);
      case 'revealed':
        return nftStates.filter(nft => nft.isRevealed);
      default:
        return nftStates;
    }
  };

  const getCollectionStats = () => {
    if (!selectedCollection) return null;
    return metadataManagementService.getCollectionStats(selectedCollection.collectionId);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Required</h2>
          <p className="text-gray-300">Please connect your wallet to access the metadata management dashboard.</p>
        </div>
      </div>
    );
  }

  const stats = getCollectionStats();
  const filteredNFTs = getFilteredNFTs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Metadata Management</h1>
          <p className="text-gray-300">Manage NFT metadata for pre and post reveal states</p>
        </div>

        {/* Collection Selection */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Collection</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading collections...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <div
                  key={collection.collectionId}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCollection?.collectionId === collection.collectionId
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => {
                    setSelectedCollection(collection);
                    loadCollectionNFTs(collection.collectionId);
                  }}
                >
                  <h3 className="text-white font-semibold mb-2">{collection.collectionName}</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Total Supply: {collection.totalSupply.toLocaleString()}</p>
                    <p>NFTs: {metadataManagementService.getCollectionNFTs(collection.collectionId).length}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collection Stats */}
        {selectedCollection && stats && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Collection Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-300">{stats.total}</div>
                <div className="text-sm text-blue-200">Total NFTs</div>
              </div>
              <div className="bg-green-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-300">{stats.revealed}</div>
                <div className="text-sm text-green-200">Revealed</div>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-300">{stats.unrevealed}</div>
                <div className="text-sm text-yellow-200">Unrevealed</div>
              </div>
              <div className="bg-purple-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-300">{stats.averageRarityScore.toFixed(1)}</div>
                <div className="text-sm text-purple-200">Avg Rarity</div>
              </div>
              <div className="bg-red-500/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-300">{stats.topRarity.toFixed(1)}</div>
                <div className="text-sm text-red-200">Top Rarity</div>
              </div>
            </div>
          </div>
        )}

        {/* NFT Management */}
        {selectedCollection && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'overview'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('unrevealed')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'unrevealed'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Unrevealed ({nftStates.filter(n => !n.isRevealed).length})
                </button>
                <button
                  onClick={() => setActiveTab('revealed')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'revealed'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Revealed ({nftStates.filter(n => n.isRevealed).length})
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'export'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Export
                </button>
              </div>
              
              {activeTab !== 'export' && (
                <div className="flex gap-2">
                  <button
                    onClick={selectAllNFTs}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 text-sm rounded transition-all"
                  >
                    Clear
                  </button>
                  {selectedNFTs.length > 0 && (
                    <button
                      onClick={exportMetadata}
                      className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded transition-all"
                    >
                      Export Selected ({selectedNFTs.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNFTs.map((nft) => (
                <div key={nft.mintAddress} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedNFTs.includes(nft.mintAddress)}
                      onChange={() => toggleNFTSelection(nft.mintAddress)}
                      className="mr-2"
                    />
                    <span className={`px-2 py-1 rounded text-xs ${
                      nft.isRevealed 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {nft.isRevealed ? 'Revealed' : 'Unrevealed'}
                    </span>
                  </div>
                  
                  <div className="text-center mb-3">
                    <img
                      src={nft.isRevealed && nft.postRevealMetadata?.image 
                        ? nft.postRevealMetadata.image 
                        : nft.preRevealMetadata.image}
                      alt={nft.preRevealMetadata.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <h3 className="text-white font-semibold text-sm">{nft.preRevealMetadata.name}</h3>
                    <p className="text-gray-400 text-xs">Token ID: {nft.tokenId}</p>
                    {nft.isRevealed && nft.postRevealMetadata && (
                      <div className="text-xs text-purple-300 mt-1">
                        Rarity: {nft.postRevealMetadata.rarityScore.toFixed(1)} (#{nft.postRevealMetadata.rarityRank})
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setEditingNFT(nft);
                        setShowMetadataEditor(true);
                      }}
                      className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-all"
                    >
                      Edit Metadata
                    </button>
                    
                    {!nft.isRevealed && (
                      <button
                        onClick={() => {
                          // This would trigger the reveal process
                          console.log('Reveal NFT:', nft.mintAddress);
                        }}
                        className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded transition-all"
                      >
                        Reveal NFT
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredNFTs.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-300">No NFTs found for this filter.</p>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && selectedCollection && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Export Metadata</h2>
            <div className="space-y-4">
              <button
                onClick={exportMetadata}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
              >
                Export All Metadata
              </button>
              <p className="text-gray-300 text-sm">
                This will download a JSON file containing all metadata for the {selectedCollection.collectionName} collection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Editor Modal */}
      {showMetadataEditor && editingNFT && (
        <MetadataEditorModal
          nft={editingNFT}
          onSave={(updates) => {
            updateNFTMetadata(editingNFT.mintAddress, updates);
            setShowMetadataEditor(false);
            setEditingNFT(null);
          }}
          onClose={() => {
            setShowMetadataEditor(false);
            setEditingNFT(null);
          }}
        />
      )}
    </div>
  );
}

// Metadata Editor Modal Component
function MetadataEditorModal({ 
  nft, 
  onSave, 
  onClose 
}: { 
  nft: MetadataState; 
  onSave: (updates: Partial<NFTMetadata>) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: nft.preRevealMetadata.name,
    description: nft.preRevealMetadata.description,
    external_url: nft.preRevealMetadata.external_url || '',
    animation_url: nft.preRevealMetadata.animation_url || '',
    background_color: nft.preRevealMetadata.background_color || ''
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Metadata</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">External URL</label>
              <input
                type="url"
                value={formData.external_url}
                onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Animation URL</label>
              <input
                type="url"
                value={formData.animation_url}
                onChange={(e) => setFormData(prev => ({ ...prev, animation_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                className="w-full h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
