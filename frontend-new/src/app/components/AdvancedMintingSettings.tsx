'use client';

import { useState } from 'react';

interface AdvancedMintingSettingsProps {
  onSettingsChange: (settings: any) => void;
  initialSettings?: any;
}

export default function AdvancedMintingSettings({ onSettingsChange, initialSettings }: AdvancedMintingSettingsProps) {
  const [settings, setSettings] = useState({
    maxMintsPerWallet: initialSettings?.maxMintsPerWallet || 10,
    delayedReveal: {
      enabled: initialSettings?.delayedReveal?.enabled || false,
      type: initialSettings?.delayedReveal?.type || 'manual',
      revealTime: initialSettings?.delayedReveal?.revealTime || '',
      revealAtCompletion: initialSettings?.delayedReveal?.revealAtCompletion || false,
      placeholderImage: initialSettings?.delayedReveal?.placeholderImage || 'https://picsum.photos/300/300?random=placeholder'
    },
    whitelist: {
      enabled: initialSettings?.whitelist?.enabled || false,
      addresses: initialSettings?.whitelist?.addresses || [],
      phases: initialSettings?.whitelist?.phases || []
    },
    ...initialSettings
  });

  const [newWhitelistAddress, setNewWhitelistAddress] = useState('');
  const [newPhase, setNewPhase] = useState({
    name: '',
    startTime: '',
    endTime: '',
    maxMintsPerWallet: 5,
    price: 0,
    addresses: [] as string[]
  });

  const handleSettingChange = (path: string, value: any) => {
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const addToWhitelist = () => {
    if (newWhitelistAddress.trim()) {
      const addresses = [...settings.whitelist.addresses, newWhitelistAddress.trim()];
      handleSettingChange('whitelist.addresses', addresses);
      setNewWhitelistAddress('');
    }
  };

  const removeFromWhitelist = (index: number) => {
    const addresses = settings.whitelist.addresses.filter((_: any, i: number) => i !== index);
    handleSettingChange('whitelist.addresses', addresses);
  };

  const addWhitelistPhase = () => {
    if (newPhase.name.trim()) {
      const phase = {
        ...newPhase,
        startTime: new Date(newPhase.startTime).getTime(),
        endTime: new Date(newPhase.endTime).getTime(),
        active: true
      };
      
      const phases = [...settings.whitelist.phases, phase];
      handleSettingChange('whitelist.phases', phases);
      
      // Reset form
      setNewPhase({
        name: '',
        startTime: '',
        endTime: '',
        maxMintsPerWallet: 5,
        price: 0,
        addresses: []
      });
    }
  };

  const removeWhitelistPhase = (index: number) => {
    const phases = settings.whitelist.phases.filter((_: any, i: number) => i !== index);
    handleSettingChange('whitelist.phases', phases);
  };

  return (
    <div className="space-y-8">
      {/* Max Mints Per Wallet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Max Mints Per Wallet</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            value={settings.maxMintsPerWallet}
            onChange={(e) => handleSettingChange('maxMintsPerWallet', parseInt(e.target.value) || 1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <span className="text-gray-600 dark:text-gray-300">NFTs per wallet</span>
        </div>
      </div>

      {/* Delayed Reveal Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎭 Delayed Reveal</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <input
            type="checkbox"
            checked={settings.delayedReveal.enabled}
            onChange={(e) => handleSettingChange('delayedReveal.enabled', e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Enable delayed reveal</span>
        </div>

        {settings.delayedReveal.enabled && (
          <div className="space-y-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reveal Type
              </label>
              <select
                value={settings.delayedReveal.type}
                onChange={(e) => handleSettingChange('delayedReveal.type', e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="manual">Manual Reveal</option>
                <option value="timer">Timer Based</option>
                <option value="completion">On Collection Completion</option>
              </select>
            </div>

            {settings.delayedReveal.type === 'timer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reveal Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={settings.delayedReveal.revealTime ? new Date(settings.delayedReveal.revealTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleSettingChange('delayedReveal.revealTime', new Date(e.target.value).getTime())}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            {settings.delayedReveal.type === 'completion' && (
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={settings.delayedReveal.revealAtCompletion}
                  onChange={(e) => handleSettingChange('delayedReveal.revealAtCompletion', e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Reveal when collection is 100% minted</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Placeholder Image URL
              </label>
              <input
                type="url"
                value={settings.delayedReveal.placeholderImage}
                onChange={(e) => handleSettingChange('delayedReveal.placeholderImage', e.target.value)}
                placeholder="https://example.com/placeholder.jpg"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Whitelist Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Whitelist Management</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <input
            type="checkbox"
            checked={settings.whitelist.enabled}
            onChange={(e) => handleSettingChange('whitelist.enabled', e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Enable whitelist</span>
        </div>

        {settings.whitelist.enabled && (
          <div className="space-y-4">
            {/* Add to Whitelist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWhitelistAddress}
                  onChange={(e) => setNewWhitelistAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={addToWhitelist}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Whitelist Addresses */}
            {settings.whitelist.addresses.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  Whitelisted Addresses ({settings.whitelist.addresses.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {settings.whitelist.addresses.map((address: string, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{address}</span>
                      <button
                        onClick={() => removeFromWhitelist(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Whitelist Phases */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">🎯 Whitelist Phases</h4>
              
              {/* Add New Phase */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add New Phase</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={newPhase.name}
                    onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                    placeholder="Phase Name"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    value={newPhase.maxMintsPerWallet}
                    onChange={(e) => setNewPhase({ ...newPhase, maxMintsPerWallet: parseInt(e.target.value) || 1 })}
                    placeholder="Max mints per wallet"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="datetime-local"
                    value={newPhase.startTime}
                    onChange={(e) => setNewPhase({ ...newPhase, startTime: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="datetime-local"
                    value={newPhase.endTime}
                    onChange={(e) => setNewPhase({ ...newPhase, endTime: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newPhase.price}
                    onChange={(e) => setNewPhase({ ...newPhase, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Phase Price"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={addWhitelistPhase}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Phase
                  </button>
                </div>
              </div>

              {/* Existing Phases */}
              {settings.whitelist.phases.length > 0 && (
                <div className="space-y-2">
                  {settings.whitelist.phases.map((phase: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{phase.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                          {new Date(phase.startTime).toLocaleDateString()} - {new Date(phase.endTime).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                          ({phase.maxMintsPerWallet} per wallet, {phase.price} $LOS)
                        </span>
                      </div>
                      <button
                        onClick={() => removeWhitelistPhase(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
