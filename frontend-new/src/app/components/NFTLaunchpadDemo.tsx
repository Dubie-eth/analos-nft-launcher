'use client';

/**
 * NFT Launchpad Demo Component
 * 
 * Demonstrates integration with the deployed NFT Launchpad smart contract.
 * Shows collection initialization, minting, revealing, and admin controls.
 */

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getNFTLaunchpadService } from '@/lib/nft-launchpad-service';
import {
  NFT_LAUNCHPAD_PROGRAM_ID,
  DEFAULT_COLLECTION_CONFIG,
  getRarityTier,
  CONFIG_SUMMARY,
} from '@/lib/nft-launchpad-config';

export default function NFTLaunchpadDemo() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [collectionConfig, setCollectionConfig] = useState<any>(null);
  
  // Collection form state
  const [collectionName, setCollectionName] = useState('Mystery Collection');
  const [collectionSymbol, setCollectionSymbol] = useState('MST');
  const [maxSupply, setMaxSupply] = useState(1000);
  const [mintPrice, setMintPrice] = useState(0.1);
  const [revealThreshold, setRevealThreshold] = useState(500);
  const [placeholderUri, setPlaceholderUri] = useState('https://arweave.net/placeholder.json');
  
  const service = getNFTLaunchpadService(connection);

  useEffect(() => {
    if (publicKey) {
      loadCollectionConfig();
    }
  }, [publicKey]);

  async function loadCollectionConfig() {
    if (!publicKey) return;
    
    try {
      const config = await service.getCollectionConfig(publicKey);
      setCollectionConfig(config);
    } catch (err) {
      console.error('Failed to load collection:', err);
    }
  }

  async function handleInitializeCollection() {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setStatus('Initializing collection...');
    setError('');

    try {
      const wallet = { publicKey, signTransaction };
      
      const result = await service.initializeCollection(wallet, {
        maxSupply,
        priceLamports: Math.floor(mintPrice * LAMPORTS_PER_SOL),
        revealThreshold,
        collectionName,
        collectionSymbol,
        placeholderUri,
      });

      setStatus(`✅ Collection initialized! TX: ${result.signature.slice(0, 8)}...`);
      setCollectionConfig({ collectionName, maxSupply, currentSupply: 0 });
      
      console.log('🎉 Collection Config PDA:', result.collectionConfig.toBase58());
    } catch (err: any) {
      setError(`❌ ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMintPlaceholder() {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setStatus('Minting placeholder NFT...');
    setError('');

    try {
      const wallet = { publicKey, signTransaction };
      
      const result = await service.mintPlaceholder(wallet, publicKey);

      const tier = getRarityTier(result.rarityScore);
      setStatus(`✅ Minted! Rarity: ${tier} (${result.rarityScore}/100)`);
      
      console.log('🎨 Mint Record:', result.mintRecord.toBase58());
      
      await loadCollectionConfig();
    } catch (err: any) {
      setError(`❌ ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealCollection() {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setStatus('Revealing collection...');
    setError('');

    try {
      const wallet = { publicKey, signTransaction };
      const revealedUri = 'https://arweave.net/revealed/';
      
      const signature = await service.revealCollection(wallet, revealedUri);

      setStatus(`✅ Collection revealed! TX: ${signature.slice(0, 8)}...`);
      
      await loadCollectionConfig();
    } catch (err: any) {
      setError(`❌ ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePauseToggle(paused: boolean) {
    if (!publicKey || !signTransaction) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setStatus(paused ? 'Pausing...' : 'Resuming...');
    setError('');

    try {
      const wallet = { publicKey, signTransaction };
      
      const signature = await service.setPause(wallet, paused);

      setStatus(`✅ ${paused ? 'Paused' : 'Resumed'}! TX: ${signature.slice(0, 8)}...`);
      
      await loadCollectionConfig();
    } catch (err: any) {
      setError(`❌ ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">🚀 NFT Launchpad</h1>
        <p className="text-lg opacity-90">
          Blind Mint & Reveal System on Analos
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CONFIG_SUMMARY.features.map((feature, idx) => (
            <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Program Info */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-white">📍 Deployed Contract</h2>
        <div className="space-y-2 text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Program ID:</span>
            <code className="bg-gray-800 px-3 py-1 rounded text-green-400 text-sm">
              {NFT_LAUNCHPAD_PROGRAM_ID.toBase58()}
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Network:</span>
            <span className="text-white">{CONFIG_SUMMARY.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deployed:</span>
            <span className="text-white">{CONFIG_SUMMARY.deployedAt}</span>
          </div>
          <a
            href={CONFIG_SUMMARY.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-400 hover:text-blue-300 mt-2"
          >
            View on Explorer →
          </a>
        </div>
      </div>

      {/* Wallet Status */}
      {publicKey ? (
        <div className="bg-green-900/30 border border-green-600 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span className="text-white">Connected: {publicKey.toBase58().slice(0, 8)}...</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4">
          <span className="text-yellow-400">⚠️ Please connect your wallet to interact</span>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-xl p-4">
          <p className="text-blue-300">{status}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-xl p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Collection Info */}
      {collectionConfig && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-white">📦 Your Collection</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div>
              <p className="text-gray-400 text-sm">Name</p>
              <p className="text-white font-semibold">{collectionConfig.collectionName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Supply</p>
              <p className="text-white font-semibold">
                {collectionConfig.currentSupply} / {collectionConfig.maxSupply}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-white font-semibold">
                {collectionConfig.isRevealed ? '🎭 Revealed' : '🎁 Unrevealed'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Minting</p>
              <p className="text-white font-semibold">
                {collectionConfig.isPaused ? '⏸️ Paused' : '▶️ Active'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Initialize Collection Form */}
      {!collectionConfig && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6 text-white">🎨 Initialize Collection</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Mystery Collection"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol</label>
                <input
                  type="text"
                  value={collectionSymbol}
                  onChange={(e) => setCollectionSymbol(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="MST"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max Supply</label>
                <input
                  type="number"
                  value={maxSupply}
                  onChange={(e) => setMaxSupply(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mint Price (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={mintPrice}
                  onChange={(e) => setMintPrice(parseFloat(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Reveal Threshold</label>
                <input
                  type="number"
                  value={revealThreshold}
                  onChange={(e) => setRevealThreshold(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Placeholder URI</label>
              <input
                type="text"
                value={placeholderUri}
                onChange={(e) => setPlaceholderUri(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://arweave.net/placeholder.json"
              />
            </div>

            <button
              onClick={handleInitializeCollection}
              disabled={loading || !publicKey}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              {loading ? '⏳ Initializing...' : '🚀 Initialize Collection'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {collectionConfig && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleMintPlaceholder}
            disabled={loading || !publicKey}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all"
          >
            {loading ? '⏳ Minting...' : '🎨 Mint Placeholder'}
          </button>
          
          <button
            onClick={handleRevealCollection}
            disabled={loading || !publicKey || collectionConfig?.isRevealed}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all"
          >
            {loading ? '⏳ Revealing...' : '🎭 Reveal Collection'}
          </button>
        </div>
      )}

      {/* Admin Controls */}
      {collectionConfig && (
        <div className="bg-gray-900 rounded-xl p-6 border border-yellow-600/50">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">🔐 Admin Controls</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handlePauseToggle(true)}
              disabled={loading || !publicKey}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              ⏸️ Pause Minting
            </button>
            
            <button
              onClick={() => handlePauseToggle(false)}
              disabled={loading || !publicKey}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              ▶️ Resume Minting
            </button>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-white">📚 How It Works</h2>
        <div className="space-y-3 text-gray-300">
          <div className="flex gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <strong className="text-white">Initialize:</strong> Create your collection with custom settings
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <strong className="text-white">Mint:</strong> Users mint placeholder NFTs with hidden rarity
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <strong className="text-white">Trade:</strong> Placeholders can be traded before reveal
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">4️⃣</span>
            <div>
              <strong className="text-white">Reveal:</strong> Unlock true metadata and rarity after threshold
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

