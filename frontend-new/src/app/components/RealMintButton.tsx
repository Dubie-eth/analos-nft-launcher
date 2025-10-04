'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AnalosNFTSDK } from '../../lib/sdk';
import DirectNFTMintService from '../../lib/direct-nft-mint';

interface RealMintButtonProps {
  collectionName: string;
  quantity: number;
  totalCost: number;
  currency: string;
  onMintSuccess: (result: any) => void;
  onMintError: (error: string) => void;
  losBalanceInfo?: any; // LOS balance eligibility info
  whitelistStatus?: {
    isWhitelisted: boolean;
    priceMultiplier: number;
    canMint?: boolean;
    remainingMints?: number;
    eligibilityReason?: string;
  };
}

export default function RealMintButton({
  collectionName,
  quantity,
  totalCost,
  currency,
  onMintSuccess,
  onMintError,
  losBalanceInfo,
  whitelistStatus
}: RealMintButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState('');

  const handleMint = async () => {
    if (!publicKey || !signTransaction) {
      onMintError('Wallet not connected or does not support signing');
      return;
    }

    // Check whitelist restrictions - ENFORCE STRICTLY
    if (whitelistStatus) {
      if (whitelistStatus.canMint === false || whitelistStatus.isWhitelisted === false) {
        onMintError('You are not eligible to mint during the whitelist phase');
        return;
      }
      if (whitelistStatus.remainingMints !== undefined && quantity > whitelistStatus.remainingMints) {
        onMintError(`You can only mint ${whitelistStatus.remainingMints} more NFT(s) during the whitelist phase`);
        return;
      }
    }

    setMinting(true);

    try {
      // Use direct NFT mint service to bypass backend issues
      const directMintService = new DirectNFTMintService('https://rpc.analos.io');

      console.log('🚀 Starting REAL blockchain minting (direct frontend)...');
      console.log('📍 Collection:', collectionName);
      console.log('🔢 Quantity:', quantity);
      console.log('👛 Wallet:', publicKey.toBase58());

      // Create real NFT mint transaction with Token Program instructions
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
      console.log('📝 REAL NFT transaction created with Token Program instructions, requesting wallet signature...');
      console.log(`🔑 Mint keypairs generated: ${mintKeypairs.length}`);
      
      // Add mint keypairs as signers (they need to sign for the createAccount instructions)
      mintKeypairs.forEach(keypair => {
        transaction.partialSign(keypair);
      });
      
      // Sign the transaction with wallet
      const signedTransaction = await signTransaction(transaction);
      setStatus('Transaction signed, sending to blockchain...');
      console.log('✅ REAL NFT transaction signed by wallet and mint keypairs');

      // Send to blockchain
      const connection = new (await import('@solana/web3.js')).Connection('https://rpc.analos.io', 'confirmed');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log('🎉 REAL NFT transaction sent to blockchain!');
      console.log('🔗 Transaction signature:', signature);

      const result = {
        success: true,
        signature,
        explorerUrl: directMintService.getExplorerUrl(signature),
        message: 'REAL NFT minted with Token Program instructions!'
      };

      if (result.success) {
        console.log('🎉 NFT minted successfully!');
        console.log('🔗 Transaction:', result.signature);
        console.log('🌐 Explorer:', result.explorerUrl);
        
        // Log mint events to blockchain via smart contract
        try {
          const tokenIds = mintKeypairs.map(keypair => keypair.publicKey.toBase58());
          const phase = whitelistStatus?.isWhitelisted ? 'whitelist' : 'public';
          
          await directMintService.logMintEvent(
            'Test', // Use actual collection name for logging
            publicKey.toBase58(),
            tokenIds,
            totalCost / quantity, // Price per NFT
            phase,
            result.signature
          );
          
          console.log('✅ Mint events logged to blockchain via smart contract');
        } catch (loggingError) {
          console.warn('⚠️ Failed to log mint events to blockchain:', loggingError);
          // Don't fail the mint if logging fails
        }
        
        onMintSuccess({
          success: true,
          transactionSignature: result.signature,
          explorerUrl: result.explorerUrl,
          quantity: quantity,
          collection: collectionName,
          totalCost: totalCost,
          currency: currency
        });
      } else {
        console.error('❌ Minting failed:', result.error);
        onMintError(result.error || 'Minting failed');
      }

    } catch (error) {
      console.error('❌ Error during minting:', error);
      onMintError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setMinting(false);
      setStatus('');
    }
  };

  // Determine if button should be disabled - ENFORCE STRICTLY
  const isDisabled = minting || 
    !publicKey || 
    (losBalanceInfo && !losBalanceInfo.hasMinimumBalance) ||
    (whitelistStatus && (whitelistStatus.canMint === false || whitelistStatus.isWhitelisted === false));

  // Get disabled reason for tooltip
  const getDisabledReason = () => {
    if (!publicKey) return 'Connect your wallet to mint';
    if (losBalanceInfo && !losBalanceInfo.hasMinimumBalance) {
      return 'You need more $LOL tokens to mint during this phase. Don\'t worry - this phase ends soon and another will begin!';
    }
    if (whitelistStatus && whitelistStatus.isWhitelisted && whitelistStatus.canMint === false) {
      if (whitelistStatus.remainingMints === 0) {
        return 'You have reached your mint limit for this whitelist phase. Don\'t worry - this phase ends soon and another will begin!';
      }
      return 'You are not eligible to mint during the whitelist phase. Don\'t worry - this phase ends soon and another will begin!';
    }
    return '';
  };

  // Determine button styling based on eligibility
  const getButtonStyling = () => {
    if (minting) {
      return 'bg-gray-600 cursor-not-allowed opacity-50';
    }
    
    if (!publicKey) {
      return 'bg-gray-600 cursor-not-allowed opacity-50';
    }
    
    if (losBalanceInfo && !losBalanceInfo.hasMinimumBalance) {
      return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cursor-not-allowed';
    }
    
    if (whitelistStatus && (whitelistStatus.canMint === false || whitelistStatus.isWhitelisted === false)) {
      return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cursor-not-allowed';
    }
    
    return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105';
  };

  return (
    <button
      onClick={handleMint}
      disabled={isDisabled}
      className={`w-full py-4 px-8 rounded-lg font-bold text-lg transition-all duration-200 transform ${getButtonStyling()}`}
      title={getDisabledReason()}
    >
      {minting ? (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Processing Mint...</span>
          </div>
          {status && (
            <div className="text-sm text-white/80">{status}</div>
          )}
        </div>
      ) : (
        <span className="flex flex-col items-center space-y-1">
          {losBalanceInfo && !losBalanceInfo.hasMinimumBalance ? (
            <>
              <span className="flex items-center space-x-2">
                <span>🚫 Not Eligible - Need More $LOL</span>
              </span>
              <span className="text-sm font-normal opacity-90">
                Don't worry! This phase ends soon and another will begin
              </span>
            </>
          ) : whitelistStatus && whitelistStatus.isWhitelisted && whitelistStatus.canMint === false ? (
            <>
              <span className="flex items-center space-x-2">
                <span>🚫 Not Eligible for Current Phase</span>
              </span>
              <span className="text-sm font-normal opacity-90">
                Don't worry! This phase ends soon and another will begin
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center space-x-2">
                <span>{`🎯 Mint ${quantity} NFT${quantity > 1 ? 's' : ''} for ${totalCost} ${currency}`}</span>
                {whitelistStatus?.isWhitelisted && (
                  <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                    {whitelistStatus.priceMultiplier === 0 ? 'FREE' : `${whitelistStatus.priceMultiplier}x`}
                  </span>
                )}
              </span>
            </>
          )}
        </span>
      )}
    </button>
  );
}
