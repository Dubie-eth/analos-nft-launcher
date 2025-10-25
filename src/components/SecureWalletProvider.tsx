'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SecureWalletProviderProps {
  children: React.ReactNode;
}

export default function SecureWalletProvider({ children }: SecureWalletProviderProps) {
  // Enhanced security: Use Analos RPC endpoint with HTTP-only connection
  const network = WalletAdapterNetwork.Devnet; // Using devnet for safety
  const endpoint = useMemo(() => 'https://rpc.analos.io', []);
  
  // Configure connection to disable WebSocket and increase timeout for slow Analos network
  const connection = useMemo(() => {
    const conn = new Connection(endpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket by overriding the _rpcWebSocket property
    (conn as any)._rpcWebSocket = null;
    (conn as any)._rpcWebSocketConnected = false;
    
    // Note: Keep default confirmTransaction to maintain typings
    
    return conn;
  }, [endpoint]);

  // Enhanced security: Only allow trusted wallets that support custom RPCs
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      // Backpack and other Standard Wallet API wallets are auto-detected
      // Phantom removed - doesn't support custom RPCs yet
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
