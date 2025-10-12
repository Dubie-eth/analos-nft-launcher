'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function SwapPage() {
  const { connected, publicKey } = useWallet();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('los');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwap = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const userConfirmed = window.confirm(
      '🔒 SECURITY WARNING 🔒\n\n' +
      'Please ensure you are using a BURNER WALLET with minimal funds before swapping.\n\n' +
      'This feature requires wallet connection. Do you want to continue?'
    );

    if (userConfirmed) {
      setIsLoading(true);
      try {
        // Simulate swap processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calculate estimated output (mock calculation)
        const estimatedOutput = (parseFloat(fromAmount) * 0.95).toFixed(4);
        setToAmount(estimatedOutput);
        
        alert(`Swap initiated! Estimated output: ${estimatedOutput} $LOL`);
      } catch (error) {
        alert('Swap failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReverseSwap = () => {
    const tempAmount = fromAmount;
    const tempToken = fromToken;
    
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setFromToken('lol');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔄</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Token Swap
          </h1>
          <p className="text-xl text-gray-300">
            Trade tokens directly on our platform using your wallet
          </p>
        </div>

        {/* Swap Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          {/* From Token */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300 text-lg font-medium">From</span>
              <span className="text-gray-400 text-sm">Balance: 0.00</span>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent text-white text-2xl font-semibold outline-none flex-1 mr-4"
              />
              <select 
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-white/10 text-white rounded-lg px-4 py-3 border border-white/20 font-semibold"
              >
                <option value="los">$LOS</option>
                <option value="sol">$SOL</option>
                <option value="usdc">$USDC</option>
              </select>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleReverseSwap}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300 text-lg font-medium">To</span>
              <span className="text-gray-400 text-sm">Balance: 0.00</span>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="bg-transparent text-white text-2xl font-semibold outline-none flex-1 mr-4"
              />
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg px-4 py-3 font-bold">
                $LOL
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <button 
            onClick={handleSwap}
            disabled={isLoading || !connected}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>{connected ? 'Swap Tokens' : 'Connect Wallet First'}</span>
                </>
              )}
            </div>
          </button>

          {/* Swap Info */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-400">
              Powered by Analos DEX • Slippage: 0.5%
            </p>
            <p className="text-xs text-gray-500">
              Estimated gas fee: ~0.001 SOL
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-red-500/20 border border-red-500/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <h3 className="font-bold text-red-300">Security Notice</h3>
          </div>
          <p className="text-red-200 text-sm leading-relaxed">
            Always use a burner wallet with minimal funds when testing new platforms. 
            This is a beta feature - trade at your own risk and never use wallets with 
            significant funds on experimental platforms.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <a
            href="https://app.analos.io/dex/9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
          >
            <div className="text-xl mb-1">💱</div>
            <div>Buy $LOL</div>
          </a>
          <a
            href="https://losscreener.com/token/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-center"
          >
            <div className="text-xl mb-1">📊</div>
            <div>View Chart</div>
          </a>
        </div>
      </div>
    </div>
  );
}
