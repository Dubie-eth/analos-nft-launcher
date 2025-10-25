'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingCart, Send, Coins, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'list' | 'delist';
  nftMint: string;
  tokenId?: string;
  collectionType: string;
  fromWallet?: string;
  toWallet?: string;
  price?: number;
  timestamp: string;
  transactionSignature?: string;
}

export default function PlatformActivityFeed({ limit = 20 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    // Refresh every 15 seconds
    const interval = setInterval(loadActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/platform/activity?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return <Coins className="w-4 h-4" />;
      case 'sale': return <ShoppingCart className="w-4 h-4" />;
      case 'transfer': return <Send className="w-4 h-4" />;
      case 'list': return <TrendingUp className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mint': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'sale': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'transfer': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'list': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getActivityText = (activity: Activity) => {
    const collection = activity.collectionType === 'losbros' ? 'Los Bros' : 'Profile NFT';
    const tokenDisplay = activity.tokenId ? `#${activity.tokenId}` : shortenAddress(activity.nftMint);

    switch (activity.type) {
      case 'mint':
        return (
          <>
            <span className="font-semibold">{shortenAddress(activity.toWallet || '')}</span>
            {' minted '}
            <span className="font-semibold">{collection} {tokenDisplay}</span>
          </>
        );
      case 'sale':
        return (
          <>
            <span className="font-semibold">{shortenAddress(activity.fromWallet || '')}</span>
            {' sold '}
            <span className="font-semibold">{collection} {tokenDisplay}</span>
            {' to '}
            <span className="font-semibold">{shortenAddress(activity.toWallet || '')}</span>
            {activity.price && <span className="text-green-400 font-bold ml-2">{activity.price} LOS</span>}
          </>
        );
      case 'transfer':
        return (
          <>
            <span className="font-semibold">{shortenAddress(activity.fromWallet || '')}</span>
            {' transferred '}
            <span className="font-semibold">{collection} {tokenDisplay}</span>
            {' to '}
            <span className="font-semibold">{shortenAddress(activity.toWallet || '')}</span>
          </>
        );
      case 'list':
        return (
          <>
            <span className="font-semibold">{shortenAddress(activity.fromWallet || '')}</span>
            {' listed '}
            <span className="font-semibold">{collection} {tokenDisplay}</span>
            {activity.price && <span className="text-orange-400 font-bold ml-2">for {activity.price} LOS</span>}
          </>
        );
      default:
        return `Activity for ${tokenDisplay}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Platform Activity
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4 text-sm">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Platform Activity
        </h3>
        <span className="text-xs text-gray-400">Live</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="bg-black/30 rounded-lg p-3 border border-white/10 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {getActivityText(activity)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                    {activity.transactionSignature && (
                      <Link
                        href={`https://explorer.analos.io/tx/${activity.transactionSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Tx
                      </Link>
                    )}
                  </div>
                </div>

                {/* Collection Badge */}
                <div className={`text-xs px-2 py-1 rounded ${
                  activity.collectionType === 'losbros'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {activity.collectionType === 'losbros' ? '🎨' : '👤'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

