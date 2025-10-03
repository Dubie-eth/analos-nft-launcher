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
import DirectNFTMintService from '@/lib/direct-nft-mint';
import BlockchainVerificationService from '@/lib/blockchain-verification-service';
import { smartContractReference } from '@/lib/smart-contract-reference';
import { nftSupplyTracker } from '@/lib/nft-supply-tracker';

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

  const fetchCollectionInfo = useCallback(async (forceRefresh = false) => {
    try {
      // Add simple caching to prevent redundant calls
      const cacheKey = `collection_${collectionName}`;
      const cacheTime = 10000; // 10 seconds cache
      const now = Date.now();
      
      if (!forceRefresh && collection && (now - (collection as any).lastFetched) < cacheTime) {
        console.log('📋 Using cached collection data for:', collectionName);
        return;
      }
      
      console.log('📡 Fetching collection from blockchain (single source of truth):', collectionName);
      const blockchainService = new BlockchainCollectionService();
      const blockchainCollection = await blockchainService.getCollectionByNameFromBlockchain(collectionName);
      
      if (blockchainCollection) {
        // Add timestamp for caching
        (blockchainCollection as any).lastFetched = now;
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
      
      // Only set up real-time updates for supply changes when actively minting
      // Reduced frequency to 60 seconds for better performance
      const interval = setInterval(() => {
        // Only refresh if page is visible and we have a collection loaded
        if (document.visibilityState === 'visible' && collection) {
          fetchCollectionInfo();
        }
      }, 60000); // Changed from 5000ms to 60000ms (60 seconds)
      
      return () => clearInterval(interval);
    }
  }, [collectionName]); // Removed fetchCollectionInfo from dependencies to prevent re-renders

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
      // Validate against smart contract reference first
      console.log('🔍 Validating minting eligibility against smart contract...');
      
      // Determine payment token based on what user has
      let paymentToken = 'LOS'; // Default to LOS
      if (lolBalanceInfo && lolBalanceInfo.balance >= 1000) {
        paymentToken = 'LOL'; // Use LOL if user has sufficient balance
      }
      
      console.log('💳 Selected payment token:', paymentToken);
      
      // Check smart contract eligibility
      const eligibility = smartContractReference.validateMintingEligibility(
        collection.name,
        publicKey.toString(),
        mintQuantity,
        paymentToken
      );
      
      if (!eligibility.eligible) {
        throw new Error(`Minting not eligible: ${eligibility.reason}`);
      }
      
      console.log('✅ Smart contract validation passed');
      console.log('📊 Current phase:', eligibility.currentPhase?.name);
      console.log('💰 Mint price:', eligibility.price);
      console.log('🎯 Max mints per wallet:', eligibility.maxMints);
      
      // Use direct frontend minting with proper payment processing
      console.log('🎯 Using direct frontend minting with payment processing...');
      
      const directMintService = new DirectNFTMintService();
      
      const collectionData = {
        name: collection.name,
        symbol: collection.symbol || collection.name.substring(0, 4),
        description: collection.description || '',
        image: collection.imageUrl || '',
        mintPrice: eligibility.price || collection.mintPrice, // Use smart contract price
        paymentToken: paymentToken
      };
      
      console.log('🔍 Collection data for minting:', {
        name: collectionData.name,
        mintPrice: collectionData.mintPrice,
        paymentToken: collectionData.paymentToken,
        eligibilityPrice: eligibility.price,
        originalPrice: collection.mintPrice
      });
      
      const { transaction, mintKeypairs } = await directMintService.createRealNFTMintTransaction(
        collection.name,
        mintQuantity,
        publicKey.toString(),
        collectionData
      );
      
      console.log('📝 REAL NFT transaction created with Token Program instructions, requesting wallet signature...');
      
      setMintStatus('Please sign the NFT minting transaction in your wallet...');
      
      // Create connection for transaction handling
      const connection = new Connection('https://rpc.analos.io', {
        commitment: 'confirmed',
        wsEndpoint: undefined,
      });
      
      console.log('🔑 Mint keypairs generated:', mintKeypairs.length);
      
      // Sign the transaction with both wallet and mint keypairs
      const signedTransaction = await signTransaction(transaction);
      
      // Add mint keypairs to the transaction
      mintKeypairs.forEach(keypair => {
        signedTransaction.partialSign(keypair);
      });
      
      console.log('✅ REAL NFT transaction signed by wallet and mint keypairs');
      
      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log('🎉 REAL NFT transaction sent to blockchain!');
      console.log('🔗 Transaction signature:', signature);
      
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
      
      console.log('🎉 NFT minted successfully!');
      console.log('🔗 Transaction:', signature);
      console.log('🌐 Explorer:', directMintService.getExplorerUrl(signature));

      // Verify transaction on blockchain as fail-safe
      setMintStatus('Verifying transaction on blockchain...');
      console.log('🔍 Starting blockchain verification as fail-safe...');
      
      const verificationService = new BlockchainVerificationService();
      
      try {
        const verificationResult = await verificationService.retryTransactionVerification(
          signature,
          3, // Max retries
          2000 // 2 second delay between retries
        );
        
        if (verificationResult.success && verificationResult.verified) {
          console.log('✅ Blockchain verification successful!');
          console.log('🎯 NFT mint address:', verificationResult.nftMintAddress);
          console.log('💰 Payment verified:', verificationResult.paymentAmount, verificationResult.paymentToken);
          
          // Verify NFT ownership
          if (verificationResult.nftMintAddress) {
            const ownershipVerified = await verificationService.verifyNFTOwnership(
              verificationResult.nftMintAddress,
              publicKey.toString()
            );
            
            if (ownershipVerified) {
              console.log('✅ NFT ownership verified on blockchain!');
              setMintStatus(`✅ Successfully minted and verified ${mintQuantity} NFT(s)! Transaction: ${signature}`);
              
              // Update supply data after successful mint
              console.log('📊 Updating supply data after successful mint...');
              await nftSupplyTracker.updateSupplyAfterMint(collection.name, mintQuantity);
            } else {
              console.log('⚠️ NFT ownership not yet confirmed (may take time to propagate)');
              setMintStatus(`✅ NFT minted! Transaction: ${signature} (Ownership verification pending)`);
              
              // Still update supply data even if ownership verification is pending
              console.log('📊 Updating supply data after mint (ownership pending)...');
              await nftSupplyTracker.updateSupplyAfterMint(collection.name, mintQuantity);
            }
          }
        } else {
          console.log('⚠️ Blockchain verification failed:', verificationResult.error);
          setMintStatus(`⚠️ NFT transaction sent but verification failed: ${verificationResult.error}`);
        }
      } catch (verificationError) {
        console.error('❌ Blockchain verification error:', verificationError);
        setMintStatus(`✅ NFT transaction sent! Verification error: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
      }

      // Refresh collection info to update supply and progress bar
      console.log('🔄 Refreshing collection info to update progress bar...');
      await fetchCollectionInfo(true); // Force refresh

    } catch (error) {
      console.error('❌ Minting error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.message.includes('toBase58')) {
          setMintStatus('Minting failed: Invalid wallet address or transaction data. Please refresh and try again.');
        } else if (error.message.includes('User rejected')) {
          setMintStatus('Minting cancelled: Transaction was rejected in your wallet.');
        } else if (error.message.includes('Insufficient funds')) {
          setMintStatus('Minting failed: Insufficient LOS balance for transaction.');
        } else {
          setMintStatus(`Minting failed: ${error.message}`);
        }
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
                <div className="flex justify-between items-start mb-4">
                  <div></div>
                  <button
                    onClick={() => fetchCollectionInfo(true)}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 text-blue-400 hover:text-blue-300 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                    title="Refresh collection data"
                  >
                    {loading ? '🔄' : '↻'} Refresh
                  </button>
                </div>
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
