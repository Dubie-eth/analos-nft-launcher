/**
 * LIVING PORTFOLIO NFT COMPONENT
 * Display and manage auto-investing, self-evolving NFTs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface LivingPortfolioNFTProps {
  tokenId: string;
  ownerAddress: string;
  initialInvestment?: number;
  onPortfolioUpdate?: (portfolio: any) => void;
}

interface PortfolioData {
  tokenId: string;
  owner: string;
  portfolioAnalysis: {
    tradingPatterns: {
      favoriteTokens: string[];
      tradingFrequency: string;
      riskTolerance: string;
      totalVolume: number;
      uniqueTokens: number;
    };
    investmentStrategy: {
      autoInvest: boolean;
      investmentPercentage: number;
      diversificationLevel: number;
      riskLevel: string;
    };
  };
  investments: Array<{
    tokenSymbol: string;
    allocation: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    reason: string;
  }>;
  evolution: {
    performanceLayers: {
      background: string;
      border: string;
      effects: string[];
      animations: string[];
      aura: string;
    };
    metadataUpdates: {
      totalReturn: number;
      bestInvestment: string;
      riskScore: number;
      performanceTier: string;
      rarityTier: string;
      evolutionCount: number;
    };
  };
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  isActive: boolean;
}

export default function LivingPortfolioNFT({ 
  tokenId, 
  ownerAddress, 
  initialInvestment = 0.1,
  onPortfolioUpdate 
}: LivingPortfolioNFTProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [tokenId, ownerAddress]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get existing portfolio
      const response = await fetch(`/api/living-portfolio/${tokenId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
        onPortfolioUpdate?.(data);
      } else if (response.status === 404) {
        // Portfolio doesn't exist, initialize it
        await initializePortfolio();
      } else {
        throw new Error('Failed to load portfolio');
      }
    } catch (err: any) {
      logger.error('Error loading portfolio:', err);
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const initializePortfolio = async () => {
    try {
      setActionLoading('initializing');
      
      const response = await fetch(`/api/living-portfolio/${tokenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress,
          initialInvestment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio);
        onPortfolioUpdate?.(data.portfolio);
        logger.log(`✅ Portfolio NFT ${tokenId} initialized successfully`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize portfolio');
      }
    } catch (err: any) {
      logger.error('Error initializing portfolio:', err);
      setError(err.message || 'Failed to initialize portfolio');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRebalance = async () => {
    try {
      setActionLoading('rebalancing');
      
      const response = await fetch(`/api/living-portfolio/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rebalance' })
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio);
        logger.log(`⚖️ Portfolio ${tokenId} rebalanced successfully`);
      } else {
        throw new Error('Failed to rebalance portfolio');
      }
    } catch (err: any) {
      logger.error('Error rebalancing portfolio:', err);
      setError(err.message || 'Failed to rebalance portfolio');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEvolve = async () => {
    try {
      setActionLoading('evolving');
      
      const response = await fetch(`/api/living-portfolio/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evolve' })
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.portfolio);
        logger.log(`🔄 Portfolio NFT ${tokenId} evolved successfully`);
      } else {
        throw new Error('Failed to evolve portfolio');
      }
    } catch (err: any) {
      logger.error('Error evolving portfolio:', err);
      setError(err.message || 'Failed to evolve portfolio');
    } finally {
      setActionLoading(null);
    }
  };

  const getPerformanceColor = (returnPercentage: number): string => {
    if (returnPercentage > 20) return 'text-green-500';
    if (returnPercentage > 0) return 'text-green-400';
    if (returnPercentage > -10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceEmoji = (tier: string): string => {
    const emojis: Record<string, string> = {
      hot_streak: '🔥',
      growing: '📈',
      stable: '⚖️',
      learning: '📚',
      conservative: '🛡️'
    };
    return emojis[tier] || '❓';
  };

  const getRarityColor = (tier: string): string => {
    const colors: Record<string, string> = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-orange-400',
      mythic: 'text-pink-400'
    };
    return colors[tier] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse">
        <div className="w-full h-64 bg-gray-700 rounded-md mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-2">Error Loading Portfolio NFT #{tokenId}</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={loadPortfolio}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Portfolio NFT #{tokenId}</h3>
        <p className="text-gray-300 mb-4">This portfolio NFT hasn't been initialized yet.</p>
        <button
          onClick={initializePortfolio}
          disabled={actionLoading === 'initializing'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {actionLoading === 'initializing' ? 'Initializing...' : 'Initialize Portfolio'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
      {/* NFT Image */}
      <div className="relative">
        <img
          src={`https://via.placeholder.com/400x400/4f46e5/ffffff?text=Portfolio+${portfolio.evolution.metadataUpdates.performanceTier.replace('_', '+')}`}
          alt={`Living Portfolio NFT ${tokenId}`}
          className="w-full h-64 object-cover"
        />
        
        {/* Performance Overlay */}
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
          {getPerformanceEmoji(portfolio.evolution.metadataUpdates.performanceTier)} {portfolio.evolution.metadataUpdates.performanceTier.replace('_', ' ').toUpperCase()}
        </div>
        
        {/* Rarity Badge */}
        <div className="absolute top-2 left-2 bg-purple-600/80 text-white text-xs font-bold px-2 py-1 rounded-full">
          {portfolio.evolution.metadataUpdates.rarityTier.toUpperCase()}
        </div>
        
        {/* Evolution Counter */}
        <div className="absolute bottom-2 left-2 bg-blue-600/80 text-white text-xs font-bold px-2 py-1 rounded-full">
          Evolution #{portfolio.evolution.metadataUpdates.evolutionCount}
        </div>
      </div>

      {/* Portfolio Information */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2">Portfolio NFT #{tokenId}</h3>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-white font-bold">{portfolio.totalValue.toFixed(4)} SOL</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Return</p>
            <p className={`font-bold ${getPerformanceColor(portfolio.evolution.metadataUpdates.totalReturn)}`}>
              {portfolio.evolution.metadataUpdates.totalReturn > 0 ? '+' : ''}{portfolio.evolution.metadataUpdates.totalReturn.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Investment Breakdown */}
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Investments</h4>
          <div className="space-y-2">
            {portfolio.investments.map((investment, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                <div>
                  <span className="text-white font-medium">{investment.tokenSymbol}</span>
                  <span className="text-gray-400 text-sm ml-2">({(investment.allocation * 100).toFixed(1)}%)</span>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm">{investment.currentValue.toFixed(4)} SOL</p>
                  <p className={`text-xs ${getPerformanceColor(investment.profitLossPercentage)}`}>
                    {investment.profitLossPercentage > 0 ? '+' : ''}{investment.profitLossPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Information */}
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">Strategy</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Risk Level:</span>
              <span className="text-white ml-1">{portfolio.portfolioAnalysis.investmentStrategy.riskLevel}</span>
            </div>
            <div>
              <span className="text-gray-400">Diversification:</span>
              <span className="text-white ml-1">{portfolio.portfolioAnalysis.investmentStrategy.diversificationLevel}/10</span>
            </div>
            <div>
              <span className="text-gray-400">Auto Invest:</span>
              <span className="text-white ml-1">{portfolio.portfolioAnalysis.investmentStrategy.autoInvest ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Best Performer:</span>
              <span className="text-white ml-1">{portfolio.evolution.metadataUpdates.bestInvestment}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRebalance}
            disabled={actionLoading === 'rebalancing'}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {actionLoading === 'rebalancing' ? 'Rebalancing...' : 'Rebalance'}
          </button>
          <button
            onClick={handleEvolve}
            disabled={actionLoading === 'evolving'}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {actionLoading === 'evolving' ? 'Evolving...' : 'Evolve'}
          </button>
        </div>
      </div>
    </div>
  );
}
