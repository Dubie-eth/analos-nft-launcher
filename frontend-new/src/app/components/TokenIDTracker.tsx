'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { tokenIdTracker } from '@/lib/token-id-tracker';

interface TokenIDTrackerProps {
  collectionMint: string;
  collectionName: string;
}

interface TokenInfo {
  tokenId: string;
  mintAddress: string;
  mintTime: number;
  metadataUri?: string;
}

export default function TokenIDTracker({ collectionMint, collectionName }: TokenIDTrackerProps) {
  const { publicKey } = useWallet();
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey || !collectionMint) {
      setUserTokens([]);
      setLoading(false);
      return;
    }

    const loadUserTokens = () => {
      try {
        const collectionInfo = tokenIdTracker.getCollectionInfo(collectionMint);
        if (!collectionInfo) {
          setUserTokens([]);
          setLoading(false);
          return;
        }

        // Get user's minted tokens from the tracker
        const walletMints = collectionInfo.mintedNFTs[publicKey.toBase58()] || {};
        const tokens: TokenInfo[] = [];

        Object.entries(walletMints).forEach(([tokenId, mintData]) => {
          tokens.push({
            tokenId,
            mintAddress: mintData.mintAddress,
            mintTime: mintData.mintTime,
            metadataUri: mintData.metadataUri
          });
        });

        // Sort by token ID (numerical)
        tokens.sort((a, b) => {
          const aNum = parseInt(a.tokenId);
          const bNum = parseInt(b.tokenId);
          return aNum - bNum;
        });

        setUserTokens(tokens);
        console.log('🎯 User tokens loaded:', tokens);
      } catch (error) {
        console.error('Error loading user tokens:', error);
        setUserTokens([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserTokens();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadUserTokens, 10000);
    return () => clearInterval(interval);
  }, [publicKey, collectionMint]);

  if (!publicKey) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="ml-2 text-white">Loading your tokens...</span>
        </div>
      </div>
    );
  }

  if (userTokens.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
        <div className="text-center">
          <div className="text-2xl mb-2">🎨</div>
          <h3 className="text-white font-semibold mb-1">Your NFT Collection</h3>
          <p className="text-gray-300 text-sm">No tokens minted yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Your NFT Collection</h3>
        <div className="text-sm text-gray-300">
          {userTokens.length} token{userTokens.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {userTokens.map((token) => (
          <div key={token.tokenId} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">
                #{token.tokenId}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {new Date(token.mintTime).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 font-mono truncate" title={token.mintAddress}>
                {token.mintAddress.slice(0, 8)}...{token.mintAddress.slice(-8)}
              </div>
              {token.metadataUri && (
                <a 
                  href={token.metadataUri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View Metadata
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between text-sm text-gray-300">
          <span>Collection: {collectionName}</span>
          <span>Wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</span>
        </div>
      </div>
    </div>
  );
}
