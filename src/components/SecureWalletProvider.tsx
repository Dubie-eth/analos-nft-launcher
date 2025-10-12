'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SecureWalletProviderProps {
  children: React.ReactNode;
}

export default function SecureWalletProvider({ children }: SecureWalletProviderProps) {
  // Enhanced security: Use Analos RPC endpoint
  const network = WalletAdapterNetwork.Devnet; // Using devnet for safety
  const endpoint = useMemo(() => 'https://rpc.analos.io', []);

  // Enhanced security: Only allow trusted wallets that support custom RPCs
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
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
