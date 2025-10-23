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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhitelistStats();
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

  return (
    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 border border-gray-700 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Crown className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {whitelistStats.isPublicLaunch ? '🎉 Public Launch Active!' : '🎖️ LOL Token Holder Benefits'}
            </h2>
            <p className="text-gray-300">
              {whitelistStats.isPublicLaunch 
                ? 'Everyone can now mint! LOL holders still get special benefits.'
                : 'Hold 1M+ LOL tokens for exclusive whitelist access'
              }
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 bg-gradient-to-r ${getStatusColor()} rounded-full`}>
          <span className="text-white font-semibold text-sm">{getStatusText()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{whitelistStats.totalWhitelisted}</div>
              <div className="text-sm text-gray-400">Whitelisted Wallets</div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Gift className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{whitelistStats.freeMintsClaimed}</div>
              <div className="text-sm text-gray-400">Free Mints Claimed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-white">{whitelistStats.whitelistSlotsRemaining}</div>
              <div className="text-sm text-gray-400">Slots Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Free Mints Progress</span>
          <span className="text-gray-400 text-sm">
            {whitelistStats.freeMintsClaimed} / {whitelistStats.whitelistLimit} claimed
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="text-center mt-2">
          <span className="text-gray-400 text-sm">
            {whitelistStats.isPublicLaunch 
              ? '🎉 Public launch reached! Everyone can mint now!'
              : `${whitelistStats.whitelistSlotsRemaining} slots left until public launch`
            }
          </span>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOL Holder Benefits */}
        <div className="bg-black/20 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>LOL Token Holder Benefits</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">🆓 1 Free Profile NFT Mint per wallet</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">💰 Pay only minting and hosting costs</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">⭐ Priority support and early access</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">🎨 Special supporter badge and backgrounds</span>
            </div>
          </div>
        </div>

        {/* Requirements */}
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
              <span className="text-gray-300">Hold 1,000,000+ LOL tokens</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">2</span>
              </div>
              <span className="text-gray-300">Connect your wallet to check status</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">3</span>
              </div>
              <span className="text-gray-300">
                {whitelistStats.isPublicLaunch 
                  ? 'Mint your free Profile NFT now!'
                  : 'Get whitelisted for early access'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Status */}
      {connected && lolStatus && (
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                lolStatus.isWhitelisted ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Crown className={`w-5 h-5 ${
                  lolStatus.isWhitelisted ? 'text-green-400' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h4 className="text-white font-semibold">
                  {lolStatus.isWhitelisted ? '🎖️ You are Whitelisted!' : '💎 LOL Token Status'}
                </h4>
                <p className="text-gray-400 text-sm">
                  Balance: {lolStatus.balanceFormatted}
                  {lolStatus.whitelistPosition && ` • Position #${lolStatus.whitelistPosition}`}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${
              lolStatus.isWhitelisted 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-gray-500/20 border border-gray-500/50'
            }`}>
              <span className={`text-sm font-semibold ${
                lolStatus.isWhitelisted ? 'text-green-400' : 'text-gray-400'
              }`}>
                {lolStatus.isWhitelisted ? 'ELIGIBLE' : 'CHECK STATUS'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.href = '/profile'}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
        >
          <Gift className="w-5 h-5" />
          <span>
            {whitelistStats.isPublicLaunch 
              ? 'Mint Your Profile NFT Now!' 
              : 'Check Your LOL Status'
            }
          </span>
        </button>
      </div>
    </div>
  );
};

export default LOLWhitelistPromo;
