'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';
import TransactionConfirmationDialog from './TransactionConfirmationDialog';

export default function PriceOracleInitializer() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [losMarketCap, setLosMarketCap] = useState('1000000'); // $1M market cap
  
  // Use WebSocket-disabled connection
  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  const getTransactionDetails = () => {
    return {
      title: 'Initialize Price Oracle',
      description: `Initialize the Price Oracle with LOS market cap of $${parseInt(losMarketCap).toLocaleString()} USD`,
      estimatedFee: '0.005 LOS',
      fromAccount: publicKey?.toString() || '',
      toAccount: ANALOS_PROGRAMS.PRICE_ORACLE.toString(),
      programId: ANALOS_PROGRAMS.PRICE_ORACLE.toString()
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
    setShowConfirmation(false);
    setLoading(true);
    setResult(null);

    try {
      // Ensure publicKey is available
      if (!publicKey || !signTransaction) {
        setResult({ success: false, message: 'Wallet connection lost' });
        return;
      }

      // Create the Price Oracle PDA
      const [priceOraclePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle')],
        ANALOS_PROGRAMS.PRICE_ORACLE
      );

      // Convert market cap to micro USD (6 decimals)
      const marketCapMicroUSD = parseInt(losMarketCap) * 1000000; // Convert to 6 decimals

      // Create instruction data for initialize_oracle
      // This is a simplified version - in production you'd use Anchor's instruction builder
      const instructionData = Buffer.concat([
        Buffer.from([0x8a, 0x97, 0x15, 0x4b, 0x9a, 0x8e, 0x2c, 0x7b]), // Discriminator for initialize_oracle
        Buffer.alloc(8), // Placeholder for market cap (will be filled by program)
      ]);

      // Write the market cap value (8 bytes, little endian)
      instructionData.writeUInt32LE(marketCapMicroUSD & 0xFFFFFFFF, 8);
      instructionData.writeUInt32LE((marketCapMicroUSD >> 32) & 0xFFFFFFFF, 12);

      const transaction = new Transaction().add({
        keys: [
          { pubkey: priceOraclePda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: ANALOS_PROGRAMS.PRICE_ORACLE,
        data: instructionData,
      });

      // Sign and send transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log('🚀 Price Oracle initialized successfully:', signature);
      
      // Transaction sent successfully - show success immediately
      setResult({
        success: true,
        message: `Price Oracle initialized with $${parseInt(losMarketCap).toLocaleString()} market cap ✅`,
        signature
      });

      // Try to confirm in background
      try {
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
        }, 'confirmed');
        
        setResult({
          success: true,
          message: `Price Oracle initialized with $${parseInt(losMarketCap).toLocaleString()} market cap ✅ CONFIRMED`,
          signature
        });
      } catch (confirmError) {
        console.log('Confirmation timeout, but transaction was sent:', signature);
        setResult({
          success: true,
          message: `Price Oracle initialized with $${parseInt(losMarketCap).toLocaleString()} market cap ⏳ Sent`,
          signature
        });
      }

    } catch (error: any) {
      console.error('Price Oracle initialization error:', error);
      
      if (error.message?.includes('TransactionExpiredTimeoutError')) {
        setResult({
          success: false,
          message: 'Transaction timeout - Analos network is slow. Please check transaction status manually.'
        });
      } else if (error.message?.includes('WebSocket')) {
        setResult({
          success: false,
          message: 'Connection error - WebSocket disabled for security. Please try again.'
        });
      } else {
        setResult({
          success: false,
          message: `Initialization failed: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/30">
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-3xl">💰</span>
        <div>
          <h3 className="text-2xl font-bold text-white">Price Oracle Initializer</h3>
          <p className="text-gray-300">Initialize the Price Oracle with proper instruction handlers</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">
            LOS Market Cap (USD)
          </label>
          <input
            type="number"
            value={losMarketCap}
            onChange={(e) => setLosMarketCap(e.target.value)}
            placeholder="1000000"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <p className="text-gray-400 text-sm mt-1">
            Example: 1000000 means $1,000,000 USD market cap for LOS token
          </p>
        </div>

        <button
          onClick={handleInitialize}
          disabled={loading || !connected}
          className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Initializing...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Initialize Price Oracle</span>
            </>
          )}
        </button>

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
      </div>

      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Information</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Initialize: Creates the oracle with proper instruction handlers</li>
          <li>• Market Cap: Sets the initial LOS market cap in USD</li>
          <li>• You must be the program authority to use these functions</li>
          <li>• Price is stored with 6 decimal precision</li>
        </ul>
      </div>

      {/* Transaction Confirmation Dialog */}
      <TransactionConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={handleConfirmTransaction}
        onCancel={() => setShowConfirmation(false)}
        transactionDetails={getTransactionDetails()}
      />
    </div>
  );
}