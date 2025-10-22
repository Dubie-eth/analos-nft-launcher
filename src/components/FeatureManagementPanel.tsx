'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BarChart3, Plus, Edit3, Trash2, Save, X, Coins, Users, TrendingUp } from 'lucide-react';

interface FeatureRequest {
  id: string;
  name: string;
  description: string;
  targetThreshold: number;
  currentVotes: number;
  totalWeight: number;
  progress: number;
  status: 'active' | 'funded' | 'in_development' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const FeatureManagementPanel: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<FeatureRequest | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeature, setNewFeature] = useState({
    name: '',
    description: '',
    targetThreshold: 100000000
  });

  useEffect(() => {
    if (connected) {
      loadFeatures();
    }
  }, [connected]);

  const loadFeatures = async () => {
    try {
      const response = await fetch('/api/feature-voting');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.features) {
          setFeatures(data.features);
        }
      }
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeature = async (featureId: string, updates: Partial<FeatureRequest>) => {
    try {
      const response = await fetch('/api/feature-voting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, updates })
      });

      if (response.ok) {
        await loadFeatures();
        setEditingFeature(null);
      }
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  };

  const handleAddFeature = async () => {
    try {
      const response = await fetch('/api/feature-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFeature.name,
          description: newFeature.description,
          targetThreshold: newFeature.targetThreshold
        })
      });

      if (response.ok) {
        await loadFeatures();
        setShowAddForm(false);
        setNewFeature({ name: '', description: '', targetThreshold: 100000000 });
      }
    } catch (error) {
      console.error('Error adding feature:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_development': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'funded': return '🎯 Ready for Development';
      case 'in_development': return '🚧 In Development';
      case 'completed': return '✅ Completed';
      default: return '🗳️ Active Voting';
    }
  };

  if (!connected) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Connect your wallet to manage feature requests</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feature requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🗳️ Feature Request Management</h2>
            <p className="text-gray-300">Manage community-driven feature requests with weighted voting</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feature</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {features.reduce((sum, f) => sum + f.currentVotes, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Voters</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {features.reduce((sum, f) => sum + f.totalWeight, 0).toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Vote Weight</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {features.filter(f => f.status === 'funded').length}
            </div>
            <div className="text-gray-400 text-sm">Features Funded</div>
          </div>
        </div>
      </div>

      {/* Add Feature Form */}
      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Add New Feature Request</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Feature Name</label>
              <input
                type="text"
                value={newFeature.name}
                onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter feature name"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Description</label>
              <textarea
                value={newFeature.description}
                onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                placeholder="Describe the feature"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Target Threshold (LOL tokens)</label>
              <input
                type="number"
                value={newFeature.targetThreshold}
                onChange={(e) => setNewFeature(prev => ({ ...prev, targetThreshold: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="100000000"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddFeature}
                disabled={!newFeature.name || !newFeature.description}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Save Feature</span>
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">Feature Requests</h3>
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">{feature.name}</h4>
                  <p className="text-gray-300 text-sm mb-3">{feature.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{feature.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          feature.progress >= 100 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(feature.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        {feature.totalWeight.toLocaleString()} / {feature.targetThreshold.toLocaleString()} LOL
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {feature.currentVotes} votes
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(feature.status)}`}>
                    {getStatusLabel(feature.status)}
                  </span>
                  <button
                    onClick={() => setEditingFeature(feature)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Feature Modal */}
      {editingFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Edit Feature</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Status</label>
                <select
                  value={editingFeature.status}
                  onChange={(e) => setEditingFeature(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="active">Active Voting</option>
                  <option value="funded">Ready for Development</option>
                  <option value="in_development">In Development</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Target Threshold</label>
                <input
                  type="number"
                  value={editingFeature.targetThreshold}
                  onChange={(e) => setEditingFeature(prev => prev ? { ...prev, targetThreshold: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (editingFeature) {
                      handleUpdateFeature(editingFeature.id, {
                        status: editingFeature.status,
                        targetThreshold: editingFeature.targetThreshold
                      });
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setEditingFeature(null)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManagementPanel;