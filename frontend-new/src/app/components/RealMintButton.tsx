'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AnalosNFTSDK } from '../../lib/sdk';

interface RealMintButtonProps {
  collectionName: string;
  quantity: number;
  totalCost: number;
  currency: string;
  onMintSuccess: (result: any) => void;
  onMintError: (error: string) => void;
}

export default function RealMintButton({
  collectionName,
  quantity,
  totalCost,
  currency,
  onMintSuccess,
  onMintError
}: RealMintButtonProps) {
  const { publicKey, signTransaction } = useWallet();
  const [minting, setMinting] = useState(false);
  const [status, setStatus] = useState('');

  const handleMint = async () => {
    if (!publicKey || !signTransaction) {
      onMintError('Wallet not connected or does not support signing');
      return;
    }

    setMinting(true);

    try {
      // Initialize the Analos NFT SDK
      const sdk = new AnalosNFTSDK({
        config: {
          rpcUrl: 'https://rpc.analos.io',
          explorerUrl: 'https://explorer.analos.io',
          apiUrl: 'https://analos-nft-launcher-production-f3da.up.railway.app',
          network: 'mainnet',
          cacheEnabled: true,
          cacheTimeout: 300000
        }
      });

      console.log('🚀 Starting real blockchain minting...');
      console.log('📍 Collection:', collectionName);
      console.log('🔢 Quantity:', quantity);
      console.log('👛 Wallet:', publicKey.toBase58());

      // Mint NFT using real blockchain transactions
      const result = await sdk.mintNFTWithWallet(
        collectionName,
        quantity,
        publicKey.toBase58(),
        async (transaction) => {
          setStatus('Requesting wallet signature...');
          console.log('📝 Transaction created, requesting wallet signature...');
          // This will prompt the user to sign the transaction
          const signedTransaction = await signTransaction(transaction);
          setStatus('Transaction signed, sending to blockchain...');
          console.log('✅ Transaction signed by wallet');
          return signedTransaction;
        }
      );

      if (result.success) {
        console.log('🎉 NFT minted successfully!');
        console.log('🔗 Transaction:', result.signature);
        console.log('🌐 Explorer:', result.explorerUrl);
        
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

  return (
    <button
      onClick={handleMint}
      disabled={minting || !publicKey}
      className={`w-full py-4 px-8 rounded-lg font-bold text-lg transition-all duration-200 transform ${
        minting || !publicKey
          ? 'bg-gray-600 cursor-not-allowed opacity-50'
          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105'
      }`}
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
        `🎯 Mint ${quantity} NFT${quantity > 1 ? 's' : ''} for ${totalCost} ${currency}`
      )}
    </button>
  );
}
