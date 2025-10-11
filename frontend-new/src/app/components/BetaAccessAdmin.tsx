'use client';

import { useState, useEffect } from 'react';
import { betaAccessService, BetaAccessRequest, BetaAccessConfig } from '@/lib/beta-access-service';

export default function BetaAccessAdmin() {
  const [requests, setRequests] = useState<BetaAccessRequest[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [config, setConfig] = useState<BetaAccessConfig | null>(null);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRequests(betaAccessService.getBetaAccessRequests());
    setWhitelist(betaAccessService.getBetaWhitelist());
    setConfig(betaAccessService.getBetaAccessConfig());
  };

  const handleApproveRequest = (walletAddress: string) => {
    setLoading(true);
    try {
      const success = betaAccessService.addToBetaWhitelist(walletAddress, 'admin', 'Approved via admin panel');
      if (success) {
        loadData();
      }
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = (walletAddress: string) => {
    setLoading(true);
    try {
      betaAccessService.removeFromBetaWhitelist(walletAddress);
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWallet = () => {
    if (!newWalletAddress.trim()) return;

    setLoading(true);
    try {
      const success = betaAccessService.addToBetaWhitelist(newWalletAddress, 'admin', 'Manually added by admin');
      if (success) {
        setNewWalletAddress('');
        loadData();
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWallet = (walletAddress: string) => {
    setLoading(true);
    try {
      betaAccessService.removeFromBetaWhitelist(walletAddress);
      loadData();
    } catch (error) {
      console.error('Error removing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicAccess = () => {
    if (!config) return;

    setLoading(true);
    try {
      betaAccessService.updateBetaAccessConfig({
        isPublicAccessEnabled: !config.isPublicAccessEnabled
      });
      loadData();
    } catch (error) {
      console.error('Error toggling public access:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">🎯 Beta Access Management</h1>

        {/* Config Section */}
        {config && (
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">{config.currentBetaUsers}</div>
                <div className="text-sm text-gray-300">Current Beta Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{config.maxBetaUsers}</div>
                <div className="text-sm text-gray-300">Max Beta Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className={`text-2xl font-bold ${config.isPublicAccessEnabled ? 'text-green-400' : 'text-red-400'}`}>
                  {config.isPublicAccessEnabled ? 'Public' : 'Private'}
                </div>
                <div className="text-sm text-gray-300">Access Status</div>
              </div>
            </div>
            <button
              onClick={handleTogglePublicAccess}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                config.isPublicAccessEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {config.isPublicAccessEnabled ? 'Disable Public Access' : 'Enable Public Access'}
            </button>
          </div>
        )}

        {/* Add New Wallet */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add Wallet to Whitelist</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              placeholder="Enter wallet address..."
              className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAddWallet}
              disabled={loading || !newWalletAddress.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Pending Requests ({requests.filter(r => r.status === 'pending').length})
          </h2>
          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <p className="text-gray-400">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {requests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{request.walletAddress}</div>
                      <div className="text-gray-400 text-sm">Submitted: {formatDate(request.submittedAt)}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRequest(request.walletAddress)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.walletAddress)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Beta Whitelist */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Beta Whitelist ({whitelist.length})
          </h2>
          {whitelist.length === 0 ? (
            <p className="text-gray-400">No wallets in whitelist</p>
          ) : (
            <div className="space-y-2">
              {whitelist.map((wallet) => (
                <div key={wallet} className="bg-white/10 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-white font-mono text-sm">{wallet}</span>
                  <button
                    onClick={() => handleRemoveWallet(wallet)}
                    disabled={loading}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
