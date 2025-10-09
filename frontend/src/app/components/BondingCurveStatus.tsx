'use client';

import { useState, useEffect } from 'react';
import { bondingCurveService } from '@/lib/bonding-curve-service';

interface BondingCurveStatusProps {
  collectionName: string;
  bondingCurveConfig: {
    virtualLOSReserves: number;
    virtualNFTSupply: number;
    realNFTSupply: number;
    bondingCap: number;
    feePercentage: number;
    creatorFeePercentage: number;
    platformFeePercentage: number;
  };
  currentSupply: number;
  totalRaised: number;
}

export default function BondingCurveStatus({ 
  collectionName, 
  bondingCurveConfig, 
  currentSupply, 
  totalRaised 
}: BondingCurveStatusProps) {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedFinalPrice, setEstimatedFinalPrice] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Calculate current price based on bonding curve
    const config = bondingCurveConfig;
    const price = bondingCurveService.calculatePriceAtSupply(config, currentSupply);
    setCurrentPrice(price);

    // Calculate progress to bonding cap
    const progress = (totalRaised / config.bondingCap) * 100;
    setProgressPercentage(Math.min(progress, 100));

    // Estimate final price (at bonding cap completion)
    const finalPrice = bondingCurveService.calculatePriceAtSupply(config, config.virtualNFTSupply);
    setEstimatedFinalPrice(finalPrice);

    // Calculate estimated time remaining (rough estimate)
    if (progress > 0 && progress < 100) {
      const rate = totalRaised / (Date.now() - (Date.now() - 86400000)); // Rough estimate
      const remaining = (config.bondingCap - totalRaised) / rate;
      if (remaining > 0) {
        const hours = Math.ceil(remaining / 3600000);
        setTimeRemaining(`${hours} hours estimated`);
      }
    }
  }, [bondingCurveConfig, currentSupply, totalRaised]);

  const isRevealed = progressPercentage >= 100;

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          📈 Bonding Curve Status
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isRevealed 
            ? 'bg-green-600 text-white' 
            : 'bg-yellow-600 text-white'
        }`}>
          {isRevealed ? '🎉 REVEALED' : '⏳ IN PROGRESS'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80 text-sm">Progress to Reveal</span>
          <span className="text-white font-semibold">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-white/60 mt-1">
          <span>${totalRaised.toLocaleString()}</span>
          <span>${bondingCurveConfig.bondingCap.toLocaleString()} target</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-white/60 text-xs">Current Price</p>
          <p className="text-white font-bold text-lg">{currentPrice.toFixed(2)} $LOS</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-white/60 text-xs">NFTs Minted</p>
          <p className="text-white font-bold text-lg">{currentSupply}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-white/60 text-xs">Total Raised</p>
          <p className="text-white font-bold text-lg">${totalRaised.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-white/60 text-xs">Est. Final Price</p>
          <p className="text-white font-bold text-lg">{estimatedFinalPrice.toFixed(2)} $LOS</p>
        </div>
      </div>

      {/* Price Impact Warning */}
      {!isRevealed && (
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
          <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Price Impact Warning</h4>
          <p className="text-yellow-200 text-sm">
            Each mint increases the price for subsequent mints. The current price of{' '}
            <span className="font-bold">{currentPrice.toFixed(2)} $LOS</span> will increase 
            as more NFTs are minted. Early minters get better prices!
          </p>
        </div>
      )}

      {/* Bonding Curve Parameters */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">📊 Bonding Curve Parameters</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-white/60">Bonding Cap</p>
            <p className="text-white font-mono">${bondingCurveConfig.bondingCap.toLocaleString()} $LOS</p>
          </div>
          <div>
            <p className="text-white/60">Virtual Reserves</p>
            <p className="text-white font-mono">${bondingCurveConfig.virtualLOSReserves.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/60">Total Supply</p>
            <p className="text-white font-mono">{bondingCurveConfig.virtualNFTSupply} NFTs</p>
          </div>
          <div>
            <p className="text-white/60">Platform Fee</p>
            <p className="text-white font-mono">{bondingCurveConfig.platformFeePercentage}%</p>
          </div>
          <div>
            <p className="text-white/60">Creator Fee</p>
            <p className="text-white font-mono">{bondingCurveConfig.creatorFeePercentage}%</p>
          </div>
          <div>
            <p className="text-white/60">Total Fees</p>
            <p className="text-white font-mono">{bondingCurveConfig.feePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Time Remaining */}
      {!isRevealed && timeRemaining && (
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm">
            ⏱️ Estimated time to bonding cap: <span className="font-semibold">{timeRemaining}</span>
          </p>
        </div>
      )}

      {/* Revealed State */}
      {isRevealed && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mt-4">
          <h4 className="text-green-300 font-semibold mb-2">🎉 Bonding Cap Reached!</h4>
          <p className="text-green-200 text-sm">
            The bonding curve has completed! All NFTs have been revealed and the collection 
            is now ready for marketplace migration. Thank you to all participants!
          </p>
        </div>
      )}
    </div>
  );
}
