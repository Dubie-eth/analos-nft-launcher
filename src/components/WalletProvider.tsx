'use client';

import React, { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  // Use Analos RPC endpoint
  const endpoint = 'https://rpc.analos.io';

  const wallets = useMemo(
    () => {
      if (typeof window === 'undefined') return [];
      
      // Only log once in development to reduce console spam
      if (process.env.NODE_ENV === 'development' && !(window as any).walletAPILogged) {
        console.log('🔧 Configuring explicit wallet adapters for better mobile support');
        (window as any).walletAPILogged = true;
      }
      
      // Configure wallets for mobile support
      // Backpack uses Standard Wallet API, so we don't need explicit adapter
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
      ];
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
            <div className="text-xl font-semibold">Loading Analos NFT Frontend...</div>
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
          // Enhanced mobile error handling
          if (error.message?.includes('User rejected')) {
            console.log('👤 User rejected wallet connection');
          } else if (error.message?.includes('backpack')) {
            console.error('🚨 Backpack-specific error:', error);
          } else {
            console.error('🚨 General wallet error:', error);
          }
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
