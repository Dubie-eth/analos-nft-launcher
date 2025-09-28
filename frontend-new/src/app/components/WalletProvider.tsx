'use client';

import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { SolflareWalletAdapter, TorusWalletAdapter, LedgerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  // You can also provide a custom RPC endpoint.
  const endpoint = 'https://rpc.analos.io';

  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render the providers, but handle the mounting state
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {mounted ? children : <div style={{ minHeight: '100vh' }}>{children}</div>}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
