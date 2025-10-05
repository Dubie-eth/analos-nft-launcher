'use client';

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  // Use Analos RPC endpoint - same as working mint page
  const endpoint = 'https://rpc.analos.io';

  const wallets = useMemo(
    () => {
      console.log('🔧 Initializing wallet adapters...');
      
      // Create a fresh Backpack adapter instance
      const backpackAdapter = new BackpackWalletAdapter({
        // Force a unique name to avoid conflicts
        name: 'Backpack Analos',
      });
      
      console.log('✅ Backpack wallet adapter configured with name:', backpackAdapter.name);
      console.log('🌐 RPC Endpoint:', endpoint);
      
      return [backpackAdapter];
    },
    []
  );

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
