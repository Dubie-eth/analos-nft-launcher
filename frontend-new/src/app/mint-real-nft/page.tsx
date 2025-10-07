'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import RealNFTMinter from '../components/RealNFTMinter';

export default function MintRealNFTPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Real NFT Minter
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Create fully-functional NFTs on Analos with Metaplex Token Metadata
          </p>
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>

        {/* Minter Component */}
        <RealNFTMinter
          onMintComplete={(success, result) => {
            if (success) {
              console.log('✅ NFT minted successfully:', result);
            } else {
              console.error('❌ NFT minting failed:', result);
            }
          }}
        />

        {/* Back to Admin */}
        <div className="mt-8 text-center">
          <a
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            ← Back to Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
