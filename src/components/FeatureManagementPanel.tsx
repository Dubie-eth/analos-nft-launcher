'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Save, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Feature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  icon: string;
  completion_percentage: number;
  access_level: 'locked' | 'beta' | 'public';
  status: 'development' | 'testing' | 'live' | 'deprecated';
  is_visible: boolean;
  details: string[];
  deployment_info?: any;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export default function FeatureManagementPanel() {
  const { publicKey, connected } = useWallet();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch features from admin API
  const fetchFeatures = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/features?adminWallet=${publicKey.toString()}`);
      const data = await response.json();
      
      if (data.features) {
        setFeatures(data.features);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch features' });
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      setMessage({ type: 'error', text: 'Error fetching features' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchFeatures();
    }
  }, [connected, publicKey]);

  // Update feature
  const updateFeature = async (featureId: string, updates: Partial<Feature>) => {
    if (!connected || !publicKey) return;

    setSaving(true);
    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureId,
          updates,
          adminWallet: publicKey.toString()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Feature updated successfully' });
        // Update local state
        setFeatures(prev => prev.map(f => 
          f.id === featureId ? { ...f, ...updates } : f
        ));
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update feature' });
      }
    } catch (error) {
      console.error('Error updating feature:', error);
      setMessage({ type: 'error', text: 'Error updating feature' });
    } finally {
      setSaving(false);
    }
  };

  // Bulk update features
  const bulkUpdateFeatures = async () => {
    if (!connected || !publicKey) return;

    setSaving(true);
    try {
      const updates = features.map(feature => ({
        featureId: feature.id,
        updates: {
          completion_percentage: feature.completion_percentage,
          access_level: feature.access_level,
          status: feature.status,
          is_visible: feature.is_visible
        }
      }));

      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          adminWallet: publicKey.toString()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `${data.updatedCount} features updated successfully` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update features' });
      }
    } catch (error) {
      console.error('Error bulk updating features:', error);
      setMessage({ type: 'error', text: 'Error updating features' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'testing': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'development': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'deprecated': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'beta': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'locked': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your admin wallet to manage features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Feature Management
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Manage feature completion status, access levels, and visibility
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchFeatures}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={bulkUpdateFeatures}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : message.type === 'error'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {message.type === 'error' && <XCircle className="w-4 h-4" />}
          {message.type === 'info' && <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading features...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {feature.feature_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.feature_key}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                    {feature.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(feature.access_level)}`}>
                    {feature.access_level}
                  </span>
                  <button
                    onClick={() => updateFeature(feature.id, { is_visible: !feature.is_visible })}
                    className={`p-1 rounded transition-colors ${
                      feature.is_visible 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {feature.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Completion Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Completion %
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={feature.completion_percentage}
                      onChange={(e) => updateFeature(feature.id, { completion_percentage: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {feature.completion_percentage}%
                    </span>
                  </div>
                </div>

                {/* Access Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Level
                  </label>
                  <select
                    value={feature.access_level}
                    onChange={(e) => updateFeature(feature.id, { access_level: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="locked">Locked</option>
                    <option value="beta">Beta</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={feature.status}
                    onChange={(e) => updateFeature(feature.id, { status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="live">Live</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibility
                  </label>
                  <button
                    onClick={() => updateFeature(feature.id, { is_visible: !feature.is_visible })}
                    className={`w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                      feature.is_visible
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {feature.is_visible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>

              {/* Last Updated */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(feature.updated_at).toLocaleString()}
                {feature.updated_by && (
                  <span className="ml-2">by {feature.updated_by.slice(0, 8)}...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
