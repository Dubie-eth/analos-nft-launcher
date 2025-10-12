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

  // For navigation, show a simplified version
  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-sm ${className}`}
      >
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>Connect Wallet</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Connected Wallet Info - Compact */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-semibold text-sm">Connected</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            isBurnerWallet ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isBurnerWallet ? 'Secure' : 'Caution'}
          </span>
        </div>
        <div className="text-xs text-gray-300 mb-2">
          <div className="font-mono break-all wallet-address">
            {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-6)}
          </div>
          {wallet && (
            <div className="text-xs text-gray-400 mt-1">
              {wallet.adapter.name}
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Button - Compact */}
      <button
        onClick={handleDisconnect}
        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 py-1 px-3 rounded-lg transition-all duration-200 text-sm"
      >
        Disconnect
      </button>
    </div>
  );
}
