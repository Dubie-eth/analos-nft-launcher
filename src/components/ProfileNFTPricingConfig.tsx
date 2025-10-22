/**
 * PROFILE NFT PRICING CONFIG
 * Admin controls for mint pricing and availability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  DollarSign, 
  Settings, 
  ToggleLeft, 
  ToggleRight,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import PricingHistoryAnalytics from './PricingHistoryAnalytics';

interface PricingConfig {
  enabled: boolean;
  pricingTiers: {
    tier5Plus: number;    // 5+ characters
    tier4: number;        // 4 characters  
    tier3: number;        // 3 characters
    tier2: number;        // 2 characters (reserved)
    tier1: number;        // 1 character (reserved)
  };
  reservedTiers: {
    tier2: boolean;       // 2 characters disabled
    tier1: boolean;       // 1 characters disabled
  };
}

interface ProfileNFTPricingConfigProps {
  onClose?: () => void;
}

export default function ProfileNFTPricingConfig({ onClose }: ProfileNFTPricingConfigProps) {
  const { theme } = useTheme();
  const [config, setConfig] = useState<PricingConfig>({
    enabled: true,
    pricingTiers: {
      tier5Plus: 4.20,    // 5+ characters
      tier4: 42,          // 4 characters  
      tier3: 420,         // 3 characters
      tier2: 4200,        // 2 characters (reserved)
      tier1: 42000,       // 1 character (reserved)
    },
    reservedTiers: {
      tier2: true,        // 2 characters disabled
      tier1: true,        // 1 characters disabled
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadPricingConfig();
  }, []);

  const loadPricingConfig = async () => {
    try {
      const response = await fetch('/api/admin/matrix-collection/pricing-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load pricing config:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePricingConfig = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const response = await fetch('/api/admin/matrix-collection/pricing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      
      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save pricing config:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const updatePricingTier = (tier: keyof PricingConfig['pricingTiers'], value: number) => {
    setConfig(prev => ({
      ...prev,
      pricingTiers: {
        ...prev.pricingTiers,
        [tier]: value
      }
    }));
  };

  const toggleMinting = () => {
    setConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const toggleReservedTier = (tier: keyof PricingConfig['reservedTiers']) => {
    setConfig(prev => ({
      ...prev,
      reservedTiers: {
        ...prev.reservedTiers,
        [tier]: !prev.reservedTiers[tier]
      }
    }));
  };

  if (loading) {
    return (
      <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${
      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Profile NFT Pricing Configuration</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Character-based pricing tiers and minting controls
          </p>
        </div>
        <button
          onClick={loadPricingConfig}
          className={`p-2 rounded ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Minting Toggle */}
      <div className={`p-6 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Minting Status</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Enable or disable profile NFT minting
            </p>
          </div>
          <button
            onClick={toggleMinting}
            className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-all ${
              config.enabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {config.enabled ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Disabled
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className={`p-6 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Character-Based Pricing Tiers
        </h3>
        
        <div className="space-y-4">
          {/* 5+ Characters */}
          <div className={`p-4 rounded border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">5+ Characters (Common)</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Standard usernames like "johnsmith", "crypto123", "analos_user"
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.pricingTiers.tier5Plus}
                  onChange={(e) => updatePricingTier('tier5Plus', parseFloat(e.target.value))}
                  className={`w-20 px-3 py-1 rounded border text-right font-mono ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  step="0.01"
                  min="0"
                />
                <span className="font-bold">LOS</span>
              </div>
            </div>
          </div>

          {/* 4 Characters */}
          <div className={`p-4 rounded border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-400">4 Characters (Premium)</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Short usernames like "anal", "los1", "ape1"
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.pricingTiers.tier4}
                  onChange={(e) => updatePricingTier('tier4', parseFloat(e.target.value))}
                  className={`w-20 px-3 py-1 rounded border text-right font-mono ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  step="0.01"
                  min="0"
                />
                <span className="font-bold">LOS</span>
              </div>
            </div>
          </div>

          {/* 3 Characters */}
          <div className={`p-4 rounded border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-purple-400">3 Characters (Ultra Premium)</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Very rare usernames like "los", "ape", "420"
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.pricingTiers.tier3}
                  onChange={(e) => updatePricingTier('tier3', parseFloat(e.target.value))}
                  className={`w-20 px-3 py-1 rounded border text-right font-mono ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  step="0.01"
                  min="0"
                />
                <span className="font-bold">LOS</span>
              </div>
            </div>
          </div>

          {/* 2 Characters (Reserved) */}
          <div className={`p-4 rounded border ${
            config.reservedTiers.tier2 
              ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/50'
              : theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-bold ${config.reservedTiers.tier2 ? 'text-yellow-400' : ''}`}>
                  2 Characters (Reserved)
                  {config.reservedTiers.tier2 && <span className="text-xs ml-2">🔒 LOCKED</span>}
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ultra rare usernames like "da", "ls", "42" - Reserved for future
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.pricingTiers.tier2}
                    onChange={(e) => updatePricingTier('tier2', parseFloat(e.target.value))}
                    disabled={config.reservedTiers.tier2}
                    className={`w-20 px-3 py-1 rounded border text-right font-mono ${
                      config.reservedTiers.tier2
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    step="0.01"
                    min="0"
                  />
                  <span className="font-bold">LOS</span>
                </div>
                <button
                  onClick={() => toggleReservedTier('tier2')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    config.reservedTiers.tier2
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {config.reservedTiers.tier2 ? 'Locked' : 'Unlocked'}
                </button>
              </div>
            </div>
          </div>

          {/* 1 Character (Reserved) */}
          <div className={`p-4 rounded border ${
            config.reservedTiers.tier1 
              ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-500/50'
              : theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-bold ${config.reservedTiers.tier1 ? 'text-red-400' : ''}`}>
                  1 Character (Reserved)
                  {config.reservedTiers.tier1 && <span className="text-xs ml-2">🔒 LOCKED</span>}
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Legendary usernames like "a", "1", "x" - Reserved for future
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.pricingTiers.tier1}
                    onChange={(e) => updatePricingTier('tier1', parseFloat(e.target.value))}
                    disabled={config.reservedTiers.tier1}
                    className={`w-20 px-3 py-1 rounded border text-right font-mono ${
                      config.reservedTiers.tier1
                        ? 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    step="0.01"
                    min="0"
                  />
                  <span className="font-bold">LOS</span>
                </div>
                <button
                  onClick={() => toggleReservedTier('tier1')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    config.reservedTiers.tier1
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {config.reservedTiers.tier1 ? 'Locked' : 'Unlocked'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Configuration saved!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Failed to save configuration</span>
            </div>
          )}
        </div>
        
        <button
          onClick={savePricingConfig}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2 rounded font-semibold transition-all ${
            saving
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* History/Analytics */}
      <PricingHistoryAnalytics />

      {/* Info Alert */}
      <div className={`mt-6 p-4 rounded border flex gap-3 ${
        theme === 'dark'
          ? 'bg-blue-900/20 border-blue-600 text-blue-300'
          : 'bg-blue-50 border-blue-300 text-blue-700'
      }`}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Pricing Tier System</p>
          <p className="text-sm mt-1">
            Character-based pricing creates natural scarcity. Reserved tiers (1-2 characters) 
            can be unlocked later for special events or auctions.
          </p>
        </div>
      </div>
    </div>
  );
}