'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSearchParams } from 'next/navigation';
import { transactionService } from '../services/TransactionService';
import TransactionStatus from '../components/TransactionStatus';

export default function MintPage() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('id');

  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [nftName, setNftName] = useState('Analos NFT');
  const [nftDescription, setNftDescription] = useState('A unique NFT minted on the Analos blockchain');
  const [collectionData, setCollectionData] = useState<any>(null);
  const [isLoadingCollection, setIsLoadingCollection] = useState(true);

  // Load collection data from backend
  useEffect(() => {
    const loadCollectionData = async () => {
      if (!collectionId) {
        setIsLoadingCollection(false);
        return;
      }

      setIsLoadingCollection(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/collections/${collectionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Collection not found. It may have been deleted or the ID is incorrect.');
          } else {
            throw new Error(`Failed to load collection: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        
        if (data.success) {
          setCollectionData(data.data);
          setNftName(data.data.name);
          setNftDescription(data.data.description);
        } else {
          setError(data.error || 'Failed to load collection data');
        }
      } catch (error) {
        console.error('Error loading collection:', error);
        setError('Failed to load collection data. Please check your connection.');
      } finally {
        setIsLoadingCollection(false);
      }
    };

    loadCollectionData();
  }, [collectionId]);

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    if (!nftName.trim()) {
      setError('Please enter an NFT name');
      return;
    }

    if (!collectionData) {
      setError('Collection data not loaded. Cannot mint.');
      return;
    }

    setIsMinting(true);
    setError(null);
    setMintResult(null);

    try {
      // Step 1: Create the mint transaction
      const transactionResult = await transactionService.createMintNftTransaction({
        collectionId: collectionData.id,
        nftName: nftName.trim(),
        nftSymbol: 'NFT',
        nftUri: collectionData.imageUrl,
        userWallet: publicKey.toString(),
        programId: collectionData.smartContract?.programId || '11111111111111111111111111111112'
      });

      if (!transactionResult.success) {
        throw new Error(transactionResult.error || 'Failed to create mint transaction');
      }

      // Step 2: Sign and submit the transaction
      const transaction = transactionResult.data.transaction;
      const result = await transactionService.signAndSubmitTransactionWithBackend(
        transaction,
        { signTransaction }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to mint NFT');
      }

      // Step 3: Create the final result
      const finalResult = {
        mintAddress: transactionResult.data.accounts.nft,
        metadataUri: collectionData.imageUrl,
        transactionSignature: result.signature,
        explorerUrl: result.explorerUrl,
        estimatedCost: collectionData.mintPrice / 1000000000, // Convert lamports to SOL
        currency: 'SOL',
        nft: {
          name: nftName.trim(),
          description: nftDescription.trim(),
          image: collectionData.imageUrl
        },
        smartContract: transactionResult.data.accounts
      };

      setMintResult(finalResult);
      setTransactionSignature(result.signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  if (isLoadingCollection && collectionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collectionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Collection Not Found
          </h1>
          <p className="text-gray-300 text-lg">
            Please provide a collection ID in the URL
          </p>
          <p className="text-gray-400 text-sm mt-4">
            Example: /mint?id=AnalosCol17590218191402pwitha7p
          </p>
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-gray-300 text-lg">The collection "{collectionId}" could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🚀 Mint {collectionData.name}
            </h1>
            <p className="text-gray-300 text-xl mb-4">
              Collection ID: <span className="font-mono text-blue-400 bg-blue-500/20 px-3 py-1 rounded-lg">{collectionId}</span>
            </p>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              {collectionData.description}
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-3">
                  🔐 Connect Wallet
                </h2>
                <p className="text-gray-300 text-lg">
                  Connect your wallet to mint NFTs on Analos
                </p>
              </div>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !rounded-xl !px-6 !py-3 !text-lg !font-semibold" />
            </div>
          </div>

          {/* Collection Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20">
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">
              🎨 Collection NFT
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Collection Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-200 mb-3">
                    NFT Name *
                  </label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    placeholder="Enter NFT name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-200 mb-3">
                    Description
                  </label>
                  <textarea
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg resize-none"
                    placeholder="Describe your NFT..."
                  />
                </div>
              </div>

              {/* Right Column - Collection Image */}
              <div className="space-y-6">
                <label className="block text-lg font-medium text-gray-200 mb-3">
                  Collection Image
                </label>
                
                {/* Collection Image */}
                <div className="relative">
                  <img
                    src={collectionData.imageUrl}
                    alt="Collection NFT"
                    className="w-full h-64 object-cover rounded-2xl border-2 border-white/20"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                    {collectionData.name}
                  </div>
                </div>

                {/* Collection Info */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-2xl p-6">
                  <div className="space-y-3">
                    <p className="text-blue-200 text-lg">
                      🎨 <strong>Collection:</strong> {collectionData.name}
                    </p>
                    <p className="text-blue-200 text-lg">
                      📊 <strong>Total Supply:</strong> {collectionData.totalSupply}
                    </p>
                    <p className="text-blue-200 text-lg">
                      💰 <strong>Price:</strong> {collectionData.mintPrice} {collectionData.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mint Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleMint}
              disabled={!connected || isMinting || !nftName.trim()}
              className={`px-16 py-6 rounded-2xl font-bold text-2xl transition-all duration-200 transform ${
                connected && !isMinting && nftName.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isMinting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                  Minting NFT...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-3 text-3xl">🚀</span>
                  Mint Collection NFT ({collectionData.mintPrice} {collectionData.currency})
                </div>
              )}
            </button>
            
            {!connected && (
              <p className="text-gray-400 text-lg mt-4">
                Connect your wallet to start minting
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-8">
              <p className="text-red-200 text-lg text-center">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {mintResult && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8">
              <h3 className="text-3xl font-semibold text-green-200 mb-6 text-center">
                🎉 NFT Minted Successfully!
              </h3>
              
              {/* Transaction Status */}
              {transactionSignature && (
                <div className="mb-6">
                  <TransactionStatus 
                    signature={transactionSignature}
                    onComplete={(result) => {
                      console.log('Transaction completed:', result);
                    }}
                  />
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-300 text-lg">NFT Name:</span>
                    <span className="text-white ml-2 text-lg font-semibold">{mintResult.nft.name}</span>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-300 text-lg">Mint Address:</span>
                    <span className="text-white ml-2 font-mono text-sm block mt-1">
                      {mintResult.mintAddress}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-300 text-lg">Transaction:</span>
                    <a
                      href={mintResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-2 underline text-lg"
                    >
                      View on Explorer
                    </a>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-300 text-lg">Mint Cost:</span>
                    <span className="text-green-400 ml-2 font-bold text-lg">
                      {mintResult.estimatedCost} {mintResult.currency || '$LOS'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <img
                    src={mintResult.nft.image}
                    alt={mintResult.nft.name}
                    className="w-48 h-48 rounded-2xl object-cover border-2 border-white/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 mt-8 border border-white/10">
            <div className="text-center text-gray-400 text-lg space-y-2">
              <p>🌐 Network: Analos</p>
              <p>🔗 RPC: https://rpc.analos.io</p>
              <p>🔍 Explorer: https://explorer.analos.io</p>
              <p className="text-yellow-400 text-lg font-semibold">💰 Fees: {collectionData.mintPrice} {collectionData.currency} → {collectionData.adminWallet.slice(0, 8)}...{collectionData.adminWallet.slice(-8)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
