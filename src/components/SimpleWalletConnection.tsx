'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface SimpleWalletConnectionProps {
  className?: string;
}

export default function SimpleWalletConnection({ className = '' }: SimpleWalletConnectionProps) {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setVisible(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${className}`}
      >
        {isConnecting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>🔒</span>
            <span>Connect Wallet</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Connected Wallet Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-semibold">Connected</span>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
            Active
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
  );
}
