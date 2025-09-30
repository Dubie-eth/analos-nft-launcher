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
      // Use direct NFT mint service to bypass backend issues
      const directMintService = new DirectNFTMintService('https://rpc.analos.io');

      console.log('🚀 Starting REAL blockchain minting (direct frontend)...');
      console.log('📍 Collection:', collectionName);
      console.log('🔢 Quantity:', quantity);
      console.log('👛 Wallet:', publicKey.toBase58());

      // Create real NFT mint transaction with Token Program instructions
      const transaction = await directMintService.createRealNFTMintTransaction(
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
      
      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);
      setStatus('Transaction signed, sending to blockchain...');
      console.log('✅ REAL NFT transaction signed by wallet');

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
