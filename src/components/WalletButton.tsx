'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

export default function WalletButton() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {connected ? (
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300">
            Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
          <WalletDisconnectButton className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" />
        </div>
      ) : (
        <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" />
      )}
    </div>
  );
}
