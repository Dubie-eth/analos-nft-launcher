/**
 * Complete Minting Interface Component
 * Shows bonding curve, pricing, and handles minting
 */

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useAnalosLaunch } from "../hooks/useAnalosLaunch";

interface MintingInterfaceProps {
  collectionAddress: string;
}

export function MintingInterface({ collectionAddress }: MintingInterfaceProps) {
  const wallet = useWallet();
  const {
    sdk,
    losPrice,
    loading,
    mintNFT,
    getCollectionStats,
    calculatePriceInLOS,
    isConnected,
  } = useAnalosLaunch();

  const [stats, setStats] = useState<any>(null);
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<string | null>(null);

  const collectionPDA = new PublicKey(collectionAddress);

  // Fetch collection stats
  useEffect(() => {
    if (!sdk) return;

    async function fetchStats() {
      const data = await getCollectionStats(collectionPDA);
      setStats(data);
    }

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [sdk, collectionPDA]);

  // Handle mint
  const handleMint = async () => {
    if (!isConnected || !sdk) {
      alert("Please connect your wallet first!");
      return;
    }

    setMinting(true);
    setMintSuccess(false);

    try {
      const { nftMint, tx } = await mintNFT(collectionPDA);
      setMintedNFT(nftMint.toString());
      setMintSuccess(true);
      
      // Refresh stats
      const data = await getCollectionStats(collectionPDA);
      setStats(data);
      
      console.log("✅ Mint successful!", nftMint.toString());
    } catch (error: any) {
      console.error("Mint failed:", error);
      alert(`Mint failed: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  const priceInLOS = calculatePriceInLOS(stats.pricing.targetUSD);
  const priceInUSD = stats.pricing.targetUSD;
  const progress = (stats.collection.currentSupply / stats.collection.maxSupply) * 100;
  const remaining = stats.collection.maxSupply - stats.collection.currentSupply;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{stats.collection.name}</h1>
        <p className="text-xl text-gray-600">{stats.collection.symbol}</p>
        <div className="mt-4">
          <WalletMultiButton />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Left Column: Pricing */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Current Price</h2>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-4">
            <p className="text-sm opacity-80">Mint Price</p>
            <p className="text-4xl font-bold">${priceInUSD.toFixed(2)}</p>
            <p className="text-lg mt-2">{priceInLOS.toFixed(2)} LOS</p>
            <p className="text-xs opacity-70 mt-1">$LOS @ ${losPrice.toFixed(6)}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee (6%):</span>
              <span className="font-semibold">${(priceInUSD * 0.06).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pool (69%):</span>
              <span className="font-semibold text-green-600">${(priceInUSD * 0.69).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Creator (25%):</span>
              <span className="font-semibold text-blue-600">${(priceInUSD * 0.25).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Progress */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Collection Progress</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Minted</span>
              <span className="font-bold">
                {stats.collection.currentSupply} / {stats.collection.maxSupply}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress.toFixed(1)}% Complete</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Remaining:</span>
              <span className="font-bold">{remaining} NFTs</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Status:</span>
              <span className={stats.collection.isPaused ? "text-red-600" : "text-green-600"}>
                {stats.collection.isPaused ? "⏸️ Paused" : "✅ Active"}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Revealed:</span>
              <span className={stats.collection.isRevealed ? "text-green-600" : "text-yellow-600"}>
                {stats.collection.isRevealed ? "Yes" : "Not Yet"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">🎁 What You Get:</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl mb-2">🖼️</p>
            <p className="font-semibold">1 NFT</p>
            <p className="text-xs text-gray-600">Placeholder until reveal</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl mb-2">💰</p>
            <p className="font-semibold">10,000 Tokens</p>
            <p className="text-xs text-gray-600">Held until you reveal</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-3xl mb-2">🎲</p>
            <p className="font-semibold">Rarity Chance</p>
            <p className="text-xs text-gray-600">Up to 1000x multiplier!</p>
          </div>
        </div>
      </div>

      {/* Rarity Odds */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">🎯 Rarity Odds:</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span className="font-semibold">Common</span>
              <span className="text-xs text-gray-500 ml-2">(70%)</span>
            </div>
            <span className="text-blue-600 font-bold">10,000 tokens (1x)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span className="font-semibold">Uncommon</span>
              <span className="text-xs text-gray-500 ml-2">(15%)</span>
            </div>
            <span className="text-green-600 font-bold">50,000 tokens (5x)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span className="font-semibold">Rare</span>
              <span className="text-xs text-gray-500 ml-2">(10%)</span>
            </div>
            <span className="text-purple-600 font-bold">100,000 tokens (10x)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-200">
            <div>
              <span className="font-semibold text-orange-600">Epic</span>
              <span className="text-xs text-gray-500 ml-2">(3%)</span>
            </div>
            <span className="text-orange-600 font-bold">500,000 tokens (50x)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded border border-yellow-300">
            <div>
              <span className="font-semibold text-yellow-600">Legendary</span>
              <span className="text-xs text-gray-500 ml-2">(1.5%)</span>
            </div>
            <span className="text-yellow-600 font-bold">1,000,000 tokens (100x)</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded border-2 border-purple-400">
            <div>
              <span className="font-semibold text-purple-700">Mythic</span>
              <span className="text-xs text-gray-500 ml-2">(0.5%)</span>
            </div>
            <span className="text-purple-700 font-bold">10,000,000 tokens (1000x!) 🔥</span>
          </div>
        </div>
      </div>

      {/* Mint Button */}
      <div className="text-center">
        {mintSuccess && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            <p className="font-semibold">🎉 Mint Successful!</p>
            <p className="text-sm mt-1">NFT: {mintedNFT?.slice(0, 8)}...{mintedNFT?.slice(-8)}</p>
            <button
              onClick={() => window.location.href = `/reveal/${mintedNFT}`}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Reveal Now →
            </button>
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={!isConnected || minting || stats.collection.isPaused || remaining === 0}
          className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
        >
          {minting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Minting...
            </span>
          ) : remaining === 0 ? (
            "SOLD OUT!"
          ) : !isConnected ? (
            "Connect Wallet to Mint"
          ) : (
            `Mint for ${priceInLOS.toFixed(2)} LOS ($${priceInUSD.toFixed(2)})`
          )}
        </button>

        {!isConnected && (
          <p className="mt-4 text-sm text-gray-500">
            Connect your wallet above to start minting
          </p>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            ${(stats.escrow.poolReserve * losPrice).toFixed(0)}
          </p>
          <p className="text-sm text-gray-600">Pool Value (USD)</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">
            {(stats.tokens.totalMinted / 1e6).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Tokens Created</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {stats.tokens.isBonded ? "✅ Bonded" : "⏳ Minting"}
          </p>
          <p className="text-sm text-gray-600">Status</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-blue-900 mb-2">💡 How It Works</h4>
          <ul className="text-sm space-y-2 text-blue-800">
            <li>✅ Mint NFT for ${priceInUSD.toFixed(2)} USD</li>
            <li>✅ Receive 10,000 tokens (held until reveal)</li>
            <li>✅ Reveal for rarity (1x-1000x multiplier!)</li>
            <li>✅ Trade tokens after collection bonds</li>
            <li>✅ Or buyback & re-reveal for better rarity!</li>
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-bold text-purple-900 mb-2">🎯 After Bonding</h4>
          <ul className="text-sm space-y-2 text-purple-800">
            <li>✅ 69% of funds create DLMM pool</li>
            <li>✅ Token trading opens on losscreener.com</li>
            <li>✅ Rarity determines your token amount</li>
            <li>✅ Mythic holders get 10M tokens! 🔥</li>
            <li>✅ Deep liquidity from day 1</li>
          </ul>
        </div>
      </div>

      {/* Price Updates Notice */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>💱 Prices automatically adjust for $LOS volatility</p>
        <p>You always pay the same USD value</p>
        <p className="mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

