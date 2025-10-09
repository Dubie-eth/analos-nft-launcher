'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { blockchainFirstNFTService, CollectionOnChainData } from '@/lib/blockchain-first-nft-service';

export default function BlockchainFirstAdmin() {
  const { publicKey, connected } = useWallet();
  const [collections, setCollections] = useState<CollectionOnChainData[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebuildResults, setRebuildResults] = useState<any>(null);
  const [newCollection, setNewCollection] = useState<Partial<CollectionOnChainData>>({
    collectionName: '',
    totalSupply: 0,
    currentSupply: 0,
    mintPrice: 0,
    paymentToken: 'LOS',
    creatorWallet: '',
    isActive: true,
    mintingEnabled: true,
    phases: [],
    deployedAt: Date.now()
  });

  useEffect(() => {
    if (connected) {
      loadCollections();
    }
  }, [connected]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const result = await blockchainFirstNFTService.getTrackedCollections();
      if (result.success && result.collections) {
        setCollections(result.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeLosBrosCollection = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const result = await blockchainFirstNFTService.initializeLosBrosCollection(publicKey.toString());
      
      if (result.success) {
        console.log('✅ Los Bros collection initialized:', result.message);
        await loadCollections(); // Refresh the list
      } else {
        console.error('❌ Failed to initialize Los Bros collection:', result.error);
      }
    } catch (error) {
      console.error('Error initializing Los Bros collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewCollection = async () => {
    if (!newCollection.collectionName || !newCollection.creatorWallet) {
      alert('Please fill in collection name and creator wallet');
      return;
    }

    try {
      setLoading(true);
      const result = await blockchainFirstNFTService.addCollection(newCollection as CollectionOnChainData);
      
      if (result.success) {
        console.log('✅ Collection added:', result.message);
        setNewCollection({
          collectionName: '',
          totalSupply: 0,
          currentSupply: 0,
          mintPrice: 0,
          paymentToken: 'LOS',
          creatorWallet: publicKey?.toString() || '',
          isActive: true,
          mintingEnabled: true,
          phases: [],
          deployedAt: Date.now()
        });
        await loadCollections(); // Refresh the list
      } else {
        console.error('❌ Failed to add collection:', result.error);
      }
    } catch (error) {
      console.error('Error adding collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const rebuildDatabaseFromBlockchain = async () => {
    try {
      setLoading(true);
      const result = await blockchainFirstNFTService.rebuildDatabaseFromBlockchain();
      
      if (result.success) {
        console.log('✅ Database rebuilt from blockchain:', result.stats);
        setRebuildResults(result);
        await loadCollections(); // Refresh the list
      } else {
        console.error('❌ Failed to rebuild database:', result.error);
      }
    } catch (error) {
      console.error('Error rebuilding database:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanCollection = async (mintAddress: string) => {
    try {
      const result = await blockchainFirstNFTService.scanCollectionForNFTs(mintAddress);
      
      if (result.success) {
        console.log(`✅ Scanned collection ${mintAddress}: Found ${result.count} NFTs`);
        alert(`Found ${result.count} NFTs in collection ${mintAddress}`);
      } else {
        console.error('❌ Failed to scan collection:', result.error);
      }
    } catch (error) {
      console.error('Error scanning collection:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">🔗 Blockchain-First NFT System</h1>
        
        <div className="text-green-400 bg-green-400/10 border border-green-400/30 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">✅ Blockchain-First Architecture</h2>
          <p className="text-sm">
            This system stores all NFT data directly on the blockchain in metadata. 
            If our servers go down, we can always rebuild the entire database by scanning the blockchain.
            No more data loss from cache clearing or server issues!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={initializeLosBrosCollection}
              disabled={loading || !connected}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? 'Initializing...' : '🏗️ Initialize Los Bros Collection'}
            </button>

            <button
              onClick={rebuildDatabaseFromBlockchain}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? 'Rebuilding...' : '🔍 Rebuild from Blockchain'}
            </button>

            <button
              onClick={loadCollections}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {loading ? 'Loading...' : '📊 Refresh Collections'}
            </button>
          </div>
        </div>

        {/* Add New Collection */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add New Collection</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name</label>
              <input
                type="text"
                value={newCollection.collectionName}
                onChange={(e) => setNewCollection({ ...newCollection, collectionName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter collection name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Creator Wallet</label>
              <input
                type="text"
                value={newCollection.creatorWallet}
                onChange={(e) => setNewCollection({ ...newCollection, creatorWallet: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter creator wallet address..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Total Supply</label>
              <input
                type="number"
                value={newCollection.totalSupply}
                onChange={(e) => setNewCollection({ ...newCollection, totalSupply: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter total supply..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mint Price</label>
              <input
                type="number"
                step="0.01"
                value={newCollection.mintPrice}
                onChange={(e) => setNewCollection({ ...newCollection, mintPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter mint price..."
              />
            </div>
          </div>

          <button
            onClick={addNewCollection}
            disabled={loading || !newCollection.collectionName || !newCollection.creatorWallet}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
          >
            {loading ? 'Adding...' : 'Add Collection'}
          </button>
        </div>

        {/* Tracked Collections */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tracked Collections ({collections.length})</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No collections tracked yet. Initialize Los Bros or add a new collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white font-semibold">{collection.collectionName}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        collection.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {collection.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        collection.mintingEnabled ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {collection.mintingEnabled ? 'Minting' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <div>Supply: {collection.totalSupply.toLocaleString()}</div>
                    <div>Current: {collection.currentSupply.toLocaleString()}</div>
                    <div>Price: {collection.mintPrice} {collection.paymentToken}</div>
                    <div>Creator: {collection.creatorWallet.slice(0, 8)}...</div>
                    <div>Phases: {collection.phases.length}</div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => scanCollection(collection.collectionName)}
                      className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded transition-all"
                    >
                      Scan for NFTs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rebuild Results */}
        {rebuildResults && (
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Database Rebuild Results</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{rebuildResults.stats?.totalNFTs || 0}</div>
                <div className="text-sm text-gray-300">Total NFTs Found</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{rebuildResults.stats?.totalCollections || 0}</div>
                <div className="text-sm text-gray-300">Collections Found</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{rebuildResults.stats?.totalUsers || 0}</div>
                <div className="text-sm text-gray-300">Unique Users</div>
              </div>
            </div>

            {rebuildResults.stats?.errors && rebuildResults.stats.errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Errors Encountered:</h3>
                <ul className="text-red-300 text-sm space-y-1">
                  {rebuildResults.stats.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
