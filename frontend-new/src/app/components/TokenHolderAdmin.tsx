/**
 * Token Holder Admin Component
 * Manages token holder access configurations and verifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { tokenHolderService, TokenHolderConfig, TokenHolderVerification } from '../../lib/token-holder-service';

interface TokenHolderAdminProps {
  className?: string;
}

export default function TokenHolderAdmin({ className = '' }: TokenHolderAdminProps) {
  const { publicKey } = useWallet();
  const [configs, setConfigs] = useState<TokenHolderConfig[]>([]);
  const [stats, setStats] = useState(tokenHolderService.getTokenHolderStats());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states for adding/editing configs
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TokenHolderConfig | null>(null);
  const [newConfig, setNewConfig] = useState({
    tokenMint: '',
    tokenSymbol: '',
    minimumBalance: '',
    decimals: 6,
    isEnabled: false,
    accessLevel: 'beta' as 'beta' | 'premium' | 'enterprise',
    description: ''
  });

  // Verification states
  const [verificationAddress, setVerificationAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState<TokenHolderVerification[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = () => {
    const loadedConfigs = tokenHolderService.getTokenConfigs();
    setConfigs(loadedConfigs);
    setStats(tokenHolderService.getTokenHolderStats());
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveConfig = () => {
    if (!newConfig.tokenMint || !newConfig.tokenSymbol || !newConfig.minimumBalance) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const configData = {
        tokenMint: newConfig.tokenMint,
        tokenSymbol: newConfig.tokenSymbol.toUpperCase(),
        minimumBalance: parseFloat(newConfig.minimumBalance) * Math.pow(10, newConfig.decimals),
        decimals: newConfig.decimals,
        isEnabled: newConfig.isEnabled,
        accessLevel: newConfig.accessLevel,
        description: newConfig.description
      };

      let success = false;
      if (editingConfig) {
        success = tokenHolderService.updateTokenConfig(editingConfig.tokenMint, configData);
      } else {
        success = tokenHolderService.addTokenConfig(configData);
      }

      if (success) {
        showMessage('success', `${editingConfig ? 'Updated' : 'Added'} token holder configuration successfully`);
        loadConfigs();
        resetForm();
      } else {
        showMessage('error', 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showMessage('error', 'Error saving configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConfig = (config: TokenHolderConfig) => {
    setEditingConfig(config);
    setNewConfig({
      tokenMint: config.tokenMint,
      tokenSymbol: config.tokenSymbol,
      minimumBalance: (config.minimumBalance / Math.pow(10, config.decimals)).toString(),
      decimals: config.decimals,
      isEnabled: config.isEnabled,
      accessLevel: config.accessLevel,
      description: config.description
    });
    setShowAddForm(true);
  };

  const handleDeleteConfig = (tokenMint: string, tokenSymbol: string) => {
    if (confirm(`Are you sure you want to delete the configuration for ${tokenSymbol}?`)) {
      const success = tokenHolderService.removeTokenConfig(tokenMint);
      if (success) {
        showMessage('success', `Deleted ${tokenSymbol} configuration`);
        loadConfigs();
      } else {
        showMessage('error', 'Failed to delete configuration');
      }
    }
  };

  const handleToggleEnabled = (tokenMint: string, currentStatus: boolean) => {
    const success = tokenHolderService.updateTokenConfig(tokenMint, { isEnabled: !currentStatus });
    if (success) {
      showMessage('success', `Token holder access ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadConfigs();
    } else {
      showMessage('error', 'Failed to update configuration');
    }
  };

  const resetForm = () => {
    setNewConfig({
      tokenMint: '',
      tokenSymbol: '',
      minimumBalance: '',
      decimals: 6,
      isEnabled: false,
      accessLevel: 'beta',
      description: ''
    });
    setEditingConfig(null);
    setShowAddForm(false);
  };

  const handleVerifyWallet = async () => {
    if (!verificationAddress) {
      showMessage('error', 'Please enter a wallet address');
      return;
    }

    setIsVerifying(true);
    try {
      const verifications = await tokenHolderService.verifyTokenHolder(verificationAddress);
      setVerificationResult(verifications);
      
      if (verifications.length > 0) {
        const eligible = verifications.filter(v => v.hasAccess);
        if (eligible.length > 0) {
          showMessage('success', `Wallet verified! Eligible for ${eligible.length} token holder access levels`);
        } else {
          showMessage('info', 'Wallet verified but no eligible token holdings found');
        }
      } else {
        showMessage('info', 'No token holder configurations found');
      }
    } catch (error) {
      console.error('Error verifying wallet:', error);
      showMessage('error', 'Error verifying wallet');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatBalance = (balance: number, decimals: number) => {
    return tokenHolderService.formatTokenBalance(balance, decimals);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">🎯 Token Holder Access Management</h2>
        <p className="text-gray-300 text-sm mb-4">
          Configure access levels for users holding specific tokens (e.g., $LOL holders)
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-400">{configs.length}</div>
            <div className="text-xs text-gray-300">Total Configs</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">{configs.filter(c => c.isEnabled).length}</div>
            <div className="text-xs text-gray-300">Active</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{stats.accessLevels.beta}</div>
            <div className="text-xs text-gray-300">Beta Access</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-400">{stats.accessLevels.premium}</div>
            <div className="text-xs text-gray-300">Premium Access</div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
          message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingConfig ? 'Edit Token Configuration' : 'Add New Token Configuration'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Mint Address</label>
              <input
                type="text"
                value={newConfig.tokenMint}
                onChange={(e) => setNewConfig({ ...newConfig, tokenMint: e.target.value })}
                placeholder="Enter token mint address..."
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Symbol</label>
              <input
                type="text"
                value={newConfig.tokenSymbol}
                onChange={(e) => setNewConfig({ ...newConfig, tokenSymbol: e.target.value })}
                placeholder="e.g., LOL"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Balance</label>
              <input
                type="number"
                value={newConfig.minimumBalance}
                onChange={(e) => setNewConfig({ ...newConfig, minimumBalance: e.target.value })}
                placeholder="e.g., 1000"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
              <input
                type="number"
                value={newConfig.decimals}
                onChange={(e) => setNewConfig({ ...newConfig, decimals: parseInt(e.target.value) })}
                placeholder="6"
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
              <select
                value={newConfig.accessLevel}
                onChange={(e) => setNewConfig({ ...newConfig, accessLevel: e.target.value as any })}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="beta">Beta</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={newConfig.isEnabled}
                onChange={(e) => setNewConfig({ ...newConfig, isEnabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="isEnabled" className="text-sm text-gray-300">Enable this configuration</label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={newConfig.description}
              onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
              placeholder="Describe this token holder access..."
              rows={3}
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Saving...' : (editingConfig ? 'Update' : 'Add')}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Token Configurations */}
      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Token Configurations</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Add Token
          </button>
        </div>

        <div className="space-y-3">
          {configs.map((config) => (
            <div key={config.tokenMint} className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-medium">{config.tokenSymbol}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      config.isEnabled 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {config.isEnabled ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      config.accessLevel === 'beta' ? 'bg-blue-500/20 text-blue-300' :
                      config.accessLevel === 'premium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {config.accessLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{config.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Mint: {config.tokenMint.slice(0, 8)}...{config.tokenMint.slice(-8)}</div>
                    <div>Min Balance: {formatBalance(config.minimumBalance, config.decimals)} {config.tokenSymbol}</div>
                    <div>Updated: {new Date(config.lastUpdated).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleEnabled(config.tokenMint, config.isEnabled)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      config.isEnabled
                        ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                        : 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                    }`}
                  >
                    {config.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleEditConfig(config)}
                    className="px-3 py-1 rounded text-xs bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(config.tokenMint, config.tokenSymbol)}
                    className="px-3 py-1 rounded text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {configs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No token holder configurations found.</p>
              <p className="text-sm mt-2">Add a configuration to enable token holder access.</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Verification */}
      <div className="bg-white/10 rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">🔍 Wallet Verification</h3>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={verificationAddress}
            onChange={(e) => setVerificationAddress(e.target.value)}
            placeholder="Enter wallet address to verify..."
            className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
          />
          <button
            onClick={handleVerifyWallet}
            disabled={isVerifying}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {verificationResult.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Verification Results:</h4>
            {verificationResult.map((verification, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white font-medium">{verification.tokenSymbol}</div>
                    <div className="text-gray-400 text-sm">
                      Balance: {formatBalance(verification.balance, 6)} {verification.tokenSymbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      verification.hasAccess 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {verification.hasAccess ? 'Eligible' : 'Not Eligible'}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {verification.accessLevel.toUpperCase()}
                    </div>
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
