'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { Crown, Gift, Users, TrendingUp, Zap, Star, CheckCircle } from 'lucide-react';
import { LOLTokenChecker, LOLTokenStatus } from '@/lib/lol-token-checker';

interface WhitelistStats {
  totalWhitelisted: number;
  freeMintsClaimed: number;
  whitelistSlotsRemaining: number;
  isPublicLaunch: boolean;
  whitelistLimit: number;
}

interface LosBrosAllocation {
  tier: string;
  total_allocated: number;
  minted_count: number;
  requires_lol: number;
  is_active: boolean;
}

const LOLWhitelistPromo: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [whitelistStats, setWhitelistStats] = useState<WhitelistStats>({
    totalWhitelisted: 0,
    freeMintsClaimed: 0,
    whitelistSlotsRemaining: 100,
    isPublicLaunch: false,
    whitelistLimit: 100
  });
  const [lolStatus, setLolStatus] = useState<LOLTokenStatus | null>(null);
  const [losBrosAllocations, setLosBrosAllocations] = useState<LosBrosAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhitelistStats();
    loadLosBrosAllocations();
    if (connected && publicKey) {
      loadLOLStatus();
    }
  }, [connected, publicKey]);

  const loadWhitelistStats = async () => {
    try {
      const response = await fetch('/api/whitelist/status');
      const data = await response.json();
      
      if (data.success) {
        setWhitelistStats({
          totalWhitelisted: data.totalWhitelisted,
          freeMintsClaimed: data.freeMintsClaimed || 0,
          whitelistSlotsRemaining: data.whitelistSlotsRemaining,
          isPublicLaunch: data.isPublicLaunch,
          whitelistLimit: data.whitelistLimit
        });
      }
    } catch (error) {
      console.error('Error loading whitelist stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLOLStatus = async () => {
    if (!publicKey) return;

    try {
      const connection = new Connection('https://rpc.analos.io', 'confirmed');
      const checker = new LOLTokenChecker(connection);
      const status = await checker.checkLOLBalance(publicKey.toString());
      setLolStatus(status);
    } catch (error) {
      console.error('Error loading LOL status:', error);
    }
  };

  const loadLosBrosAllocations = async () => {
    try {
      const response = await fetch('/api/los-bros/allocations');
      const data = await response.json();
      
      if (data.success && data.allocations) {
        setLosBrosAllocations(data.allocations);
        console.log('📊 Los Bros allocations loaded:', data.allocations);
      }
    } catch (error) {
      console.error('Error loading Los Bros allocations:', error);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((whitelistStats.freeMintsClaimed / whitelistStats.whitelistLimit) * 100, 100);
  };

  const getStatusColor = () => {
    if (whitelistStats.isPublicLaunch) return 'from-green-500 to-emerald-600';
    if (whitelistStats.whitelistSlotsRemaining <= 10) return 'from-orange-500 to-red-600';
    return 'from-blue-500 to-purple-600';
  };

  const getStatusText = () => {
    if (whitelistStats.isPublicLaunch) return '🚀 Public Launch Active';
    if (whitelistStats.whitelistSlotsRemaining <= 10) return '⚡ Almost Full!';
    return '⏳ Whitelist Phase';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'TEAM': return '🎖️';
      case 'COMMUNITY': return '🎁';
      case 'EARLY': return '💎';
      case 'PUBLIC': return '🌍';
      default: return '🎨';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TEAM': return 'border-yellow-400 bg-yellow-900/20';
      case 'COMMUNITY': return 'border-green-400 bg-green-900/20';
      case 'EARLY': return 'border-blue-400 bg-blue-900/20';
      case 'PUBLIC': return 'border-purple-400 bg-purple-900/20';
      default: return 'border-gray-400 bg-gray-900/20';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'TEAM': return 'Team';
      case 'COMMUNITY': return 'Community (1M+ $LOL)';
      case 'EARLY': return 'Early Supporters (100k+ $LOL)';
      case 'PUBLIC': return 'Public Sale';
      default: return tier;
    }
  };

  const totalLosBrosMinted = losBrosAllocations.reduce((sum, alloc) => sum + alloc.minted_count, 0);
  const totalLosBrosAllocated = losBrosAllocations.reduce((sum, alloc) => sum + alloc.total_allocated, 0);
  const losBrosRemaining = totalLosBrosAllocated - totalLosBrosMinted;

  return (
    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 border border-gray-700 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Crown className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              🎨 Los Bros NFT - Live Allocation Tracker
            </h2>
            <p className="text-gray-300">
              Real-time whitelist tier availability with token gating & anti-bot protection
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full">
          <span className="text-white font-semibold text-sm">🔥 LIVE NOW</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Gift className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{totalLosBrosMinted}</div>
              <div className="text-sm text-gray-400">Los Bros Minted</div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{losBrosRemaining}</div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{totalLosBrosAllocated}</div>
              <div className="text-sm text-gray-400">Total Supply</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Allocations */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Whitelist Tier Allocations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {losBrosAllocations.map((allocation) => {
            const percentMinted = allocation.total_allocated > 0 
              ? (allocation.minted_count / allocation.total_allocated) * 100 
              : 0;
            const remaining = allocation.total_allocated - allocation.minted_count;

            return (
              <div 
                key={allocation.tier}
                className={`bg-black/40 rounded-lg p-4 border-2 ${getTierColor(allocation.tier)}`}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{getTierIcon(allocation.tier)}</div>
                  <h4 className="text-white font-bold text-sm">{getTierName(allocation.tier)}</h4>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Allocated:</span>
                    <span className="font-semibold text-white">{allocation.total_allocated}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Minted:</span>
                    <span className="font-semibold text-cyan-400">{allocation.minted_count}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Remaining:</span>
                    <span className="font-semibold text-green-400">{remaining}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentMinted}%` }}
                      ></div>
                    </div>
                    <div className="text-center mt-1 text-gray-400 text-xs">
                      {percentMinted.toFixed(1)}% minted
                    </div>
                  </div>

                  {allocation.requires_lol > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-center text-xs text-yellow-400">
                        Requires {(allocation.requires_lol / 1000000).toFixed(allocation.requires_lol >= 1000000 ? 0 : 1)}M $LOL
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOL Holder Benefits */}
        <div className="bg-black/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>$LOL Token Holder Benefits</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">🆓 FREE Los Bros mints (1M+ $LOL holders)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">💎 50% OFF for Early Supporters (100k+ $LOL)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">🛡️ Anti-bot 72-hour holding period protection</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">⚡ Priority access before public sale</span>
            </div>
          </div>
        </div>

        {/* How to Qualify */}
        <div className="bg-black/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span>How to Qualify</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">1</span>
              </div>
              <span className="text-gray-300">Hold 100k+ or 1M+ $LOL tokens</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">2</span>
              </div>
              <span className="text-gray-300">Hold for 72 hours (anti-bot protection)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">3</span>
              </div>
              <span className="text-gray-300">Connect wallet and mint Los Bro NFT</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Status - Always show, update based on connection */}
      <div className="mt-6 p-4 bg-black/30 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              connected && lolStatus?.isWhitelisted ? 'bg-green-500/20' : 'bg-blue-500/20'
            }`}>
              <Crown className={`w-5 h-5 ${
                connected && lolStatus?.isWhitelisted ? 'text-green-400' : 'text-blue-400'
              }`} />
            </div>
            <div>
              <h4 className="text-white font-semibold">
                {!connected 
                  ? '💎 $LOL Token Status' 
                  : lolStatus?.isWhitelisted 
                    ? '🎖️ You are Eligible!' 
                    : '💎 $LOL Token Status'
                }
              </h4>
              <p className="text-gray-400 text-sm">
                {!connected 
                  ? 'Connect wallet to check your eligibility'
                  : lolStatus 
                    ? `Balance: ${lolStatus.balanceFormatted}${lolStatus.whitelistPosition ? ` • Position #${lolStatus.whitelistPosition}` : ''}`
                    : 'Checking balance...'
                }
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          {connected && lolStatus && (
            <div className={`px-3 py-1 rounded-full ${
              lolStatus.isWhitelisted 
                ? 'bg-green-500/20 border border-green-500/50' 
                : lolStatus.balance >= 100000
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-gray-500/20 border border-gray-500/50'
            }`}>
              <span className={`text-sm font-semibold ${
                lolStatus.isWhitelisted 
                  ? 'text-green-400' 
                  : lolStatus.balance >= 100000
                    ? 'text-blue-400'
                    : 'text-gray-400'
              }`}>
                {lolStatus.isWhitelisted 
                  ? '✅ COMMUNITY' 
                  : lolStatus.balance >= 100000
                    ? '💎 EARLY'
                    : '🌍 PUBLIC'
                }
              </span>
            </div>
          )}

          {/* Connect Wallet CTA for non-connected users */}
          {!connected && (
            <button
              onClick={() => {
                // Trigger wallet connection - the wallet adapter modal will handle it
                const walletButton = document.querySelector('.wallet-adapter-button');
                if (walletButton) {
                  (walletButton as HTMLElement).click();
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Detailed tier info when connected */}
        {connected && lolStatus && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              {lolStatus.isWhitelisted ? (
                <span className="text-green-400">
                  ✅ You qualify for COMMUNITY tier (1M+ $LOL) - FREE mints with platform fee only!
                </span>
              ) : lolStatus.balance >= 100000 ? (
                <span className="text-blue-400">
                  💎 You qualify for EARLY SUPPORTER tier (100k+ $LOL) - 50% OFF mints!
                </span>
              ) : (
                <span className="text-gray-400">
                  🌍 You qualify for PUBLIC SALE tier - Dynamic pricing starting at 4,200.69 $LOS
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.href = '/collections/los-bros'}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
        >
          <Gift className="w-5 h-5" />
          <span>🎨 Mint Los Bro NFT Now!</span>
        </button>
      </div>
    </div>
  );
};

export default LOLWhitelistPromo;
