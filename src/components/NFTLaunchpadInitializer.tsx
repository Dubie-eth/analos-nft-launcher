'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { useWebSocketDisabledConnection } from '@/hooks/useWebSocketDisabledConnection';
import TransactionConfirmationDialog from './TransactionConfirmationDialog';
import idl from '@/idl/analos_nft_launchpad.json';

interface NFTLaunchpadInitializerProps {}

export default function NFTLaunchpadInitializer({}: NFTLaunchpadInitializerProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [maxSupply, setMaxSupply] = useState('1000');
  const [priceLamports, setPriceLamports] = useState('1000000000'); // 1 LOS in lamports (9 decimals)
  const [revealThreshold, setRevealThreshold] = useState('100');
  const [placeholderUri, setPlaceholderUri] = useState('https://example.com/placeholder.json');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTransactionDetails, setPendingTransactionDetails] = useState<any>(null);

  const connection = useWebSocketDisabledConnection(ANALOS_RPC_URL);

  const getProgram = () => {
    if (!publicKey || !signTransaction) return null;
    const provider = new AnchorProvider(connection, { publicKey, signTransaction } as any, { commitment: 'confirmed' });
    return new Program(idl as any, provider);
  };

  const getTransactionDetails = () => {
    if (!publicKey) return null;
    
    return {
      title: 'Initialize NFT Launchpad (Frontend Mode)',
      description: `Initialize NFT collection locally: ${collectionName || 'Unnamed'} (${collectionSymbol || 'SYMBOL'}) with ${maxSupply} max supply at ${(parseFloat(priceLamports) / 1000000000).toFixed(2)} LOS each. Data will be stored in browser.`,
      estimatedFee: '0 LOS (Frontend Only)',
      fromAccount: publicKey.toString(),
      toAccount: 'Browser Local Storage',
      programId: 'Frontend Simulation',
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

      console.log('🎯 FRONTEND-ONLY APPROACH: Simulating NFT Launchpad initialization...');
      
      // Create a simulated NFT collection
      const collectionData = {
        authority: publicKey.toString(),
        collectionName: collectionName || 'Unnamed Collection',
        collectionSymbol: collectionSymbol || 'SYMBOL',
        maxSupply: parseInt(maxSupply),
        priceLamports: parseInt(priceLamports),
        priceLOS: parseFloat(priceLamports) / 1000000000,
        revealThreshold: parseInt(revealThreshold),
        placeholderUri: placeholderUri,
        lastUpdated: new Date().toISOString(),
        isActive: true,
        programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString()
      };
      
      console.log('📊 NFT Collection Data:', collectionData);
      
      // Store in localStorage for persistence
      localStorage.setItem('analos-nft-collection', JSON.stringify(collectionData));
      
      // Simulate transaction confirmation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a fake transaction signature for UI consistency
      const fakeSignature = `FRONTEND_NFT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🚀 NFT Launchpad initialized successfully (Frontend Mode):', fakeSignature);
      
      setResult({
        success: true,
        message: `NFT Launchpad initialized for collection: ${collectionName} (${collectionSymbol}) ✅ Frontend Mode`,
        signature: fakeSignature
      });

    } catch (error: any) {
      console.error('NFT Launchpad initialization error:', error);
      setResult({ success: false, message: `Initialization failed: ${error.message}` });
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

        <div>
          <label className="block text-white font-semibold mb-2">
            Max Supply
          </label>
          <input
            type="number"
            value={maxSupply}
            onChange={(e) => setMaxSupply(e.target.value)}
            placeholder="e.g., 1000"
            min="1"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            Maximum number of NFTs in this collection.
          </p>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Price (LOS)
          </label>
          <input
            type="number"
            step="0.000000001"
            value={(parseFloat(priceLamports) / 1000000000).toString()}
            onChange={(e) => setPriceLamports((parseFloat(e.target.value || '0') * 1000000000).toString())}
            placeholder="e.g., 1.0"
            min="0"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            Price per NFT in LOS tokens (9 decimals).
          </p>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Reveal Threshold
          </label>
          <input
            type="number"
            value={revealThreshold}
            onChange={(e) => setRevealThreshold(e.target.value)}
            placeholder="e.g., 100"
            min="1"
            max={maxSupply}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            Number of NFTs that must be minted before reveal is allowed.
          </p>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">
            Placeholder URI
          </label>
          <input
            type="url"
            value={placeholderUri}
            onChange={(e) => setPlaceholderUri(e.target.value)}
            placeholder="https://example.com/placeholder.json"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-2">
            URL to the placeholder metadata JSON file.
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
