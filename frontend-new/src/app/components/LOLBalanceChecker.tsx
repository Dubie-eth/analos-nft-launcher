'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { lolBalanceChecker, LOLBalanceInfo } from '@/lib/lol-balance-checker';

interface LOLBalanceCheckerProps {
  minimumRequired?: number;
  onBalanceUpdate?: (balanceInfo: LOLBalanceInfo) => void;
}

export default function LOLBalanceChecker({ 
  minimumRequired = 1000, 
  onBalanceUpdate 
}: LOLBalanceCheckerProps) {
  const { publicKey, connected } = useWallet();
  const [balanceInfo, setBalanceInfo] = useState<LOLBalanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const checkBalance = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError('');

    try {
      const balance = await lolBalanceChecker.checkLOLBalance(publicKey.toString(), minimumRequired);
      setBalanceInfo(balance);
      onBalanceUpdate?.(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
    } else {
      setBalanceInfo(null);
      setError('');
    }
  }, [connected, publicKey, minimumRequired]);

  if (!connected || !publicKey) {
    return (
      <div className="bg-white/10 rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🪙</div>
            <div>
              <h3 className="text-white font-semibold">$LOL Balance Check</h3>
              <p className="text-gray-300 text-sm">Connect wallet to check balance</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🪙</div>
          <div>
            <h3 className="text-white font-semibold">$LOL Balance Check</h3>
            <p className="text-gray-300 text-sm">Minimum required: {minimumRequired.toLocaleString()} $LOL</p>
          </div>
        </div>
        <button
          onClick={checkBalance}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {balanceInfo && (
        <div className={`p-4 rounded-lg border ${
          balanceInfo.hasMinimumBalance 
            ? 'bg-green-500/20 border-green-500/50' 
            : 'bg-red-500/20 border-red-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold ${
              balanceInfo.hasMinimumBalance ? 'text-green-400' : 'text-red-400'
            }`}>
              {balanceInfo.hasMinimumBalance ? '✅ Eligible' : '❌ Not Eligible'}
            </span>
            <span className="text-white font-bold">
              {parseFloat(balanceInfo.balanceFormatted).toFixed(2)} / {minimumRequired.toLocaleString()} $LOL
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Wallet:</span>
              <span className="font-mono">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span className="font-mono">{parseFloat(balanceInfo.balanceFormatted).toFixed(2)} $LOL</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Required:</span>
              <span className="font-mono">{minimumRequired.toLocaleString()} $LOL</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={balanceInfo.hasMinimumBalance ? 'text-green-400' : 'text-red-400'}>
                {balanceInfo.hasMinimumBalance 
                  ? 'Sufficient balance' 
                  : `You need ${balanceInfo.shortfall.toLocaleString()} more $LOL tokens`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
