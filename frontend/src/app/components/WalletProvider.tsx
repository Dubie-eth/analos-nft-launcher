'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { 
  SolflareWalletAdapter, 
  PhantomWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { BackpackWalletAdapter } from './BackpackWalletAdapter';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Import wallet adapter CSS
if (typeof window !== 'undefined') {
  // Avoid importing styles on the server to reduce SSR work
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@solana/wallet-adapter-react-ui/styles.css');
}

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  // Analos RPC endpoint (Solana fork) - Updated for deployment
  const endpoint = useMemo(() => 'https://rpc.analos.io/', []);

  const wallets = useMemo(() => {
    const configured = [
      new BackpackWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];
    return configured as unknown as any[];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
