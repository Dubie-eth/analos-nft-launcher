'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function MintPage() {
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [totalMinted, setTotalMinted] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [lolBalance, setLolBalance] = useState(0);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(true);
  const [previewTraits, setPreviewTraits] = useState<any>(null);

  // Fetch allocations on mount
  useEffect(() => {
    fetchAllocations();
    const interval = setInterval(fetchAllocations, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch SOL balance and pricing
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchMintCount();
      fetchPricing();
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey) return;
    
    try {
      const { Connection } = await import('@solana/web3.js');
      const { ANALOS_RPC_URL } = await import('@/config/analos-programs');
      const connection = new Connection(ANALOS_RPC_URL);
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchMintCount = async () => {
    try {
      const response = await fetch('/api/profile-nft/mint-count');
      const data = await response.json();
      setTotalMinted(data.mintedCount || 0);
    } catch (error) {
      console.error('Error fetching mint count:', error);
    }
  };

  const fetchAllocations = async () => {
    try {
      const response = await fetch('/api/los-bros/allocations');
      const data = await response.json();
      if (data.success) {
        setAllocations(data.allocations || []);
        console.log('📊 Allocations loaded:', data.allocations);
      }
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoadingAllocations(false);
    }
  };

  const fetchPricing = async () => {
    if (!publicKey) return;
    
    try {
      // Check $LOL token balance
      const { tokenGatingService } = await import('@/lib/token-gating-service');
      const result = await tokenGatingService.checkEligibility(publicKey.toString());
      
      setLolBalance(result.tokenBalance || 0);
      
      // Calculate pricing
      const { calculateLosBrosPricing } = await import('@/config/los-bros-pricing');
      const pricingInfo = calculateLosBrosPricing(publicKey.toString(), result.tokenBalance || 0);
      
      setPricing(pricingInfo);
      console.log('💰 Los Bros Pricing:', pricingInfo);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      // Default to public pricing
      setPricing({
        tier: 'PUBLIC',
        basePrice: 4200.69,
        discount: 0,
        finalPrice: 4200.69,
        platformFee: 290.05,
        isFree: false,
        tokenBalance: 0,
        message: '🌍 Public Sale - Full Price',
      });
    }
  };

  const generateTraitPreview = () => {
    // Generate random traits for preview
    const { generateLosBrosTraits } = require('@/lib/los-bros-minting');
    const traits = generateLosBrosTraits();
    setPreviewTraits(traits);
    console.log('🎲 Generated preview traits:', traits);
  };

  const handleMint = async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    if (solBalance < 0.01) {
      alert('❌ Insufficient balance!\n\nYou need at least 0.01 SOL to mint.\n\nCurrent balance: ' + solBalance.toFixed(4) + ' SOL');
      return;
    }

    setLoading(true);

    try {
      alert('🎨 Minting Los Bros NFT...\n\nGenerating random traits and rarity!\n\nThis will require wallet approval.');

      const { losBrosMintingService } = await import('@/lib/los-bros-minting');

      const result = await losBrosMintingService.mintLosBros({
        wallet: publicKey.toString(),
        signTransaction,
        sendTransaction
      });

      if (!result.success) {
        alert(`❌ Mint failed: ${result.error}\n\nPlease try again.`);
        setLoading(false);
        return;
      }

      // Record mint in database
      try {
        await fetch('/api/los-bros/record-mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mintAddress: result.mintAddress,
            walletAddress: publicKey.toString(),
            tokenId: result.tokenId,
            rarityTier: result.rarityTier,
            rarityScore: result.rarityScore,
            traits: result.traits,
            signature: result.signature,
            imageUrl: result.imageUrl,
            metadataUri: result.metadataUri
          })
        });
      } catch (dbError) {
        console.warn('Failed to record in database (non-critical):', dbError);
      }

      // Show reveal
      setMintedNFT(result);
      setShowReveal(true);

      // Update counts
      fetchMintCount();
      fetchBalance();

    } catch (error: any) {
      console.error('Mint error:', error);
      alert(`❌ Mint failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            🎨 Los Bros NFT Collection
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            2,222 unique generative PFPs on Analos blockchain
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{totalMinted}</div>
              <div className="text-sm text-gray-300">Minted</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{2222 - totalMinted}</div>
              <div className="text-sm text-gray-300">Remaining</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">0.069</div>
              <div className="text-sm text-gray-300">SOL</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl font-bold text-purple-400">69%</div>
              <div className="text-sm text-gray-300">Rare+</div>
            </div>
          </div>
        </div>

        {/* Main Mint Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left: Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🎲 Random Generation</h2>
            <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">❓</div>
                <div className="text-xl font-bold">Mystery Los Bro</div>
                <div className="text-sm text-gray-200 mt-2">Revealed after mint!</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>🎨 Backgrounds:</span>
                <span className="text-white">7 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>🧢 Hats:</span>
                <span className="text-white">12 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>👀 Eyes:</span>
                <span className="text-white">10 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>👃 Nose:</span>
                <span className="text-white">8 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>👄 Mouth:</span>
                <span className="text-white">9 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>👕 Outfit:</span>
                <span className="text-white">11 variants</span>
              </div>
              <div className="flex justify-between p-2 bg-black/20 rounded">
                <span>✨ Accessory:</span>
                <span className="text-white">6 variants</span>
              </div>
            </div>
          </div>

          {/* Right: Mint UI */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🚀 Mint Your Los Bro</h2>
            
            {!connected ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔌</div>
                <h3 className="text-xl font-bold text-white mb-2">Connect Wallet</h3>
                <p className="text-gray-300">Connect your wallet to mint a Los Bro NFT</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Wallet Info */}
                <div className="bg-black/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Wallet:</span>
                    <span className="text-white font-mono">
                      {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Balance:</span>
                    <span className="text-green-400 font-semibold">{solBalance.toFixed(4)} SOL</span>
                  </div>
                </div>

                {/* Live Allocation Tracker */}
                {!loadingAllocations && allocations.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-5 border border-purple-400/30">
                    <h3 className="text-sm font-bold text-white mb-3">📊 Live Mint Allocation</h3>
                    <div className="space-y-2">
                      {allocations.map((alloc: any) => (
                        <div key={alloc.tier} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-semibold ${
                              alloc.tier === 'TEAM' ? 'text-yellow-300' :
                              alloc.tier === 'COMMUNITY' ? 'text-green-300' :
                              alloc.tier === 'EARLY' ? 'text-blue-300' :
                              'text-purple-300'
                            }`}>
                              {alloc.tier === 'TEAM' ? '🎖️' :
                               alloc.tier === 'COMMUNITY' ? '🎁' :
                               alloc.tier === 'EARLY' ? '💎' : '🌍'} {alloc.tier}
                            </span>
                            <span className="text-gray-300">
                              {alloc.minted_count || alloc.live_minted_count || 0} / {alloc.total_allocated}
                            </span>
                          </div>
                          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                alloc.tier === 'TEAM' ? 'bg-yellow-400' :
                                alloc.tier === 'COMMUNITY' ? 'bg-green-400' :
                                alloc.tier === 'EARLY' ? 'bg-blue-400' :
                                'bg-purple-400'
                              }`}
                              style={{ 
                                width: `${((alloc.minted_count || alloc.live_minted_count || 0) / alloc.total_allocated * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trait Preview/Randomizer */}
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-lg p-5 border border-blue-400/30">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-white">🎲 Trait Preview</h3>
                    <button
                      onClick={generateTraitPreview}
                      className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      Randomize
                    </button>
                  </div>
                  
                  {previewTraits ? (
                    <div className="space-y-2 text-xs">
                      {previewTraits.attributes.map((trait: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-400">{trait.trait_type}:</span>
                          <span className="text-white font-semibold">{trait.value}</span>
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Rarity:</span>
                          <span className={`font-bold ${
                            previewTraits.rarity === 'LEGENDARY' ? 'text-yellow-400' :
                            previewTraits.rarity === 'EPIC' ? 'text-purple-400' :
                            previewTraits.rarity === 'RARE' ? 'text-blue-400' :
                            'text-gray-300'
                          }`}>
                            {previewTraits.rarity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-400">Score:</span>
                          <span className="text-white">{previewTraits.rarityScore.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Click "Randomize" to see a trait preview! 🎯
                    </p>
                  )}
                </div>

                {/* Pricing */}
                {pricing ? (
                  <div className={`rounded-lg p-6 border ${
                    pricing.tier === 'TEAM' ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-400/30' :
                    pricing.tier === 'COMMUNITY' ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-400/30' :
                    pricing.tier === 'EARLY' ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-400/30' :
                    'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-400/30'
                  }`}>
                    <div className="text-center mb-4">
                      <div className="text-xs text-gray-300 mb-1">Your Tier</div>
                      <div className="text-2xl font-bold text-white mb-2">{pricing.tier}</div>
                      <div className="text-sm text-gray-300 mb-3">{pricing.message}</div>
                      
                      {pricing.discount > 0 && (
                        <div className="inline-block bg-green-900/50 border border-green-400/50 rounded-full px-4 py-1 text-green-300 text-sm font-semibold mb-2">
                          {pricing.discount}% OFF! 🎉
                        </div>
                      )}
                      
                      <div className="text-4xl font-bold text-white mt-2">
                        {pricing.isFree && pricing.platformFee === 0 ? (
                          <span className="text-green-400">FREE! 🎁</span>
                        ) : (
                          `${pricing.finalPrice.toFixed(2)} LOS`
                        )}
                      </div>
                      {pricing.platformFee > 0 && !pricing.isFree && (
                        <div className="text-xs text-gray-400 mt-1">+ {pricing.platformFee.toFixed(2)} LOS platform fee</div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-gray-400 line-through">
                          <span>Base Price:</span>
                          <span>{pricing.basePrice.toFixed(2)} LOS</span>
                        </div>
                      )}
                      {pricing.discount > 0 && pricing.discount < 100 && (
                        <div className="flex justify-between text-green-400">
                          <span>Your Price ({pricing.discount}% off):</span>
                          <span>{pricing.finalPrice.toFixed(2)} LOS</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-300">
                        <span>Platform Fee (6.9%):</span>
                        <span>{pricing.platformFee.toFixed(2)} LOS</span>
                      </div>
                      {lolBalance > 0 && (
                        <div className="flex justify-between text-blue-300 mt-2 pt-2 border-t border-gray-600">
                          <span>🪙 Your $LOL:</span>
                          <span className="font-semibold">{lolBalance.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-6 border border-purple-400/30">
                    <div className="text-center">
                      <div className="animate-pulse text-gray-300">Loading pricing...</div>
                    </div>
                  </div>
                )}

                {/* Rarity Info */}
                <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">🌟 LEGENDARY:</span>
                    <span className="text-yellow-400 font-semibold">5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">💜 EPIC:</span>
                    <span className="text-purple-400 font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">💙 RARE:</span>
                    <span className="text-blue-400 font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⚪ COMMON:</span>
                    <span className="text-gray-300 font-semibold">50%</span>
                  </div>
                </div>

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={loading || solBalance < 0.01}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                    loading || solBalance < 0.01
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Minting...
                    </span>
                  ) : solBalance < 0.01 ? (
                    '❌ Insufficient Balance'
                  ) : (
                    '🎨 Mint Los Bro NFT'
                  )}
                </button>

                {solBalance < 0.01 && (
                  <div className="bg-red-900/30 border border-red-400/30 rounded-lg p-4 text-sm text-red-200">
                    ⚠️ You need at least 0.01 SOL to mint. Please add more SOL to your wallet.
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

        {/* About Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📖 About Los Bros</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">✨ Generative Art</h3>
              <p className="text-sm">Each Los Bro is uniquely generated from over 10,000 possible trait combinations, ensuring your NFT is truly one-of-a-kind.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">🏆 Rarity System</h3>
              <p className="text-sm">Every trait has different rarity weights. Your NFT's overall rarity is calculated from its trait combination.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">⛓️ On-Chain Forever</h3>
              <p className="text-sm">Los Bros NFTs are minted using Token-2022 on Analos blockchain with full metadata stored on IPFS.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">🎭 Future Profile System</h3>
              <p className="text-sm">Los Bros will integrate with our upcoming Analos Name Service (ANS) for profile pictures!</p>
            </div>
          </div>
        </div>

      </div>

      {/* Reveal Modal */}
      {showReveal && mintedNFT && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 max-w-md w-full border-2 border-yellow-400 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-4">Los Bro Minted!</h2>
              
              <div className="bg-black/40 rounded-lg p-4 mb-6">
                <img 
                  src={mintedNFT.imageUrl} 
                  alt="Your Los Bro" 
                  className="w-full rounded-lg mb-4"
                />
                <div className="space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Token ID:</span>
                    <span className="text-white font-semibold">#{mintedNFT.tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Rarity:</span>
                    <span className={`font-bold ${
                      mintedNFT.rarityTier === 'LEGENDARY' ? 'text-yellow-400' :
                      mintedNFT.rarityTier === 'EPIC' ? 'text-purple-400' :
                      mintedNFT.rarityTier === 'RARE' ? 'text-blue-400' :
                      'text-gray-300'
                    }`}>
                      {mintedNFT.rarityTier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Score:</span>
                    <span className="text-white font-semibold">{mintedNFT.rarityScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Mint:</span>
                    <span className="text-white font-mono text-xs">
                      {mintedNFT.mintAddress?.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowReveal(false)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                ✅ Awesome!
              </button>

              <a
                href={`https://explorer.analos.io/tx/${mintedNFT.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                🔗 View on Explorer
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

