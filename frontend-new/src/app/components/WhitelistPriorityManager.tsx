'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export type WhitelistType = 'token_holders' | 'snapshot' | 'nft_collection' | 'manual';

export interface WhitelistRule {
  id: string;
  type: WhitelistType;
  name: string;
  priority: number; // Lower number = higher priority
  enabled: boolean;
  priceMultiplier: number; // 0 = free, 0.5 = half price, 1 = normal price
  maxMintsPerWallet: number;
  config: {
    // Token holders config
    tokenMint?: string;
    minBalance?: number;
    maxBalance?: number;
    snapshotName?: string;
    
    // Snapshot config
    walletAddresses?: string[];
    
    // NFT collection config
    collectionMint?: string;
    minNFTs?: number;
    
    // Manual config
    manualAddresses?: string[];
  };
  startDate: string;
  endDate: string;
  description?: string;
}

interface WhitelistPriorityManagerProps {
  collectionId: string;
  collectionName: string;
  onWhitelistRulesChange?: (rules: WhitelistRule[]) => void;
  initialRules?: WhitelistRule[];
}

export default function WhitelistPriorityManager({ 
  collectionId, 
  collectionName, 
  onWhitelistRulesChange,
  initialRules = []
}: WhitelistPriorityManagerProps) {
  const { publicKey } = useWallet();
  const [rules, setRules] = useState<WhitelistRule[]>(initialRules);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<WhitelistRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<WhitelistRule>>({
    type: 'token_holders',
    name: '',
    priority: 1,
    enabled: true,
    priceMultiplier: 1.0,
    maxMintsPerWallet: 1,
    config: {},
    startDate: '',
    endDate: '',
    description: ''
  });

  // Load whitelist rules from localStorage
  useEffect(() => {
    const savedRules = localStorage.getItem(`whitelist_rules_${collectionId}`);
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules);
        setRules(parsedRules);
        onWhitelistRulesChange?.(parsedRules);
      } catch (error) {
        console.error('Error loading whitelist rules:', error);
      }
    }
  }, [collectionId, onWhitelistRulesChange]);

  // Save whitelist rules to localStorage
  const saveWhitelistRules = (updatedRules: WhitelistRule[]) => {
    localStorage.setItem(`whitelist_rules_${collectionId}`, JSON.stringify(updatedRules));
    setRules(updatedRules);
    onWhitelistRulesChange?.(updatedRules);
  };

  const addRule = () => {
    if (!newRule.name?.trim()) return;

    const rule: WhitelistRule = {
      id: `rule_${Date.now()}`,
      type: newRule.type || 'token_holders',
      name: newRule.name.trim(),
      priority: newRule.priority || 1,
      enabled: newRule.enabled || true,
      priceMultiplier: newRule.priceMultiplier || 1.0,
      maxMintsPerWallet: newRule.maxMintsPerWallet || 1,
      config: newRule.config || {},
      startDate: newRule.startDate || '',
      endDate: newRule.endDate || '',
      description: newRule.description?.trim() || undefined
    };

    const updatedRules = [...rules, rule].sort((a, b) => a.priority - b.priority);
    saveWhitelistRules(updatedRules);
    
    setNewRule({
      type: 'token_holders',
      name: '',
      priority: Math.max(...rules.map(r => r.priority), 0) + 1,
      enabled: true,
      priceMultiplier: 1.0,
      maxMintsPerWallet: 1,
      config: {},
      startDate: '',
      endDate: '',
      description: ''
    });
    setShowAddRule(false);
  };

  const updateRule = (ruleId: string, updates: Partial<WhitelistRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ).sort((a, b) => a.priority - b.priority);
    saveWhitelistRules(updatedRules);
    setEditingRule(null);
  };

  const removeRule = (ruleId: string) => {
    if (!confirm('Are you sure you want to remove this whitelist rule?')) return;
    
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    saveWhitelistRules(updatedRules);
  };

  const toggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    saveWhitelistRules(updatedRules);
  };

  const reorderRules = (fromIndex: number, toIndex: number) => {
    const newRules = [...rules];
    const [movedRule] = newRules.splice(fromIndex, 1);
    newRules.splice(toIndex, 0, movedRule);
    
    // Update priorities based on new order
    const reorderedRules = newRules.map((rule, index) => ({
      ...rule,
      priority: index + 1
    }));
    
    saveWhitelistRules(reorderedRules);
  };

  const getRuleTypeIcon = (type: WhitelistType) => {
    switch (type) {
      case 'token_holders': return '🪙';
      case 'snapshot': return '📸';
      case 'nft_collection': return '🎨';
      case 'manual': return '✋';
      default: return '❓';
    }
  };

  const getRuleTypeDescription = (type: WhitelistType) => {
    switch (type) {
      case 'token_holders': return 'Based on token balance (e.g., $LOL holders)';
      case 'snapshot': return 'Pre-defined list of wallet addresses';
      case 'nft_collection': return 'Holders of specific NFT collection';
      case 'manual': return 'Manually added individual wallets';
      default: return 'Unknown type';
    }
  };

  const getCurrentActiveRule = () => {
    const now = new Date();
    return rules.find(rule => {
      if (!rule.enabled) return false;
      const startDate = new Date(rule.startDate);
      const endDate = new Date(rule.endDate);
      return now >= startDate && now <= endDate;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🎯 Whitelist Priority Management
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Manage whitelist rules in priority order for <strong>{collectionName}</strong>. 
        Rules are checked in priority order (1 = highest priority).
      </p>

      {/* Current Active Rule */}
      {rules.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            📊 Current Active Rule
          </h4>
          {getCurrentActiveRule() ? (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div><strong>Active Rule:</strong> {getCurrentActiveRule()?.name}</div>
              <div><strong>Type:</strong> {getRuleTypeIcon(getCurrentActiveRule()?.type || 'manual')} {getRuleTypeDescription(getCurrentActiveRule()?.type || 'manual')}</div>
              <div><strong>Price Multiplier:</strong> {getCurrentActiveRule()?.priceMultiplier}x</div>
              <div><strong>Max Mints per Wallet:</strong> {getCurrentActiveRule()?.maxMintsPerWallet}</div>
            </div>
          ) : (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              No active whitelist rule. All rules are either disabled or outside their date range.
            </div>
          )}
        </div>
      )}

      {/* Add New Rule */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddRule(!showAddRule)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm mb-4"
        >
          {showAddRule ? 'Cancel' : '+ Add Whitelist Rule'}
        </button>

        {showAddRule && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">New Whitelist Rule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., VIP Token Holders, Early Snapshot"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Type
                </label>
                <select
                  value={newRule.type || 'token_holders'}
                  onChange={(e) => setNewRule({ ...newRule, type: e.target.value as WhitelistType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="token_holders">🪙 Token Holders</option>
                  <option value="snapshot">📸 Snapshot</option>
                  <option value="nft_collection">🎨 NFT Collection</option>
                  <option value="manual">✋ Manual</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority (1 = highest)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newRule.priority || 1}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={newRule.priceMultiplier || 1.0}
                  onChange={(e) => setNewRule({ ...newRule, priceMultiplier: parseFloat(e.target.value) || 1 })}
                  placeholder="1.0 = normal price, 0.5 = half price, 0 = free"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={newRule.startDate || ''}
                  onChange={(e) => setNewRule({ ...newRule, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={newRule.endDate || ''}
                  onChange={(e) => setNewRule({ ...newRule, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Mints per Wallet
                </label>
                <input
                  type="number"
                  min="1"
                  value={newRule.maxMintsPerWallet || 1}
                  onChange={(e) => setNewRule({ ...newRule, maxMintsPerWallet: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRule.enabled || true}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Rule</span>
                </label>
              </div>
            </div>

            {/* Rule-specific configuration */}
            {newRule.type === 'token_holders' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <h5 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">Token Holder Configuration</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Token Mint Address
                    </label>
                    <input
                      type="text"
                      value={newRule.config?.tokenMint || ''}
                      onChange={(e) => setNewRule({ 
                        ...newRule, 
                        config: { ...newRule.config, tokenMint: e.target.value }
                      })}
                      placeholder="e.g., ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum Balance
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newRule.config?.minBalance || 0}
                      onChange={(e) => setNewRule({ 
                        ...newRule, 
                        config: { ...newRule.config, minBalance: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={addRule}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              Add Rule
            </button>
          </div>
        )}
      </div>

      {/* Existing Rules */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Whitelist Rules (in priority order):</h4>
        {rules.map((rule, index) => (
          <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getRuleTypeIcon(rule.type)}</span>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    #{rule.priority} {rule.name}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getRuleTypeDescription(rule.type)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rule.enabled 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {rule.enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 text-xs rounded ${
                    rule.enabled
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                  }`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => setEditingRule(rule)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              <div><strong>Period:</strong> {rule.startDate} to {rule.endDate}</div>
              <div><strong>Price:</strong> {rule.priceMultiplier}x normal price</div>
              <div><strong>Max per Wallet:</strong> {rule.maxMintsPerWallet} mints</div>
              {rule.description && <div><strong>Description:</strong> {rule.description}</div>}
            </div>

            {/* Rule-specific details */}
            {rule.type === 'token_holders' && rule.config.tokenMint && (
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <div><strong>Token:</strong> {rule.config.tokenMint.slice(0, 8)}...{rule.config.tokenMint.slice(-8)}</div>
                {rule.config.minBalance && <div><strong>Min Balance:</strong> {rule.config.minBalance}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🎯</div>
          <p>No whitelist rules configured yet.</p>
          <p className="text-sm">Add rules to create a priority-based whitelist system.</p>
        </div>
      )}
    </div>
  );
}
