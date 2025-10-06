'use client';

import React, { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { AnalosConnection } from '../../lib/analos-web3-wrapper';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  // Use Analos RPC endpoint with enhanced logging
  const endpoint = 'https://rpc.analos.io';

  // Create Analos-specific connection for enhanced functionality
  const analosConnection = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    console.log('🔗 Creating Analos Connection...');
    
    const connection = new AnalosConnection(endpoint, {
      network: 'MAINNET',
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
    
    console.log('✅ Analos Connection created:', connection.getClusterInfo().name);
    console.log('🌐 RPC URL:', connection.getClusterInfo().rpc);
    console.log('🔌 WebSocket URL:', connection.getClusterInfo().ws);
    
    // Initialize WebSocket for real-time subscriptions
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

  // Prevent hydration issues by not rendering wallet providers on server
  if (!mounted) {
    return <>{children}</>;
  }

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
