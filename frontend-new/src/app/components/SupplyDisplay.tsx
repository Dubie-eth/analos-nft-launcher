'use client';

import { useState, useEffect } from 'react';
import { nftSupplyTracker } from '@/lib/nft-supply-tracker';

interface SupplyDisplayProps {
  collectionName: string;
  className?: string;
}

export default function SupplyDisplay({ collectionName, className = '' }: SupplyDisplayProps) {
  const [supplyData, setSupplyData] = useState({
    currentSupply: 0,
    totalSupply: 4200,
    remainingSupply: 4200,
    mintedPercentage: 0,
    isSoldOut: false,
    lastUpdated: new Date().toLocaleTimeString()
  });
  const [loading, setLoading] = useState(true);

  const fetchSupplyData = async () => {
    try {
      console.log('📊 Fetching supply data for:', collectionName);
      const stats = await nftSupplyTracker.getSupplyStatistics(collectionName);
      setSupplyData(stats);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching supply data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyData();
    
    // Refresh supply data every 30 seconds
    const interval = setInterval(fetchSupplyData, 30000);
    
    return () => clearInterval(interval);
  }, [collectionName]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-white/20 rounded mb-2"></div>
        <div className="h-2 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Supply Information */}
      <div className="flex justify-between items-center">
        <span className="text-white/80 text-sm">Supply:</span>
        <span className="text-white font-semibold">
          {supplyData.currentSupply}/{supplyData.totalSupply}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm">Minted</span>
          <span className="text-white/60 text-xs">
            {supplyData.currentSupply}/{supplyData.totalSupply} ({supplyData.mintedPercentage}%)
          </span>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(supplyData.mintedPercentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/60">
            {supplyData.mintedPercentage.toFixed(1)}% minted
          </span>
          <span className="text-white/60">
            {supplyData.remainingSupply} remaining
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center">
        {supplyData.isSoldOut ? (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
            🔥 Sold Out
          </span>
        ) : supplyData.mintedPercentage > 90 ? (
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
            ⚡ Almost Sold Out
          </span>
        ) : supplyData.mintedPercentage > 50 ? (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
            🔥 Selling Fast
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
            🚀 Available
          </span>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <span className="text-white/40 text-xs">
          Updated: {supplyData.lastUpdated}
        </span>
      </div>

      {/* Manual Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchSupplyData}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 text-xs rounded-lg transition-colors duration-200"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
