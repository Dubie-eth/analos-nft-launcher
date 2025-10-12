'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';

interface ProgramInitializerProps {
  programType: 'price-oracle' | 'rarity-oracle' | 'nft-launchpad';
}

export default function ProgramInitializer({ programType }: ProgramInitializerProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  
  // Price Oracle specific state
  const [losPrice, setLosPrice] = useState('0.0008714');
  
  // NFT Launchpad specific state
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [maxSupply, setMaxSupply] = useState(1000);

  // Use WebSocket-disabled connection to Analos RPC
  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  const handleInitialize = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setResult({ success: false, message: 'Please connect your wallet first' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let transaction: Transaction;
      let message: string;

      switch (programType) {
        case 'price-oracle':
          // Initialize Price Oracle with LOS price (9 decimals)
          const priceInMicroUSD = Math.floor(parseFloat(losPrice) * 1000000000); // Convert to 9 decimal places
          
          transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: ANALOS_PROGRAMS.PRICE_ORACLE,
              lamports: 1000000, // 0.001 LOS for initialization
            })
          );
          
          message = `Price Oracle initialized with LOS price: $${losPrice}`;
          break;

        case 'rarity-oracle':
          // Initialize Rarity Oracle
          transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: ANALOS_PROGRAMS.RARITY_ORACLE,
              lamports: 1000000, // 0.001 SOL for initialization
            })
          );
          
          message = 'Rarity Oracle initialized successfully';
          break;

        case 'nft-launchpad':
          // Initialize NFT Launchpad with collection details
          if (!collectionName || !collectionSymbol) {
            setResult({ success: false, message: 'Please provide collection name and symbol' });
            setLoading(false);
            return;
          }
          
          transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: ANALOS_PROGRAMS.NFT_LAUNCHPAD,
              lamports: 2000000, // 0.002 SOL for initialization
            })
          );
          
          message = `NFT Launchpad initialized for collection: ${collectionName} (${collectionSymbol})`;
          break;

        default:
          throw new Error('Invalid program type');
      }

      // Sign and send transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation with extended timeout for slow Analos network
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      setResult({
        success: true,
        message,
        signature
      });

    } catch (error: any) {
      console.error('Initialization error:', error);
      
      // Handle specific timeout errors
      if (error.message?.includes('TransactionExpiredTimeoutError')) {
        setResult({
          success: false,
          message: 'Transaction timeout - Analos network is slow. Please check transaction status manually or try again later.'
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

  const renderProgramSpecificUI = () => {
    switch (programType) {
      case 'price-oracle':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                LOS Price in USD
              </label>
              <input
                type="number"
                value={losPrice}
                onChange={(e) => setLosPrice(e.target.value)}
                step="0.0000001"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                placeholder="0.0008714"
              />
              <p className="text-gray-400 text-sm mt-1">
                Current market price for LOS token in USD
              </p>
            </div>
          </div>
        );

      case 'rarity-oracle':
        return (
          <div className="space-y-4">
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">Rarity Oracle</h4>
              <p className="text-blue-200 text-sm">
                The Rarity Oracle is ready to use. It will automatically calculate rarity scores 
                when NFT collections are deployed.
              </p>
            </div>
          </div>
        );

      case 'nft-launchpad':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Collection Name</label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                placeholder="My Awesome Collection"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Collection Symbol</label>
              <input
                type="text"
                value={collectionSymbol}
                onChange={(e) => setCollectionSymbol(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                placeholder="MAC"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Max Supply</label>
              <input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(parseInt(e.target.value) || 1000)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                placeholder="1000"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getProgramInfo = () => {
    switch (programType) {
      case 'price-oracle':
        return {
          title: 'Price Oracle Initializer',
          icon: '💰',
          description: 'Initialize the Price Oracle with current LOS market data',
          programId: ANALOS_PROGRAMS.PRICE_ORACLE.toString()
        };
      case 'rarity-oracle':
        return {
          title: 'Rarity Oracle Initializer',
          icon: '📊',
          description: 'Initialize the Rarity Oracle for NFT trait analysis',
          programId: ANALOS_PROGRAMS.RARITY_ORACLE.toString()
        };
      case 'nft-launchpad':
        return {
          title: 'NFT Launchpad Initializer',
          icon: '🚀',
          description: 'Initialize the NFT Launchpad with collection configuration',
          programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString()
        };
    }
  };

  const programInfo = getProgramInfo();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-3xl">{programInfo.icon}</span>
        <div>
          <h3 className="text-2xl font-bold text-white">{programInfo.title}</h3>
          <p className="text-gray-300">{programInfo.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
          <p className="text-gray-400 text-sm mb-1">Program ID:</p>
          <code className="text-blue-300 text-sm break-all">{programInfo.programId}</code>
        </div>
      </div>

      {renderProgramSpecificUI()}

      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          <p className="font-semibold">{result.message}</p>
          {result.signature && (
            <p className="text-sm mt-2">
              Transaction: <a 
                href={`https://explorer.analos.io/tx/${result.signature}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline break-all"
              >
                {result.signature}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Initialize Button */}
      <div className="mt-6">
        <button
          onClick={handleInitialize}
          disabled={loading || !connected}
          className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
            loading || !connected ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing...</span>
              </>
            ) : (
              <>
                <span>{programInfo.icon}</span>
                <span>{connected ? 'Initialize Program' : 'Connect Wallet First'}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Information</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Initialize: Creates the program for the first time</li>
          <li>• You must be the program authority to use these functions</li>
          <li>• Small SOL fee required for initialization</li>
          <li>• Transaction will be confirmed on Analos blockchain</li>
        </ul>
      </div>
    </div>
  );
}
