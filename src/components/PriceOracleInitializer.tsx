'use client';

import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';
import crypto from 'crypto';
import TransactionConfirmationDialog from './TransactionConfirmationDialog';

export default function PriceOracleInitializer() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [losMarketCap, setLosMarketCap] = useState('1000000'); // $1M market cap
  
  // Use WebSocket-disabled connection
  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  // No Anchor - using pure raw instructions to avoid BN issues

  const getTransactionDetails = () => {
    return {
      title: 'Initialize Price Oracle (Analos Blockchain)',
      description: `Initialize the Price Oracle on Analos blockchain with LOS market cap of $${parseInt(losMarketCap).toLocaleString()} USD. Data stored both on-chain and locally.`,
      estimatedFee: '~0.001 LOS',
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

      console.log('🔧 Creating Price Oracle PDA...');
      const [priceOraclePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle'), publicKey.toBuffer()],
        ANALOS_PROGRAMS.PRICE_ORACLE
      );
      console.log('✅ Price Oracle PDA:', priceOraclePda.toString());

      console.log('🔗 RAW INSTRUCTION APPROACH: Testing with original program ID...');
      
      // Convert market cap to proper format (LOS with 9 decimals)
      const marketCapUSD = parseInt(losMarketCap);
      const marketCapNanoLOS = marketCapUSD * 1000000000; // Convert to nano LOS (9 decimals)
      
      console.log('📊 Market Cap (USD):', marketCapUSD);
      console.log('📊 Market Cap (nano LOS):', marketCapNanoLOS);
      console.log('🔗 Program ID:', ANALOS_PROGRAMS.PRICE_ORACLE.toString());
      console.log('🔗 PDA:', priceOraclePda.toString());

      // Try different discriminators - the deployed program might use a different one
      const discriminators = [
        crypto.createHash('sha256').update('global:initialize_oracle').digest().slice(0, 8),
        Buffer.from([0x8f, 0x9e, 0x4e, 0x4e, 0x00, 0x00, 0x00, 0x00]), // Previous attempt
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // Simple zero discriminator
      ];
      
      const discriminator = discriminators[0]; // Try the standard Anchor discriminator
      
      console.log('🔧 Discriminator:', discriminator.toString('hex'));

      // Create raw instruction data
      const instructionData = Buffer.alloc(8 + 8); // 8 bytes discriminator + 8 bytes u64
      instructionData.set(discriminator, 0);
      
      // Set market cap as little-endian u64
      const marketCapBuffer = Buffer.alloc(8);
      marketCapBuffer.writeBigUInt64LE(BigInt(marketCapNanoLOS), 0);
      instructionData.set(marketCapBuffer, 8);
      
      console.log('🔧 Instruction data length:', instructionData.length);
      console.log('🔧 Market cap buffer:', marketCapBuffer.toString('hex'));

      // Create the raw instruction
      const initializeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: priceOraclePda, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: ANALOS_PROGRAMS.PRICE_ORACLE,
        data: instructionData,
      });

      // Create and send transaction
      const transaction = new Transaction().add(initializeInstruction);
      
      // Get latest blockhash and set transaction properties
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('✅ Transaction sent successfully! Signature:', signature);

      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      console.log('✅ Price Oracle initialized successfully on blockchain:', signature);

      // Also store locally for UI persistence
      const oracleData = {
        authority: publicKey.toString(),
        marketCapUsd: marketCapUSD,
        marketCapNanoLos: marketCapNanoLOS,
        lastUpdated: new Date().toISOString(),
        isActive: true,
        programId: ANALOS_PROGRAMS.PRICE_ORACLE.toString(),
        signature: signature
      };
      
      localStorage.setItem('analos-price-oracle', JSON.stringify(oracleData));
      
      // Blockchain initialization complete - show success
      setResult({
        success: true,
        message: `Price Oracle initialized with $${parseInt(losMarketCap).toLocaleString()} market cap ✅ BLOCKCHAIN`,
        signature: signature
      });

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

      <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <h4 className="text-green-300 font-semibold mb-2">✅ Pure Raw Instruction Approach - No Anchor, No BN Issues</h4>
        <ul className="text-green-200 text-sm space-y-1">
          <li>• <span className="text-green-300">🚀 Completely bypasses Anchor and BN processing</span></li>
          <li>• Calculates correct discriminator using crypto.sha256</li>
          <li>• Market Cap: Sets initial LOS market cap in USD (9 decimals)</li>
          <li>• Creates real PriceOracle account on-chain</li>
          <li>• Uses pure Solana Web3.js instructions</li>
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