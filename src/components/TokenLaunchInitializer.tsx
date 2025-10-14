'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';
import TransactionConfirmationDialog from './TransactionConfirmationDialog';

interface TokenLaunchInitializerProps {}

export default function TokenLaunchInitializer({}: TokenLaunchInitializerProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Use WebSocket-disabled connection
  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  const getTransactionDetails = () => {
    return {
      title: 'Initialize Token Launch Program (Analos Blockchain)',
      description: `Initialize the Token Launch program on Analos blockchain. This program handles token launches with bonding curves, creator prebuy, and trading fees.`,
      estimatedFee: '~0.002 LOS',
      fromAccount: publicKey?.toString() || '',
      toAccount: ANALOS_PROGRAMS.TOKEN_LAUNCH.toString(),
      programId: ANALOS_PROGRAMS.TOKEN_LAUNCH.toString()
    };
  };

  const handleInitialize = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setResult({ success: false, message: 'Please connect your wallet first' });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmTransaction = async () => {
    if (!connected || !publicKey || !signTransaction) return;

    setLoading(true);
    setResult(null);
    setShowConfirmation(false);

    try {
      // Create initialization transaction
      const transaction = new Transaction();

      // Add program initialization instruction
      // Note: This is a simplified initialization - actual implementation would depend on the program's specific requirements
      const initializeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: ANALOS_PROGRAMS.TOKEN_LAUNCH, isSigner: false, isWritable: false },
        ],
        programId: ANALOS_PROGRAMS.TOKEN_LAUNCH,
        data: Buffer.from([]), // Empty data for initialization
      });

      transaction.add(initializeInstruction);

      // Get recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      // Confirm transaction
      await connection.confirmTransaction(signature);

      setResult({
        success: true,
        message: 'Token Launch program initialized successfully!',
        signature
      });

    } catch (error: any) {
      console.error('Initialization error:', error);
      setResult({
        success: false,
        message: `Initialization failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-4xl">🚀</div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Token Launch Initializer</h3>
          <p className="text-gray-300">
            Initialize the Token Launch program with bonding curve functionality.
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-black/20 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">Program Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Program ID:</span>
              <span className="text-purple-400 font-mono text-xs break-all">
                {ANALOS_PROGRAMS.TOKEN_LAUNCH.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">Deployed ✅ | Not Initialized ⏳</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-blue-400">Analos Mainnet</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
          <h4 className="text-lg font-semibold text-white mb-2">Features</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Dynamic bonding curve pricing</li>
            <li>• Creator prebuy functionality</li>
            <li>• Automated trading fee collection</li>
            <li>• DLMM integration for liquidity</li>
          </ul>
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-lg mb-4 ${
          result.success 
            ? 'bg-green-500/10 border border-green-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{result.success ? '✅' : '❌'}</span>
            <span className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? 'Success' : 'Error'}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-2">{result.message}</p>
          {result.signature && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Transaction:</span>
              <a
                href={`https://explorer.analos.io/tx/${result.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 break-all"
              >
                {result.signature}
              </a>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleInitialize}
        disabled={!connected || loading}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
          !connected || loading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg hover:shadow-purple-500/25'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Initializing...
          </div>
        ) : !connected ? (
          'Connect Wallet to Initialize'
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>🚀</span>
            Initialize Token Launch Program
          </div>
        )}
      </button>

      {showConfirmation && (
        <TransactionConfirmationDialog
          isOpen={showConfirmation}
          onConfirm={handleConfirmTransaction}
          onCancel={handleCancelTransaction}
          transactionDetails={getTransactionDetails()}
        />
      )}
    </div>
  );
}
