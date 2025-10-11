/**
 * Wallet Provider Setup for Analos Network
 * 
 * Wrap your app with this provider to enable wallet connections
 */

import React, { FC, ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Analos RPC endpoint
const ANALOS_RPC = 'https://rpc.analos.io';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Use Analos mainnet RPC
  const endpoint = useMemo(() => ANALOS_RPC, []);

  // Initialize wallets compatible with Solana (and Analos fork)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

/**
 * Usage in your main app:
 * 
 * import { WalletContextProvider } from './wallet-provider-setup';
 * import MintUI from './mint-ui-example';
 * 
 * function App() {
 *   return (
 *     <WalletContextProvider>
 *       <MintUI />
 *     </WalletContextProvider>
 *   );
 * }
 */

