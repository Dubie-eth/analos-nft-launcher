'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

export default function MintPage() {
  const { publicKey, connected } = useWallet();
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');

  const handleMint = async () => {
    if (!connected || !publicKey) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    setMinting(true);
    setMintStatus('Minting NFT...');

    try {
      // Simulate minting process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMintStatus('NFT minted successfully!');
    } catch {
      setMintStatus('Minting failed. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              Analos NFT Launcher
            </h1>
            
            <div className="text-center mb-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            </div>

            {connected && (
              <div className="text-center mb-8">
                <p className="text-white/80 mb-4">
                  Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
                <p className="text-white/60">
                  Network: Analos (Devnet)
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleMint}
                disabled={!connected || minting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {minting ? 'Minting...' : 'Mint NFT'}
              </button>
            </div>

            {mintStatus && (
              <div className="mt-6 p-4 bg-white/20 rounded-lg">
                <p className="text-white text-center">{mintStatus}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
