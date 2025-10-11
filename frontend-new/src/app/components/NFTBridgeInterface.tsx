'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { nftBridgeService, SupportedToken, BridgeQuote } from '@/lib/nft-bridge-service';

interface NFTBridgeInterfaceProps {
  collectionId: string;
  collectionName: string;
  userNFTBalance: number;
  onTradeComplete?: (tradeResult: any) => void;
}

export default function NFTBridgeInterface({
  collectionId,
  collectionName,
  userNFTBalance,
  onTradeComplete
}: NFTBridgeInterfaceProps) {
  const { publicKey, connected } = useWallet();
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<SupportedToken | null>(null);
  const [nftAmount, setNftAmount] = useState('');
  const [bridgeQuote, setBridgeQuote] = useState<BridgeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    setSupportedTokens(nftBridgeService.getSupportedTokens());
    if (supportedTokens.length > 0) {
      setSelectedToken(supportedTokens[0]);
    }
  }, []);

  // Calculate quote when inputs change
  useEffect(() => {
    if (selectedToken && nftAmount && !isNaN(parseFloat(nftAmount))) {
      calculateQuote();
    } else {
      setBridgeQuote(null);
    }
  }, [selectedToken, nftAmount, collectionId]);

  const calculateQuote = async () => {
    if (!selectedToken || !nftAmount) return;

    try {
      const quote = await nftBridgeService.calculateBridgeQuote(
        collectionId,
        parseFloat(nftAmount),
        selectedToken.mint
      );
      setBridgeQuote(quote);
    } catch (err) {
      console.error('Error calculating bridge quote:', err);
    }
  };

  const handleBridgeTrade = async () => {
    if (!connected || !publicKey || !bridgeQuote || !selectedToken) return;

    setLoading(true);
    setError('');

    try {
      const result = await nftBridgeService.executeBridgeTrade(
        collectionId,
        bridgeQuote.nftAmount,
        selectedToken.mint,
        publicKey.toString()
      );

      if (result.success) {
        setSuccess(`Successfully traded ${bridgeQuote.nftAmount} NFTs for ${bridgeQuote.netAmount.toFixed(6)} ${selectedToken.symbol}!`);
        onTradeComplete?.(result);
        setNftAmount('');
        setBridgeQuote(null);
      } else {
        setError(result.error || 'Bridge trade failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bridge trade failed');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    setNftAmount(userNFTBalance.toString());
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🌉 NFT Bridge</h2>
        <p className="text-gray-300">Trade your revealed NFTs for any supported token</p>
      </div>

      {/* User Balance */}
      <div className="bg-white/10 rounded-xl p-4 mb-6 border border-white/20">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium">Your {collectionName} NFTs:</span>
          <span className="text-blue-400 font-bold">{userNFTBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Token Selection */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">
          Select Token to Receive
        </label>
        <div className="grid grid-cols-2 gap-3">
          {supportedTokens.map((token) => (
            <button
              key={token.mint}
              onClick={() => setSelectedToken(token)}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                selectedToken?.mint === token.mint
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">{token.symbol}</div>
                  <div className="text-gray-400 text-sm">{token.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* NFT Amount Input */}
      <div className="mb-6">
        <label className="block text-white font-medium mb-2">
          Amount of NFTs to Trade
        </label>
        <div className="relative">
          <input
            type="number"
            value={nftAmount}
            onChange={(e) => setNftAmount(e.target.value)}
            placeholder="Enter NFT amount"
            max={userNFTBalance}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={setMaxAmount}
            className="absolute right-3 top-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Max
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Available: {userNFTBalance.toFixed(2)} NFTs
        </p>
      </div>

      {/* Bridge Quote */}
      {bridgeQuote && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-4 mb-6">
          <h4 className="text-purple-400 font-semibold mb-3">Bridge Quote</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">You trade:</span>
              <span className="text-white">{bridgeQuote.nftAmount.toFixed(2)} NFTs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">You receive:</span>
              <span className="text-purple-400 font-semibold">
                {bridgeQuote.netAmount.toFixed(6)} {bridgeQuote.tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Price per NFT:</span>
              <span className="text-white">
                {bridgeQuote.pricePerNFT.toFixed(6)} {bridgeQuote.tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Price impact:</span>
              <span className={`${bridgeQuote.priceImpact > 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                {bridgeQuote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Bridge fee:</span>
              <span className="text-gray-400">
                {bridgeQuote.bridgeFee.toFixed(6)} {bridgeQuote.tokenSymbol}
              </span>
            </div>
          </div>
        </div>
      )}

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

      {/* Bridge Trade Button */}
      <button
        onClick={handleBridgeTrade}
        disabled={!connected || !bridgeQuote || loading || !nftAmount || parseFloat(nftAmount) > userNFTBalance}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
      >
        {loading ? 'Bridging...' : !connected ? 'Connect Wallet' : !bridgeQuote ? 'Enter Amount' : `Bridge to ${selectedToken?.symbol}`}
      </button>

      {/* Bridge Information */}
      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
        <h4 className="text-blue-400 font-semibold mb-2">🌉 Bridge Information</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Trade NFTs for any supported token</li>
          <li>• 0.5% bridge fee on all trades</li>
          <li>• Instant settlement on Analos blockchain</li>
          <li>• Liquidity provided by the community</li>
        </ul>
      </div>

      {/* Supported Tokens */}
      <div className="mt-4">
        <h4 className="text-white font-semibold mb-3">Supported Tokens</h4>
        <div className="grid grid-cols-2 gap-2">
          {supportedTokens.map((token) => (
            <div key={token.mint} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {token.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{token.symbol}</div>
                  <div className="text-gray-400 text-xs">{token.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
