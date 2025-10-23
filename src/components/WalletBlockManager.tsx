'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Ban, Search, Plus, Trash2, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface BlockedWallet {
  id: string;
  walletAddress: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
  isActive: boolean;
  notes?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const WalletBlockManager: React.FC = () => {
  const [blockedWallets, setBlockedWallets] = useState<BlockedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    walletAddress: '',
    reason: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBlockedWallets();
  }, []);

  const loadBlockedWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/blocked-wallets');
      const data = await response.json();
      
      if (data.success) {
        setBlockedWallets(data.blockedWallets || []);
      } else {
        setError('Failed to load blocked wallets');
      }
    } catch (error) {
      console.error('Error loading blocked wallets:', error);
      setError('Failed to load blocked wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.walletAddress || !newBlock.reason) {
      setError('Wallet address and reason are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/blocked-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlock)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Wallet blocked successfully!');
        setShowAddModal(false);
        setNewBlock({
          walletAddress: '',
          reason: '',
          severity: 'medium',
          notes: ''
        });
        loadBlockedWallets();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to block wallet');
      }
    } catch (error) {
      console.error('Error blocking wallet:', error);
      setError('Failed to block wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async (blockId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/blocked-wallets/${blockId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isActive ? 'Wallet unblocked!' : 'Wallet blocked!');
        loadBlockedWallets();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to toggle block status');
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      setError('Failed to toggle block status');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to permanently delete this block entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blocked-wallets/${blockId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Block entry deleted!');
        loadBlockedWallets();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete block entry');
      }
    } catch (error) {
      console.error('Error deleting block:', error);
      setError('Failed to delete block entry');
    }
  };

  const filteredWallets = blockedWallets.filter(wallet =>
    wallet.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'medium':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'critical':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'high':
        return '🔴';
      case 'critical':
        return '💀';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading blocked wallets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Shield className="w-6 h-6 mr-3" />
            Wallet Block Manager
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Block Wallet</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-gray-300 text-sm mb-1">Total Blocked</div>
            <div className="text-white text-2xl font-bold">{blockedWallets.length}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-gray-300 text-sm mb-1">Active Blocks</div>
            <div className="text-white text-2xl font-bold">
              {blockedWallets.filter(w => w.isActive).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-gray-300 text-sm mb-1">High Severity</div>
            <div className="text-white text-2xl font-bold">
              {blockedWallets.filter(w => w.severity === 'high' || w.severity === 'critical').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-gray-300 text-sm mb-1">Inactive</div>
            <div className="text-white text-2xl font-bold">
              {blockedWallets.filter(w => !w.isActive).length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by wallet address or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Blocked Wallets List */}
        <div className="space-y-4">
          {filteredWallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border transition-all ${
                wallet.isActive ? 'border-red-500/50' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getSeverityIcon(wallet.severity)}</span>
                    <div>
                      <h3 className="text-white font-mono font-semibold">
                        {wallet.walletAddress.slice(0, 8)}...{wallet.walletAddress.slice(-8)}
                      </h3>
                      <p className="text-gray-400 text-xs">{wallet.walletAddress}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(wallet.severity)}`}>
                      {wallet.severity.toUpperCase()}
                    </span>
                    {wallet.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/50">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/50">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="ml-11 space-y-2">
                    <div>
                      <span className="text-gray-400 text-sm">Reason: </span>
                      <span className="text-white text-sm">{wallet.reason}</span>
                    </div>
                    {wallet.notes && (
                      <div>
                        <span className="text-gray-400 text-sm">Notes: </span>
                        <span className="text-gray-300 text-sm">{wallet.notes}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Blocked by: {wallet.blockedBy}</span>
                      <span>•</span>
                      <span>Date: {new Date(wallet.blockedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleBlock(wallet.id, wallet.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      wallet.isActive
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={wallet.isActive ? 'Unblock wallet' : 'Activate block'}
                  >
                    {wallet.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteBlock(wallet.id)}
                    className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Delete block entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredWallets.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No blocked wallets found</p>
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Ban className="w-5 h-5 mr-2" />
                  Block Wallet
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Wallet Address *</label>
                  <input
                    type="text"
                    value={newBlock.walletAddress}
                    onChange={(e) => setNewBlock({ ...newBlock, walletAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none font-mono"
                    placeholder="Enter wallet address..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Severity *</label>
                  <select
                    value={newBlock.severity}
                    onChange={(e) => setNewBlock({ ...newBlock, severity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="low">Low - Minor violations</option>
                    <option value="medium">Medium - Suspicious activity</option>
                    <option value="high">High - Confirmed malicious</option>
                    <option value="critical">Critical - Severe threat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Reason *</label>
                  <input
                    type="text"
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., Spam, Scam attempts, Phishing..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={newBlock.notes}
                    onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none h-24 resize-none"
                    placeholder="Any additional context or details..."
                  />
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-300 text-sm">
                      <p className="font-semibold mb-1">Warning</p>
                      <p>This wallet will be immediately blocked from all platform interactions including minting, trading, and profile updates.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddBlock}
                  disabled={saving}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>{saving ? 'Blocking...' : 'Block Wallet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-300">{success}</p>
        </div>
      )}
    </div>
  );
};

export default WalletBlockManager;
