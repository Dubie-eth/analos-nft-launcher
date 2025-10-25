'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Settings, 
  Save, 
  Upload, 
  Eye, 
  EyeOff, 
  Shield, 
  Users, 
  Link as LinkIcon,
  Image,
  Palette,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Collection founder wallet
const COLLECTION_FOUNDER = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

interface CollectionSettings {
  collection_id: string;
  socials: {
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
  };
  media: {
    logo_url?: string;
    banner_url?: string;
  };
  verification: {
    is_verified: boolean;
    verified_by?: string;
    verified_at?: string;
  };
  whitelist_phases: {
    team: { active: boolean; mint_limit: number; requires_lol: number };
    community: { active: boolean; mint_limit: number; requires_lol: number };
    early: { active: boolean; mint_limit: number; requires_lol: number };
    public: { active: boolean; mint_limit: number; requires_lol: number };
  };
  reveal_settings: {
    auto_reveal: boolean;
    reveal_delay_hours: number;
    placeholder_image?: string;
  };
}

interface RevealStats {
  total: number;
  revealed: number;
  unrevealed: number;
  nfts: Array<{
    tokenId: string;
    isRevealed: boolean;
    revealedAt?: string;
    revealedBy?: string;
    mintDate: string;
  }>;
}

export default function CollectionAdminPanel() {
  const { publicKey } = useWallet();
  const [settings, setSettings] = useState<CollectionSettings | null>(null);
  const [revealStats, setRevealStats] = useState<RevealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [activeTab, setActiveTab] = useState<'socials' | 'media' | 'whitelist' | 'reveal' | 'verification'>('socials');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user is the collection founder
  const isFounder = publicKey?.toString() === COLLECTION_FOUNDER;

  useEffect(() => {
    if (isFounder) {
      loadSettings();
      loadRevealStats();
    }
  }, [isFounder]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/admin/collection-settings?wallet=${publicKey?.toString()}&collectionId=los-bros`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load settings' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadRevealStats = async () => {
    try {
      const response = await fetch(`/api/admin/nft-reveal?wallet=${publicKey?.toString()}&collectionId=los-bros`);
      const data = await response.json();
      
      if (data.success) {
        setRevealStats(data.stats);
      }
    } catch (error: any) {
      console.warn('Failed to load reveal stats:', error.message);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/collection-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toString(),
          collectionId: 'los-bros',
          updates: settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const revealAllNFTs = async () => {
    setRevealing(true);
    try {
      const response = await fetch('/api/admin/nft-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toString(),
          revealType: 'all'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Revealed ${data.revealed} NFTs successfully!` });
        loadRevealStats(); // Refresh stats
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reveal NFTs' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setRevealing(false);
    }
  };

  const updateSocials = (platform: string, url: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socials: {
        ...settings.socials,
        [platform]: url
      }
    });
  };

  const updateWhitelistPhase = (phase: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      whitelist_phases: {
        ...settings.whitelist_phases,
        [phase]: {
          ...settings.whitelist_phases[phase as keyof typeof settings.whitelist_phases],
          [field]: value
        }
      }
    });
  };

  const updateMedia = (field: string, url: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      media: {
        ...settings.media,
        [field]: url
      }
    });
  };

  const toggleVerification = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      verification: {
        ...settings.verification,
        is_verified: !settings.verification.is_verified,
        verified_at: new Date().toISOString(),
        verified_by: publicKey?.toString() || 'founder'
      }
    });
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isFounder) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Access Denied</h3>
        <p className="text-red-300">Only the collection founder can access this panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8 text-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Loading collection settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Settings Not Found</h3>
        <p className="text-red-300">Failed to load collection settings.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Collection Admin Panel</h2>
              <p className="text-gray-300">Founder-only collection management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings.verification.is_verified && (
              <div className="flex items-center gap-1 bg-green-900/30 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm">Verified</span>
              </div>
            )}
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 border-b border-gray-700 ${
          message.type === 'success' ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? 
              <CheckCircle className="w-5 h-5" /> : 
              <AlertCircle className="w-5 h-5" />
            }
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800/50">
        {[
          { id: 'socials', label: 'Social Links', icon: LinkIcon },
          { id: 'media', label: 'Media', icon: Image },
          { id: 'whitelist', label: 'Whitelist', icon: Users },
          { id: 'reveal', label: 'NFT Reveal', icon: Eye },
          { id: 'verification', label: 'Verification', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/20'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'socials' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Social Media Links</h3>
            
            {Object.entries(settings.socials).map(([platform, url]) => (
              <div key={platform} className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 capitalize">
                  {platform === 'twitter' ? 'X (Twitter)' : platform}
                </label>
                <input
                  type="url"
                  value={url || ''}
                  onChange={(e) => updateSocials(platform, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Collection Media</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Logo URL</label>
              <input
                type="url"
                value={settings.media.logo_url || ''}
                onChange={(e) => updateMedia('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Banner URL</label>
              <input
                type="url"
                value={settings.media.banner_url || ''}
                onChange={(e) => updateMedia('banner_url', e.target.value)}
                placeholder="https://example.com/banner.png"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {(settings.media.logo_url || settings.media.banner_url) && (
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h4 className="font-medium text-gray-300">Preview</h4>
                {settings.media.logo_url && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Logo:</p>
                    <img 
                      src={settings.media.logo_url} 
                      alt="Logo Preview" 
                      className="w-16 h-16 rounded-lg object-cover border border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {settings.media.banner_url && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Banner:</p>
                    <img 
                      src={settings.media.banner_url} 
                      alt="Banner Preview" 
                      className="w-full max-w-md h-24 rounded-lg object-cover border border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'whitelist' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Whitelist Phases</h3>
            
            {Object.entries(settings.whitelist_phases).map(([phase, config]) => (
              <div key={phase} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white capitalize">{phase} Tier</h4>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.active}
                      onChange={(e) => updateWhitelistPhase(phase, 'active', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Mint Limit per Wallet</label>
                    <input
                      type="number"
                      min="0"
                      value={config.mint_limit}
                      onChange={(e) => updateWhitelistPhase(phase, 'mint_limit', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Required $LOL</label>
                    <input
                      type="number"
                      min="0"
                      value={config.requires_lol}
                      onChange={(e) => updateWhitelistPhase(phase, 'requires_lol', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reveal' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">NFT Reveal Management</h3>
            
            {revealStats && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{revealStats.total}</div>
                  <div className="text-sm text-gray-400">Total NFTs</div>
                </div>
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{revealStats.revealed}</div>
                  <div className="text-sm text-gray-400">Revealed</div>
                </div>
                <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{revealStats.unrevealed}</div>
                  <div className="text-sm text-gray-400">Unrevealed</div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={revealAllNFTs}
                disabled={revealing || !revealStats?.unrevealed}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                {revealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {revealing ? 'Revealing...' : `Reveal All (${revealStats?.unrevealed || 0})`}
              </button>
              
              <button
                onClick={loadRevealStats}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Loader2 className="w-4 h-4" />
                Refresh Stats
              </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Reveal Settings</h4>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.reveal_settings.auto_reveal}
                  onChange={(e) => setSettings({
                    ...settings,
                    reveal_settings: {
                      ...settings.reveal_settings,
                      auto_reveal: e.target.checked
                    }
                  })}
                  className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Auto-reveal new mints</span>
              </label>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Reveal Delay (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={settings.reveal_settings.reveal_delay_hours}
                  onChange={(e) => setSettings({
                    ...settings,
                    reveal_settings: {
                      ...settings.reveal_settings,
                      reveal_delay_hours: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Collection Verification</h3>
            
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shield className={`w-6 h-6 ${settings.verification.is_verified ? 'text-green-400' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-medium text-white">Verification Status</h4>
                    <p className="text-sm text-gray-400">
                      {settings.verification.is_verified ? 'Collection is verified' : 'Collection is not verified'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={toggleVerification}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.verification.is_verified
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {settings.verification.is_verified ? 'Remove Verification' : 'Verify Collection'}
                </button>
              </div>
              
              {settings.verification.is_verified && settings.verification.verified_at && (
                <div className="text-sm text-gray-400">
                  <p>Verified on: {new Date(settings.verification.verified_at).toLocaleDateString()}</p>
                  <p>Verified by: {settings.verification.verified_by}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
