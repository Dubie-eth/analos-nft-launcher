'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WhitelistEntry {
  walletAddress: string;
  maxMints: number;
  mintedCount: number;
  addedAt: number;
  addedBy: string;
  notes?: string;
}

interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number; // 1.0 = normal price, 0.5 = half price, 0 = free
  maxMintsPerWallet: number;
  entries: WhitelistEntry[];
}

interface WhitelistManagerProps {
  collectionId: string;
  collectionName: string;
  onWhitelistChange?: (phases: WhitelistPhase[]) => void;
  initialPhases?: WhitelistPhase[];
}

export default function WhitelistManager({ 
  collectionId, 
  collectionName, 
  onWhitelistChange,
  initialPhases = []
}: WhitelistManagerProps) {
  const { publicKey } = useWallet();
  const [phases, setPhases] = useState<WhitelistPhase[]>(initialPhases);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState<string | null>(null);
  const [newPhase, setNewPhase] = useState({
    name: '',
    startDate: '',
    endDate: '',
    priceMultiplier: 1.0,
    maxMintsPerWallet: 1,
    enabled: true
  });
  const [newEntry, setNewEntry] = useState({
    walletAddress: '',
    maxMints: 1,
    notes: ''
  });

  // Load whitelist data from localStorage
  useEffect(() => {
    const savedPhases = localStorage.getItem(`whitelist_${collectionId}`);
    if (savedPhases) {
      try {
        const parsedPhases = JSON.parse(savedPhases);
        setPhases(parsedPhases);
        onWhitelistChange?.(parsedPhases);
      } catch (error) {
        console.error('Error loading whitelist data:', error);
      }
    }
  }, [collectionId, onWhitelistChange]);

  // Save whitelist data to localStorage
  const saveWhitelistData = (updatedPhases: WhitelistPhase[]) => {
    localStorage.setItem(`whitelist_${collectionId}`, JSON.stringify(updatedPhases));
    setPhases(updatedPhases);
    onWhitelistChange?.(updatedPhases);
  };

  const addPhase = () => {
    if (!newPhase.name.trim()) return;

    const phase: WhitelistPhase = {
      id: `phase_${Date.now()}`,
      name: newPhase.name.trim(),
      enabled: newPhase.enabled,
      startDate: newPhase.startDate,
      endDate: newPhase.endDate,
      priceMultiplier: newPhase.priceMultiplier,
      maxMintsPerWallet: newPhase.maxMintsPerWallet,
      entries: []
    };

    const updatedPhases = [...phases, phase];
    saveWhitelistData(updatedPhases);
    
    setNewPhase({
      name: '',
      startDate: '',
      endDate: '',
      priceMultiplier: 1.0,
      maxMintsPerWallet: 1,
      enabled: true
    });
    setShowAddPhase(false);
  };

  const addEntry = (phaseId: string) => {
    if (!newEntry.walletAddress.trim()) return;

    const entry: WhitelistEntry = {
      walletAddress: newEntry.walletAddress.trim(),
      maxMints: newEntry.maxMints,
      mintedCount: 0,
      addedAt: Date.now(),
      addedBy: publicKey?.toString() || 'unknown',
      notes: newEntry.notes.trim() || undefined
    };

    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          entries: [...phase.entries, entry]
        };
      }
      return phase;
    });

    saveWhitelistData(updatedPhases);
    
    setNewEntry({
      walletAddress: '',
      maxMints: 1,
      notes: ''
    });
    setShowAddEntry(null);
  };

  const removePhase = (phaseId: string) => {
    if (!confirm('Are you sure you want to remove this whitelist phase? This action cannot be undone.')) return;
    
    const updatedPhases = phases.filter(phase => phase.id !== phaseId);
    saveWhitelistData(updatedPhases);
  };

  const removeEntry = (phaseId: string, walletAddress: string) => {
    if (!confirm('Are you sure you want to remove this wallet from the whitelist?')) return;
    
    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          entries: phase.entries.filter(entry => entry.walletAddress !== walletAddress)
        };
      }
      return phase;
    });

    saveWhitelistData(updatedPhases);
  };

  const togglePhase = (phaseId: string) => {
    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        return { ...phase, enabled: !phase.enabled };
      }
      return phase;
    });
    saveWhitelistData(updatedPhases);
  };

  const getCurrentPhase = () => {
    const now = new Date();
    return phases.find(phase => {
      if (!phase.enabled) return false;
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      return now >= startDate && now <= endDate;
    });
  };

  const getWalletWhitelistStatus = (walletAddress: string) => {
    const currentPhase = getCurrentPhase();
    if (!currentPhase) return null;

    const entry = currentPhase.entries.find(e => e.walletAddress === walletAddress);
    if (!entry) return null;

    return {
      phase: currentPhase,
      entry: entry,
      canMint: entry.mintedCount < entry.maxMints,
      remainingMints: entry.maxMints - entry.mintedCount,
      priceMultiplier: currentPhase.priceMultiplier
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🔐 Whitelist Management
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Manage whitelist phases and wallet addresses for <strong>{collectionName}</strong>. 
        Whitelisted users get priority access and may receive discounted pricing.
      </p>

      {/* Current Phase Status */}
      {phases.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            📊 Current Status
          </h4>
          {getCurrentPhase() ? (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div><strong>Active Phase:</strong> {getCurrentPhase()?.name}</div>
              <div><strong>Price Multiplier:</strong> {getCurrentPhase()?.priceMultiplier}x</div>
              <div><strong>Max Mints per Wallet:</strong> {getCurrentPhase()?.maxMintsPerWallet}</div>
              <div><strong>Total Whitelisted:</strong> {getCurrentPhase()?.entries.length} wallets</div>
            </div>
          ) : (
            <div className="text-sm text-blue-800 dark:text-blue-200">
              No active whitelist phase. All phases are either disabled or outside their date range.
            </div>
          )}
        </div>
      )}

      {/* Add New Phase */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddPhase(!showAddPhase)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm mb-4"
        >
          {showAddPhase ? 'Cancel' : '+ Add Whitelist Phase'}
        </button>

        {showAddPhase && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">New Whitelist Phase</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phase Name
                </label>
                <input
                  type="text"
                  value={newPhase.name}
                  onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                  placeholder="e.g., VIP Phase, Early Access"
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
                  value={newPhase.priceMultiplier}
                  onChange={(e) => setNewPhase({ ...newPhase, priceMultiplier: parseFloat(e.target.value) || 1 })}
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
                  value={newPhase.startDate}
                  onChange={(e) => setNewPhase({ ...newPhase, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={newPhase.endDate}
                  onChange={(e) => setNewPhase({ ...newPhase, endDate: e.target.value })}
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
                  value={newPhase.maxMintsPerWallet}
                  onChange={(e) => setNewPhase({ ...newPhase, maxMintsPerWallet: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newPhase.enabled}
                    onChange={(e) => setNewPhase({ ...newPhase, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Phase</span>
                </label>
              </div>
            </div>

            <button
              onClick={addPhase}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
            >
              Add Phase
            </button>
          </div>
        )}
      </div>

      {/* Existing Phases */}
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {phase.name}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  phase.enabled 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {phase.enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {phase.entries.length} wallets
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className={`px-3 py-1 text-xs rounded ${
                    phase.enabled
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                  }`}
                >
                  {phase.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => setShowAddEntry(showAddEntry === phase.id ? null : phase.id)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add Wallet
                </button>
                <button
                  onClick={() => removePhase(phase.id)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              <div><strong>Period:</strong> {phase.startDate} to {phase.endDate}</div>
              <div><strong>Price:</strong> {phase.priceMultiplier}x normal price</div>
              <div><strong>Max per Wallet:</strong> {phase.maxMintsPerWallet} mints</div>
            </div>

            {/* Add Entry Form */}
            {showAddEntry === phase.id && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 mb-3">
                <h5 className="text-xs font-medium text-gray-900 dark:text-white mb-2">Add Wallet to Whitelist</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={newEntry.walletAddress}
                      onChange={(e) => setNewEntry({ ...newEntry, walletAddress: e.target.value })}
                      placeholder="Enter wallet address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Mints
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newEntry.maxMints}
                      onChange={(e) => setNewEntry({ ...newEntry, maxMints: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newEntry.notes}
                      onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                      placeholder="e.g., VIP member"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addEntry(phase.id)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Wallet
                  </button>
                  <button
                    onClick={() => setShowAddEntry(null)}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Whitelist Entries */}
            {phase.entries.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-900 dark:text-white">Whitelisted Wallets:</h5>
                {phase.entries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-gray-800 dark:text-gray-200">
                        {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-8)}
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{entry.notes}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {entry.mintedCount}/{entry.maxMints} minted
                      </div>
                      <button
                        onClick={() => removeEntry(phase.id, entry.walletAddress)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {phases.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🔐</div>
          <p>No whitelist phases configured yet.</p>
          <p className="text-sm">Add a phase to start managing whitelisted wallets.</p>
        </div>
      )}
    </div>
  );
}
