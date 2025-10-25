'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Tag, DollarSign, BarChart3, Coins, Shield, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface CollectionStatsBannerProps {
  collectionId: string;
  name: string;
  description?: string;
  bannerImage?: string;
  logoImage?: string;
  socials?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
}

interface CollectionStats {
  totalSupply: number;
  totalMinted: number;
  floorPrice: number;
  volume24h: number;
  volumeTotal: number;
  marketCap: number;
  floorChange24h: number;
  volumeChange24h: number;
  uniqueOwners: number;
  listedCount: number;
  listedPercentage: number;
  sales24h: number;
  avgSalePrice: number;
}

export default function CollectionStatsBanner({
  collectionId,
  name,
  description,
  bannerImage,
  logoImage,
  socials
}: CollectionStatsBannerProps) {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectionStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() => fetchCollectionStats(true), 30000);
    return () => clearInterval(interval);
  }, [collectionId]);

  const fetchCollectionStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch(`/api/collections/${collectionId}/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching collection stats:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    const isPositive = percent >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(percent).toFixed(2)}%
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 backdrop-blur-sm border-b border-white/10 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-32 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Banner Background */}
      <div className="absolute inset-0">
        {bannerImage ? (
          <div className="w-full h-full relative">
            <Image 
              src={bannerImage} 
              alt={name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Top Section - Logo, Name, Description, Socials */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Logo */}
          {logoImage && (
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-black/50">
                <Image 
                  src={logoImage} 
                  alt={name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  {name}
                  <span title="Verified Collection">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </span>
                </h1>
                {description && (
                  <p className="text-gray-300 text-lg max-w-2xl">{description}</p>
                )}
              </div>

              {/* Socials */}
              {socials && (
                <div className="flex gap-3">
                  {socials.twitter && (
                    <a 
                      href={socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                    </a>
                  )}
                  {socials.discord && (
                    <a 
                      href={socials.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0a12.64 12.64 0 00-.617-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057a19.9 19.9 0 005.993 3.03a.078.078 0 00.084-.028a14.09 14.09 0 001.226-1.994a.076.076 0 00-.041-.106a13.107 13.107 0 01-1.872-.892a.077.077 0 01-.008-.128a10.2 10.2 0 00.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127a12.299 12.299 0 01-1.873.892a.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028a19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
                      </svg>
                    </a>
                  )}
                  {socials.website && (
                    <a 
                      href={socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors flex items-center gap-2 text-white text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* Floor Price */}
            <StatCard
              icon={<Tag className="w-5 h-5" />}
              label="Floor Price"
              value={`${stats.floorPrice.toFixed(2)} LOS`}
              change={stats.floorChange24h}
              subValue={`$${(stats.floorPrice * 0.0018).toFixed(2)}`}
            />

            {/* Volume 24h */}
            <StatCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Volume 24h"
              value={`${formatNumber(stats.volume24h)} LOS`}
              change={stats.volumeChange24h}
            />

            {/* Total Volume */}
            <StatCard
              icon={<Coins className="w-5 h-5" />}
              label="Total Volume"
              value={`${formatNumber(stats.volumeTotal)} LOS`}
            />

            {/* Market Cap */}
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Market Cap"
              value={`${formatNumber(stats.marketCap)} LOS`}
            />

            {/* Sales 24h */}
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Sales 24h"
              value={stats.sales24h.toString()}
              subValue={stats.avgSalePrice > 0 ? `Avg: ${stats.avgSalePrice.toFixed(2)} LOS` : undefined}
            />

            {/* Items */}
            <StatCard
              icon={<Tag className="w-5 h-5" />}
              label="Items"
              value={`${stats.totalMinted}/${stats.totalSupply}`}
              subValue={`${((stats.totalMinted / stats.totalSupply) * 100).toFixed(1)}% minted`}
            />

            {/* Owners */}
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Owners"
              value={stats.uniqueOwners.toString()}
              subValue={`${((stats.uniqueOwners / stats.totalMinted) * 100).toFixed(1)}% unique`}
            />

            {/* Listed */}
            <StatCard
              icon={<Tag className="w-5 h-5" />}
              label="Listed"
              value={stats.listedCount.toString()}
              subValue={`${stats.listedPercentage.toFixed(1)}%`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  change, 
  subValue 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  subValue?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <div className="text-white text-xl font-bold mb-1">{value}</div>
      {change !== undefined && (
        <div className="text-sm">
          {change >= 0 ? (
            <span className="flex items-center gap-1 text-green-400">
              <TrendingUp className="w-3 h-3" />
              +{change.toFixed(2)}%
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              {change.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      {subValue && !change && (
        <div className="text-gray-400 text-xs">{subValue}</div>
      )}
    </div>
  );
}

