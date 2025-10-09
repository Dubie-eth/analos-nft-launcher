'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { secureEscrowWalletManager, EscrowWalletConfig, RewardDistribution } from '@/lib/secure-escrow-wallet-manager';

export default function SecureEscrowWalletManager() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'rewards' | 'logs' | 'settings' | 'privatekeys' | 'keyburning'>('overview');
  const [escrowWallets, setEscrowWallets] = useState<EscrowWalletConfig[]>([]);
  const [rewardDistributions, setRewardDistributions] = useState<RewardDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionId, setNewCollectionId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundTokenType, setFundTokenType] = useState<'LOS' | 'LOL' | 'CUSTOM'>('LOS');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardRecipient, setRewardRecipient] = useState('');
  const [rewardTokenType, setRewardTokenType] = useState<'LOS' | 'LOL' | 'CUSTOM'>('LOS');
  const [rewardReason, setRewardReason] = useState('');
  
  // Private keys state
  const [privateKeysData, setPrivateKeysData] = useState<{
    escrowPrivateKey: string;
    tokenPrivateKey: string;
    escrowAddress: string;
    tokenMintAddress: string;
  } | null>(null);
  const [showEscrowKey, setShowEscrowKey] = useState(false);
  const [showTokenKey, setShowTokenKey] = useState(false);
  
  // Key burning state
  const [burnConfirmationCode, setBurnConfirmationCode] = useState('');
  const [burnStatus, setBurnStatus] = useState<{
    keysBurned: boolean;
    burnedAt?: Date;
    burnedBy?: string;
    escrowAddress: string;
    tokenMintAddress: string;
    accessLevel: string;
  } | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      loadEscrowData();
    }
  }, [connected, publicKey]);

  const loadEscrowData = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const wallets = secureEscrowWalletManager.getAllEscrowWallets(publicKey.toString());
      setEscrowWallets(wallets);
      
      if (wallets.length > 0) {
        setSelectedCollection(wallets[0].collectionId);
        const rewards = secureEscrowWalletManager.getRewardDistributions(wallets[0].collectionId, publicKey.toString());
        setRewardDistributions(rewards);
      }
    } catch (error) {
      console.error('❌ Error loading escrow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrowWallet = async () => {
    if (!publicKey || !newCollectionName || !newCollectionId) return;

    setLoading(true);
    try {
      await secureEscrowWalletManager.generateEscrowWallet(
        newCollectionId,
        newCollectionName,
        publicKey.toString()
      );
      
      await loadEscrowData();
      setShowCreateForm(false);
      setNewCollectionName('');
      setNewCollectionId('');
      alert('✅ Escrow wallet created successfully!');
    } catch (error) {
      console.error('❌ Error creating escrow wallet:', error);
      alert('❌ Failed to create escrow wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleGetPrivateKeys = async () => {
    if (!publicKey || !selectedCollection) return;

    setLoading(true);
    try {
      const keys = secureEscrowWalletManager.getEscrowPrivateKeys(selectedCollection, publicKey.toString());
      if (keys) {
        setPrivateKeysData(keys);
        console.log('✅ Private keys retrieved successfully');
      } else {
        console.error('❌ Failed to retrieve private keys');
        alert('❌ Failed to retrieve private keys');
      }
    } catch (error) {
      console.error('❌ Error retrieving private keys:', error);
      alert('❌ Error retrieving private keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('✅ Copied to clipboard');
      alert('✅ Copied to clipboard!');
    }).catch((error) => {
      console.error('❌ Failed to copy to clipboard:', error);
      alert('❌ Failed to copy to clipboard');
    });
  };

  const handleBurnKeys = async () => {
    if (!publicKey || !selectedCollection || !burnConfirmationCode) return;

    // Double confirmation
    if (!confirm('🔥 FINAL WARNING: This will PERMANENTLY BURN the private keys. This action is IRREVERSIBLE! Are you absolutely sure?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await secureEscrowWalletManager.burnPrivateKeys(
        selectedCollection,
        publicKey.toString(),
        burnConfirmationCode
      );

      if (result.success) {
        console.log('🔥 Keys burned successfully:', result);
        alert(`🔥 PRIVATE KEYS BURNED PERMANENTLY!\n\n${result.message}\n\nBurned at: ${result.burnedAt}\nEscrow: ${result.escrowAddress}\nToken: ${result.tokenMintAddress}`);
        
        // Refresh data
        await loadEscrowData();
        await loadBurnStatus();
        setBurnConfirmationCode('');
      }
    } catch (error) {
      console.error('❌ Error burning keys:', error);
      alert(`❌ Failed to burn keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBurnStatus = async () => {
    if (!publicKey || !selectedCollection) return;

    try {
      const status = secureEscrowWalletManager.getBurnStatus(selectedCollection, publicKey.toString());
      setBurnStatus(status);
    } catch (error) {
      console.error('❌ Error loading burn status:', error);
      setBurnStatus(null);
    }
  };

  const handleFundEscrow = async () => {
    if (!publicKey || !selectedCollection || !fundAmount) return;

    setLoading(true);
    try {
      const success = await secureEscrowWalletManager.fundEscrowWallet(
        selectedCollection,
        parseFloat(fundAmount),
        fundTokenType,
        publicKey.toString()
      );
      
      if (success) {
        await loadEscrowData();
        setFundAmount('');
        alert('✅ Escrow wallet funded successfully!');
      } else {
        alert('❌ Failed to fund escrow wallet');
      }
    } catch (error) {
      console.error('❌ Error funding escrow wallet:', error);
      alert('❌ Failed to fund escrow wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeReward = async () => {
    if (!publicKey || !selectedCollection || !rewardAmount || !rewardRecipient || !rewardReason) return;

    setLoading(true);
    try {
      const reward = await secureEscrowWalletManager.distributeReward(
        selectedCollection,
        rewardRecipient,
        parseFloat(rewardAmount),
        rewardTokenType,
        rewardReason,
        publicKey.toString()
      );
      
      await loadEscrowData();
      setRewardAmount('');
      setRewardRecipient('');
      setRewardReason('');
      alert(`✅ Reward distributed successfully! Transaction: ${reward.transactionHash}`);
    } catch (error) {
      console.error('❌ Error distributing reward:', error);
      alert('❌ Failed to distribute reward');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!publicKey || !selectedCollection || !fundAmount) return;

    if (!confirm('🚨 EMERGENCY WITHDRAWAL: Are you sure you want to withdraw from this escrow wallet?')) {
      return;
    }

    setLoading(true);
    try {
      const success = await secureEscrowWalletManager.emergencyWithdraw(
        selectedCollection,
        parseFloat(fundAmount),
        publicKey.toString()
      );
      
      if (success) {
        await loadEscrowData();
        setFundAmount('');
        alert('✅ Emergency withdrawal completed!');
      } else {
        alert('❌ Failed to perform emergency withdrawal');
      }
    } catch (error) {
      console.error('❌ Error during emergency withdrawal:', error);
      alert('❌ Failed to perform emergency withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-2">🔐 Admin Access Required</h3>
        <p className="text-red-300">Please connect your admin wallet to access escrow wallet management.</p>
      </div>
    );
  }

  const selectedWallet = escrowWallets.find(wallet => wallet.collectionId === selectedCollection);
  const escrowStats = secureEscrowWalletManager.getEscrowStats(publicKey.toString());

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🔐 Secure Escrow Wallet Manager</h3>
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
            onClick={() => setActiveTab('wallets')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'wallets' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Wallets
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'rewards' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'logs' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('privatekeys')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'privatekeys' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🔐 Private Keys
          </button>
          <button
            onClick={() => setActiveTab('keyburning')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'keyburning' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🔥 Key Burning
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{escrowStats.totalWallets}</div>
              <div className="text-sm text-gray-400">Total Wallets</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{escrowStats.activeWallets}</div>
              <div className="text-sm text-gray-400">Active Wallets</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{escrowStats.totalDeposited.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total Deposited</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{escrowStats.totalDistributed.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total Distributed</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Quick Actions</h4>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                ➕ Create New Escrow Wallet
              </button>
              <button
                onClick={loadEscrowData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-lg">Escrow Wallets</h4>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              ➕ Create New
            </button>
          </div>

          {/* Wallet List */}
          <div className="space-y-4">
            {escrowWallets.map((wallet) => (
              <div key={wallet.collectionId} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-white font-medium">{wallet.collectionName}</h5>
                    <p className="text-gray-400 text-sm">{wallet.collectionId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    wallet.isActive 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {wallet.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Escrow Address:</span>
                    <p className="text-white font-mono text-xs">{wallet.escrowAddress}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Token Mint:</span>
                    <p className="text-white font-mono text-xs">{wallet.tokenMintAddress}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Deposited:</span>
                    <p className="text-white">{wallet.totalDeposited.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Distributed:</span>
                    <p className="text-white">{wallet.totalDistributed.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-xs">
                    Created: {wallet.createdAt.toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedCollection(wallet.collectionId)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Reward Distribution</h4>

          {/* Selected Wallet Info */}
          {selectedWallet && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h5 className="text-white font-medium mb-2">Selected: {selectedWallet.collectionName}</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Available Balance:</span>
                  <p className="text-white">{(selectedWallet.totalDeposited - selectedWallet.totalDistributed).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Deposited:</span>
                  <p className="text-white">{selectedWallet.totalDeposited.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Distributed:</span>
                  <p className="text-white">{selectedWallet.totalDistributed.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fund Wallet */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h5 className="text-green-400 font-medium mb-3">💰 Fund Escrow Wallet</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Type</label>
                <select
                  value={fundTokenType}
                  onChange={(e) => setFundTokenType(e.target.value as 'LOS' | 'LOL' | 'CUSTOM')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="LOS">$LOS</option>
                  <option value="LOL">$LOL</option>
                  <option value="CUSTOM">Custom Token</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleFundEscrow}
                  disabled={loading || !fundAmount}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Fund
                </button>
                <button
                  onClick={handleEmergencyWithdraw}
                  disabled={loading || !fundAmount}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  🚨 Emergency Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Distribute Rewards */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3">🎁 Distribute Reward</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Wallet</label>
                <input
                  type="text"
                  value={rewardRecipient}
                  onChange={(e) => setRewardRecipient(e.target.value)}
                  placeholder="Enter wallet address"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Type</label>
                <select
                  value={rewardTokenType}
                  onChange={(e) => setRewardTokenType(e.target.value as 'LOS' | 'LOL' | 'CUSTOM')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="LOS">$LOS</option>
                  <option value="LOL">$LOL</option>
                  <option value="CUSTOM">Custom Token</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                <input
                  type="text"
                  value={rewardReason}
                  onChange={(e) => setRewardReason(e.target.value)}
                  placeholder="Why is this reward being given?"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
            <button
              onClick={handleDistributeReward}
              disabled={loading || !rewardRecipient || !rewardAmount || !rewardReason}
              className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              🎁 Distribute Reward
            </button>
          </div>

          {/* Recent Rewards */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Recent Reward Distributions</h5>
            <div className="space-y-2">
              {rewardDistributions.slice(-5).map((reward) => (
                <div key={reward.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <div>
                    <span className="text-white font-medium">{reward.amount} {reward.tokenType}</span>
                    <span className="text-gray-400 text-sm ml-2">to {reward.recipientWallet.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      reward.status === 'completed' 
                        ? 'bg-green-600 text-white'
                        : reward.status === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {reward.status.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {reward.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {rewardDistributions.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p>No reward distributions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create New Escrow Wallet Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h4 className="text-white font-medium text-lg mb-4">Create New Escrow Wallet</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Collection ID</label>
                <input
                  type="text"
                  value={newCollectionId}
                  onChange={(e) => setNewCollectionId(e.target.value)}
                  placeholder="Enter collection ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEscrowWallet}
                disabled={loading || !newCollectionName || !newCollectionId}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Keys Tab */}
      {activeTab === 'privatekeys' && (
        <div className="space-y-6">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-red-400 text-xl">⚠️</span>
              <h3 className="text-red-400 font-bold">SECURITY WARNING</h3>
            </div>
            <p className="text-red-300 text-sm">
              Private keys are sensitive information. Only access them when absolutely necessary. 
              All access is logged and monitored for security purposes.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">🔐 Access Private Keys</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Collection
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a collection...</option>
                  {escrowWallets.map((wallet) => (
                    <option key={wallet.collectionId} value={wallet.collectionId}>
                      {wallet.collectionName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCollection && (
                <button
                  onClick={handleGetPrivateKeys}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : '🔓 Get Private Keys'}
                </button>
              )}
            </div>
          </div>

          {privateKeysData && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">📋 Escrow Wallet Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collection:</span>
                    <span className="text-white">{selectedCollection}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Escrow Address:</span>
                    <span className="text-blue-400 font-mono text-xs">{privateKeysData.escrowAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token Mint Address:</span>
                    <span className="text-blue-400 font-mono text-xs">{privateKeysData.tokenMintAddress}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-3">🔑 Private Keys (KEEP SECURE!)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-1">
                      Escrow Private Key:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showEscrowKey ? 'text' : 'password'}
                        value={privateKeysData.escrowPrivateKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800 border border-red-500/50 rounded text-red-200 font-mono text-xs"
                      />
                      <button
                        onClick={() => setShowEscrowKey(!showEscrowKey)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        {showEscrowKey ? '👁️' : '🔒'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(privateKeysData.escrowPrivateKey)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-1">
                      Token Private Key:
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showTokenKey ? 'text' : 'password'}
                        value={privateKeysData.tokenPrivateKey}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-800 border border-red-500/50 rounded text-red-200 font-mono text-xs"
                      />
                      <button
                        onClick={() => setShowTokenKey(!showTokenKey)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        {showTokenKey ? '👁️' : '🔒'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(privateKeysData.tokenPrivateKey)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Burning Tab */}
      {activeTab === 'keyburning' && (
        <div className="space-y-6">
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-orange-400 text-xl">🔥</span>
              <h3 className="text-orange-400 font-bold">ULTIMATE SECURITY MEASURE</h3>
            </div>
            <div className="text-orange-300 text-sm space-y-2">
              <p><strong>⚠️ CRITICAL WARNING:</strong> Key burning is PERMANENT and IRREVERSIBLE!</p>
              <p>• Once burned, private keys can NEVER be recovered</p>
              <p>• Only burn keys after thorough testing and when 100% certain everything works</p>
              <p>• This is the ultimate security measure to prevent any tampering</p>
              <p>• After burning, only public addresses remain accessible</p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">🔥 Burn Private Keys</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Collection
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => {
                    setSelectedCollection(e.target.value);
                    if (e.target.value) {
                      loadBurnStatus();
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Select a collection...</option>
                  {escrowWallets.map((wallet) => (
                    <option key={wallet.collectionId} value={wallet.collectionId}>
                      {wallet.collectionName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCollection && burnStatus && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keys Burned:</span>
                      <span className={`font-medium ${burnStatus.keysBurned ? 'text-red-400' : 'text-green-400'}`}>
                        {burnStatus.keysBurned ? '🔥 BURNED' : '🔐 ACTIVE'}
                      </span>
                    </div>
                    {burnStatus.keysBurned && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Burned At:</span>
                          <span className="text-white">{burnStatus.burnedAt?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Burned By:</span>
                          <span className="text-white font-mono text-xs">{burnStatus.burnedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Access Level:</span>
                          <span className="text-blue-400">{burnStatus.accessLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Escrow Address:</span>
                          <span className="text-blue-400 font-mono text-xs">{burnStatus.escrowAddress}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedCollection && burnStatus && !burnStatus.keysBurned && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmation Code
                    </label>
                    <input
                      type="text"
                      value={burnConfirmationCode}
                      onChange={(e) => setBurnConfirmationCode(e.target.value)}
                      placeholder="Type: BURN_KEYS_PERMANENTLY"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Type "BURN_KEYS_PERMANENTLY" to confirm this irreversible action
                    </p>
                  </div>

                  <button
                    onClick={handleBurnKeys}
                    disabled={loading || burnConfirmationCode !== 'BURN_KEYS_PERMANENTLY'}
                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Burning...' : '🔥 BURN PRIVATE KEYS PERMANENTLY'}
                  </button>
                </div>
              )}

              {selectedCollection && burnStatus && burnStatus.keysBurned && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-400 text-xl">✅</span>
                    <h4 className="text-green-400 font-medium">Keys Successfully Burned</h4>
                  </div>
                  <p className="text-green-300 text-sm">
                    The private keys for this collection have been permanently destroyed. 
                    This escrow wallet is now in public claim mode and cannot be tampered with.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
