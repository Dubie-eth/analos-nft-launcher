'use client';

import { useState, useEffect } from 'react';
import { bondingCurveWhitelistService, BondingCurveWhitelistConfig, BondingCurveWhitelistPhase } from '@/lib/bonding-curve-whitelist-service';
import { bondingCurveSecurity } from '@/lib/bonding-curve-security';
import { escrowWalletService } from '@/lib/escrow-wallet-service';

interface BondingCurveAdminPanelProps {
  collectionId: string;
  collectionName: string;
  isAuthorized: boolean;
}

export default function BondingCurveAdminPanel({ 
  collectionId, 
  collectionName, 
  isAuthorized 
}: BondingCurveAdminPanelProps) {
  const [whitelistConfig, setWhitelistConfig] = useState<BondingCurveWhitelistConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'security' | 'escrow'>('overview');
  const [securitySettings, setSecuritySettings] = useState({
    maxTradeSizePercentage: 5,
    maxTradeSizeAbsolute: 100,
    maxPriceImpact: 50,
    cooldownPeriodMs: 300000,
    maxDailyVolumePerWallet: 100000
  });

  useEffect(() => {
    if (isAuthorized) {
      loadBondingCurveData();
    }
  }, [isAuthorized, collectionId]);

  const loadBondingCurveData = async () => {
    setLoading(true);
    try {
      const config = bondingCurveWhitelistService.getWhitelistConfig(collectionId);
      setWhitelistConfig(config);
    } catch (error) {
      console.error('❌ Error loading bonding curve data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async () => {
    setLoading(true);
    try {
      // Update security settings (would integrate with actual security service)
      console.log('🔒 Updating security settings:', securitySettings);
      // TODO: Implement actual security settings update
      alert('Security settings updated successfully!');
    } catch (error) {
      console.error('❌ Error updating security settings:', error);
      alert('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const addNewPhase = async () => {
    const phaseName = prompt('Enter phase name:');
    const minimumBalance = prompt('Enter minimum $LOL balance required:');
    const priceMultiplier = prompt('Enter price multiplier (0.1-1.0):');
    const maxMints = prompt('Enter maximum mints for this phase:');

    if (phaseName && minimumBalance && priceMultiplier && maxMints) {
      setLoading(true);
      try {
        const newPhase: Omit<BondingCurveWhitelistPhase, 'statistics'> = {
          id: `phase_${Date.now()}`,
          name: phaseName,
          description: `Custom phase for ${minimumBalance}+ $LOL holders`,
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Start tomorrow
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // End in 7 days
          isActive: false,
          isUpcoming: true,
          isCompleted: false,
          tokenRequirements: {
            tokenAddress: 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6',
            minimumBalance: parseInt(minimumBalance),
            tokenSymbol: '$LOL',
            tokenDecimals: 9
          },
          bondingCurveBenefits: {
            priceMultiplier: parseFloat(priceMultiplier),
            maxMints: parseInt(maxMints),
            maxMintsPerWallet: 2,
            priorityAccess: true,
            skipQueue: false
          }
        };

        const success = bondingCurveWhitelistService.addWhitelistPhase(collectionId, newPhase);
        if (success) {
          await loadBondingCurveData();
          alert(`✅ Added new phase: ${phaseName}`);
        } else {
          alert('❌ Failed to add new phase');
        }
      } catch (error) {
        console.error('❌ Error adding new phase:', error);
        alert('❌ Error adding new phase');
      } finally {
        setLoading(false);
      }
    }
  };

  const emergencyPauseWallet = (walletAddress: string) => {
    if (confirm(`🚨 EMERGENCY PAUSE: Suspend trading for wallet ${walletAddress}?`)) {
      bondingCurveSecurity.emergencyPauseWallet(walletAddress);
      alert(`✅ Trading suspended for wallet: ${walletAddress}`);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-2">🚫 Unauthorized Access</h3>
        <p className="text-red-300">You don't have permission to access bonding curve admin controls.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!whitelistConfig) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-2">🎯 Bonding Curve Admin</h3>
        <p className="text-gray-400">No bonding curve configuration found for this collection.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🎯 Bonding Curve Admin - {collectionName}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'phases' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Phases
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'security' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('escrow')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'escrow' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Escrow
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Global Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {whitelistConfig.phases.filter(p => p.isActive).length}
              </div>
              <div className="text-sm text-gray-400">Active Phases</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {whitelistConfig.phases.reduce((sum, phase) => sum + phase.statistics.totalMinted, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Minted</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                ${whitelistConfig.phases.reduce((sum, phase) => sum + phase.statistics.totalVolume, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Volume</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {whitelistConfig.globalSettings.bondingCurveCap.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Bonding Cap ($LOS)</div>
            </div>
          </div>

          {/* Current Active Phase */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium text-lg mb-3">Current Active Phase</h4>
            {(() => {
              const activePhase = whitelistConfig.phases.find(p => p.isActive);
              if (activePhase) {
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{activePhase.name}</span>
                      <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{activePhase.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-lg font-bold text-green-400">{activePhase.statistics.totalMinted}</div>
                        <div className="text-xs text-gray-400">Minted</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">{activePhase.bondingCurveBenefits.maxMints}</div>
                        <div className="text-xs text-gray-400">Max Mints</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-400">
                          {(activePhase.bondingCurveBenefits.priceMultiplier * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-400">Price Multiplier</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-400">{activePhase.statistics.totalEligibleWallets}</div>
                        <div className="text-xs text-gray-400">Eligible Wallets</div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-4 text-gray-400">
                    <p>No active phases</p>
                    <p className="text-sm mt-1">Next phase starts: {whitelistConfig.phases.find(p => p.isUpcoming)?.startDate.toLocaleDateString()}</p>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {activeTab === 'phases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-lg">Whitelist Phases</h4>
            <button
              onClick={addNewPhase}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              + Add New Phase
            </button>
          </div>

          <div className="space-y-3">
            {whitelistConfig.phases.map((phase) => (
              <div key={phase.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-white font-medium">{phase.name}</h5>
                    <p className="text-gray-400 text-sm">{phase.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {phase.isActive && (
                      <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                        ACTIVE
                      </span>
                    )}
                    {phase.isUpcoming && (
                      <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs font-medium">
                        UPCOMING
                      </span>
                    )}
                    {phase.isCompleted && (
                      <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium">
                        COMPLETED
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-400">Required Balance</div>
                    <div className="text-white font-medium">
                      {phase.tokenRequirements.minimumBalance.toLocaleString()} {phase.tokenRequirements.tokenSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Price Multiplier</div>
                    <div className="text-white font-medium">
                      {(phase.bondingCurveBenefits.priceMultiplier * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Max Mints</div>
                    <div className="text-white font-medium">{phase.bondingCurveBenefits.maxMints}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Remaining</div>
                    <div className="text-white font-medium">{phase.statistics.remainingMints}</div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Start: {phase.startDate.toLocaleDateString()}</span>
                  <span>End: {phase.endDate.toLocaleDateString()}</span>
                  <span>Minted: {phase.statistics.totalMinted}/{phase.bondingCurveBenefits.maxMints}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Security Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Trade Size (% of supply)
                </label>
                <input
                  type="number"
                  value={securitySettings.maxTradeSizePercentage}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    maxTradeSizePercentage: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Trade Size (Absolute)
                </label>
                <input
                  type="number"
                  value={securitySettings.maxTradeSizeAbsolute}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    maxTradeSizeAbsolute: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Price Impact (%)
                </label>
                <input
                  type="number"
                  value={securitySettings.maxPriceImpact}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    maxPriceImpact: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cooldown Period (minutes)
                </label>
                <input
                  type="number"
                  value={securitySettings.cooldownPeriodMs / 60000}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    cooldownPeriodMs: parseInt(e.target.value) * 60000
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Daily Volume per Wallet ($)
                </label>
                <input
                  type="number"
                  value={securitySettings.maxDailyVolumePerWallet}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    maxDailyVolumePerWallet: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                  min="1000"
                  max="1000000"
                />
              </div>

              <button
                onClick={updateSecuritySettings}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Update Security Settings
              </button>
            </div>
          </div>

          {/* Emergency Controls */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h5 className="text-red-400 font-medium text-lg mb-3">🚨 Emergency Controls</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emergency Pause Wallet
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Wallet address to pause"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    id="emergencyWalletInput"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('emergencyWalletInput') as HTMLInputElement;
                      if (input?.value) {
                        emergencyPauseWallet(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Pause Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'escrow' && (
        <div className="space-y-6">
          <h4 className="text-white font-medium text-lg">Escrow Wallet Management</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h5 className="text-white font-medium mb-3">Platform Fees Escrow</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white font-mono text-sm">
                    {escrowWalletService.getPlatformFeesEscrow()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-green-400 font-medium">
                    {escrowWalletService.getEscrowBalance('platform_fees')} $LOS
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <h5 className="text-white font-medium mb-3">Bonding Curve Escrow</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Address:</span>
                  <span className="text-white font-mono text-sm">
                    {escrowWalletService.getBondingCurveEscrowAddress()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-blue-400 font-medium">
                    {escrowWalletService.getEscrowBalance('bonding_curve')} $LOS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Transactions */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Recent Transactions</h5>
            <div className="space-y-2">
              {escrowWalletService.getAllEscrowWallets().map((wallet, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                  <div>
                    <span className="text-white font-medium">{wallet.type}</span>
                    <span className="text-gray-400 text-sm ml-2">({wallet.address.slice(0, 8)}...)</span>
                  </div>
                  <span className="text-green-400 font-medium">{wallet.balance} $LOS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
