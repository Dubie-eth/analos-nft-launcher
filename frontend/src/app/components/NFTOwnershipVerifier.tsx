'use client';

import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { NFTVerificationService, NFTOwnershipInfo } from '../../lib/blockchain/nft-verification-service';

interface NFTOwnershipVerifierProps {
  mintAddress?: string;
  className?: string;
}

export default function NFTOwnershipVerifier({ 
  mintAddress, 
  className = '' 
}: NFTOwnershipVerifierProps) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [ownership, setOwnership] = useState<NFTOwnershipInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationService] = useState(() => new NFTVerificationService(connection));

  // Auto-verify ownership when mint address or wallet changes
  useEffect(() => {
    if (mintAddress && publicKey && connected) {
      verifyOwnership();
    } else {
      setOwnership(null);
    }
  }, [mintAddress, publicKey, connected]);

  const verifyOwnership = async () => {
    if (!mintAddress || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationService.verifyNFTOwnership(
        mintAddress,
        publicKey.toBase58()
      );

      if (result.success && result.ownership) {
        setOwnership(result.ownership);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshOwnership = () => {
    verifyOwnership();
  };

  if (!connected) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">Connect wallet to verify ownership</span>
        </div>
      </div>
    );
  }

  if (!mintAddress) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">No NFT address provided</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">NFT Ownership</h3>
        <button
          onClick={refreshOwnership}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Verifying ownership...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {ownership && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${ownership.isOwned ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${ownership.isOwned ? 'text-green-700' : 'text-red-700'}`}>
                {ownership.isOwned ? 'OWNED' : 'NOT OWNED'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium text-gray-900">{ownership.amount}</span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-500">Token Account:</div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
              {ownership.tokenAccount}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-gray-500">Mint Address:</div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
              {ownership.mintAddress}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Updated:</span>
            <span className="text-xs text-gray-500">
              {ownership.lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for displaying wallet's NFT collection
export function WalletNFTCollection({ className = '' }: { className?: string }) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [nfts, setNfts] = useState<NFTOwnershipInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationService] = useState(() => new NFTVerificationService(connection));

  useEffect(() => {
    if (publicKey && connected) {
      loadWalletNFTs();
    } else {
      setNfts([]);
    }
  }, [publicKey, connected]);

  const loadWalletNFTs = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationService.getWalletNFTs(publicKey.toBase58());

      if (result.success && result.nfts) {
        setNfts(result.nfts);
      } else {
        setError(result.error || 'Failed to load NFTs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">Connect wallet to view NFT collection</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your NFT Collection</h3>
        <button
          onClick={loadWalletNFTs}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading your NFTs...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {nfts.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🎨</div>
          <p className="text-gray-600">No NFTs found in your wallet</p>
        </div>
      )}

      {nfts.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            Found {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
          </div>
          {nfts.map((nft, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">NFT #{index + 1}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {nft.lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <div className="font-mono text-xs bg-white p-2 rounded break-all">
                {nft.mintAddress}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
