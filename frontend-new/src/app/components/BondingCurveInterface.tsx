'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { bondingCurveService, BondingCurveCollection, TradingQuote, SellQuote } from '@/lib/bonding-curve-service';

interface BondingCurveInterfaceProps {
  collection: BondingCurveCollection;
  onTradeComplete?: (tradeResult: any) => void;
}

export default function BondingCurveInterface({
  collection,
  onTradeComplete
}: BondingCurveInterfaceProps) {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [losAmount, setLosAmount] = useState('');
  const [nftAmount, setNftAmount] = useState('');
  const [buyQuote, setBuyQuote] = useState<TradingQuote | null>(null);
  const [sellQuote, setSellQuote] = useState<SellQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Calculate quotes when inputs change
  useEffect(() => {
    if (losAmount && !isNaN(parseFloat(losAmount))) {
      const quote = bondingCurveService.calculateBuyQuote(
        collection.config,
        collection.state,
        parseFloat(losAmount)
      );
      setBuyQuote(quote);
    } else {
      setBuyQuote(null);
    }
  }, [losAmount, collection]);

  useEffect(() => {
    if (nftAmount && !isNaN(parseFloat(nftAmount))) {
      const quote = bondingCurveService.calculateSellQuote(
        collection.config,
        collection.state,
        parseFloat(nftAmount)
      );
      setSellQuote(quote);
    } else {
      setSellQuote(null);
    }
  }, [nftAmount, collection]);

  const handleBuy = async () => {
    if (!connected || !publicKey || !buyQuote) return;

    setLoading(true);
    setError('');

    try {
      const result = await bondingCurveService.executeBuyTrade(
        collection.id,
        buyQuote.inputAmount,
        publicKey.toString()
      );

      if (result.success) {
        setSuccess(`Successfully bought ${result.nftsReceived.toFixed(2)} NFTs!`);
        onTradeComplete?.(result);
        setLosAmount('');
        setBuyQuote(null);
      } else {
        setError(result.error || 'Buy trade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!connected || !publicKey || !sellQuote) return;

    setLoading(true);
    setError('');

    try {
      const result = await bondingCurveService.executeSellTrade(
        collection.id,
        sellQuote.inputAmount,
        publicKey.toString()
      );

      if (result.success) {
        setSuccess(`Successfully sold ${sellQuote.inputAmount} NFTs for ${result.losReceived.toFixed(2)} $LOS!`);
        onTradeComplete?.(result);
        setNftAmount('');
        setSellQuote(null);
      } else {
        setError(result.error || 'Sell trade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const metrics = bondingCurveService.calculateMetrics(collection.state);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🚀 Bonding Curve Trading</h2>
        <p className="text-gray-300">Trade NFTs on the bonding curve before reveal</p>
      </div>

      {/* Collection Info */}
      <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
        <div className="flex items-center space-x-4">
          <img
            src={collection.imageUrl}
            alt={collection.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{collection.name}</h3>
            <p className="text-gray-300 text-sm">{collection.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="text-green-400">Price: {collection.state.currentPrice.toFixed(6)} $LOS</span>
              <span className="text-blue-400">Supply: {collection.state.totalNFTsMinted.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Reveal */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">Progress to Reveal</span>
          <span className="text-purple-400 font-bold">
            {(collection.state.progressToReveal * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${collection.state.progressToReveal * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>{collection.state.totalLOSRaised.toLocaleString()} $LOS raised</span>
          <span>{collection.config.bondingCap.toLocaleString()} $LOS cap</span>
        </div>
        {collection.state.isRevealed && (
          <div className="mt-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-sm font-semibold">🎉 NFTs Revealed! Bridge trading is now available.</p>
          </div>
        )}
      </div>

      {/* Trading Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          💰 Buy NFTs
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'sell'
              ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          💸 Sell NFTs
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Buy Interface */}
      {activeTab === 'buy' && (
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Amount of $LOS to spend
            </label>
            <div className="relative">
              <input
                type="number"
                value={losAmount}
                onChange={(e) => setLosAmount(e.target.value)}
                placeholder="Enter $LOS amount"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="absolute right-3 top-3 text-gray-400">$LOS</div>
            </div>
          </div>

          {buyQuote && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <h4 className="text-green-400 font-semibold mb-3">Buy Quote</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">You pay:</span>
                  <span className="text-white">{buyQuote.inputAmount.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">You receive:</span>
                  <span className="text-green-400 font-semibold">{buyQuote.outputAmount.toFixed(2)} NFTs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Price impact:</span>
                  <span className={`${buyQuote.priceImpact > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {buyQuote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Trading fee:</span>
                  <span className="text-gray-400">{buyQuote.fee.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Creator fee:</span>
                  <span className="text-gray-400">{buyQuote.creatorFee.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Platform fee:</span>
                  <span className="text-gray-400">{buyQuote.platformFee.toFixed(2)} $LOS</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={!connected || !buyQuote || loading || !losAmount}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
          >
            {loading ? 'Buying...' : !connected ? 'Connect Wallet' : !buyQuote ? 'Enter Amount' : 'Buy NFTs'}
          </button>
        </div>
      )}

      {/* Sell Interface */}
      {activeTab === 'sell' && (
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Amount of NFTs to sell
            </label>
            <div className="relative">
              <input
                type="number"
                value={nftAmount}
                onChange={(e) => setNftAmount(e.target.value)}
                placeholder="Enter NFT amount"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="absolute right-3 top-3 text-gray-400">NFTs</div>
            </div>
          </div>

          {sellQuote && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <h4 className="text-red-400 font-semibold mb-3">Sell Quote</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">You sell:</span>
                  <span className="text-white">{sellQuote.inputAmount.toFixed(2)} NFTs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">You receive:</span>
                  <span className="text-red-400 font-semibold">{sellQuote.outputAmount.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Price impact:</span>
                  <span className={`${sellQuote.priceImpact > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {sellQuote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Trading fee:</span>
                  <span className="text-gray-400">{sellQuote.fee.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Creator fee:</span>
                  <span className="text-gray-400">{sellQuote.creatorFee.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Platform fee:</span>
                  <span className="text-gray-400">{sellQuote.platformFee.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Net amount:</span>
                  <span className="text-green-400 font-semibold">{sellQuote.netAmount.toFixed(2)} $LOS</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSell}
            disabled={!connected || !sellQuote || loading || !nftAmount}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
          >
            {loading ? 'Selling...' : !connected ? 'Connect Wallet' : !sellQuote ? 'Enter Amount' : 'Sell NFTs'}
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-3 border border-white/20">
          <div className="text-gray-400 text-sm">Market Cap</div>
          <div className="text-white font-bold">{metrics.marketCap.toLocaleString()} $LOS</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 border border-white/20">
          <div className="text-gray-400 text-sm">Liquidity</div>
          <div className="text-white font-bold">{metrics.liquidity.toLocaleString()} $LOS</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 border border-white/20">
          <div className="text-gray-400 text-sm">Total Volume</div>
          <div className="text-white font-bold">{collection.totalVolume.toLocaleString()} $LOS</div>
        </div>
        <div className="bg-white/10 rounded-xl p-3 border border-white/20">
          <div className="text-gray-400 text-sm">Total Trades</div>
          <div className="text-white font-bold">{collection.totalTrades}</div>
        </div>
      </div>
    </div>
  );
}
