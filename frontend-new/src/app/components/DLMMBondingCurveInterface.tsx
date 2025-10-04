'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { dlmmBondingCurveService, BondingCurveConfig } from '@/lib/dlmm-bonding-curve-service';

interface DLMMBondingCurveInterfaceProps {
  collectionId: string;
  collectionName: string;
}

export default function DLMMBondingCurveInterface({ 
  collectionId, 
  collectionName 
}: DLMMBondingCurveInterfaceProps) {
  const { publicKey, connected } = useWallet();
  const [bondingCurve, setBondingCurve] = useState<BondingCurveConfig | null>(null);
  const [nftAmount, setNftAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const [mintHistory, setMintHistory] = useState<any[]>([]);

  useEffect(() => {
    loadBondingCurveData();
  }, [collectionId]);

  const loadBondingCurveData = async () => {
    try {
      const config = dlmmBondingCurveService.getBondingCurveConfig(collectionId);
      const history = dlmmBondingCurveService.getMintHistory(collectionId);
      
      setBondingCurve(config);
      setMintHistory(history);
    } catch (error) {
      console.error('❌ Error loading bonding curve data:', error);
    }
  };

  const handleMint = async () => {
    if (!connected || !publicKey || !bondingCurve) return;

    setLoading(true);
    setMintResult(null);

    try {
      // Get mint quote first
      const quote = dlmmBondingCurveService.getMintQuote(collectionId, nftAmount, publicKey.toString());
      
      if (!quote) {
        setMintResult('❌ Failed to get mint quote');
        return;
      }

      // Execute mint
      const result = await dlmmBondingCurveService.executeBondingCurveMint(
        collectionId,
        publicKey.toString(),
        nftAmount
      );

      if (result.success) {
        let successMessage = `✅ Successfully minted ${result.nftAmount} NFT(s) for ${result.losAmount.toFixed(2)} $LOS!`;
        
        if (result.rewardEligible) {
          successMessage += `\n🎁 You're eligible for ${result.estimatedReward?.toFixed(2)} $LOS reward!`;
        }
        
        if (result.bondingComplete) {
          successMessage += `\n🎉 Bonding curve completed! Reveal triggered!`;
        }
        
        setMintResult(successMessage);
        await loadBondingCurveData(); // Refresh data
      } else {
        setMintResult(`❌ Mint failed: ${result.error}`);
      }
    } catch (error) {
      setMintResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!bondingCurve) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-2">🎯 DLMM Bonding Curve</h3>
        <p className="text-gray-400">Bonding curve not found for this collection.</p>
      </div>
    );
  }

  const quote = dlmmBondingCurveService.getMintQuote(collectionId, nftAmount, publicKey?.toString() || '');
  const stats = dlmmBondingCurveService.getBondingCurveStats(collectionId);

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🎯 DLMM Bonding Curve - {collectionName}</h3>
        <span className={`px-3 py-1 rounded text-sm font-medium ${
          bondingCurve.isActive 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {bondingCurve.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* Bonding Curve Progress */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Bonding Curve Progress</h4>
          <span className="text-blue-400 font-bold">
            {(bondingCurve.bondingProgress * 100).toFixed(1)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${bondingCurve.bondingProgress * 100}%` }}
          ></div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Raised:</span>
            <p className="text-white font-medium">{bondingCurve.currentLOSRaised.toLocaleString()} $LOS</p>
          </div>
          <div>
            <span className="text-gray-400">Target:</span>
            <p className="text-white font-medium">{bondingCurve.bondingCap.toLocaleString()} $LOS</p>
          </div>
          <div>
            <span className="text-gray-400">NFTs Sold:</span>
            <p className="text-white font-medium">{bondingCurve.currentNFTSold.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-400">Current Price:</span>
            <p className="text-white font-medium">{bondingCurve.currentPrice.toFixed(2)} $LOS</p>
          </div>
        </div>
      </div>

      {/* Mint Interface */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-6">
        <h4 className="text-white font-medium mb-4">🎯 Mint NFTs</h4>
        
        {/* Quantity Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of NFTs to Mint
          </label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setNftAmount(Math.max(1, nftAmount - 1))}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              -
            </button>
            <input
              type="number"
              value={nftAmount}
              onChange={(e) => setNftAmount(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
            />
            <button
              onClick={() => setNftAmount(nftAmount + 1)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Mint Quote */}
        {quote && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
            <h5 className="text-white font-medium mb-3">Mint Quote</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">NFTs:</span>
                <span className="text-white">{quote.nftAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price per NFT:</span>
                <span className="text-white">{quote.pricePerNFT.toFixed(2)} $LOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Cost:</span>
                <span className="text-white font-medium">{quote.totalCost.toFixed(2)} $LOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Impact:</span>
                <span className="text-yellow-400">{quote.priceImpact.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bonding Progress:</span>
                <span className="text-blue-400">{(quote.bondingProgress * 100).toFixed(1)}%</span>
              </div>
              {quote.estimatedReward > 0 && (
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-green-400">Estimated Reward:</span>
                  <span className="text-green-400 font-medium">{quote.estimatedReward.toFixed(2)} $LOS</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={loading || !connected || !bondingCurve.isActive}
          className={`w-full px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
            loading
              ? 'bg-blue-600 text-white cursor-not-allowed'
              : !connected
              ? 'bg-gray-600 text-white cursor-not-allowed'
              : !bondingCurve.isActive
              ? 'bg-red-600 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white transform hover:scale-105'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Minting...</span>
            </div>
          ) : !connected ? (
            'Connect Wallet to Mint'
          ) : !bondingCurve.isActive ? (
            'Bonding Curve Inactive'
          ) : (
            <div className="flex flex-col items-center">
              <span>🎯 Mint NFTs</span>
              <span className="text-sm opacity-80">{nftAmount} NFT(s) for {quote?.totalCost.toFixed(2) || '0.00'} $LOS</span>
            </div>
          )}
        </button>
      </div>

      {/* Token Holder Rewards */}
      {bondingCurve.tokenHolderRewards.enabled && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <h4 className="text-green-400 font-medium mb-3">🎁 Token Holder Rewards</h4>
          
          {/* Basic Reward Info */}
          <div className="space-y-2 text-sm text-green-300 mb-4">
            <div className="flex justify-between">
              <span>Reward Percentage:</span>
              <span className="text-white">{bondingCurve.tokenHolderRewards.rewardPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Minimum Holdings:</span>
              <span className="text-white">{bondingCurve.tokenHolderRewards.minimumHoldings.toLocaleString()} $LOL</span>
            </div>
            <div className="flex justify-between">
              <span>Reward Token:</span>
              <span className="text-white">${bondingCurve.tokenHolderRewards.rewardToken}</span>
            </div>
          </div>

          {/* Reward Tiers */}
          <div className="space-y-2 text-xs">
            <h5 className="text-green-400 font-medium">Reward Tiers:</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-purple-400 font-medium">🐋 Whale</div>
                <div>≥{bondingCurve.tokenHolderRewards.rewardTiers.whale.minHoldings.toLocaleString()} $LOL</div>
                <div>{bondingCurve.tokenHolderRewards.rewardTiers.whale.rewardMultiplier}x multiplier</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-blue-400 font-medium">💎 Diamond</div>
                <div>≥{bondingCurve.tokenHolderRewards.rewardTiers.diamond.minHoldings.toLocaleString()} $LOL</div>
                <div>{bondingCurve.tokenHolderRewards.rewardTiers.diamond.rewardMultiplier}x multiplier</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-yellow-400 font-medium">🥇 Gold</div>
                <div>≥{bondingCurve.tokenHolderRewards.rewardTiers.gold.minHoldings.toLocaleString()} $LOL</div>
                <div>{bondingCurve.tokenHolderRewards.rewardTiers.gold.rewardMultiplier}x multiplier</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-gray-400 font-medium">🥈 Silver</div>
                <div>≥{bondingCurve.tokenHolderRewards.rewardTiers.silver.minHoldings.toLocaleString()} $LOL</div>
                <div>{bondingCurve.tokenHolderRewards.rewardTiers.silver.rewardMultiplier}x multiplier</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-green-400 mt-3">
            Hold tokens to qualify for tiered rewards! Higher tiers get better multipliers on your mint fund returns.
          </p>
        </div>
      )}

      {/* Reveal Triggers */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h4 className="text-blue-400 font-medium mb-3">🎉 Reveal Triggers</h4>
        <div className="space-y-2 text-sm text-blue-300">
          <div className="flex justify-between">
            <span>Market Cap Trigger:</span>
            <span className="text-white">{bondingCurve.revealTriggers.marketCapTrigger.toLocaleString()} $LOS</span>
          </div>
          <div className="flex justify-between">
            <span>NFT Sold Trigger:</span>
            <span className="text-white">{bondingCurve.revealTriggers.nftSoldTrigger.toLocaleString()} NFTs</span>
          </div>
          {bondingCurve.revealTriggers.timeTrigger && (
            <div className="flex justify-between">
              <span>Time Trigger:</span>
              <span className="text-white">{bondingCurve.revealTriggers.timeTrigger.toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Manual Reveal:</span>
            <span className={`font-medium ${bondingCurve.revealTriggers.manualReveal ? 'text-green-400' : 'text-gray-400'}`}>
              {bondingCurve.revealTriggers.manualReveal ? 'TRIGGERED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Mint History */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Recent Mint History</h4>
        <div className="space-y-2">
          {mintHistory.slice(-5).map((mint, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
              <div>
                <span className="text-white font-medium">{mint.nftAmount} NFT(s)</span>
                <span className="text-gray-400 text-sm ml-2">{mint.pricePerNFT.toFixed(2)} $LOS each</span>
              </div>
              <div className="flex items-center space-x-2">
                {mint.rewardEligible && <span className="text-green-400 text-sm">🎁</span>}
                <span className="text-gray-400 text-xs">
                  {new Date(mint.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {mintHistory.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              <p>No mint history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Mint Result */}
      {mintResult && (
        <div className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-line ${
          mintResult.includes('✅') 
            ? 'bg-green-900/20 border border-green-500/30 text-green-300'
            : 'bg-red-900/20 border border-red-500/30 text-red-300'
        }`}>
          {mintResult}
        </div>
      )}
    </div>
  );
}
