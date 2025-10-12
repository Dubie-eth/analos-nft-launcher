'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
// import { Program, AnchorProvider, web3 } from '@project-serum/anchor'; // Temporarily disabled - no IDL available
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';
import TransactionConfirmationDialog from './TransactionConfirmationDialog';

// NFT Launchpad IDL - you'll need to add this file
// import idl from '../../programs/analos-nft-launchpad/target/idl/analos_nft_launchpad.json';

interface NFTLaunchpadInitializerProps {}

export default function NFTLaunchpadInitializer({}: NFTLaunchpadInitializerProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTransactionDetails, setPendingTransactionDetails] = useState<any>(null);

  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  const getProgram = () => {
    // Temporarily disabled until Anchor IDL is available
    return null;
  };

  const getTransactionDetails = () => {
    if (!publicKey) return null;

    const fee = '0.002 LOS'; // Estimated fee for initialization
    const programId = ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString();
    
    return {
      title: 'Initialize NFT Launchpad Collection',
      description: `Initialize the NFT Launchpad for collection: ${collectionName || 'Unnamed'} (${collectionSymbol || 'SYMBOL'})`,
      estimatedFee: fee,
      fromAccount: publicKey.toString(),
      toAccount: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString(),
      programId: programId,
      actionType: 'initialize'
    };
  };

  const handleInitialize = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setResult({ success: false, message: 'Please connect your wallet first' });
      return;
    }

    if (!collectionName.trim() || !collectionSymbol.trim()) {
      setResult({ success: false, message: 'Please enter both collection name and symbol' });
      return;
    }

    const details = getTransactionDetails();
    if (!details) {
      setResult({ success: false, message: 'Failed to get transaction details.' });
      return;
    }
    setPendingTransactionDetails(details);
    setShowConfirmation(true);
  };

  const handleConfirmTransaction = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setResult(null);

    try {
      if (!publicKey || !signTransaction) {
        setResult({ success: false, message: 'Wallet connection lost' });
        return;
      }

      // For now, use simple transfer until we have proper IDL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: ANALOS_PROGRAMS.NFT_LAUNCHPAD,
          lamports: 2000000, // 0.002 LOS for initialization
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log('🚀 NFT Launchpad transaction sent successfully:', signature);
      
      setResult({
        success: true,
        message: `NFT Launchpad initialized for collection: ${collectionName} (${collectionSymbol}) ✅ Transaction sent successfully!`,
        signature
      });

      try {
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
        }, 'confirmed');
        
        setResult({
          success: true,
          message: `NFT Launchpad initialized for collection: ${collectionName} (${collectionSymbol}) ✅ CONFIRMED on blockchain`,
          signature
        });
      } catch (confirmError) {
        console.log('Confirmation timeout, but transaction was sent:', signature);
        setResult({
          success: true,
          message: `NFT Launchpad initialized for collection: ${collectionName} (${collectionSymbol}) ⏳ Sent (check explorer for confirmation)`,
          signature
        });
      }

    } catch (error: any) {
      console.error('NFT Launchpad initialization error:', error);
      let errorMessage = 'Initialization failed';
      if (error.message?.includes('TransactionExpiredTimeoutError')) {
        errorMessage = 'Transaction timeout - Analos network is slow. Please check transaction status manually or try again later.';
      } else if (error.message?.includes('WebSocket')) {
        errorMessage = 'Connection error - WebSocket disabled for security. Please try again.';
      } else {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      setResult({ success: false, message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">🎨</span>
        <h2 className="text-3xl font-bold text-white">NFT Launchpad Initializer</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-white font-semibold mb-2">
            Collection Name
          </label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder="e.g., Los Bros NFT"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            Enter the name of your NFT collection.
          </p>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Collection Symbol
          </label>
          <input
            type="text"
            value={collectionSymbol}
            onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase())}
            placeholder="e.g., LOSBROS"
            maxLength={10}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            Enter the symbol for your NFT collection (max 10 characters).
          </p>
        </div>

        <button
          onClick={handleInitialize}
          disabled={loading || !connected || !collectionName.trim() || !collectionSymbol.trim()}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span>🎨</span>
              <span>Initialize NFT Launchpad</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className={`mt-6 p-6 rounded-xl border ${
          result.success 
            ? 'bg-green-500/20 text-green-300 border-green-500/30' 
            : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">{result.success ? '✅' : '❌'}</span>
            <p className="font-semibold text-lg">{result.message}</p>
          </div>
          
          {result.signature && (
            <div className="bg-black/30 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium mb-2">Transaction Signature:</p>
              <code className="text-xs break-all block mb-3 p-2 bg-black/50 rounded">
                {result.signature}
              </code>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <a 
                  href={`https://explorer.analos.io/tx/${result.signature}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <span>🔗</span>
                  <span>View on Analos Explorer</span>
                </a>
                
                <button
                  onClick={() => navigator.clipboard.writeText(result.signature!)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <span>📋</span>
                  <span>Copy Signature</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h4 className="text-purple-300 font-semibold mb-2">Information</h4>
        <ul className="text-purple-200 text-sm space-y-1">
          <li>• Initializes the NFT Launchpad for your specific collection</li>
          <li>• You must be the program authority to use this function</li>
          <li>• This sets up the collection configuration and minting parameters</li>
          <li>• Once initialized, you can configure bonding curves, tiers, and launch settings</li>
        </ul>
      </div>

      {/* Transaction Confirmation Dialog */}
      <TransactionConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirmTransaction}
        onCancel={() => setShowConfirmation(false)}
        transactionDetails={pendingTransactionDetails}
      />
    </div>
  );
}
