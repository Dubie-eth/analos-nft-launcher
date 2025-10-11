'use client';

import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PROGRAMS } from '@/config/analos-programs';

export default function PriceOracleInitializer() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [losPrice, setLosPrice] = useState('0.10'); // Default: $0.10 USD
  const [status, setStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');

  const initializePriceOracle = async () => {
    if (!publicKey || !signTransaction) {
      setStatus('error');
      setMessage('Please connect your wallet first');
      return;
    }

    try {
      setStatus('initializing');
      setMessage('Building transaction...');

      // Parse price to 6 decimals (e.g., $0.10 = 100000)
      const priceInMicroUSD = Math.floor(parseFloat(losPrice) * 1_000_000);
      
      console.log('💰 Initializing Price Oracle...');
      console.log('   Price:', losPrice, 'USD');
      console.log('   Price (6 decimals):', priceInMicroUSD);
      console.log('   Authority:', publicKey.toString());

      // Derive PDA for oracle data account
      const [oracleDataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle')],
        ANALOS_PROGRAMS.PRICE_ORACLE
      );

      console.log('   Oracle PDA:', oracleDataPDA.toString());

      // Build initialize instruction
      // Note: You'll need to implement this based on your program's exact instruction format
      // This is a template - adjust the instruction data based on your program
      
      const instructionData = Buffer.alloc(9); // 1 byte discriminator + 8 bytes for u64 price
      instructionData.writeUInt8(0, 0); // Instruction discriminator for "initialize"
      instructionData.writeBigUInt64LE(BigInt(priceInMicroUSD), 1);

      const instruction = {
        programId: ANALOS_PROGRAMS.PRICE_ORACLE,
        keys: [
          { pubkey: oracleDataPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      };

      // Create transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      
      // Get recent blockhash
      setMessage('Getting recent blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // Sign transaction
      setMessage('Please sign the transaction in your wallet...');
      const signedTransaction = await signTransaction(transaction);

      // Send transaction
      setMessage('Sending transaction to blockchain...');
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      setMessage('Waiting for confirmation...');
      console.log('   Transaction Signature:', txSignature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      // Success!
      setStatus('success');
      setMessage(`Price Oracle initialized successfully! LOS price set to $${losPrice} USD`);
      setSignature(txSignature);
      
      console.log('✅ Price Oracle initialized!');
      console.log('   Transaction:', txSignature);
      console.log('   Explorer:', `https://explorer.analos.io/tx/${txSignature}`);

    } catch (error: any) {
      console.error('❌ Initialization failed:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to initialize Price Oracle');
    }
  };

  const updatePrice = async () => {
    if (!publicKey || !signTransaction) {
      setStatus('error');
      setMessage('Please connect your wallet first');
      return;
    }

    try {
      setStatus('initializing');
      setMessage('Updating price...');

      const priceInMicroUSD = Math.floor(parseFloat(losPrice) * 1_000_000);
      
      console.log('💰 Updating Price Oracle...');
      console.log('   New Price:', losPrice, 'USD');

      // Derive PDA
      const [oracleDataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle')],
        ANALOS_PROGRAMS.PRICE_ORACLE
      );

      // Build update instruction
      const instructionData = Buffer.alloc(9);
      instructionData.writeUInt8(1, 0); // Instruction discriminator for "update_price"
      instructionData.writeBigUInt64LE(BigInt(priceInMicroUSD), 1);

      const instruction = {
        programId: ANALOS_PROGRAMS.PRICE_ORACLE,
        keys: [
          { pubkey: oracleDataPDA, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
        ],
        data: instructionData,
      };

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = publicKey;
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      setMessage('Please sign the transaction...');
      const signedTransaction = await signTransaction(transaction);

      setMessage('Sending transaction...');
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      setMessage('Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      setStatus('success');
      setMessage(`Price updated successfully! New price: $${losPrice} USD`);
      setSignature(txSignature);
      
      console.log('✅ Price updated!');
      console.log('   Transaction:', txSignature);

    } catch (error: any) {
      console.error('❌ Update failed:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to update price');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4">💰 Price Oracle Initializer</h2>
      
      <div className="space-y-4">
        {/* Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LOS Price in USD
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={losPrice}
            onChange={(e) => setLosPrice(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white"
            placeholder="0.10"
          />
          <p className="text-xs text-gray-400 mt-1">
            Example: 0.10 means $0.10 USD per LOS token
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={initializePriceOracle}
            disabled={!publicKey || status === 'initializing'}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            {status === 'initializing' ? 'Initializing...' : '🚀 Initialize Oracle'}
          </button>
          
          <button
            onClick={updatePrice}
            disabled={!publicKey || status === 'initializing'}
            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            {status === 'initializing' ? 'Updating...' : '🔄 Update Price'}
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-500/20 border border-green-500/50' :
            status === 'error' ? 'bg-red-500/20 border border-red-500/50' :
            'bg-blue-500/20 border border-blue-500/50'
          }`}>
            <p className="text-white">{message}</p>
            
            {signature && (
              <a
                href={`https://explorer.analos.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
              >
                View on Explorer →
              </a>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">ℹ️ Information</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• <strong>Initialize:</strong> Creates the oracle for the first time</li>
            <li>• <strong>Update:</strong> Changes the LOS price (use after initialization)</li>
            <li>• You must be the program authority to use these functions</li>
            <li>• Price is stored with 6 decimal precision</li>
          </ul>
        </div>

        {/* Current Wallet */}
        {publicKey && (
          <div className="text-xs text-gray-400">
            Connected Wallet: <code className="bg-gray-800/50 px-2 py-1 rounded">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</code>
          </div>
        )}
      </div>
    </div>
  );
}

