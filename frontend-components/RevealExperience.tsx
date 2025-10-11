/**
 * Gamified Reveal Experience
 * Animated reveal with rarity announcement
 */

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAnalosLaunch } from "../hooks/useAnalosLaunch";

interface RevealExperienceProps {
  collectionAddress: string;
  nftMint: string;
}

const RARITY_DATA = [
  { name: "Common", chance: 70, multiplier: 1, color: "gray", tokens: "10,000" },
  { name: "Uncommon", chance: 15, multiplier: 5, color: "green", tokens: "50,000" },
  { name: "Rare", chance: 10, multiplier: 10, color: "blue", tokens: "100,000" },
  { name: "Epic", chance: 3, multiplier: 50, color: "purple", tokens: "500,000" },
  { name: "Legendary", chance: 1.5, multiplier: 100, color: "yellow", tokens: "1,000,000" },
  { name: "Mythic", chance: 0.5, multiplier: 1000, color: "pink", tokens: "10,000,000" },
];

export function RevealExperience({ collectionAddress, nftMint }: RevealExperienceProps) {
  const wallet = useWallet();
  const { sdk, revealNFT, getUserStats, isConnected } = useAnalosLaunch();

  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [rarity, setRarity] = useState<any>(null);
  const [animationStep, setAnimationStep] = useState(0);

  const collectionPDA = new PublicKey(collectionAddress);
  const nftMintPDA = new PublicKey(nftMint);

  // Check if already revealed
  useEffect(() => {
    if (!sdk || !wallet.publicKey) return;

    async function checkRevealed() {
      const stats = await getUserStats(collectionPDA);
      if (stats && stats.hasClaimedTokens) {
        setRevealed(true);
        setRarity({
          tier: stats.rarityTier,
          multiplier: stats.tokenMultiplier,
          tokens: stats.tokensClaimed,
        });
      }
    }

    checkRevealed();
  }, [sdk, wallet.publicKey]);

  const handleReveal = async () => {
    if (!isConnected) {
      alert("Please connect your wallet!");
      return;
    }

    setRevealing(true);
    setAnimationStep(1);

    try {
      // Animate mystery box
      await animateReveal();

      // Reveal on-chain
      const { tx } = await revealNFT(collectionPDA, nftMintPDA);
      console.log("Reveal TX:", tx);

      // Get rarity result
      const stats = await getUserStats(collectionPDA);
      const rarityInfo = RARITY_DATA[stats.rarityTier || 0];

      setRarity({
        ...rarityInfo,
        tier: stats.rarityTier,
        multiplier: stats.tokenMultiplier,
        tokens: stats.tokensClaimed,
      });

      setRevealed(true);
      setAnimationStep(3);

    } catch (error: any) {
      console.error("Reveal failed:", error);
      alert(`Reveal failed: ${error.message}`);
      setRevealing(false);
      setAnimationStep(0);
    }
  };

  const animateReveal = async () => {
    // Step 1: Mystery box shaking
    setAnimationStep(1);
    await sleep(2000);

    // Step 2: Opening
    setAnimationStep(2);
    await sleep(1500);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  if (revealed && rarity) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        {/* Success Animation */}
        <div className="mb-8 animate-bounce">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
        </div>

        {/* Rarity Card */}
        <div className={`bg-gradient-to-br from-${rarity.color}-400 to-${rarity.color}-600 text-white rounded-xl p-8 shadow-2xl mb-8 transform hover:scale-105 transition-all`}>
          <p className="text-sm opacity-80 mb-2">You Revealed:</p>
          <h2 className="text-5xl font-bold mb-4">{rarity.name.toUpperCase()}!</h2>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-3xl font-bold">{rarity.multiplier}x Multiplier</p>
            <p className="text-xl mt-2">{rarity.tokens} Tokens!</p>
          </div>
        </div>

        {/* Token Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">💰 Your Token Allocation:</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Rarity Tier:</span>
              <span className="font-bold">{rarity.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span>Multiplier:</span>
              <span className="font-bold text-green-600">{rarity.multiplier}x</span>
            </div>
            <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
              <span>Tokens Received:</span>
              <span className="font-bold text-blue-600 text-lg">{rarity.tokens}</span>
            </div>
            <div className="flex justify-between p-3 bg-purple-50 rounded border border-purple-200">
              <span>Estimated Value:</span>
              <span className="font-bold text-purple-600">
                ${((parseInt(rarity.tokens.replace(/,/g, '')) / 1e6) * 0.0001435).toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => window.location.href = `/trade`}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            💱 Trade Tokens
          </button>
          <button
            onClick={() => window.location.href = `/mint`}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            🎯 Mint Another
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          NFT Mint: {nftMint.slice(0, 8)}...{nftMint.slice(-8)}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎁 Reveal Your NFT</h1>
        <p className="text-gray-600">Discover your rarity and claim your tokens!</p>
      </div>

      {/* Mystery Box Animation */}
      <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-12 mb-8 relative overflow-hidden">
        <div className="text-center">
          {animationStep === 0 && (
            <div className="transform hover:scale-110 transition-transform cursor-pointer">
              <p className="text-8xl mb-4 animate-pulse">📦</p>
              <p className="text-xl font-semibold text-gray-700">Mystery Box</p>
            </div>
          )}

          {animationStep === 1 && (
            <div className="animate-bounce">
              <p className="text-8xl mb-4">📦</p>
              <p className="text-xl font-semibold text-gray-700">Opening...</p>
            </div>
          )}

          {animationStep === 2 && (
            <div className="animate-spin-slow">
              <p className="text-8xl mb-4">✨</p>
              <p className="text-xl font-semibold text-gray-700">Revealing...</p>
            </div>
          )}
        </div>

        {/* Sparkle effects */}
        {(animationStep === 1 || animationStep === 2) && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 animate-ping">✨</div>
            <div className="absolute top-20 right-10 animate-ping" style={{ animationDelay: '0.2s' }}>✨</div>
            <div className="absolute bottom-10 left-20 animate-ping" style={{ animationDelay: '0.4s' }}>✨</div>
            <div className="absolute bottom-20 right-20 animate-ping" style={{ animationDelay: '0.6s' }}>✨</div>
          </div>
        )}
      </div>

      {/* Rarity Possibilities */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">🎲 Possible Outcomes:</h3>
        <div className="space-y-2">
          {RARITY_DATA.map((tier) => (
            <div
              key={tier.name}
              className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`font-semibold text-${tier.color}-600`}>{tier.name}</span>
                <span className="text-xs text-gray-500">({tier.chance}% chance)</span>
              </div>
              <span className={`font-bold text-${tier.color}-600`}>
                {tier.tokens} tokens ({tier.multiplier}x)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reveal Button */}
      <div className="text-center">
        <button
          onClick={handleReveal}
          disabled={!isConnected || revealing}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
        >
          {revealing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Revealing...
            </span>
          ) : (
            "🎲 Reveal Now!"
          )}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Reveal fee may apply (check collection settings)
        </p>
      </div>

      {/* NFT Info */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>NFT: {nftMint.slice(0, 8)}...{nftMint.slice(-8)}</p>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}

