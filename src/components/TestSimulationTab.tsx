'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface TestTransaction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  success: boolean;
  data?: any;
  error?: string;
}

interface TestCollection {
  id: string;
  name: string;
  symbol: string;
  maxSupply: number;
  price: number;
  createdAt: number;
  status: 'draft' | 'active' | 'completed';
}

interface TestNFT {
  id: string;
  collectionId: string;
  name: string;
  rarity: string;
  traits: Record<string, string>;
  owner: string;
  mintedAt: number;
}

interface TestStake {
  id: string;
  nftId: string;
  owner: string;
  stakedAt: number;
  rewards: number;
  multiplier: number;
}

const TestSimulationTab: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'collections' | 'nfts' | 'staking' | 'transactions'>('collections');
  const [loading, setLoading] = useState(false);
  
  // Test data state
  const [testCollections, setTestCollections] = useState<TestCollection[]>([]);
  const [testNFTs, setTestNFTs] = useState<TestNFT[]>([]);
  const [testStakes, setTestStakes] = useState<TestStake[]>([]);
  const [testTransactions, setTestTransactions] = useState<TestTransaction[]>([]);
  
  // Form states
  const [newCollection, setNewCollection] = useState({
    name: '',
    symbol: '',
    maxSupply: 1000,
    price: 1.0,
  });
  
  const [newNFT, setNewNFT] = useState({
    collectionId: '',
    name: '',
    rarity: 'common',
    traits: {} as Record<string, string>,
  });

  // Load test data from localStorage on mount
  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = () => {
    try {
      const collections = localStorage.getItem('test_collections');
      const nfts = localStorage.getItem('test_nfts');
      const stakes = localStorage.getItem('test_stakes');
      const transactions = localStorage.getItem('test_transactions');

      if (collections) setTestCollections(JSON.parse(collections));
      if (nfts) setTestNFTs(JSON.parse(nfts));
      if (stakes) setTestStakes(JSON.parse(stakes));
      if (transactions) setTestTransactions(JSON.parse(transactions));
    } catch (error) {
      console.error('Failed to load test data:', error);
    }
  };

  const saveTestData = () => {
    try {
      localStorage.setItem('test_collections', JSON.stringify(testCollections));
      localStorage.setItem('test_nfts', JSON.stringify(testNFTs));
      localStorage.setItem('test_stakes', JSON.stringify(testStakes));
      localStorage.setItem('test_transactions', JSON.stringify(testTransactions));
    } catch (error) {
      console.error('Failed to save test data:', error);
    }
  };

  const addTestTransaction = (type: string, description: string, success: boolean, data?: any, error?: string) => {
    const transaction: TestTransaction = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: Date.now(),
      success,
      data,
      error,
    };
    
    setTestTransactions(prev => [transaction, ...prev.slice(0, 49)]); // Keep last 50 transactions
  };

  const createTestCollection = async () => {
    if (!newCollection.name || !newCollection.symbol) {
      alert('Please fill in collection name and symbol');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const collection: TestCollection = {
        id: `test_collection_${Date.now()}`,
        name: newCollection.name,
        symbol: newCollection.symbol,
        maxSupply: newCollection.maxSupply,
        price: newCollection.price,
        createdAt: Date.now(),
        status: 'draft',
      };
      
      setTestCollections(prev => [collection, ...prev]);
      setNewCollection({ name: '', symbol: '', maxSupply: 1000, price: 1.0 });
      
      addTestTransaction(
        'create_collection',
        `Created test collection "${collection.name}"`,
        true,
        collection
      );
      
      alert('✅ Test collection created successfully!');
      
    } catch (error) {
      addTestTransaction(
        'create_collection',
        `Failed to create test collection "${newCollection.name}"`,
        false,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      alert('❌ Failed to create test collection');
    } finally {
      setLoading(false);
    }
  };

  const activateTestCollection = async (collectionId: string) => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTestCollections(prev => 
        prev.map(col => 
          col.id === collectionId ? { ...col, status: 'active' as const } : col
        )
      );
      
      const collection = testCollections.find(c => c.id === collectionId);
      addTestTransaction(
        'activate_collection',
        `Activated test collection "${collection?.name}"`,
        true,
        { collectionId }
      );
      
      alert('✅ Test collection activated!');
      
    } catch (error) {
      addTestTransaction(
        'activate_collection',
        `Failed to activate test collection`,
        false,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      alert('❌ Failed to activate test collection');
    } finally {
      setLoading(false);
    }
  };

  const mintTestNFT = async (collectionId: string) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const collection = testCollections.find(c => c.id === collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      const nft: TestNFT = {
        id: `test_nft_${Date.now()}`,
        collectionId,
        name: `${collection.name} #${testNFTs.filter(n => n.collectionId === collectionId).length + 1}`,
        rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)],
        traits: {
          background: ['blue', 'red', 'green', 'purple', 'gold'][Math.floor(Math.random() * 5)],
          eyes: ['normal', 'laser', 'glowing', 'rainbow'][Math.floor(Math.random() * 4)],
          mouth: ['smile', 'frown', 'surprised', 'angry'][Math.floor(Math.random() * 4)],
        },
        owner: publicKey.toString(),
        mintedAt: Date.now(),
      };
      
      setTestNFTs(prev => [nft, ...prev]);
      
      addTestTransaction(
        'mint_nft',
        `Minted test NFT "${nft.name}"`,
        true,
        nft
      );
      
      alert(`✅ Minted test NFT: ${nft.name} (${nft.rarity})`);
      
    } catch (error) {
      addTestTransaction(
        'mint_nft',
        `Failed to mint test NFT`,
        false,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      alert('❌ Failed to mint test NFT');
    } finally {
      setLoading(false);
    }
  };

  const stakeTestNFT = async (nftId: string) => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const nft = testNFTs.find(n => n.id === nftId);
      if (!nft) {
        throw new Error('NFT not found');
      }
      
      const stake: TestStake = {
        id: `test_stake_${Date.now()}`,
        nftId,
        owner: publicKey.toString(),
        stakedAt: Date.now(),
        rewards: 0,
        multiplier: nft.rarity === 'legendary' ? 5 : nft.rarity === 'epic' ? 3 : nft.rarity === 'rare' ? 2 : 1,
      };
      
      setTestStakes(prev => [stake, ...prev]);
      
      addTestTransaction(
        'stake_nft',
        `Staked test NFT "${nft.name}" (${nft.rarity} - ${stake.multiplier}x multiplier)`,
        true,
        stake
      );
      
      alert(`✅ Staked test NFT: ${nft.name} (${stake.multiplier}x multiplier)`);
      
    } catch (error) {
      addTestTransaction(
        'stake_nft',
        `Failed to stake test NFT`,
        false,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      alert('❌ Failed to stake test NFT');
    } finally {
      setLoading(false);
    }
  };

  const clearAllTestData = () => {
    if (!confirm('Are you sure you want to clear all test data? This cannot be undone.')) {
      return;
    }
    
    setTestCollections([]);
    setTestNFTs([]);
    setTestStakes([]);
    setTestTransactions([]);
    
    localStorage.removeItem('test_collections');
    localStorage.removeItem('test_nfts');
    localStorage.removeItem('test_stakes');
    localStorage.removeItem('test_transactions');
    
    alert('🧹 All test data cleared!');
  };

  // Save data whenever it changes
  useEffect(() => {
    saveTestData();
  }, [testCollections, testNFTs, testStakes, testTransactions]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🧪 Test & Simulation Environment</h1>
        <p className="text-yellow-100">
          Test all platform features without affecting the live blockchain. 
          All data is stored locally in your browser.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-yellow-400 text-2xl">⚠️</div>
          <div>
            <h3 className="text-yellow-200 font-semibold">Test Mode Active</h3>
            <p className="text-yellow-300 text-sm">
              This is a simulation environment. All actions are local and won't affect the live blockchain.
              Use this to test features before using the real platform.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'collections', name: 'Collections', icon: '📚', count: testCollections.length },
              { id: 'nfts', name: 'NFTs', icon: '🎨', count: testNFTs.length },
              { id: 'staking', name: 'Staking', icon: '🪙', count: testStakes.length },
              { id: 'transactions', name: 'Transactions', icon: '📋', count: testTransactions.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'collections' && (
            <div className="space-y-6">
              {/* Create Collection Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                    <input
                      type="text"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="My Test Collection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={newCollection.symbol}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="MTC"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
                    <input
                      type="number"
                      value={newCollection.maxSupply}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 1000 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (LOS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newCollection.price}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, price: parseFloat(e.target.value) || 1.0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0.01"
                    />
                  </div>
                </div>
                <button
                  onClick={createTestCollection}
                  disabled={loading}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Test Collection'}
                </button>
              </div>

              {/* Collections List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Collections ({testCollections.length})</h3>
                {testCollections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No test collections created yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testCollections.map((collection) => (
                      <div key={collection.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            collection.status === 'active' ? 'bg-green-100 text-green-800' :
                            collection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {collection.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Symbol: {collection.symbol}</p>
                        <p className="text-sm text-gray-600 mb-2">Max Supply: {collection.maxSupply}</p>
                        <p className="text-sm text-gray-600 mb-4">Price: {collection.price} LOS</p>
                        <div className="flex space-x-2">
                          {collection.status === 'draft' && (
                            <button
                              onClick={() => activateTestCollection(collection.id)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          {collection.status === 'active' && (
                            <button
                              onClick={() => mintTestNFT(collection.id)}
                              disabled={loading}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Mint NFT
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'nfts' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Test NFTs ({testNFTs.length})</h3>
              {testNFTs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No test NFTs minted yet</p>
                  <p className="text-sm mt-2">Create and activate a collection first, then mint some NFTs!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testNFTs.map((nft) => {
                    const collection = testCollections.find(c => c.id === nft.collectionId);
                    const isStaked = testStakes.some(s => s.nftId === nft.id);
                    
                    return (
                      <div key={nft.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{nft.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            nft.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                            nft.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                            nft.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                            nft.rarity === 'uncommon' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {nft.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Collection: {collection?.name}</p>
                        <p className="text-sm text-gray-600 mb-2">Owner: {nft.owner.slice(0, 8)}...{nft.owner.slice(-8)}</p>
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Traits:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(nft.traits).map(([key, value]) => (
                              <span key={key} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                        {!isStaked && (
                          <button
                            onClick={() => stakeTestNFT(nft.id)}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Stake NFT
                          </button>
                        )}
                        {isStaked && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                            ✅ Staked
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Staked NFTs ({testStakes.length})</h3>
              {testStakes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No NFTs staked yet</p>
                  <p className="text-sm mt-2">Mint some NFTs and stake them to earn rewards!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testStakes.map((stake) => {
                    const nft = testNFTs.find(n => n.id === stake.nftId);
                    const collection = testCollections.find(c => c.id === nft?.collectionId);
                    
                    return (
                      <div key={stake.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{nft?.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">Collection: {collection?.name}</p>
                        <p className="text-sm text-gray-600 mb-2">Owner: {stake.owner.slice(0, 8)}...{stake.owner.slice(-8)}</p>
                        <p className="text-sm text-gray-600 mb-2">Multiplier: {stake.multiplier}x</p>
                        <p className="text-sm text-gray-600 mb-2">Rewards: {stake.rewards.toFixed(2)} LOS</p>
                        <p className="text-sm text-gray-500">
                          Staked: {new Date(stake.stakedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Test Transactions ({testTransactions.length})</h3>
                <button
                  onClick={clearAllTestData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Clear All Test Data
                </button>
              </div>
              {testTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No test transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testTransactions.map((tx) => (
                    <div key={tx.id} className={`border rounded-lg p-4 ${
                      tx.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{tx.description}</h4>
                          <p className="text-sm text-gray-600">Type: {tx.type}</p>
                          <p className="text-sm text-gray-600">
                            Time: {new Date(tx.timestamp).toLocaleString()}
                          </p>
                          {tx.error && (
                            <p className="text-sm text-red-600 mt-1">Error: {tx.error}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tx.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.success ? '✅ Success' : '❌ Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 text-xl">ℹ️</div>
          <div>
            <h3 className="text-blue-200 font-semibold">Test Environment Info</h3>
            <div className="text-blue-300 text-sm mt-2 space-y-1">
              <p>• All data is stored locally in your browser</p>
              <p>• No real blockchain transactions are made</p>
              <p>• Perfect for testing features before going live</p>
              <p>• Data persists between browser sessions</p>
              <p>• Use "Clear All Test Data" to reset everything</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSimulationTab;
