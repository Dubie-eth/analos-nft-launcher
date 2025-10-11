'use client';

import React, { useState, useEffect } from 'react';
import { tierSystemService, TierConfig, BondingCurveTemplate } from '@/lib/tier-system-service';

interface TierConfigurationProps {
  selectedTemplate: BondingCurveTemplate | null;
  onTiersConfigured: (tiers: TierConfig[]) => void;
  onClose?: () => void;
}

export default function TierConfiguration({
  selectedTemplate,
  onTiersConfigured,
  onClose
}: TierConfigurationProps) {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [editingTier, setEditingTier] = useState<TierConfig | null>(null);
  const [showTierEditor, setShowTierEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedTemplate) {
      loadDefaultTiers();
    }
  }, [selectedTemplate]);

  const loadDefaultTiers = () => {
    const defaultTiers = tierSystemService.getDefaultTiers();
    
    // Filter tiers based on template capabilities
    if (selectedTemplate) {
      const maxTiers = selectedTemplate.maxTiers;
      const filteredTiers = defaultTiers.slice(0, maxTiers);
      
      // Adjust pricing to fit template range
      const adjustedTiers = filteredTiers.map(tier => ({
        ...tier,
        mintPrice: Math.min(Math.max(tier.mintPrice, selectedTemplate.minPrice), selectedTemplate.maxPrice)
      }));
      
      setTiers(adjustedTiers);
    } else {
      setTiers(defaultTiers);
    }
  };

  const updateTier = (updatedTier: TierConfig) => {
    setTiers(prev => prev.map(tier => tier.id === updatedTier.id ? updatedTier : tier));
    setEditingTier(null);
    setShowTierEditor(false);
  };

  const toggleTierActive = (tierId: string) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, isActive: !tier.isActive } : tier
    ));
  };

  const handleSave = () => {
    const activeTiers = tiers.filter(tier => tier.isActive);
    
    if (activeTiers.length === 0) {
      setError('At least one tier must be active');
      return;
    }

    onTiersConfigured(activeTiers);
  };

  const getTierIcon = (tier: TierConfig) => {
    const icons = {
      free: '🆓',
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      diamond: '💎',
      whale: '🐋'
    };
    return icons[tier.id as keyof typeof icons] || '⭐';
  };

  const getTierColor = (tier: TierConfig) => {
    return tier.color;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          🎯 Tier Configuration
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6 mb-6">
          <h3 className="text-purple-400 font-bold mb-2">{selectedTemplate.icon} {selectedTemplate.name}</h3>
          <p className="text-gray-300 mb-4">{selectedTemplate.description}</p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-white font-medium">Max Tiers:</span>
              <span className="text-gray-300 ml-2">{selectedTemplate.maxTiers}</span>
            </div>
            <div>
              <span className="text-white font-medium">Price Range:</span>
              <span className="text-gray-300 ml-2">{selectedTemplate.minPrice} - {selectedTemplate.maxPrice} $LOS</span>
            </div>
            <div>
              <span className="text-white font-medium">Bonding Cap:</span>
              <span className="text-gray-300 ml-2">{selectedTemplate.bondingCap.toLocaleString()} $LOS</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tiers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-xl p-6 border transition-all duration-200 ${
              tier.isActive
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 bg-white/5 opacity-60'
            }`}
          >
            {/* Tier Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: getTierColor(tier) + '20', border: `2px solid ${getTierColor(tier)}` }}
                >
                  {getTierIcon(tier)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{tier.name}</h3>
                  <p className="text-gray-400 text-sm">{tier.mintPrice} $LOS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tier.isActive}
                  onChange={() => toggleTierActive(tier.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Tier Description */}
            <p className="text-gray-300 text-sm mb-4">{tier.description}</p>

            {/* Tier Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Mints:</span>
                <span className="text-white">{tier.maxMints}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Social Score:</span>
                <span className="text-white">{tier.socialRequirements.minSocialScore || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Min Followers:</span>
                <span className="text-white">{tier.socialRequirements.minFollowers || 0}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">Benefits:</h4>
              <ul className="space-y-1">
                {tier.benefits.slice(0, 2).map((benefit, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {benefit}
                  </li>
                ))}
                {tier.benefits.length > 2 && (
                  <li className="text-gray-400 text-sm">
                    +{tier.benefits.length - 2} more benefits
                  </li>
                )}
              </ul>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => {
                setEditingTier(tier);
                setShowTierEditor(true);
              }}
              className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Edit Tier
            </button>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-xl p-6 mb-8">
        <h3 className="text-green-400 font-bold mb-4">💰 Pricing Summary</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Active Tiers:</h4>
            <div className="space-y-2">
              {tiers.filter(t => t.isActive).map((tier) => (
                <div key={tier.id} className="flex justify-between text-sm">
                  <span className="text-gray-300">{tier.name}:</span>
                  <span className="text-white">{tier.mintPrice} $LOS</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Price Range:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Minimum:</span>
                <span className="text-green-400">
                  {Math.min(...tiers.filter(t => t.isActive).map(t => t.mintPrice))} $LOS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Maximum:</span>
                <span className="text-blue-400">
                  {Math.max(...tiers.filter(t => t.isActive).map(t => t.mintPrice))} $LOS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={loadDefaultTiers}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors"
        >
          Reset to Defaults
        </button>
        
        <div className="flex space-x-4">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={tiers.filter(t => t.isActive).length === 0}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Tier Editor Modal */}
      {showTierEditor && editingTier && (
        <TierEditor
          tier={editingTier}
          onSave={updateTier}
          onClose={() => {
            setEditingTier(null);
            setShowTierEditor(false);
          }}
        />
      )}
    </div>
  );
}

// Tier Editor Component
interface TierEditorProps {
  tier: TierConfig;
  onSave: (tier: TierConfig) => void;
  onClose: () => void;
}

function TierEditor({ tier, onSave, onClose }: TierEditorProps) {
  const [editedTier, setEditedTier] = useState<TierConfig>({ ...tier });

  const handleSave = () => {
    onSave(editedTier);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Edit {tier.name} Tier</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Mint Price ($LOS)</label>
            <input
              type="number"
              value={editedTier.mintPrice}
              onChange={(e) => setEditedTier(prev => ({ ...prev, mintPrice: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Max Mints</label>
            <input
              type="number"
              value={editedTier.maxMints}
              onChange={(e) => setEditedTier(prev => ({ ...prev, maxMints: parseInt(e.target.value) || 1 }))}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Min Social Score</label>
            <input
              type="number"
              value={editedTier.socialRequirements.minSocialScore || 0}
              onChange={(e) => setEditedTier(prev => ({
                ...prev,
                socialRequirements: {
                  ...prev.socialRequirements,
                  minSocialScore: parseInt(e.target.value) || 0
                }
              }))}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Min Followers</label>
            <input
              type="number"
              value={editedTier.socialRequirements.minFollowers || 0}
              onChange={(e) => setEditedTier(prev => ({
                ...prev,
                socialRequirements: {
                  ...prev.socialRequirements,
                  minFollowers: parseInt(e.target.value) || 0
                }
              }))}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
