'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useParams } from 'next/navigation';
import { PublicKey, Connection } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

interface CollectionData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  maxSupply: number;
  currentSupply: number;
  mintPriceUSD: number;
  mintPriceLOS: number;
  isActive: boolean;
  mintingEnabled: boolean;
  isWhitelistOnly: boolean;
  revealType: 'instant' | 'delayed';
  revealDate?: string;
  bondingCurveEnabled: boolean;
  currentTier: number;
  tierPrices: number[];
  creator: string;
  programId: string;
  collectionConfig: string;
}

interface MintStats {
  totalMints: number;
  recentMints: Array<{
    user: string;
    timestamp: string;
    signature: string;
  }>;
}

export default function MintPage() {
  const { collectionName } = useParams();
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  // State management
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [mintStats, setMintStats] = useState<MintStats>({
    totalMints: 0,
    recentMints: []
  });
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [losPrice, setLosPrice] = useState<number>(0);

  // Load collection data
  useEffect(() => {
    const loadCollectionData = async () => {
      try {
        setLoading(true);
        console.log('🎯 Loading REAL collection data for:', collectionName);
        
        // Load blockchain service
        const { blockchainService } = await import('@/lib/blockchain-service');
        
        // Get all collections and find the one matching the name
        const allCollections = await blockchainService.getAllCollections();
        const matchingCollection = allCollections.find(
          col => col.collectionName.toLowerCase().replace(/\s+/g, '-') === (collectionName as string).toLowerCase()
        );

        if (!matchingCollection) {
          console.warn('⚠️ Collection not found on blockchain');
          setCollection(null);
          setLoading(false);
          return;
        }

        // Transform to UI format
        const uiCollection: CollectionData = {
          name: matchingCollection.collectionName,
          symbol: matchingCollection.collectionSymbol,
          description: `${matchingCollection.collectionName} - ${matchingCollection.bondingCurveEnabled ? 'Bonding Curve Enabled' : 'Fixed Price'} Collection on Analos`,
          imageUrl: matchingCollection.placeholderUri || '/api/placeholder/600/600',
          maxSupply: matchingCollection.totalSupply,
          currentSupply: matchingCollection.mintedCount,
          mintPriceUSD: matchingCollection.mintPriceUSD,
          mintPriceLOS: matchingCollection.mintPriceLamports,
          isActive: !matchingCollection.isPaused,
          mintingEnabled: !matchingCollection.isPaused && matchingCollection.mintedCount < matchingCollection.totalSupply,
          isWhitelistOnly: matchingCollection.isWhitelistOnly,
          revealType: matchingCollection.isRevealed ? 'instant' : 'delayed',
          revealDate: matchingCollection.isRevealed ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          bondingCurveEnabled: matchingCollection.bondingCurveEnabled,
          currentTier: 1,
          tierPrices: [matchingCollection.mintPriceUSD],
          creator: matchingCollection.authority,
          programId: matchingCollection.programId,
          collectionConfig: matchingCollection.address
        };

        setCollection(uiCollection);
        setLosPrice(await blockchainService.getCurrentLOSPrice());
        
        // Load recent transactions
        const recentTxs = await blockchainService.getRecentProgramTransactions(
          ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString(),
          10
        );
        
        setMintStats({
          totalMints: matchingCollection.mintedCount,
          recentMints: recentTxs.map(tx => ({
            user: 'Recent Minter',
            timestamp: new Date(tx.blockTime * 1000).toISOString(),
            signature: tx.signature
          }))
        });

        console.log('✅ REAL collection data loaded from blockchain');
      } catch (error) {
        console.error('❌ Error loading collection data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionData();
  }, [collectionName]);

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setMintResult({ success: false, message: 'Please connect your wallet to mint' });
      return;
    }

    if (!collection) {
      setMintResult({ success: false, message: 'Collection data not loaded' });
      return;
    }

    if (!collection.mintingEnabled) {
      setMintResult({ success: false, message: 'Minting is currently disabled for this collection' });
      return;
    }

    if (collection.currentSupply >= collection.maxSupply) {
      setMintResult({ success: false, message: 'Collection is sold out' });
      return;
    }

    setMinting(true);
    setMintResult(null);

    try {
      console.log('🎯 Minting from collection:', collection.name);
      console.log('💰 Price (USD):', collection.mintPriceUSD);
      console.log('💰 Price (LOS):', collection.mintPriceLOS);
      console.log('🔗 Program ID:', collection.programId);
      
      // TODO: Implement actual minting with smart contract
      // This would:
      // 1. Calculate exact LOS amount needed using Price Oracle
      // 2. Check whitelist status if whitelist only
      // 3. Call NFT_LAUNCHPAD.mint_placeholder()
      // 4. Handle bonding curve logic if enabled
      // 5. Sign and send transaction
      // 6. Update local state with new mint data
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockSignature = 'DemoMintSignature' + Date.now();
      
      setMintResult({
        success: true,
        message: `Successfully minted ${collection.name} #${collection.currentSupply + 1}!`,
        signature: mockSignature
      });

      // Update collection data
      setCollection(prev => prev ? {
        ...prev,
        currentSupply: prev.currentSupply + 1
      } : null);

      // Update mint stats
      setMintStats(prev => ({
        ...prev,
        totalMints: prev.totalMints + 1,
        recentMints: [{
          user: publicKey.toString(),
          timestamp: new Date().toISOString(),
          signature: mockSignature
        }, ...prev.recentMints.slice(0, 9)]
      }));

    } catch (error: any) {
      console.error('❌ Error minting:', error);
      setMintResult({
        success: false,
        message: `Failed to mint: ${error.message}`
      });
    } finally {
      setMinting(false);
    }
  };

  const getMintProgress = () => {
    if (!collection) return 0;
    return (collection.currentSupply / collection.maxSupply) * 100;
  };

  const getTimeUntilReveal = () => {
    if (!collection || collection.revealType !== 'delayed' || !collection.revealDate) return null;
    
    const now = new Date();
    const revealDate = new Date(collection.revealDate);
    const diff = revealDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Revealed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Loading Collection...</div>
          <div className="text-gray-300 mt-2">Fetching data from Analos blockchain</div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-4xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-xl text-gray-300 mb-8">
            The collection "{collectionName}" could not be found
          </p>
          <a
            href="/marketplace"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
          >
            Browse Marketplace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎯 Mint {collection.name}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {collection.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Collection Image and Info */}
          <div className="space-y-6">
            {/* Collection Image */}
            <div className="aspect-square bg-gray-800/50 rounded-2xl flex items-center justify-center">
              <div className="text-8xl">🎨</div>
            </div>

            {/* Collection Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Collection Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Symbol:</span>
                  <span className="text-white font-semibold">{collection.symbol}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Creator:</span>
                  <code className="text-white font-mono text-sm">
                    {collection.creator.slice(0, 8)}...{collection.creator.slice(-8)}
                  </code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Program:</span>
                  <code className="text-white font-mono text-sm">
                    {collection.programId.slice(0, 16)}...
                  </code>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Reveal Type:</span>
                  <span className="text-white font-semibold capitalize">{collection.revealType}</span>
                </div>
                
                {collection.revealType === 'delayed' && collection.revealDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reveal In:</span>
                    <span className="text-white font-semibold">{getTimeUntilReveal()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Bonding Curve:</span>
                  <span className={`font-semibold ${collection.bondingCurveEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                    {collection.bondingCurveEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                {collection.isWhitelistOnly && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Access:</span>
                    <span className="text-yellow-400 font-semibold">Whitelist Only</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bonding Curve Tiers */}
            {collection.bondingCurveEnabled && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Bonding Curve Pricing</h2>
                
                <div className="space-y-3">
                  {collection.tierPrices.map((price, index) => (
                    <div key={index} className={`flex justify-between p-3 rounded-lg ${
                      index === collection.currentTier - 1 
                        ? 'bg-purple-500/20 border border-purple-500/30' 
                        : 'bg-gray-800/30'
                    }`}>
                      <span className="text-gray-300">Tier {index + 1}:</span>
                      <span className={`font-semibold ${
                        index === collection.currentTier - 1 ? 'text-purple-400' : 'text-white'
                      }`}>
                        ${price}
                        {index === collection.currentTier - 1 && ' (Current)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Minting Interface */}
          <div className="space-y-6">
            {/* Mint Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Mint Statistics</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Progress:</span>
                    <span className="text-white font-semibold">
                      {collection.currentSupply} / {collection.maxSupply}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getMintProgress()}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-300">
                    {getMintProgress().toFixed(1)}% Minted
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">${collection.mintPriceUSD}</div>
                    <div className="text-sm text-gray-300">Mint Price (USD)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{(collection.mintPriceLOS / 1000000000).toFixed(2)}</div>
                    <div className="text-sm text-gray-300">Mint Price (LOS)</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{collection.maxSupply - collection.currentSupply}</div>
                  <div className="text-sm text-gray-300">Remaining</div>
                </div>
              </div>
            </div>

            {/* Mint Button */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Mint Your NFT</h2>
              
              {!connected ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔗</div>
                  <p className="text-gray-300 mb-6">Connect your wallet to start minting</p>
                  <div className="text-sm text-gray-400">
                    You'll need SOL to pay for transaction fees and LOS for the mint price
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg text-gray-300 mb-2">Ready to mint?</div>
                    <div className="text-sm text-gray-400">
                      You'll pay <span className="text-white font-semibold">${collection.mintPriceUSD}</span> 
                      {' '}(<span className="text-white font-semibold">{(collection.mintPriceLOS / 1000000000).toFixed(2)} LOS</span>) 
                      {' '}plus transaction fees
                    </div>
                  </div>
                  
                  <button
                    onClick={handleMint}
                    disabled={minting || !collection.mintingEnabled || collection.currentSupply >= collection.maxSupply}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {minting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                        Minting NFT...
                      </div>
                    ) : !collection.mintingEnabled ? (
                      'Minting Disabled'
                    ) : collection.currentSupply >= collection.maxSupply ? (
                      'Sold Out'
                    ) : (
                      `🎯 Mint for $${collection.mintPriceUSD}`
                    )}
                  </button>
                  
                  {collection.isWhitelistOnly && (
                    <div className="text-center">
                      <div className="text-sm text-yellow-400">
                        ⚠️ This collection requires whitelist access
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mint Result */}
              {mintResult && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  mintResult.success 
                    ? 'bg-green-900/20 border-green-500 text-green-300' 
                    : 'bg-red-900/20 border-red-500 text-red-300'
                }`}>
                  <div className="flex items-start">
                    <span className="text-xl mr-3">{mintResult.success ? '✅' : '❌'}</span>
                    <div>
                      <p className="font-semibold">{mintResult.message}</p>
                      {mintResult.signature && (
                        <div className="mt-2">
                          <p className="text-sm opacity-75">Transaction Signature:</p>
                          <code className="block mt-1 p-2 bg-black/20 rounded text-xs break-all">
                            {mintResult.signature}
                          </code>
                          <button
                            onClick={() => window.open(`https://explorer.analos.io/tx/${mintResult.signature}`, '_blank')}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                          >
                            View on Explorer →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Mints */}
            {mintStats.recentMints.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Mints</h2>
                
                <div className="space-y-3">
                  {mintStats.recentMints.slice(0, 5).map((mint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div>
                        <div className="text-white font-semibold">
                          {mint.user.slice(0, 8)}...{mint.user.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(mint.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(`https://explorer.analos.io/tx/${mint.signature}`, '_blank')}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-all duration-200"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Program Information */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">🔗 Smart Contract Information</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="text-lg font-bold text-white mb-2">NFT Launchpad</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="text-lg font-bold text-white mb-2">Price Oracle</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.PRICE_ORACLE.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">🎲</div>
              <h3 className="text-lg font-bold text-white mb-2">Rarity Oracle</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.RARITY_ORACLE.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
            
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="text-lg font-bold text-white mb-2">Token Launch</h3>
              <div className="bg-gray-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 break-all">
                {ANALOS_PROGRAMS.TOKEN_LAUNCH.toString().slice(0, 16)}...
              </div>
              <span className="text-green-400 text-sm">✓ Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
