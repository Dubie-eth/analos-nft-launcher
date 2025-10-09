'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { mplHybrid404Service, Hybrid404Config } from '@/lib/mpl-hybrid-404-service';

interface Hybrid404TradingInterfaceProps {
  collectionId: string;
  collectionName: string;
}

export default function Hybrid404TradingInterface({ 
  collectionId, 
  collectionName 
}: Hybrid404TradingInterfaceProps) {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'info'>('buy');
  const [losAmount, setLosAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [swapResult, setSwapResult] = useState<string | null>(null);
  const [collectionConfig, setCollectionConfig] = useState<Hybrid404Config | null>(null);

  useEffect(() => {
    loadCollectionConfig();
  }, [collectionId]);

  const loadCollectionConfig = () => {
    const config = mplHybrid404Service.getCollectionConfig(collectionId);
    setCollectionConfig(config);
  };

  const handleLOSAmountChange = (value: string) => {
    setLosAmount(value);
    if (value && collectionConfig) {
      const tokens = mplHybrid404Service.calculateTokensForLOS(collectionId, parseFloat(value));
      setTokenAmount(tokens.toString());
    }
  };

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (value && collectionConfig) {
      const los = mplHybrid404Service.calculateLOSForTokens(collectionId, parseFloat(value));
      setLosAmount(los.toFixed(6));
    }
  };

  const handleBuyTokens = async () => {
    if (!connected || !publicKey || !losAmount) return;

    setLoading(true);
    setSwapResult(null);

    try {
      const losAmountNum = parseFloat(losAmount);
      const tokenAmountNum = parseFloat(tokenAmount);

      // For buying tokens with $LOS, we simulate a token purchase
      const result = await mplHybrid404Service.swapTokensToNFT(
        collectionId,
        publicKey.toString(),
        tokenAmountNum
      );

      if (result.success) {
        setSwapResult(`✅ Successfully purchased ${tokenAmountNum.toLocaleString()} tokens for ${losAmount} $LOS!`);
        setLosAmount('');
        setTokenAmount('');
      } else {
        setSwapResult(`❌ Purchase failed: ${result.error}`);
      }
    } catch (error) {
      setSwapResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSellTokens = async () => {
    if (!connected || !publicKey || !tokenAmount) return;

    setLoading(true);
    setSwapResult(null);

    try {
      const tokenAmountNum = parseFloat(tokenAmount);
      const losAmountNum = parseFloat(losAmount);

      // For selling tokens for $LOS, we simulate a token sale
      const result = await mplHybrid404Service.swapNFTToTokens(
        collectionId,
        publicKey.toString(),
        tokenAmountNum / (collectionConfig?.totalSupply || 1)
      );

      if (result.success) {
        setSwapResult(`✅ Successfully sold ${tokenAmountNum.toLocaleString()} tokens for ${losAmount} $LOS!`);
        setLosAmount('');
        setTokenAmount('');
      } else {
        setSwapResult(`❌ Sale failed: ${result.error}`);
      }
    } catch (error) {
      setSwapResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!collectionConfig) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-2">🔗 404 Trading Interface</h3>
        <p className="text-gray-400">Collection not found or not 404 enabled.</p>
      </div>
    );
  }

  const tokenPrice = collectionConfig.nftPrice / collectionConfig.totalSupply;
  const nftPrice = collectionConfig.nftPrice;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🔗 404 Trading Interface - {collectionName}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('buy')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'buy' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Buy Tokens
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'sell' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sell Tokens
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'info' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Info
          </button>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{nftPrice.toFixed(2)} $LOS</div>
          <div className="text-xs text-gray-400">Full NFT Price</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">{tokenPrice.toFixed(6)} $LOS</div>
          <div className="text-xs text-gray-400">Per Token</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{collectionConfig.totalSupply.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Tokens</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">
            {((1 / collectionConfig.totalSupply) * 100).toFixed(4)}%
          </div>
          <div className="text-xs text-gray-400">Token per NFT</div>
        </div>
      </div>

      {activeTab === 'buy' && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-3">🛒 Buy Fractional Tokens</h4>
            <p className="text-green-300 text-sm mb-4">
              Buy fractional tokens of {collectionName} NFTs. Each token represents a fraction of the full NFT.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount in $LOS
                </label>
                <input
                  type="number"
                  value={losAmount}
                  onChange={(e) => handleLOSAmountChange(e.target.value)}
                  placeholder="Enter $LOS amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tokens You'll Receive
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  placeholder="Enter token amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per Token:</span>
                  <span className="text-white">{tokenPrice.toFixed(6)} $LOS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Equivalent NFT Fraction:</span>
                  <span className="text-white">
                    {tokenAmount ? ((parseFloat(tokenAmount) / collectionConfig.totalSupply) * 100).toFixed(4) : '0'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee (0.3%):</span>
                  <span className="text-white">
                    {losAmount ? (parseFloat(losAmount) * 0.003).toFixed(6) : '0'} $LOS
                  </span>
                </div>
              </div>

              <button
                onClick={handleBuyTokens}
                disabled={loading || !connected || !losAmount || !tokenAmount}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Buying Tokens...' : '🛒 Buy Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-red-400 font-medium mb-3">💰 Sell Fractional Tokens</h4>
            <p className="text-red-300 text-sm mb-4">
              Sell your fractional tokens back to $LOS. You'll receive $LOS based on current token price.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Amount to Sell
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  placeholder="Enter token amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  $LOS You'll Receive
                </label>
                <input
                  type="number"
                  value={losAmount}
                  onChange={(e) => handleLOSAmountChange(e.target.value)}
                  placeholder="Enter $LOS amount"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per Token:</span>
                  <span className="text-white">{tokenPrice.toFixed(6)} $LOS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">NFT Fraction Selling:</span>
                  <span className="text-white">
                    {tokenAmount ? ((parseFloat(tokenAmount) / collectionConfig.totalSupply) * 100).toFixed(4) : '0'}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee (0.3%):</span>
                  <span className="text-white">
                    {losAmount ? (parseFloat(losAmount) * 0.003).toFixed(6) : '0'} $LOS
                  </span>
                </div>
              </div>

              <button
                onClick={handleSellTokens}
                disabled={loading || !connected || !losAmount || !tokenAmount}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Selling Tokens...' : '💰 Sell Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-3">📊 How 404 Trading Works</h4>
            <div className="space-y-3 text-sm text-blue-300">
              <div>
                <h5 className="font-medium text-blue-400 mb-1">🔗 What is MPL-Hybrid 404?</h5>
                <p>MPL-Hybrid 404 allows NFTs to be fractionalized into tradeable tokens. Each NFT is backed by a pool of tokens.</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400 mb-1">🛒 Buying Tokens</h5>
                <p>When you buy tokens, you're buying fractional ownership of the NFT. You can buy any amount of tokens up to the total supply.</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400 mb-1">💰 Selling Tokens</h5>
                <p>When you sell tokens, you receive $LOS based on the current token price. The more tokens you sell, the more $LOS you receive.</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-400 mb-1">🎯 Full NFT Redemption</h5>
                <p>If you own 100% of the tokens, you can redeem them for the full NFT. This requires owning all {collectionConfig.totalSupply.toLocaleString()} tokens.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">📈 Collection Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Full NFT Price:</span>
                  <span className="text-white">{nftPrice.toFixed(2)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Token Supply:</span>
                  <span className="text-white">{collectionConfig.totalSupply.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price per Token:</span>
                  <span className="text-white">{tokenPrice.toFixed(6)} $LOS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${collectionConfig.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {collectionConfig.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Result */}
      {swapResult && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          swapResult.includes('✅') 
            ? 'bg-green-900/20 border border-green-500/30 text-green-300'
            : 'bg-red-900/20 border border-red-500/30 text-red-300'
        }`}>
          {swapResult}
        </div>
      )}
    </div>
  );
}
