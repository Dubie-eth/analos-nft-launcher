'use client';

import { useState, useEffect } from 'react';
import { verificationConfigManager } from '@/lib/verification-config-manager';

export default function VerificationConfigAdmin() {
  const [currentConfig, setCurrentConfig] = useState(verificationConfigManager.getConfig());
  const [configSummary, setConfigSummary] = useState(verificationConfigManager.getConfigSummary());
  const [selectedPreset, setSelectedPreset] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    setCurrentConfig(verificationConfigManager.getConfig());
    setConfigSummary(verificationConfigManager.getConfigSummary());
  };

  const handleApplyPreset = (presetName: string) => {
    setLoading(true);
    try {
      const success = verificationConfigManager.applyPreset(presetName);
      if (success) {
        loadConfig();
        setSelectedPreset(presetName);
      }
    } catch (error) {
      console.error('Error applying preset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    setLoading(true);
    try {
      verificationConfigManager.resetToDefault();
      loadConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
    } finally {
      setLoading(false);
    }
  };

  const presets = verificationConfigManager.getPresetConfigs();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">🔧 Verification Config Management</h1>

        {/* Current Configuration Summary */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Current Configuration</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{configSummary.phase}</div>
              <div className="text-sm text-gray-300">Current Phase</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className={`text-2xl font-bold ${
                configSummary.difficulty === 'Very Easy' ? 'text-green-400' :
                configSummary.difficulty === 'Easy' ? 'text-blue-400' :
                configSummary.difficulty === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {configSummary.difficulty}
              </div>
              <div className="text-sm text-gray-300">Difficulty Level</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{configSummary.estimatedTime}</div>
              <div className="text-sm text-gray-300">Est. Verification Time</div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Current Requirements</h3>
            <ul className="space-y-2">
              {configSummary.requirements.map((requirement, index) => (
                <li key={index} className="text-gray-300 flex items-center">
                  <span className="text-green-400 mr-2">•</span>
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Preset Configurations */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Preset Configurations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(presets).map(([presetName, config]) => (
              <div key={presetName} className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                  {presetName.replace('_', ' ')}
                </h3>
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <div>Twitter: {config.twitter.minFollowers}+ followers</div>
                  <div>Telegram: {config.telegram.minMembers}+ members</div>
                  <div>Discord: {config.discord.minServerMembers}+ members</div>
                  <div>Required Score: {config.requiredScore} points</div>
                </div>
                <button
                  onClick={() => handleApplyPreset(presetName)}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Applying...' : 'Apply This Preset'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Configuration */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Manual Configuration</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Platform Minimums</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter Minimum Followers
                  </label>
                  <input
                    type="number"
                    value={currentConfig.twitter.minFollowers}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      twitter: { ...currentConfig.twitter, minFollowers: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telegram Minimum Members
                  </label>
                  <input
                    type="number"
                    value={currentConfig.telegram.minMembers}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      telegram: { ...currentConfig.telegram, minMembers: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discord Minimum Members
                  </label>
                  <input
                    type="number"
                    value={currentConfig.discord.minServerMembers}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      discord: { ...currentConfig.discord, minServerMembers: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Scoring System</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Required Score
                  </label>
                  <input
                    type="number"
                    value={currentConfig.requiredScore}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      requiredScore: parseInt(e.target.value) || 10
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter Follower Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={currentConfig.scoring.twitterFollowerMultiplier}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      scoring: { ...currentConfig.scoring, twitterFollowerMultiplier: parseFloat(e.target.value) || 1.0 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verified Account Bonus
                  </label>
                  <input
                    type="number"
                    value={currentConfig.scoring.verifiedAccountBonus}
                    onChange={(e) => setCurrentConfig({
                      ...currentConfig,
                      scoring: { ...currentConfig.scoring, verifiedAccountBonus: parseInt(e.target.value) || 10 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => {
                verificationConfigManager.updateConfig(currentConfig);
                loadConfig();
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Save Configuration
            </button>
            <button
              onClick={handleResetToDefault}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => handleApplyPreset('new_collections')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🚀 New Collections (Very Easy)
            </button>
            <button
              onClick={() => handleApplyPreset('growing_platform')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              📈 Growing Platform (Moderate)
            </button>
            <button
              onClick={() => handleApplyPreset('established_platform')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🏆 Established Platform (Strict)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
