'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { secureEscrowWalletManager, EscrowWalletConfig, RewardDistribution } from '@/lib/secure-escrow-wallet-manager';

export default function SecureEscrowWalletManager() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'rewards' | 'logs' | 'settings'>('overview');
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
    </div>
  );
}
