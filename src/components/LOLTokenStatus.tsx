'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { Crown, Star, Gift, Percent, Zap, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { LOLTokenChecker, LOLTokenStatus } from '@/lib/lol-token-checker';

interface LOLTokenStatusProps {
  onStatusUpdate?: (status: LOLTokenStatus) => void;
  showBenefits?: boolean;
  className?: string;
}

const LOLTokenStatusComponent: React.FC<LOLTokenStatusProps> = ({
  onStatusUpdate,
  showBenefits = true,
  className = ''
}) => {
  const { connected, publicKey } = useWallet();
  const [status, setStatus] = useState<LOLTokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      checkLOLBalance();
    } else {
      setStatus(null);
    }
  }, [connected, publicKey]);

  const checkLOLBalance = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection('https://rpc.analos.io', 'confirmed');
      const checker = new LOLTokenChecker(connection);
      
      const lolStatus = await checker.checkLOLBalance(publicKey.toString());
      setStatus(lolStatus);
      
      if (onStatusUpdate) {
        onStatusUpdate(lolStatus);
      }
    } catch (error) {
      console.error('Error checking LOL balance:', error);
      setError('Failed to check LOL token balance');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'supporter': return <Crown className="w-5 h-5 text-yellow-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'supporter': return 'from-yellow-500 to-orange-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  if (!connected) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <span>Connect wallet to check LOL token status</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="flex items-center space-x-2 text-blue-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span>Checking LOL token balance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={checkLOLBalance}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getTierIcon(status.tier)}
          <div>
            <h3 className="text-white font-semibold">
              {status.isWhitelisted ? '🎖️ Loyal Supporter' : '💎 LOL Token Status'}
            </h3>
            <p className="text-gray-400 text-sm">
              Balance: {status.balanceFormatted}
            </p>
          </div>
        </div>
        {status.isWhitelisted && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
            <span className="text-green-400 text-sm font-semibold">WHITELISTED</span>
          </div>
        )}
      </div>

      {/* Status Card */}
      <div className={`bg-gradient-to-r ${getTierColor(status.tier)} rounded-lg p-4 mb-4`}>
        <div className="text-white">
          <div className="flex items-center space-x-2 mb-2">
            {getTierIcon(status.tier)}
            <span className="font-bold text-lg capitalize">{status.tier} Tier</span>
          </div>
          <p className="text-sm opacity-90">
            {status.isWhitelisted 
              ? 'Congratulations! You qualify for special benefits!' 
              : 'Hold 1M+ LOL tokens to unlock whitelist benefits'
            }
          </p>
        </div>
      </div>

      {/* Benefits */}
      {showBenefits && (
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Your Benefits</span>
          </h4>
          <div className="space-y-2">
            {status.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{status.freeMintsAvailable}</div>
          <div className="text-xs text-gray-400">Free Mints</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{status.discountPercentage}%</div>
          <div className="text-xs text-gray-400">Discount</div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={checkLOLBalance}
        className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Zap className="w-4 h-4" />
        <span>Refresh Status</span>
      </button>
    </div>
  );
};

export default LOLTokenStatusComponent;
