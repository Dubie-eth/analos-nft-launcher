'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import SPLNFTCreator from '../../components/SPLNFTCreator';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

export default function CreateNFTPage() {
  // Use Analos RPC endpoint
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.analos.io', 
    []
  );

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  🎨 Analos NFT Creator
                </h1>
                <p className="text-lg text-gray-600">
                  Create real SPL Token NFTs on the Analos blockchain
                </p>
              </div>
              
              <SPLNFTCreator />
              
              <div className="mt-12 text-center">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    🚀 What You Just Created
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-bold text-blue-800 mb-2">🪙 Real SPL Token</h3>
                      <p className="text-sm text-blue-700">
                        Your NFT is a genuine SPL Token with 0 decimals, making it a true NFT on Analos.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-bold text-green-800 mb-2">🔄 Transferable</h3>
                      <p className="text-sm text-green-700">
                        Your NFT can be transferred to other wallets using standard SPL Token operations.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-bold text-purple-800 mb-2">📊 Tradeable</h3>
                      <p className="text-sm text-purple-700">
                        Your NFT can be listed on marketplaces and traded like any other SPL Token.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Note</h3>
                    <p className="text-sm text-yellow-700">
                      This NFT uses the standard SPL Token program. For advanced features like metadata updates, 
                      you would need the Metaplex Token Metadata program (not yet deployed on Analos).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
