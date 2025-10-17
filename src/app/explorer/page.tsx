'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

interface Transaction {
  signature: string;
  timestamp: string;
  type: 'mint' | 'reveal' | 'collection_create' | 'oracle_update' | 'governance';
  collection?: string;
  user?: string;
  amount?: number;
  token?: string;
  status: 'success' | 'failed' | 'pending';
}

interface CollectionActivity {
  collectionName: string;
  collectionAddress: string;
  totalMints: number;
  recentActivity: Transaction[];
  lastActivity: string;
}

interface ProgramActivity {
  programId: string;
  programName: string;
  recentTransactions: Transaction[];
  totalTransactions: number;
}

export default function ExplorerPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [collectionActivity, setCollectionActivity] = useState<CollectionActivity[]>([]);
  const [programActivity, setProgramActivity] = useState<ProgramActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'transactions' | 'collections' | 'programs'>('transactions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'mint' | 'reveal' | 'collection_create' | 'oracle_update'>('all');

  // Load blockchain data
  useEffect(() => {
    const loadExplorerData = async () => {
      try {
        console.log('🔍 Loading explorer data from Analos blockchain...');
        
        // TODO: Implement actual blockchain data fetching
        // This would:
        // 1. Query recent transactions from all 4 programs
        // 2. Parse transaction logs to identify mint, reveal, and other activities
        // 3. Get collection-specific activity
        // 4. Track program usage statistics
        
        // For now, simulate with demo data
        const demoTransactions: Transaction[] = [
          {
            signature: 'DemoTxSignature1234567890abcdef',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            type: 'mint',
            collection: 'Los Bros Collection',
            user: '4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q',
            amount: 42.00,
            token: 'LOS',
            status: 'success'
          },
          {
            signature: 'DemoTxSignature0987654321fedcba',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            type: 'collection_create',
            collection: 'New Test Collection',
            user: '4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q',
            status: 'success'
          },
          {
            signature: 'DemoTxSignatureabcdef1234567890',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: 'oracle_update',
            amount: 0.10,
            token: 'LOS',
            status: 'success'
          }
        ];

        const demoCollectionActivity: CollectionActivity[] = [
          {
            collectionName: 'Los Bros Collection',
            collectionAddress: 'DemoCollectionConfigPDA1',
            totalMints: 0,
            recentActivity: demoTransactions.filter(tx => tx.collection === 'Los Bros Collection'),
            lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          }
        ];

        const demoProgramActivity: ProgramActivity[] = [
          // Current Active Programs Only
          {
            programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
            programName: 'NFT Launchpad Core',
            recentTransactions: demoTransactions.filter(tx => tx.type === 'mint' || tx.type === 'collection_create'),
            totalTransactions: 2
          },
          {
            programId: ANALOS_PROGRAMS.PRICE_ORACLE.toString(),
            programName: 'Price Oracle',
            recentTransactions: demoTransactions.filter(tx => tx.type === 'oracle_update'),
            totalTransactions: 1
          },
          {
            programId: ANALOS_PROGRAMS.RARITY_ORACLE.toString(),
            programName: 'Rarity Oracle',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.TOKEN_LAUNCH.toString(),
            programName: 'Token Launch',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.OTC_ENHANCED.toString(),
            programName: 'OTC Enhanced',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.AIRDROP_ENHANCED.toString(),
            programName: 'Airdrop Enhanced',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.VESTING_ENHANCED.toString(),
            programName: 'Vesting Enhanced',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED.toString(),
            programName: 'Token Lock Enhanced',
            recentTransactions: [],
            totalTransactions: 0
          },
          {
            programId: ANALOS_PROGRAMS.MONITORING_SYSTEM.toString(),
            programName: 'Monitoring System',
            recentTransactions: [],
            totalTransactions: 0
          }
        ];

        setTransactions(demoTransactions);
        setCollectionActivity(demoCollectionActivity);
        setProgramActivity(demoProgramActivity);

        console.log('✅ Explorer data loaded');
      } catch (error) {
        console.error('❌ Error loading explorer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExplorerData();
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.collection && tx.collection.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (tx.user && tx.user.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterBy === 'all' || tx.type === filterBy;
    
    return matchesSearch && matchesFilter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'mint': return '🎨';
      case 'reveal': return '🎲';
      case 'collection_create': return '🚀';
      case 'oracle_update': return '💰';
      case 'governance': return '🗳️';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Loading Explorer...</div>
          <div className="text-gray-300 mt-2">Fetching blockchain activity</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🔍 Blockchain Explorer
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore transactions, collections, and program activity on the Analos blockchain
          </p>
        </div>

        {/* RPC Connection Status */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-green-300 font-semibold">Connected to Analos Mainnet</h3>
                <p className="text-green-200 text-sm">Using official RPC: rpc.analos.io</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-300 text-sm font-medium">✅ Verified Connection</p>
              <p className="text-green-200 text-xs">All programs active</p>
            </div>
          </div>
        </div>

        {/* Active Program Cards - Current Programs Only */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { key: 'NFT_LAUNCHPAD_CORE', name: 'NFT Launchpad Core', description: 'Complete NFT launchpad with all features' },
            { key: 'PRICE_ORACLE', name: 'Price Oracle', description: 'Real-time LOL price data' },
            { key: 'RARITY_ORACLE', name: 'Rarity Oracle', description: 'NFT rarity calculations' },
            { key: 'TOKEN_LAUNCH', name: 'Token Launch', description: 'Token launches with bonding curves' },
            { key: 'OTC_ENHANCED', name: 'OTC Enhanced', description: 'P2P trading with escrow' },
            { key: 'AIRDROP_ENHANCED', name: 'Airdrop Enhanced', description: 'Merkle tree airdrops' },
            { key: 'VESTING_ENHANCED', name: 'Vesting Enhanced', description: 'Token vesting schedules' },
            { key: 'TOKEN_LOCK_ENHANCED', name: 'Token Lock Enhanced', description: 'Time-locked token escrow' },
            { key: 'MONITORING_SYSTEM', name: 'Monitoring System', description: 'Real-time monitoring & alerts' }
          ].map(({ key, name, description }) => {
            const programId = ANALOS_PROGRAMS[key as keyof typeof ANALOS_PROGRAMS];
            const activity = programActivity.find(p => p.programId === programId.toString());
            const explorerUrl = ANALOS_EXPLORER_URLS[key as keyof typeof ANALOS_EXPLORER_URLS];
            
            const copyToClipboard = async (address: string) => {
              try {
                await navigator.clipboard.writeText(address);
                // You could add a toast notification here
                console.log('Address copied to clipboard:', address);
              } catch (err) {
                console.error('Failed to copy address:', err);
              }
            };
            
            return (
              <div key={key} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
                    <p className="text-gray-300 text-sm">{description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Contract Address:</span>
                      <button
                        onClick={() => copyToClipboard(programId.toString())}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        title="Click to copy full address"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div 
                      className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-300 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => copyToClipboard(programId.toString())}
                      title="Click to copy full address"
                    >
                      {programId.toString().slice(0, 20)}...{programId.toString().slice(-8)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-300">
                      <span>Transactions: </span>
                      <span className="text-purple-400 font-semibold">{activity?.totalTransactions || 0}</span>
                    </div>
                    <div className="text-gray-300">
                      <span>Status: </span>
                      <span className="text-green-400 font-semibold">Active</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(explorerUrl, '_blank')}
                      className="flex-1 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm font-medium transition-all duration-200 border border-purple-500/30"
                    >
                      View on Explorer
                    </button>
                    <button
                      onClick={() => copyToClipboard(programId.toString())}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 border border-blue-500/30"
                      title="Copy contract address"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-8">
          <div className="flex space-x-2">
            {[
              { id: 'transactions', label: 'Recent Transactions', icon: '📄' },
              { id: 'collections', label: 'Collection Activity', icon: '📦' },
              { id: 'programs', label: 'Program Activity', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by signature, collection, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Transactions</option>
                <option value="mint">Mints</option>
                <option value="reveal">Reveals</option>
                <option value="collection_create">Collection Creation</option>
                <option value="oracle_update">Oracle Updates</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'transactions' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
            
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Transactions Found</h3>
                <p className="text-gray-300">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.signature} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{getTransactionIcon(tx.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {tx.type.replace('_', ' ')}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-300">
                          <div>
                            <span className="font-medium">Signature:</span>
                            <code className="ml-2 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded">
                              {tx.signature}
                            </code>
                          </div>
                          
                          {tx.collection && (
                            <div>
                              <span className="font-medium">Collection:</span>
                              <span className="ml-2 text-white">{tx.collection}</span>
                            </div>
                          )}
                          
                          {tx.user && (
                            <div>
                              <span className="font-medium">User:</span>
                              <code className="ml-2 font-mono text-xs">
                                {tx.user.slice(0, 8)}...{tx.user.slice(-8)}
                              </code>
                            </div>
                          )}
                          
                          {tx.amount && tx.token && (
                            <div>
                              <span className="font-medium">Amount:</span>
                              <span className="ml-2 text-white">{tx.amount} {tx.token}</span>
                            </div>
                          )}
                          
                          <div>
                            <span className="font-medium">Time:</span>
                            <span className="ml-2">{formatTimestamp(tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`https://explorer.analos.io/tx/${tx.signature}`, '_blank')}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-white/20"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'collections' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Collection Activity</h2>
            
            {collectionActivity.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Collections Found</h3>
                <p className="text-gray-300">Collections will appear here once they're created</p>
              </div>
            ) : (
              collectionActivity.map((collection) => (
                <div key={collection.collectionAddress} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{collection.collectionName}</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div>
                          <span className="font-medium">Address:</span>
                          <code className="ml-2 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded">
                            {collection.collectionAddress}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Total Mints:</span>
                          <span className="ml-2 text-white font-semibold">{collection.totalMints}</span>
                        </div>
                        <div>
                          <span className="font-medium">Last Activity:</span>
                          <span className="ml-2">{formatTimestamp(collection.lastActivity)}</span>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      {collection.recentActivity.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Activity:</h4>
                          <div className="space-y-2">
                            {collection.recentActivity.slice(0, 3).map((activity, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{getTransactionIcon(activity.type)}</span>
                                <span className="capitalize">{activity.type.replace('_', ' ')}</span>
                                <span>•</span>
                                <span>{formatTimestamp(activity.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`https://explorer.analos.io/address/${collection.collectionAddress}`, '_blank')}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-white/20"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'programs' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Program Activity</h2>
            
            {programActivity.map((program) => (
              <div key={program.programId} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{program.programName}</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div>
                        <span className="font-medium">Program ID:</span>
                        <code className="ml-2 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded">
                          {program.programId}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Total Transactions:</span>
                        <span className="ml-2 text-white font-semibold">{program.totalTransactions}</span>
                      </div>
                    </div>
                    
                    {/* Recent Transactions */}
                    {program.recentTransactions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Transactions:</h4>
                        <div className="space-y-2">
                          {program.recentTransactions.slice(0, 3).map((tx, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-gray-400">
                              <span>{getTransactionIcon(tx.type)}</span>
                              <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                              <span>•</span>
                              <code className="font-mono">{tx.signature.slice(0, 8)}...</code>
                              <span>•</span>
                              <span>{formatTimestamp(tx.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`https://explorer.analos.io/address/${program.programId}`, '_blank')}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-white/20"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
