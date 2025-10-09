'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

interface RevealableNFT {
  id: string;
  mintAddress: string;
  tokenId: number;
  ownerAddress: string;
  mintTime: number;
  currentMetadata: NFTMetadata;
  placeholderImage: string;
  isRevealed: boolean;
  revealTime?: number;
}

interface CollectionRevealConfig {
  collectionId: string;
  collectionName: string;
  totalSupply: number;
  revealedCount: number;
  revealTrigger: 'date' | 'supply' | 'manual';
  revealDate?: Date;
  triggerSupply?: number;
  placeholderImage: string;
  revealMessage: string;
  isActive: boolean;
}

export default function ManualRevealInterface() {
  const { publicKey, connected } = useWallet();
  
  const [collections, setCollections] = useState<CollectionRevealConfig[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionRevealConfig | null>(null);
  const [revealableNFTs, setRevealableNFTs] = useState<RevealableNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealStatus, setRevealStatus] = useState<string>('');
  const [bulkRevealMode, setBulkRevealMode] = useState(false);
  const [selectedNFTs, setSelectedNFTs] = useState<string[]>([]);

  // Load collections with delayed reveal enabled
  useEffect(() => {
    if (connected && publicKey) {
      loadRevealableCollections();
    }
  }, [connected, publicKey]);

  const loadRevealableCollections = async () => {
    try {
      setLoading(true);
      
      // Fetch collections from localStorage or backend
      const storedCollections = localStorage.getItem('launched_collections');
      if (storedCollections) {
        const collections = JSON.parse(storedCollections);
        const revealableCollections = collections.filter((collection: any) => 
          collection.revealType === 'delayed' && 
          collection.delayedRevealSettings?.revealTrigger === 'manual'
        );
        
        setCollections(revealableCollections.map((collection: any) => ({
          collectionId: collection.id,
          collectionName: collection.name,
          totalSupply: collection.maxSupply,
          revealedCount: collection.revealedCount || 0,
          revealTrigger: collection.delayedRevealSettings?.revealTrigger || 'manual',
          revealDate: collection.delayedRevealSettings?.revealDate ? 
            new Date(collection.delayedRevealSettings.revealDate) : undefined,
          triggerSupply: collection.delayedRevealSettings?.triggerSupply,
          placeholderImage: collection.delayedRevealSettings?.placeholderImage || '',
          revealMessage: collection.delayedRevealSettings?.revealMessage || 'Collection will be revealed soon!',
          isActive: collection.isActive || false
        })));
      }
    } catch (error) {
      console.error('Error loading revealable collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevealableNFTs = async (collectionId: string) => {
    try {
      setLoading(true);
      
      // Fetch NFTs from blockchain or backend
      const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/collections/${collectionId}/nfts`, {
        headers: {
          'x-admin-wallet': publicKey?.toBase58() || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRevealableNFTs(data.nfts.filter((nft: any) => !nft.isRevealed));
        }
      } else {
        // Fallback to mock data for development
        setRevealableNFTs(generateMockNFTs(collectionId));
      }
    } catch (error) {
      console.error('Error loading revealable NFTs:', error);
      // Use mock data as fallback
      setRevealableNFTs(generateMockNFTs(collectionId));
    } finally {
      setLoading(false);
    }
  };

  const generateMockNFTs = (collectionId: string): RevealableNFT[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `nft_${i + 1}`,
      mintAddress: `mint_${collectionId}_${i + 1}`,
      tokenId: i + 1,
      ownerAddress: `owner_${i + 1}`,
      mintTime: Date.now() - (i * 3600000), // 1 hour apart
      currentMetadata: {
        name: `${selectedCollection?.collectionName || 'Collection'} #${i + 1}`,
        description: 'This NFT will be revealed soon!',
        image: selectedCollection?.placeholderImage || '',
        attributes: [
          { trait_type: 'Status', value: 'Unrevealed' },
          { trait_type: 'Collection', value: selectedCollection?.collectionName || 'Unknown' }
        ]
      },
      placeholderImage: selectedCollection?.placeholderImage || '',
      isRevealed: false
    }));
  };

  const updateNFTMetadata = async (nftId: string, newMetadata: Partial<NFTMetadata>) => {
    try {
      setLoading(true);
      setRevealStatus('Updating NFT metadata...');
      
      const nft = revealableNFTs.find(n => n.id === nftId);
      if (!nft) return;
      
      // Update metadata in backend/database
      const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/nfts/${nftId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toBase58() || ''
        },
        body: JSON.stringify({
          metadata: { ...nft.currentMetadata, ...newMetadata },
          collectionId: selectedCollection?.collectionId
        })
      });
      
      if (response.ok) {
        // Update local state
        setRevealableNFTs(prev => prev.map(n => 
          n.id === nftId 
            ? { ...n, currentMetadata: { ...n.currentMetadata, ...newMetadata } }
            : n
        ));
        setRevealStatus('✅ NFT metadata updated successfully!');
      } else {
        setRevealStatus('❌ Failed to update NFT metadata');
      }
    } catch (error) {
      console.error('Error updating NFT metadata:', error);
      setRevealStatus('❌ Error updating NFT metadata');
    } finally {
      setLoading(false);
    }
  };

  const revealNFT = async (nftId: string) => {
    try {
      setLoading(true);
      setRevealStatus('Revealing NFT...');
      
      const nft = revealableNFTs.find(n => n.id === nftId);
      if (!nft) return;
      
      // Call reveal endpoint
      const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/nfts/${nftId}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toBase58() || ''
        },
        body: JSON.stringify({
          collectionId: selectedCollection?.collectionId,
          revealTime: Date.now()
        })
      });
      
      if (response.ok) {
        // Update local state
        setRevealableNFTs(prev => prev.filter(n => n.id !== nftId));
        setRevealStatus('✅ NFT revealed successfully!');
        
        // Update collection revealed count
        if (selectedCollection) {
          setSelectedCollection(prev => prev ? {
            ...prev,
            revealedCount: prev.revealedCount + 1
          } : null);
        }
      } else {
        setRevealStatus('❌ Failed to reveal NFT');
      }
    } catch (error) {
      console.error('Error revealing NFT:', error);
      setRevealStatus('❌ Error revealing NFT');
    } finally {
      setLoading(false);
    }
  };

  const bulkRevealNFTs = async () => {
    if (selectedNFTs.length === 0) return;
    
    try {
      setLoading(true);
      setRevealStatus(`Revealing ${selectedNFTs.length} NFTs...`);
      
      const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/collections/${selectedCollection?.collectionId}/bulk-reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': publicKey?.toBase58() || ''
        },
        body: JSON.stringify({
          nftIds: selectedNFTs,
          revealTime: Date.now()
        })
      });
      
      if (response.ok) {
        // Remove revealed NFTs from list
        setRevealableNFTs(prev => prev.filter(n => !selectedNFTs.includes(n.id)));
        setSelectedNFTs([]);
        setBulkRevealMode(false);
        setRevealStatus(`✅ ${selectedNFTs.length} NFTs revealed successfully!`);
        
        // Update collection revealed count
        if (selectedCollection) {
          setSelectedCollection(prev => prev ? {
            ...prev,
            revealedCount: prev.revealedCount + selectedNFTs.length
          } : null);
        }
      } else {
        setRevealStatus('❌ Failed to reveal NFTs');
      }
    } catch (error) {
      console.error('Error bulk revealing NFTs:', error);
      setRevealStatus('❌ Error revealing NFTs');
    } finally {
      setLoading(false);
    }
  };

  const toggleNFTSelection = (nftId: string) => {
    setSelectedNFTs(prev => 
      prev.includes(nftId) 
        ? prev.filter(id => id !== nftId)
        : [...prev, nftId]
    );
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Required</h2>
          <p className="text-gray-300">Please connect your wallet to access the manual reveal interface.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎭 Manual Reveal Interface</h1>
          <p className="text-gray-300">Manage and reveal your delayed reveal NFTs</p>
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
                    loadRevealableNFTs(collection.collectionId);
                  }}
                >
                  <h3 className="text-white font-semibold mb-2">{collection.collectionName}</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>Total Supply: {collection.totalSupply.toLocaleString()}</p>
                    <p>Revealed: {collection.revealedCount.toLocaleString()}</p>
                    <p>Remaining: {(collection.totalSupply - collection.revealedCount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFT Management */}
        {selectedCollection && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                {selectedCollection.collectionName} - Unrevealed NFTs
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setBulkRevealMode(!bulkRevealMode)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    bulkRevealMode
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                  }`}
                >
                  {bulkRevealMode ? 'Cancel Bulk' : 'Bulk Reveal'}
                </button>
                {bulkRevealMode && selectedNFTs.length > 0 && (
                  <button
                    onClick={bulkRevealNFTs}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg transition-all"
                  >
                    Reveal {selectedNFTs.length} NFTs
                  </button>
                )}
              </div>
            </div>

            {revealStatus && (
              <div className={`mb-4 p-4 rounded-lg ${
                revealStatus.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {revealStatus}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {revealableNFTs.map((nft) => (
                <div key={nft.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  {bulkRevealMode && (
                    <input
                      type="checkbox"
                      checked={selectedNFTs.includes(nft.id)}
                      onChange={() => toggleNFTSelection(nft.id)}
                      className="mb-2"
                    />
                  )}
                  
                  <div className="text-center mb-3">
                    <img
                      src={nft.placeholderImage || '/placeholder-nft.png'}
                      alt={nft.currentMetadata.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <h3 className="text-white font-semibold text-sm">{nft.currentMetadata.name}</h3>
                    <p className="text-gray-400 text-xs">Token ID: {nft.tokenId}</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => updateNFTMetadata(nft.id, {
                        description: prompt('Enter new description:', nft.currentMetadata.description) || nft.currentMetadata.description
                      })}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-300 text-xs rounded transition-all"
                    >
                      Edit Metadata
                    </button>
                    
                    <button
                      onClick={() => revealNFT(nft.id)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-500/20 text-green-300 text-xs rounded transition-all"
                    >
                      Reveal NFT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {revealableNFTs.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-gray-300">All NFTs have been revealed!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
