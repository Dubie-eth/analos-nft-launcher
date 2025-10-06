'use client';

import React from 'react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import RealNFTMinter from '../../components/RealNFTMinter';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  new PhantomWalletAdapter(),
];

export default function RealMintPage() {
  return (
    <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.analos.io"}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gray-100 py-8">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  🚀 Real NFT Minter
                </h1>
                <p className="text-lg text-gray-600">
                  Create real NFTs visible on the Analos blockchain
                </p>
              </div>
              
              <RealNFTMinter />
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  🌐 Network: Analos | 🔗 RPC: https://rpc.analos.io
                </p>
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
