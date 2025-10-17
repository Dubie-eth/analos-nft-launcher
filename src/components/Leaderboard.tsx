/**
 * LEADERBOARD COMPONENT
 * Displays user rankings, points, and referral stats
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useTheme } from '@/contexts/ThemeContext';

interface UserRank {
  rank: number;
  walletAddress: string;
  username: string;
  profilePicture?: string;
  totalPoints: number;
  referralPoints: number;
  activityPoints: number;
  totalReferrals: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  currentUserWallet?: string;
  className?: string;
}

const LEADERBOARD_CATEGORIES = [
  { key: 'total', name: 'Total Points', description: 'Combined referral and activity points' },
  { key: 'referrals', name: 'Referrals', description: 'Users you\'ve referred to the platform' },
  { key: 'activity', name: 'Activity', description: 'Points from platform engagement' }
];

export default function Leaderboard({
  currentUserWallet,
  className = ''
}: LeaderboardProps) {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'total' | 'referrals' | 'activity'>('total');
  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        const mockData: UserRank[] = [
          {
            rank: 1,
            walletAddress: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
            username: 'NFTMaster',
            profilePicture: 'https://via.placeholder.com/40',
            totalPoints: 15420,
            referralPoints: 12000,
            activityPoints: 3420,
            totalReferrals: 24,
            isCurrentUser: currentUserWallet === '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
          },
          {
            rank: 2,
            walletAddress: '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
            username: 'CryptoCollector',
            profilePicture: 'https://via.placeholder.com/40',
            totalPoints: 12850,
            referralPoints: 9500,
            activityPoints: 3350,
            totalReferrals: 19,
            isCurrentUser: currentUserWallet === '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
          },
          {
            rank: 3,
            walletAddress: '7xK8mN2pQ9rT5wE1yU3iO6aS8dF4gH7jK0lZ2cV5bN8mX',
            username: 'AnalosTrader',
            totalPoints: 11200,
            referralPoints: 8000,
            activityPoints: 3200,
            totalReferrals: 16
          },
          {
            rank: 4,
            walletAddress: '9yL7nP3rS0uW6xF2zV4jP7bT9eG5hI8kL1mZ3cW6bO9nY',
            username: 'BlockchainBuilder',
            totalPoints: 9850,
            referralPoints: 6500,
            activityPoints: 3350,
            totalReferrals: 13
          },
          {
            rank: 5,
            walletAddress: '8zM6oQ4sT1vX7yG3aU5kQ8cU0fH6iJ9lM2nA4dX7cP0oZ',
            username: 'DeFiExplorer',
            totalPoints: 8750,
            referralPoints: 5500,
            activityPoints: 3250,
            totalReferrals: 11
          }
        ];

        // Add current user if not in top 5
        if (currentUserWallet && !mockData.find(user => user.walletAddress === currentUserWallet)) {
          mockData.push({
            rank: 6,
            walletAddress: currentUserWallet,
            username: 'You',
            totalPoints: 4200,
            referralPoints: 2000,
            activityPoints: 2200,
            totalReferrals: 4,
            isCurrentUser: true
          });
        }

        setLeaderboardData(mockData);
        logger.log('Leaderboard data loaded:', mockData.length, 'users');
      } catch (error) {
        logger.error('Failed to load leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [currentUserWallet, timeframe]);

  const getSortedData = () => {
    return [...leaderboardData].sort((a, b) => {
      switch (selectedCategory) {
        case 'referrals':
          return b.totalReferrals - a.totalReferrals;
        case 'activity':
          return b.activityPoints - a.activityPoints;
        default:
          return b.totalPoints - a.totalPoints;
      }
    });
  };

  const getCurrentUserRank = () => {
    return leaderboardData.find(user => user.isCurrentUser);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getPointsForCategory = (user: UserRank, category: string) => {
    switch (category) {
      case 'referrals':
        return user.totalReferrals;
      case 'activity':
        return user.activityPoints;
      default:
        return user.totalPoints;
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`rounded-lg shadow p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`h-6 rounded mb-4 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`flex-1 h-4 rounded ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                <div className={`w-16 h-4 rounded ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedData = getSortedData();
  const currentUser = getCurrentUserRank();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`rounded-lg shadow p-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Leaderboard</h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Top performers and community contributors</p>
          </div>
          
          {/* Current User Stats */}
          {currentUser && (
            <div className="text-right">
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>Your Rank</div>
              <div className="text-2xl font-bold text-blue-500">
                #{currentUser.rank}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {formatNumber(currentUser.totalPoints)} points
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {LEADERBOARD_CATEGORIES.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key as any)}
              className={`
                flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
                ${selectedCategory === category.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'monthly', 'weekly'] as const).map((time) => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${timeframe === time
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {time === 'all' ? 'All Time' : time === 'monthly' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {LEADERBOARD_CATEGORIES.find(c => c.key === selectedCategory)?.name}
          </h3>
          <p className="text-sm text-gray-600">
            {LEADERBOARD_CATEGORIES.find(c => c.key === selectedCategory)?.description}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedData.map((user, index) => (
            <div
              key={user.walletAddress}
              className={`
                px-6 py-4 flex items-center space-x-4 transition-colors leaderboard-entry
                ${user.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
              `}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className={`
                  text-lg font-bold
                  ${user.rank <= 3 ? 'text-yellow-600' : 'text-gray-600'}
                `}>
                  {getRankIcon(user.rank)}
                </span>
              </div>

              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={`
                    text-sm font-medium username
                    ${user.isCurrentUser ? 'text-blue-900' : 'text-gray-900'}
                  `}>
                    {user.username}
                  </p>
                  {user.isCurrentUser && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 wallet-address">
                  {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </p>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-gray-900 points">
                  {selectedCategory === 'referrals' 
                    ? user.totalReferrals 
                    : formatNumber(getPointsForCategory(user, selectedCategory))
                  }
                </div>
                <div className="text-xs text-gray-500">
                  {selectedCategory === 'referrals' ? 'referrals' : 'points'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Complete Leaderboard →
          </button>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Earn Points by Referring Friends!</h3>
            <p className="text-blue-100 text-sm">
              Get 500 points for each friend you refer to the platform
            </p>
          </div>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Get Referral Link
          </button>
        </div>
      </div>
    </div>
  );
}
