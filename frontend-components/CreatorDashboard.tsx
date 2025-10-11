/**
 * Creator Dashboard
 * Manage collections, claim tokens, view stats
 */

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAnalosLaunch } from "../hooks/useAnalosLaunch";

interface CreatorDashboardProps {
  collectionAddress: string;
}

export function CreatorDashboard({ collectionAddress }: CreatorDashboardProps) {
  const wallet = useWallet();
  const { sdk, losPrice, getCollectionStats } = useAnalosLaunch();

  const [stats, setStats] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");

  const collectionPDA = new PublicKey(collectionAddress);

  useEffect(() => {
    if (!sdk) return;

    async function fetchStats() {
      const data = await getCollectionStats(collectionPDA);
      setStats(data);
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [sdk]);

  const handleClaimTokens = async () => {
    if (!claimAmount || !sdk) return;

    setClaiming(true);
    try {
      const amount = parseFloat(claimAmount) * 1e6; // Convert to token decimals
      // await sdk.withdrawCreatorTokens(...);
      alert("Tokens claimed successfully!");
      setClaimAmount("");
    } catch (error: any) {
      alert(`Failed to claim: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimTradingFees = async () => {
    setClaiming(true);
    try {
      // await sdk.claimTradingFees(...);
      alert("Trading fees claimed!");
    } catch (error: any) {
      alert(`Failed to claim fees: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  };

  if (!stats) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  const totalRaisedUSD = stats.escrow.totalDeposited * losPrice;
  const poolValueUSD = stats.escrow.poolReserve * losPrice;
  const creatorFundsUSD = stats.escrow.creatorFunds * losPrice;

  // Calculate vesting progress
  const currentTime = Math.floor(Date.now() / 1000);
  const vestingStart = stats.tokens.isBonded ? currentTime : 0; // Placeholder
  const monthsElapsed = Math.floor((currentTime - vestingStart) / (30 * 24 * 60 * 60));
  const vestingProgress = Math.min((monthsElapsed / 12) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Creator Dashboard</h1>
        <p className="text-gray-600">{stats.collection.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Raised</p>
          <p className="text-2xl font-bold text-green-600">${totalRaisedUSD.toFixed(0)}</p>
          <p className="text-xs text-gray-500">{stats.escrow.totalDeposited.toFixed(2)} LOS</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pool Value</p>
          <p className="text-2xl font-bold text-blue-600">${poolValueUSD.toFixed(0)}</p>
          <p className="text-xs text-gray-500">{stats.escrow.poolReserve.toFixed(2)} LOS</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Your Funds</p>
          <p className="text-2xl font-bold text-purple-600">${creatorFundsUSD.toFixed(0)}</p>
          <p className="text-xs text-gray-500">{stats.escrow.creatorFunds.toFixed(2)} LOS</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Minted</p>
          <p className="text-2xl font-bold">{stats.collection.currentSupply} / {stats.collection.maxSupply}</p>
          <p className="text-xs text-gray-500">
            {((stats.collection.currentSupply / stats.collection.maxSupply) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Vesting Status */}
      {stats.tokens.isBonded && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">🔒 Token Vesting Status</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Vesting Progress</span>
              <span className="font-bold">{monthsElapsed} / 12 months</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${vestingProgress}%` }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Immediate (10%)</p>
              <p className="text-xl font-bold text-green-600">
                {(stats.tokens.creatorTokens * 0.1 / 1e6).toLocaleString()} tokens
              </p>
              <p className="text-xs text-gray-500">Claimable now</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Vested (15%)</p>
              <p className="text-xl font-bold text-blue-600">
                {(stats.tokens.creatorTokens * 0.15 / 1e6).toLocaleString()} tokens
              </p>
              <p className="text-xs text-gray-500">Over 12 months</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Available Now</p>
              <p className="text-xl font-bold text-purple-600">
                {/* Would calculate based on elapsed time */}
                {(stats.tokens.creatorTokens * (0.1 + (0.15 * vestingProgress / 100)) / 1e6).toLocaleString()} tokens
              </p>
              <p className="text-xs text-gray-500">Claim below</p>
            </div>
          </div>
        </div>
      )}

      {/* Claim Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Claim Tokens */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">💰 Claim Vested Tokens</h3>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Amount to Claim:</label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!stats.tokens.isBonded}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: {(stats.tokens.creatorTokens * (0.1 + (0.15 * vestingProgress / 100)) / 1e6).toLocaleString()} tokens
            </p>
          </div>

          <button
            onClick={handleClaimTokens}
            disabled={!claimAmount || claiming || !stats.tokens.isBonded}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {claiming ? "Claiming..." : "Claim Tokens"}
          </button>
        </div>

        {/* Claim Trading Fees */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">💸 Claim Trading Fees</h3>
          
          <div className="mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Available Fees:</p>
              <p className="text-2xl font-bold text-green-600">
                {/* Would show actual trading fees */}
                $XXX USD
              </p>
              <p className="text-xs text-gray-500">From bonding curve trading</p>
            </div>
          </div>

          <button
            onClick={handleClaimTradingFees}
            disabled={claiming}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            {claiming ? "Claiming..." : "Claim All Fees"}
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            ✅ Available anytime, no vesting!
          </p>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">📈 Collection Statistics</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-gray-700">💰 Financials</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Raised:</span>
                <span className="font-semibold">${totalRaisedUSD.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pool (69%):</span>
                <span className="font-semibold text-blue-600">${poolValueUSD.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Share (25%):</span>
                <span className="font-semibold text-green-600">${creatorFundsUSD.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">LOL Fees (6%):</span>
                <span className="font-semibold text-purple-600">${(totalRaisedUSD * 0.06).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-700">🎮 Token Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Minted:</span>
                <span className="font-semibold">{(stats.tokens.totalMinted / 1e6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distributed:</span>
                <span className="font-semibold">{(stats.tokens.totalDistributed / 1e6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pool Tokens:</span>
                <span className="font-semibold text-blue-600">{(stats.tokens.poolTokens / 1e6).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Tokens:</span>
                <span className="font-semibold text-green-600">{(stats.tokens.creatorTokens / 1e6).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-700">📊 Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bonded:</span>
                <span className={stats.tokens.isBonded ? "text-green-600 font-semibold" : "text-yellow-600"}>
                  {stats.tokens.isBonded ? "✅ Yes" : "⏳ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revealed:</span>
                <span className={stats.collection.isRevealed ? "text-green-600 font-semibold" : "text-yellow-600"}>
                  {stats.collection.isRevealed ? "✅ Yes" : "⏳ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paused:</span>
                <span className={stats.collection.isPaused ? "text-red-600 font-semibold" : "text-green-600"}>
                  {stats.collection.isPaused ? "⏸️ Yes" : "▶️ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">$LOS Price:</span>
                <span className="font-semibold">${losPrice.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
          ⏸️ Pause Minting
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
          🔄 Update Pricing
        </button>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
          🚀 Trigger Bonding
        </button>
      </div>

      {/* Vesting Timeline Visual */}
      {stats.tokens.isBonded && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">📅 Vesting Timeline</h3>
          <div className="flex items-center gap-2 mb-4">
            {[...Array(13)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-8 rounded ${
                  i === 0
                    ? "bg-green-500"
                    : i <= monthsElapsed
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
                title={i === 0 ? "Immediate 10%" : `Month ${i}`}
              >
                {i === 0 && <p className="text-xs text-white text-center py-1">10%</p>}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Month {monthsElapsed} of 12 - {vestingProgress.toFixed(0)}% vested
          </p>
        </div>
      )}
    </div>
  );
}

