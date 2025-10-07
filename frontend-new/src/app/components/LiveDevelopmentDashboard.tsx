'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface LiveDevelopmentConfig {
  collectionId: string;
  isLiveDevelopment: boolean;
  currentPhase: 'minting' | 'development' | 'reveal';
  features: {
    traitUpdates: boolean;
    rarityAdjustments: boolean;
    communityVoting: boolean;
    liveGeneration: boolean;
  };
  communityFeedback: {
    enabled: boolean;
    votingWeight: 'equal' | 'holder_weighted' | 'developer_override';
  };
}

interface TraitUpdate {
  id: string;
  layerName: string;
  traitName: string;
  oldRarity: number;
  newRarity: number;
  reason: string;
  communityVotes: number;
  developerApproved: boolean;
}

interface CommunitySuggestion {
  id: string;
  type: 'new_trait' | 'rarity_change' | 'layer_addition' | 'feature_request';
  description: string;
  votes: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
}

export default function LiveDevelopmentDashboard() {
  const { publicKey, connected } = useWallet();
  const [config, setConfig] = useState<LiveDevelopmentConfig>({
    collectionId: '',
    isLiveDevelopment: true,
    currentPhase: 'minting',
    features: {
      traitUpdates: true,
      rarityAdjustments: true,
      communityVoting: true,
      liveGeneration: true,
    },
    communityFeedback: {
      enabled: true,
      votingWeight: 'holder_weighted',
    },
  });

  const [traitUpdates, setTraitUpdates] = useState<TraitUpdate[]>([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<CommunitySuggestion[]>([]);
  const [liveStats, setLiveStats] = useState({
    totalMinted: 0,
    activeVoters: 0,
    pendingUpdates: 0,
    communityEngagement: 0,
  });

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        totalMinted: prev.totalMinted + Math.floor(Math.random() * 3),
        activeVoters: Math.floor(Math.random() * 50) + 10,
        communityEngagement: Math.floor(Math.random() * 20) + 80,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addTraitUpdate = () => {
    const newUpdate: TraitUpdate = {
      id: Date.now().toString(),
      layerName: 'Background',
      traitName: 'Analos',
      oldRarity: 14,
      newRarity: 12,
      reason: 'Community requested rarity increase',
      communityVotes: 45,
      developerApproved: false,
    };
    setTraitUpdates(prev => [newUpdate, ...prev]);
  };

  const approveUpdate = (updateId: string) => {
    setTraitUpdates(prev => 
      prev.map(update => 
        update.id === updateId 
          ? { ...update, developerApproved: true }
          : update
      )
    );
  };

  const submitCommunitySuggestion = () => {
    const newSuggestion: CommunitySuggestion = {
      id: Date.now().toString(),
      type: 'new_trait',
      description: 'Add a "Rainbow" background trait',
      votes: 1,
      status: 'pending',
      submittedBy: publicKey?.toBase58().slice(0, 8) + '...' || 'Anonymous',
      submittedAt: new Date(),
    };
    setCommunitySuggestions(prev => [newSuggestion, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🚀 Live Development Dashboard
              </h1>
              <p className="text-gray-300">
                Build your collection in real-time while community mints
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  Phase: {config.currentPhase.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400">
                  Live Development {config.isLiveDevelopment ? 'ON' : 'OFF'}
                </div>
              </div>
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all">
                {config.isLiveDevelopment ? 'Live' : 'Start Live Dev'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{liveStats.totalMinted}</div>
                <div className="text-gray-400">Total Minted</div>
              </div>
              <div className="text-3xl">🎨</div>
            </div>
            <div className="mt-2 text-sm text-green-400">
              +{Math.floor(Math.random() * 3)} in last hour
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{liveStats.activeVoters}</div>
                <div className="text-gray-400">Active Voters</div>
              </div>
              <div className="text-3xl">🗳️</div>
            </div>
            <div className="mt-2 text-sm text-blue-400">
              Community engaged
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{liveStats.pendingUpdates}</div>
                <div className="text-gray-400">Pending Updates</div>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
            <div className="mt-2 text-sm text-yellow-400">
              Awaiting approval
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{liveStats.communityEngagement}%</div>
                <div className="text-gray-400">Engagement</div>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
            <div className="mt-2 text-sm text-purple-400">
              High activity
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Trait Updates */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Live Trait Updates</h2>
              <button 
                onClick={addTraitUpdate}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Add Update
              </button>
            </div>

            <div className="space-y-4">
              {traitUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🎨</div>
                  <p>No trait updates yet</p>
                  <p className="text-sm">Start making live changes to your collection</p>
                </div>
              ) : (
                traitUpdates.map((update) => (
                  <div key={update.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white">
                        {update.layerName} - {update.traitName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {update.communityVotes} votes
                        </span>
                        {update.developerApproved ? (
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                            ✅ Approved
                          </span>
                        ) : (
                          <button 
                            onClick={() => approveUpdate(update.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      Rarity: {update.oldRarity}% → {update.newRarity}%
                    </div>
                    <div className="text-sm text-gray-400">
                      {update.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Community Suggestions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Community Suggestions</h2>
              <button 
                onClick={submitCommunitySuggestion}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Suggest
              </button>
            </div>

            <div className="space-y-4">
              {communitySuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">💡</div>
                  <p>No suggestions yet</p>
                  <p className="text-sm">Community will submit ideas here</p>
                </div>
              ) : (
                communitySuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white">
                        {suggestion.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {suggestion.votes} votes
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          suggestion.status === 'approved' ? 'bg-green-600' :
                          suggestion.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
                        } text-white`}>
                          {suggestion.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      {suggestion.description}
                    </div>
                    <div className="text-xs text-gray-400">
                      by {suggestion.submittedBy} • {suggestion.submittedAt.toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Development Features */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">Live Development Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(config.features).map(([feature, enabled]) => (
              <div key={feature} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-white capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                </div>
                <div className="text-sm text-gray-400">
                  {enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-lg font-medium transition-all">
              🎨 Generate Live Preview
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-4 rounded-lg font-medium transition-all">
              📊 Update Rarity Distribution
            </button>
            <button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white p-4 rounded-lg font-medium transition-all">
              🎭 Schedule Reveal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
