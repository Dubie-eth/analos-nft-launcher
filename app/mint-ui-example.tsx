/**
 * Frontend Mint UI Example for Analos NFT Launchpad
 * 
 * This is a production-ready React component using:
 * - @solana/wallet-adapter-react for wallet connection
 * - @coral-xyz/anchor for program interaction
 * - Modern UI with real-time updates
 * 
 * Install dependencies:
 * npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui \
 *   @solana/wallet-adapter-wallets @coral-xyz/anchor
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from '@solana/spl-account-compression';

// Import your IDL
import idl from '../target/idl/analos_nft_launchpad.json';

// Constants
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID');
const BUBBLEGUM_PROGRAM_ID = new PublicKey(
  'BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY'
);
const COLLECTION_AUTHORITY = new PublicKey('COLLECTION_AUTHORITY_PUBKEY');

interface CollectionStats {
  currentSupply: number;
  maxSupply: number;
  price: number;
  revealThreshold: number;
  isRevealed: boolean;
  isPaused: boolean;
  name: string;
  symbol: string;
}

export default function MintUI() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Anchor program
  useEffect(() => {
    if (wallet.publicKey && wallet.signTransaction) {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );
      const prog = new Program(idl as any, PROGRAM_ID, provider);
      setProgram(prog);
    }
  }, [wallet, connection]);

  // Fetch collection stats
  const fetchStats = useCallback(async () => {
    if (!program) return;

    try {
      const [collectionConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), COLLECTION_AUTHORITY.toBuffer()],
        PROGRAM_ID
      );

      const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
      
      setStats({
        currentSupply: config.currentSupply.toNumber(),
        maxSupply: config.maxSupply.toNumber(),
        price: config.priceLamports.toNumber() / LAMPORTS_PER_SOL,
        revealThreshold: config.revealThreshold.toNumber(),
        isRevealed: config.isRevealed,
        isPaused: config.isPaused,
        name: config.collectionName,
        symbol: config.collectionSymbol,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [program]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Mint function
  const handleMint = async () => {
    if (!program || !wallet.publicKey || !stats) return;

    setLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      const [collectionConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), COLLECTION_AUTHORITY.toBuffer()],
        PROGRAM_ID
      );

      // Fetch collection config to get merkle tree
      const config = await program.account.collectionConfig.fetch(collectionConfigPDA);
      const merkleTree = config.merkleTree;

      // Derive tree authority
      const [treeAuthority] = PublicKey.findProgramAddressSync(
        [merkleTree.toBuffer()],
        BUBBLEGUM_PROGRAM_ID
      );

      // Send mint transaction
      const tx = await program.methods
        .mintPlaceholder()
        .accounts({
          collectionConfig: collectionConfigPDA,
          merkleTree: merkleTree,
          treeAuthority: treeAuthority,
          payer: wallet.publicKey,
          bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setTxSignature(tx);
      await fetchStats(); // Refresh stats

      console.log('Mint successful!', tx);
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  // Render progress bar
  const renderProgressBar = () => {
    if (!stats) return null;
    const progress = (stats.currentSupply / stats.maxSupply) * 100;
    return (
      <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-purple-500">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            {stats?.name || 'NFT Launchpad'}
          </h1>
          <p className="text-gray-400">
            Mint your mystery box and reveal exclusive NFTs!
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Price</p>
                <p className="text-2xl font-bold text-white">
                  {stats.price} LOS
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Supply</p>
                <p className="text-2xl font-bold text-white">
                  {stats.currentSupply} / {stats.maxSupply}
                </p>
              </div>
            </div>

            {renderProgressBar()}

            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>Minted: {stats.currentSupply}</span>
              <span>Remaining: {stats.maxSupply - stats.currentSupply}</span>
            </div>

            {/* Reveal Status */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Reveal Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    stats.isRevealed
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {stats.isRevealed ? '✅ Revealed' : '🎁 Mystery'}
                </span>
              </div>
              {!stats.isRevealed && (
                <div className="mt-2 text-sm text-gray-400">
                  Reveal at {stats.revealThreshold} mints (
                  {Math.max(0, stats.revealThreshold - stats.currentSupply)} remaining)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mint Button */}
        {wallet.connected ? (
          <button
            onClick={handleMint}
            disabled={
              loading ||
              !stats ||
              stats.isPaused ||
              stats.currentSupply >= stats.maxSupply
            }
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              loading || stats?.isPaused || stats?.currentSupply >= stats?.maxSupply
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {loading
              ? 'Minting...'
              : stats?.isPaused
              ? 'Minting Paused'
              : stats?.currentSupply >= stats?.maxSupply
              ? 'Sold Out'
              : 'Mint Mystery Box'}
          </button>
        ) : (
          <div className="text-center text-gray-400">
            Connect your wallet to mint
          </div>
        )}

        {/* Transaction Status */}
        {txSignature && (
          <div className="mt-4 p-4 bg-green-900 border border-green-500 rounded-lg">
            <p className="text-green-300 font-semibold mb-2">✅ Mint Successful!</p>
            <a
              href={`https://explorer.analos.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm break-all"
            >
              View Transaction ↗
            </a>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900 border border-red-500 rounded-lg">
            <p className="text-red-300 font-semibold mb-1">❌ Error</p>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Rarity Info */}
        {!stats?.isRevealed && (
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-500">
            <h3 className="text-xl font-bold text-white mb-4">Rarity Tiers</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-400">🌟 Legendary</span>
                <span className="text-gray-300">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">💎 Epic</span>
                <span className="text-gray-300">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">⭐ Rare</span>
                <span className="text-gray-300">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">🔹 Common</span>
                <span className="text-gray-300">50%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

