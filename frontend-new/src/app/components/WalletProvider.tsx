'use client';

import React, { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { AnalosConnection, ANALOS_CONFIG } from '../../lib/analos-web3-wrapper';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  // Use official Analos RPC endpoint
  const endpoint = ANALOS_CONFIG.RPC_ENDPOINT;

  // Create Analos-specific connection for enhanced functionality
  const analosConnection = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    console.log('🔗 Creating Analos Connection...');
    
    const connection = new AnalosConnection(endpoint, {
      network: ANALOS_CONFIG.NETWORK,
      commitment: ANALOS_CONFIG.COMMITMENT,
      confirmTransactionInitialTimeout: ANALOS_CONFIG.CONFIRM_TRANSACTION_TIMEOUT
    });
    
    console.log('✅ Analos Connection created:', connection.getClusterInfo().name);
    console.log('🌐 RPC URL:', connection.getClusterInfo().rpc);
    console.log('🔌 WebSocket URL:', connection.getClusterInfo().ws);
    
    // Initialize WebSocket for real-time subscriptions (non-blocking)
    connection.initializeWebSocket().catch(error => {
      console.warn('⚠️ WebSocket initialization failed, continuing with HTTP-only mode:', error);
    });
    
    return connection;
  }, []);

  const wallets = useMemo(
    () => {
      if (typeof window === 'undefined') return [];
      
      console.log('🔧 Using Standard Wallet API (no adapters needed)');
      
      // Return empty array to use Standard Wallet API
      // This removes the "Backpack was registered as a Standard Wallet" warning
      return [];
    },
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Loading Analos NFT Launcher...</div>
          </div>
        </div>
      </div>
    );
  }

  // Always render the wallet providers with safe defaults
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          console.error('❌ Wallet error:', error);
        }}
        onConnect={(publicKey) => {
          console.log('✅ Wallet connected successfully:', publicKey?.toString());
        }}
        onDisconnect={() => {
          console.log('🔌 Wallet disconnected');
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
