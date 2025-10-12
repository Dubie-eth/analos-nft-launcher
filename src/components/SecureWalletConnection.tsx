'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';

interface SecureWalletConnectionProps {
  className?: string;
}

export default function SecureWalletConnection({ className = '' }: SecureWalletConnectionProps) {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Enhanced security: Check if wallet is likely a burner wallet
  useEffect(() => {
    if (connected && publicKey) {
      // Check if wallet address suggests it's a new/burner wallet
      // This is a simple heuristic - in production you'd want more sophisticated checks
      const address = publicKey.toString();
      
      // Simple checks for burner wallet indicators
      const isLikelyBurner = 
        address.length === 44 && // Valid Solana address length
        address.startsWith('ANAL'); // Analos-specific addresses
      
      setIsBurnerWallet(isLikelyBurner);
      
      // Show warning if not using a burner wallet
      if (!isLikelyBurner) {
        setShowWarning(true);
      }
    }
  }, [connected, publicKey]);

  const handleConnect = () => {
    // Enhanced security: Show warning before connecting
    const userConfirmed = window.confirm(
      '🔒 SECURITY WARNING 🔒\n\n' +
      'Please ensure you are using a BURNER WALLET with minimal funds.\n\n' +
      '✅ Recommended: Create a new wallet specifically for testing\n' +
      '❌ Avoid: Using your main wallet with significant funds\n\n' +
      'This platform is in BETA. Do you want to continue?'
    );
    
    if (userConfirmed) {
      setVisible(true);
    }
  };

  const handleDisconnect = () => {
    const userConfirmed = window.confirm('Are you sure you want to disconnect your wallet?');
    if (userConfirmed) {
      disconnect();
      setShowWarning(false);
    }
  };

  return (
    <div className={className}>
      {/* Security Warning */}
      {showWarning && connected && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-400 text-xl">⚠️</span>
            <h4 className="font-bold text-red-300">Security Warning</h4>
          </div>
          <p className="text-red-200 text-sm">
            You're using a wallet that may contain significant funds. For safety, 
            consider using a burner wallet with minimal funds for testing.
          </p>
          <button
            onClick={() => setShowWarning(false)}
            className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
          >
            I understand the risks
          </button>
        </div>
      )}

      {/* Burner Wallet Indicator */}
      {isBurnerWallet && connected && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400 text-xl">✅</span>
            <h4 className="font-bold text-green-300">Secure Wallet Detected</h4>
          </div>
          <p className="text-green-200 text-sm">
            Good! You're using what appears to be a burner wallet. This is the recommended approach for testing.
          </p>
        </div>
      )}

      {/* Wallet Connection */}
      {!connected ? (
        <button
          onClick={handleConnect}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <span>🔒</span>
            <span>Connect Secure Wallet</span>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          {/* Connected Wallet Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Connected Wallet</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isBurnerWallet ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isBurnerWallet ? 'Secure' : 'Caution'}
              </span>
            </div>
            <div className="text-sm text-gray-300 mb-2">
              <div className="font-mono break-all wallet-address">
                {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </div>
              {wallet && (
                <div className="text-xs text-gray-400 mt-1">
                  {wallet.adapter.name}
                </div>
              )}
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 py-2 px-4 rounded-lg transition-all duration-200"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
