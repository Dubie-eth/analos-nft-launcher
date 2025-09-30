'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { tokenIdTracker } from '../../lib/token-id-tracker';
import DirectNFTMintService from '../../lib/direct-nft-mint';

interface AdvancedMintButtonProps {
  collectionName: string;
  collectionMint: string;
  quantity: number;
  totalCost: number;
  currency: string;
  onMintSuccess: (result: any) => void;
  onMintError: (error: string) => void;
}

export default function AdvancedMintButton({
  collectionName,
  collectionMint,
  quantity,
  totalCost,
  currency,
  onMintSuccess,
  onMintError
}: AdvancedMintButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState('');
  const [mintCheck, setMintCheck] = useState<any>(null);

  // Check if wallet can mint
  const checkMintEligibility = () => {
    if (!publicKey) {
      setMintCheck({ canMint: false, reason: 'Wallet not connected', currentCount: 0, maxAllowed: 0 });
      return;
    }

    const collectionInfo = tokenIdTracker.getCollectionInfo(collectionMint);
    if (!collectionInfo) {
      setMintCheck({ canMint: false, reason: 'Collection not found', currentCount: 0, maxAllowed: 0 });
      return;
    }

    const checkResult = tokenIdTracker.canMint(collectionMint, publicKey.toBase58(), quantity);
    setMintCheck(checkResult);
    
    return checkResult;
  };

  const handleMint = async () => {
    if (!publicKey || !signTransaction) {
      onMintError('Wallet not connected');
      return;
    }

    // Check mint eligibility
    const eligibility = checkMintEligibility();
    if (!eligibility?.canMint) {
      onMintError(eligibility?.reason || 'Cannot mint');
      return;
    }

    setMinting(true);
    setStatus('Initializing mint...');

    try {
      const directMintService = new DirectNFTMintService('https://rpc.analos.io');
      const { transaction, mintKeypairs } = await directMintService.createRealNFTMintTransaction(
        collectionName,
        quantity,
        publicKey.toBase58(),
        {
          name: collectionName,
          symbol: '$LOL',
          description: `A unique NFT from the ${collectionName} collection`,
          image: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
        }
      );

      setStatus('Requesting wallet signature...');
      mintKeypairs.forEach(keypair => {
        transaction.partialSign(keypair);
      });
      
      const signedTransaction = await signTransaction(transaction);
      setStatus('Transaction signed, sending to blockchain...');

      const connection = new (await import('@solana/web3.js')).Connection('https://rpc.analos.io', 'confirmed');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      setStatus('Mint successful!');

      const result = {
        success: true,
        signature,
        explorerUrl: directMintService.getExplorerUrl(signature),
        message: 'NFT minted successfully!',
        phaseInfo: eligibility.phaseInfo
      };

      onMintSuccess({
        success: true,
        transactionSignature: result.signature,
        explorerUrl: result.explorerUrl,
        quantity: quantity,
        collection: collectionName,
        totalCost: totalCost,
        currency: currency,
        phaseInfo: result.phaseInfo
      });

    } catch (error) {
      console.error('Mint error:', error);
      onMintError(error instanceof Error ? error.message : 'Minting failed');
    } finally {
      setMinting(false);
      setStatus('');
    }
  };

  // Check eligibility on component mount and when wallet changes
  React.useEffect(() => {
    checkMintEligibility();
  }, [publicKey, collectionMint, quantity]);

  const collectionInfo = tokenIdTracker.getCollectionInfo(collectionMint);
  const isRevealed = tokenIdTracker.isRevealed(collectionMint);

  if (!publicKey) {
    return (
      <button
        disabled
        className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl font-semibold cursor-not-allowed"
      >
        Connect Wallet to Mint
      </button>
    );
  }

  if (!mintCheck) {
    return (
      <button
        disabled
        className="w-full bg-gray-400 text-white py-4 px-6 rounded-xl font-semibold cursor-not-allowed"
      >
        Checking Eligibility...
      </button>
    );
  }

  if (!mintCheck.canMint) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full bg-red-500 text-white py-4 px-6 rounded-xl font-semibold cursor-not-allowed"
        >
          Cannot Mint: {mintCheck.reason}
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          You have minted {mintCheck.currentCount} of {mintCheck.maxAllowed} allowed
          {mintCheck.phaseInfo && (
            <span className="block mt-1">
              Phase: {mintCheck.phaseInfo.phase} ({mintCheck.phaseInfo.price} $LOS)
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleMint}
        disabled={minting}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        {minting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {status || 'Minting...'}
          </div>
        ) : (
          `🎨 Mint ${quantity} NFT${quantity > 1 ? 's' : ''} for ${totalCost} ${currency}`
        )}
      </button>
      
      <div className="text-sm text-gray-600 dark:text-gray-300 text-center space-y-1">
        <div>
          You have minted {mintCheck.currentCount} of {mintCheck.maxAllowed} allowed
        </div>
        {mintCheck.phaseInfo && (
          <div className="text-purple-600 dark:text-purple-400 font-medium">
            Phase: {mintCheck.phaseInfo.phase} ({mintCheck.phaseInfo.price} $LOS)
          </div>
        )}
        {collectionInfo?.delayedReveal.enabled && !isRevealed && (
          <div className="text-orange-600 dark:text-orange-400 font-medium">
            🎭 Delayed Reveal Active - Using placeholder images
          </div>
        )}
      </div>
    </div>
  );
}
