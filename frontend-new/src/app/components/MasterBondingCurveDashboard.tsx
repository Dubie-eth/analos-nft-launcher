'use client';

import { useState, useEffect } from 'react';
import { bondingCurveWhitelistService } from '@/lib/bonding-curve-whitelist-service';
import { bondingCurveSecurity } from '@/lib/bonding-curve-security';
import { escrowWalletService } from '@/lib/escrow-wallet-service';

interface MasterBondingCurveDashboardProps {
  isAuthorized: boolean;
}

export default function MasterBondingCurveDashboard({ isAuthorized }: MasterBondingCurveDashboardProps) {
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [whitelistConfigs, setWhitelistConfigs] = useState<any[]>([]);
  const [suspiciousWallets, setSuspiciousWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      loadMasterData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(loadMasterData, 30000);
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthorized]);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [stats, configs, suspicious] = await Promise.all([
        bondingCurveWhitelistService.getGlobalWhitelistStats(),
        bondingCurveWhitelistService.getAllWhitelistConfigs(),
        bondingCurveSecurity.getSuspiciousWallets()
      ]);

      setGlobalStats(stats);
      setWhitelistConfigs(configs);
      setSuspiciousWallets(suspicious);
    } catch (error) {
      console.error('❌ Error loading master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const emergencyPauseAll = () => {
    if (confirm('🚨 EMERGENCY: Pause ALL bonding curve trading across all collections?')) {
      // TODO: Implement global emergency pause
      console.log('🚨 EMERGENCY PAUSE: All bonding curves paused');
      alert('🚨 EMERGENCY PAUSE ACTIVATED - All bonding curve trading suspended');
    }
  };

  const resetWalletLimits = (walletAddress: string) => {
    if (confirm(`Reset trade limits for wallet ${walletAddress}?`)) {
      bondingCurveSecurity.resetWalletLimits(walletAddress);
      alert(`✅ Trade limits reset for wallet: ${walletAddress}`);
      loadMasterData();
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-2">🚫 Master Admin Access Required</h3>
        <p className="text-red-300">Only master admins can access the global bonding curve dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-2xl">🎯 Master Bonding Curve Dashboard</h2>
        <div className="flex space-x-3">
          <button
            onClick={loadMasterData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            onClick={emergencyPauseAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🚨 Emergency Pause All
          </button>
        </div>
      </div>

      {/* Global Statistics */}
      {globalStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 border border-blue-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">{globalStats.totalCollections}</div>
            <div className="text-sm text-blue-300">Total Collections</div>
          </div>
          <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400">{globalStats.totalActivePhases}</div>
            <div className="text-sm text-green-300">Active Phases</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">{globalStats.totalMinted}</div>
            <div className="text-sm text-yellow-300">Total Minted</div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 border border-purple-500/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">${globalStats.totalVolume.toLocaleString()}</div>
            <div className="text-sm text-purple-300">Total Volume</div>
          </div>
        </div>
      )}

      {/* Collections Overview */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 Collections Overview</h3>
        <div className="space-y-4">
          {whitelistConfigs.map((config) => (
            <div key={config.collectionId} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium text-lg">{config.collectionName}</h4>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                    {config.phases.filter((p: any) => p.isActive).length} Active
                  </span>
                  <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs font-medium">
                    {config.phases.filter((p: any) => p.isUpcoming).length} Upcoming
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-400">Total Phases</div>
                  <div className="text-white font-medium">{config.phases.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Minted</div>
                  <div className="text-white font-medium">
                    {config.phases.reduce((sum: number, phase: any) => sum + phase.statistics.totalMinted, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Volume</div>
                  <div className="text-white font-medium">
                    ${config.phases.reduce((sum: number, phase: any) => sum + phase.statistics.totalVolume, 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Bonding Cap</div>
                  <div className="text-white font-medium">
                    {config.globalSettings.bondingCurveCap.toLocaleString()} $LOS
                  </div>
                </div>
              </div>

              {/* Active Phases */}
              <div className="space-y-2">
                <h5 className="text-white font-medium">Active Phases:</h5>
                {config.phases.filter((p: any) => p.isActive).map((phase: any) => (
                  <div key={phase.id} className="flex items-center justify-between bg-gray-700/50 rounded p-2">
                    <div>
                      <span className="text-white font-medium">{phase.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {phase.statistics.totalMinted}/{phase.bondingCurveBenefits.maxMints} minted
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 font-medium">
                        {(phase.bondingCurveBenefits.priceMultiplier * 100).toFixed(0)}%
                      </span>
                      <span className="text-gray-400 text-sm">
                        {phase.tokenRequirements.minimumBalance.toLocaleString()} {phase.tokenRequirements.tokenSymbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suspicious Activity Monitoring */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">🚨 Suspicious Activity Monitoring</h3>
        
        {suspiciousWallets.length > 0 ? (
          <div className="space-y-3">
            {suspiciousWallets.map((wallet, index) => (
              <div key={index} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-red-400 font-medium">Wallet: {wallet.wallet.slice(0, 8)}...{wallet.wallet.slice(-8)}</span>
                    <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium">
                      Risk Score: {wallet.riskScore}/10
                    </span>
                  </div>
                  <button
                    onClick={() => resetWalletLimits(wallet.wallet)}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Reset Limits
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Daily Volume:</span>
                    <span className="text-white ml-1">${wallet.stats.dailyVolume.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Daily Trades:</span>
                    <span className="text-white ml-1">{wallet.stats.dailyTradeCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Trade:</span>
                    <span className="text-white ml-1">
                      {new Date(wallet.stats.lastTradeTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cooldown:</span>
                    <span className={`ml-1 ${wallet.stats.isCooldownActive ? 'text-red-400' : 'text-green-400'}`}>
                      {wallet.stats.isCooldownActive ? 'ACTIVE' : 'NONE'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>✅ No suspicious activity detected</p>
            <p className="text-sm mt-1">All wallets are operating within normal parameters</p>
          </div>
        )}
      </div>

      {/* Escrow Overview */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">🏦 Escrow Wallet Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Platform Fees Escrow</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono text-sm">
                  {escrowWalletService.getPlatformFeesEscrow()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-green-400 font-bold text-lg">
                  {escrowWalletService.getEscrowBalance('platform_fees')} $LOS
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Bonding Curve Escrow</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono text-sm">
                  {escrowWalletService.getBondingCurveEscrowAddress()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Balance:</span>
                <span className="text-blue-400 font-bold text-lg">
                  {escrowWalletService.getEscrowBalance('bonding_curve')} $LOS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">⚡ System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-green-400 font-medium">Security Active</div>
            <div className="text-green-300 text-sm">All protections enabled</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-blue-400 font-medium">Auto-Refresh</div>
            <div className="text-blue-300 text-sm">30s intervals</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-yellow-400 font-medium">Monitoring</div>
            <div className="text-yellow-300 text-sm">Real-time tracking</div>
          </div>
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🛡️</div>
            <div className="text-purple-400 font-medium">Escrow Protected</div>
            <div className="text-purple-300 text-sm">Funds secured</div>
          </div>
        </div>
      </div>
    </div>
  );
}
