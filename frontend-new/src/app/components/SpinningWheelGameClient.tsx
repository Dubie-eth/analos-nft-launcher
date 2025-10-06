'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { spinningWheelService, Prize, SpinResult, BurnToEarnEligibility } from '../../lib/spinning-wheel-service';

// Constants from service
const HOUSE_EDGE = 0.15;
const MIN_SPIN_COST = 0.1;
const MAX_SPIN_COST = 10;

export default function SpinningWheelGameClient() {
  // Add safety check for wallet context
  let walletContext;
  try {
    walletContext = useWallet();
  } catch (error) {
    console.warn('Wallet context not available yet, using fallback');
    walletContext = { publicKey: null, connected: false, signTransaction: undefined };
  }
  
  const { publicKey, connected, signTransaction } = walletContext;
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinCost, setSpinCost] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [gameStats, setGameStats] = useState({
    totalVolume: 0,
    totalSpins: 0,
    totalWins: 0,
    houseBalance: 0,
    winRate: 0,
    averagePrize: 0
  });
  const [burnToEarnEligibility, setBurnToEarnEligibility] = useState<BurnToEarnEligibility>({
    canBurn: false,
    emptyAccounts: 0,
    estimatedReward: 0
  });
  
  const wheelRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Load prizes and game stats
      setPrizes(spinningWheelService.getPrizes());
      setGameStats(spinningWheelService.getGameStats());
      
      // Check burn-to-earn eligibility
      if (publicKey && connected) {
        try {
          const eligibility = await spinningWheelService.checkBurnToEarnEligibility(publicKey);
          setBurnToEarnEligibility(eligibility);
        } catch (error) {
          console.error('Error checking burn-to-earn eligibility:', error);
        }
      }
    };

    loadInitialData();
  }, [publicKey, connected]);

  const handleSpin = async () => {
    if (!publicKey || !connected || !signTransaction) {
      alert('Please connect your wallet to spin!');
      return;
    }

    if (spinCost < MIN_SPIN_COST || spinCost > MAX_SPIN_COST) {
      alert(`Spin cost must be between ${MIN_SPIN_COST} and ${MAX_SPIN_COST} LOS`);
      return;
    }

    setIsSpinning(true);

    try {
      // Use service to execute spin
      const result = await spinningWheelService.spinWheel(spinCost, publicKey, signTransaction);
      
      // Animate wheel
      if (wheelRef.current) {
        const totalSpins = 5 + Math.random() * 5; // 5-10 spins
        const finalAngle = result.spinAngle + (totalSpins * 360);
        
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
      }

      // Wait for animation
      setTimeout(() => {
        setLastResult(result);
        setGameStats(spinningWheelService.getGameStats());
        setIsSpinning(false);
        
        if (result.isWinner && result.prize) {
          console.log('Winner! Prize:', result.prize);
          alert(`🎉 Congratulations! You won ${result.prize.name}!`);
        }
      }, 4000);

    } catch (error) {
      console.error('Spin failed:', error);
      alert('Spin failed. Please try again.');
      setIsSpinning(false);
    }
  };

  const handleBurnToEarn = async () => {
    if (!publicKey || !connected || !signTransaction) {
      alert('Please connect your wallet!');
      return;
    }

    try {
      const result = await spinningWheelService.executeBurnToEarn(publicKey, signTransaction);
      
      if (result.success) {
        alert(`🔥 Success! Closed ${burnToEarnEligibility.emptyAccounts} accounts and earned ${result.reward} LOS!`);
        // Refresh eligibility
        const newEligibility = await spinningWheelService.checkBurnToEarnEligibility(publicKey);
        setBurnToEarnEligibility(newEligibility);
        setGameStats(spinningWheelService.getGameStats());
      }
    } catch (error) {
      console.error('Burn-to-earn failed:', error);
      alert('Burn-to-earn failed. Please try again.');
    }
  };

  const wheelSections = prizes.map((prize, index) => {
    const angle = (360 / prizes.length) * index;
    const color = index % 2 === 0 ? '#8B5CF6' : '#A855F7';
    
    return (
      <div
        key={prize.id}
        className="absolute w-1/2 h-1/2 origin-bottom"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'bottom center'
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: `conic-gradient(from ${angle}deg, ${color} 0deg, ${color} ${360 / prizes.length}deg, transparent ${360 / prizes.length}deg)`,
            clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
          }}
        />
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm"
          style={{ transform: `translate(-50%, 0) rotate(${-angle}deg)` }}
        >
          {prize.name}
        </div>
      </div>
    );
  });

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🎰 Spinning Wheel Game</h2>
        <p className="text-gray-300 mb-4">Spin to win NFTs and LOS tokens!</p>
        
        {/* House Stats */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <div className="bg-purple-500/20 px-3 py-2 rounded-lg">
            <span className="text-purple-300">House Edge: {HOUSE_EDGE * 100}%</span>
          </div>
          <div className="bg-blue-500/20 px-3 py-2 rounded-lg">
            <span className="text-blue-300">Total Volume: {gameStats.totalVolume.toFixed(2)} LOS</span>
          </div>
          <div className="bg-green-500/20 px-3 py-2 rounded-lg">
            <span className="text-green-300">Win Rate: {(gameStats.winRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Wheel */}
        <div className="flex-shrink-0">
          <div className="relative w-64 h-64 mx-auto">
            {/* Wheel Container */}
            <div className="relative w-full h-full rounded-full border-4 border-white/30 overflow-hidden">
              <div
                ref={wheelRef}
                className="w-full h-full transition-transform duration-1000 ease-out"
              >
                {wheelSections}
              </div>
            </div>
            
            {/* Center Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white"></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-6">
          {/* Spin Cost */}
          <div>
            <label className="block text-white font-medium mb-2">
              Spin Cost (LOS)
            </label>
            <input
              type="number"
              min={MIN_SPIN_COST}
              max={MAX_SPIN_COST}
              step="0.1"
              value={spinCost}
              onChange={(e) => setSpinCost(parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              disabled={isSpinning}
            />
            <p className="text-gray-400 text-sm mt-1">
              Min: {MIN_SPIN_COST} LOS | Max: {MAX_SPIN_COST} LOS
            </p>
          </div>

          {/* Prizes Display */}
          <div>
            <h3 className="text-white font-medium mb-3">Available Prizes</h3>
            <div className="grid grid-cols-2 gap-2">
              {prizes.map((prize) => (
                <div key={prize.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="text-white font-medium">{prize.name}</div>
                  <div className="text-gray-400 text-sm">{(prize.probability * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSpin}
              disabled={isSpinning || !connected}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isSpinning ? '🎰 Spinning...' : `🎰 Spin for ${spinCost} LOS`}
            </button>

            {burnToEarnEligibility.canBurn && (
              <button
                onClick={handleBurnToEarn}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                🔥 Burn to Earn ({burnToEarnEligibility.estimatedReward.toFixed(1)} LOS)
              </button>
            )}
          </div>

          {/* Last Result */}
          {lastResult && (
            <div className={`p-4 rounded-lg border ${lastResult.isWinner ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
              <h4 className="text-white font-medium mb-2">
                {lastResult.isWinner ? '🎉 Congratulations!' : '😔 Better luck next time!'}
              </h4>
              {lastResult.isWinner && lastResult.prize ? (
                <p className="text-gray-300">
                  You won: <span className="font-bold text-white">{lastResult.prize.name}</span>
                </p>
              ) : (
                <p className="text-gray-300">The house wins this round!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Section (for you) */}
      {publicKey?.toString() === '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW' && (
        <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <h4 className="text-yellow-300 font-medium mb-3">🔧 Admin Controls</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
              Add NFT Prize
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
              Adjust Probabilities
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
              Withdraw House Funds
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
