'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import RealMintButton from '../../components/RealMintButton';
import AdvancedMintButton from '../../components/AdvancedMintButton';
import PaymentSelector from '../../components/PaymentSelector';
import LOLBalanceChecker from '../../components/LOLBalanceChecker';
import BlockchainCollectionService, { BlockchainCollectionData } from '@/lib/blockchain-collection-service';
import { tokenIdTracker, CollectionInfo as TokenTrackerCollectionInfo } from '@/lib/token-id-tracker';
import { LOLBalanceInfo } from '@/lib/lol-balance-checker';

// Use the blockchain collection data interface
type CollectionInfo = BlockchainCollectionData;

function CollectionMintContent() {
  const { publicKey, connected, signTransaction } = useWallet();
  const params = useParams();
  const collectionName = decodeURIComponent(params.collectionName as string);
  
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  
  // Advanced features state
  const [selectedPaymentMint, setSelectedPaymentMint] = useState<string>('');
  const [tokenTrackerCollection, setTokenTrackerCollection] = useState<TokenTrackerCollectionInfo | null>(null);
  
  // LOL balance checking
  const [lolBalanceInfo, setLolBalanceInfo] = useState<LOLBalanceInfo | null>(null);
  const [minimumLolBalance] = useState(1000); // Minimum $LOL required for minting

  const fetchCollectionInfo = useCallback(async () => {
    try {
      console.log('📡 Fetching collection from blockchain (single source of truth):', collectionName);
      const blockchainService = new BlockchainCollectionService();
      const blockchainCollection = await blockchainService.getCollectionByNameFromBlockchain(collectionName);
      
      if (blockchainCollection) {
        setCollection(blockchainCollection);
        console.log('✅ Collection fetched from blockchain:', blockchainCollection.name, 'Price:', blockchainCollection.mintPrice);
        
        // Also fetch from token tracker for advanced features
        const collectionMint = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
        const trackerCollection = tokenIdTracker.getCollectionInfo(collectionMint);
        setTokenTrackerCollection(trackerCollection);
        
        // Set default payment token if available
        if (trackerCollection && trackerCollection.paymentTokens.length > 0) {
          const defaultToken = trackerCollection.paymentTokens.find(token => token.accepted) || trackerCollection.paymentTokens[0];
          if (defaultToken) {
            setSelectedPaymentMint(defaultToken.mint);
          }
        }
      } else {
        setMintStatus('Collection not found on blockchain');
        console.log('❌ Collection not found on blockchain:', collectionName);
      }
    } catch (error) {
      console.error('❌ Failed to fetch collection from blockchain:', error);
      setMintStatus('Failed to load collection from blockchain');
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    setMounted(true);
    if (collectionName) {
      fetchCollectionInfo();
      
      // Set up real-time updates every 5 seconds
      const interval = setInterval(() => {
        fetchCollectionInfo();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [collectionName, fetchCollectionInfo]);

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    if (!collection) {
      setMintStatus('Collection not found');
      return;
    }

    if (mintQuantity < 1 || mintQuantity > 10) {
      setMintStatus('Quantity must be between 1 and 10');
      return;
    }

    setMinting(true);
    setMintStatus('Creating NFT minting transaction...');

    try {
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      
      // Call backend to create the NFT minting transaction
      const mintResponse = await fetch(`${backendUrl}/api/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: collection.name,
          quantity: mintQuantity,
          walletAddress: publicKey.toString(),
        }),
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        throw new Error(errorData.error || 'Failed to create minting transaction');
      }

      const mintData = await mintResponse.json();
      
      if (!mintData.success) {
        throw new Error(mintData.error || 'Minting failed');
      }

      console.log('🎯 Backend minting response:', mintData);

      // Check if we need to sign a transaction
      if (mintData.requiresWalletSigning && mintData.transaction) {
        setMintStatus('Please sign the NFT minting transaction in your wallet...');
        
        // Create connection for transaction handling
        const connection = new Connection('https://rpc.analos.io', {
          commitment: 'confirmed',
          wsEndpoint: undefined,
        });

        // Parse the transaction from the backend
        const transaction = Transaction.from(Buffer.from(mintData.transaction, 'base64'));
        
        console.log('🔗 Signing NFT minting transaction...');
        console.log('💰 Total cost:', mintData.totalCost, 'LOS');
        console.log('📦 Quantity:', mintQuantity);

        // Sign and send the NFT minting transaction
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        console.log('✅ NFT minting transaction sent:', signature);
        setMintStatus('NFT minting transaction sent! Confirming...');

        // Wait for confirmation
        try {
          await connection.confirmTransaction(signature, 'confirmed');
          console.log('✅ NFT minting transaction confirmed:', signature);
          setMintStatus(`Successfully minted ${mintQuantity} NFT(s)! Transaction: ${signature}`);
        } catch (confirmError) {
          console.log('⚠️ Confirmation timeout, but NFT minting transaction was sent:', signature);
          setMintStatus(`NFT minting transaction sent! Check explorer: https://explorer.analos.io/tx/${signature}. Confirmation may take longer.`);
        }

        // Confirm the mint on the backend
        await fetch(`${backendUrl}/api/mint/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionName: collection.name,
            quantity: mintQuantity,
            transactionSignature: signature,
            walletAddress: publicKey.toString(),
          }),
        });

      } else {
        // Direct minting (no wallet signing required)
        setMintStatus(`Successfully minted ${mintQuantity} NFT(s)! Transaction: ${mintData.transactionSignature}`);
      }

      // Refresh collection info to update supply
      fetchCollectionInfo();

    } catch (error) {
      console.error('Minting error:', error);
      if (error instanceof Error) {
        setMintStatus(`Minting failed: ${error.message}`);
      } else {
        setMintStatus('Minting failed. Please try again.');
      }
    } finally {
      setMinting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-white/80 mb-6">{mintStatus}</p>
          <Link 
            href="/mint" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const remainingSupply = collection.totalSupply - collection.currentSupply;
  
  // Calculate cost based on selected payment token
  let totalCost = collection.mintPrice * mintQuantity;
  let currency = '$LOS';
  
  if (tokenTrackerCollection && selectedPaymentMint) {
    const selectedToken = tokenTrackerCollection.paymentTokens.find(token => token.mint === selectedPaymentMint);
    if (selectedToken) {
      totalCost = selectedToken.pricePerNFT * mintQuantity;
      currency = selectedToken.symbol;
    }
  }
  
  const platformFee = (totalCost * collection.feePercentage) / 100;
  const creatorRevenue = totalCost - platformFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Mint NFTs</h1>
            <WalletMultiButton />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Collection Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h1 className="text-3xl font-bold text-white mb-2">{collection.name}</h1>
                <p className="text-white/80 mb-4">{collection.description}</p>
                <div className="flex justify-center space-x-4 text-sm text-white/60">
                  <span>Symbol: {collection.symbol}</span>
                  <span>•</span>
                  <span>Supply: {collection.currentSupply}/{collection.totalSupply}</span>
                </div>
              </div>

              {/* Supply Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-white/80 text-sm mb-2">
                  <span>Minted</span>
                  <span>{collection.currentSupply}/{collection.totalSupply}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(collection.currentSupply / collection.totalSupply) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>{((collection.currentSupply / collection.totalSupply) * 100).toFixed(1)}% minted</span>
                  <span>{remainingSupply} remaining</span>
                </div>
              </div>

              {collection.externalUrl && (
                <div className="text-center">
                  <a
                    href={collection.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View Collection Website
                  </a>
                </div>
              )}
            </div>

            {/* Mint Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Mint NFTs</h2>
              
              {connected ? (
                <div>
                  <div className="mb-6">
                    <p className="text-white/80 text-sm mb-2">Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
                  </div>

                  {/* LOL Balance Checker */}
                  <div className="mb-6">
                    <LOLBalanceChecker
                      minimumRequired={minimumLolBalance}
                      onBalanceUpdate={setLolBalanceInfo}
                    />
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-white/80 text-sm mb-2">Quantity (1-10)</label>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                        className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-lg transition-colors"
                        disabled={mintQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-white text-xl font-semibold min-w-[3rem] text-center">
                        {mintQuantity}
                      </span>
                      <button
                        onClick={() => setMintQuantity(Math.min(10, mintQuantity + 1))}
                        className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-lg transition-colors"
                        disabled={mintQuantity >= 10}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white/10 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Cost Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Price per NFT:</span>
                        <span>{tokenTrackerCollection && selectedPaymentMint ? 
                          (tokenTrackerCollection.paymentTokens.find(token => token.mint === selectedPaymentMint)?.pricePerNFT?.toFixed(2) || '0.00') + ' ' + currency :
                          (collection.mintPrice?.toFixed(2) || '0.00') + ' ' + currency
                        }</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Quantity:</span>
                        <span>{mintQuantity}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Subtotal:</span>
                        <span>{totalCost?.toFixed(2) || '0.00'} {currency}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Platform Fee ({collection.feePercentage || 0}%):</span>
                        <span>{platformFee?.toFixed(2) || '0.00'} {currency}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Creator Revenue:</span>
                        <span>{creatorRevenue?.toFixed(2) || '0.00'} {currency}</span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between text-white font-semibold">
                        <span>Total Cost:</span>
                        <span>{totalCost?.toFixed(2) || '0.00'} {currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Token Selector */}
                  {tokenTrackerCollection && tokenTrackerCollection.paymentTokens.length > 0 && (
                    <PaymentSelector
                      collection={tokenTrackerCollection}
                      onSelectPaymentToken={setSelectedPaymentMint}
                      selectedPaymentMint={selectedPaymentMint}
                      quantity={mintQuantity}
                    />
                  )}

                  {/* Advanced Mint Button with all features */}
                  {tokenTrackerCollection ? (
                    <AdvancedMintButton
                      collectionName={collection.name}
                      collectionMint={`collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`}
                      quantity={mintQuantity}
                      totalCost={totalCost}
                      currency={currency}
                      lolBalanceInfo={lolBalanceInfo}
                      onMintSuccess={(result) => {
                        setMintStatus(`Successfully minted ${result.quantity} NFT(s)! Transaction: ${result.transactionSignature}`);
                        fetchCollectionInfo(); // Refresh collection info
                      }}
                      onMintError={(error) => {
                        setMintStatus(`Minting failed: ${error}`);
                      }}
                    />
                  ) : (
                    <RealMintButton
                      collectionName={collection.name}
                      quantity={mintQuantity}
                      totalCost={totalCost}
                      currency={currency}
                      lolBalanceInfo={lolBalanceInfo}
                      onMintSuccess={(result) => {
                        setMintStatus(`Successfully minted ${result.quantity} NFT(s)! Transaction: ${result.transactionSignature}`);
                        fetchCollectionInfo(); // Refresh collection info
                      }}
                      onMintError={(error) => {
                        setMintStatus(`Minting failed: ${error}`);
                      }}
                    />
                  )}

                  {mintStatus && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      <p className="text-white text-sm">{mintStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white/80 mb-6">Connect your wallet to mint NFTs</p>
                  <WalletMultiButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionMintPage() {
  return <CollectionMintContent />;
}
