'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { losBalanceChecker, LOSBalanceInfo } from '@/lib/los-balance-checker';

interface LOSBalanceCheckerProps {
  minimumBalance?: number;
  onBalanceChecked?: (balanceInfo: LOSBalanceInfo) => void;
  showDetails?: boolean;
}

export default function LOSBalanceChecker({ 
  minimumBalance = 1000, 
  onBalanceChecked,
  showDetails = true 
}: LOSBalanceCheckerProps) {
  const { publicKey, connected } = useWallet();
  const [balanceInfo, setBalanceInfo] = useState<LOSBalanceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await losBalanceChecker.checkLOSBalance(
        publicKey.toBase58(),
        minimumBalance
      );
      
      setBalanceInfo(result);
      
      if (onBalanceChecked) {
        onBalanceChecked(result);
      }
    } catch (err: any) {
      console.error('Error checking $LOS balance:', err);
      setError('Failed to check $LOS balance');
    } finally {
      setLoading(false);
    }
  };

  // Auto-check balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
    } else {
      setBalanceInfo(null);
      setError(null);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Connect your wallet to check $LOS balance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Check Section */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            💰 $LOS Balance Check
          </h3>
          <button
            onClick={checkBalance}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors"
          >
            {loading ? '🔄 Checking...' : '🔄 Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        {balanceInfo && (
          <div className="space-y-2">
            {/* Balance Status */}
            <div className={`p-3 rounded-lg ${
              balanceInfo.hasMinimumBalance 
                ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700' 
                : 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  balanceInfo.hasMinimumBalance ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {balanceInfo.hasMinimumBalance ? '✅ Eligible to Mint' : '❌ Not Eligible'}
                </span>
                <span className={`text-sm ${
                  balanceInfo.hasMinimumBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {balanceInfo.losBalanceFormatted.toFixed(2)} / {minimumBalance} $LOS
                </span>
              </div>
            </div>

            {/* Detailed Info */}
            {showDetails && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Wallet:</strong> {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</p>
                <p><strong>Current Balance:</strong> {balanceInfo.losBalanceFormatted.toFixed(2)} $LOS</p>
                <p><strong>Minimum Required:</strong> {minimumBalance} $LOS</p>
                <p><strong>Status:</strong> {
                  balanceInfo.hasMinimumBalance 
                    ? 'You can mint NFTs!' 
                    : `You need ${(minimumBalance - balanceInfo.losBalanceFormatted).toFixed(2)} more $LOS tokens`
                }</p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Checking $LOS balance...</span>
          </div>
        )}
      </div>
    </div>
  );
}
