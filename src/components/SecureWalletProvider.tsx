'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';

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
      confirmTransactionTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket by overriding the _rpcWebSocket property
    (conn as any)._rpcWebSocket = null;
    (conn as any)._rpcWebSocketConnected = false;
    
    // Override confirmTransaction to use our extended timeout and better error handling
    const originalConfirmTransaction = conn.confirmTransaction.bind(conn);
    conn.confirmTransaction = async (signature: any, commitment?: any) => {
      try {
        if (typeof signature === 'string') {
          // Use extended timeout for string signatures
          const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
          return await conn.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          }, commitment || 'confirmed');
        }
        return originalConfirmTransaction(signature, commitment);
      } catch (error: any) {
        // If confirmation fails, try to get signature status as fallback
        if (typeof signature === 'string') {
          try {
            const txStatus = await conn.getSignatureStatus(signature);
            if (txStatus.value && !txStatus.value.err) {
              console.log('✅ Transaction confirmed via signature status check:', signature);
              return { value: { err: null } };
            }
          } catch (statusError) {
            console.error('❌ Signature status check failed:', statusError);
          }
        }
        throw error;
      }
    };
    
    return conn;
  }, [endpoint]);

  // Enhanced security: Only allow trusted wallets that support custom RPCs
  const wallets = useMemo(
    () => [
      new SolflareWalletAdapter(),
      // Backpack uses Standard Wallet API, so it's detected automatically
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
