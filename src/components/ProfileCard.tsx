'use client';

import React from 'react';
import { User, Globe, MessageCircle, Github, Zap, Crown, Star, Shield, Trophy } from 'lucide-react';

export interface ProfileCardData {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  twitterHandle?: string;
  website?: string;
  discord?: string;
  github?: string;
  telegram?: string;
  mintNumber?: number;
  referralCode?: string;
  tier?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  power?: number;
  status?: 'active' | 'inactive' | 'banned';
  joinDate?: string;
  lastActive?: string;
  totalMints?: number;
  totalVolume?: number;
  achievements?: string[];
  badges?: string[];
}

interface ProfileCardProps {
  data: ProfileCardData;
  variant?: 'standard' | 'premium' | 'legendary' | 'mythic';
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  data,
  variant = 'standard',
  size = 'medium',
  showDetails = true,
  className = ''
}) => {
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'mythic': return 'from-purple-600 via-pink-600 to-red-600';
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500';
      case 'epic': return 'from-purple-500 via-blue-500 to-cyan-500';
      case 'rare': return 'from-blue-400 via-indigo-500 to-purple-500';
      case 'common': return 'from-gray-400 via-gray-500 to-gray-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'mythic': return '👑';
      case 'legendary': return '⭐';
      case 'epic': return '💎';
      case 'rare': return '🔥';
      case 'common': return '⭐';
      default: return '⭐';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-yellow-400';
      case 'banned': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'mythic':
        return {
          card: 'bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-red-900/30 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/20',
          glow: 'shadow-2xl shadow-purple-500/30',
          text: 'text-white',
          accent: 'text-purple-300'
        };
      case 'legendary':
        return {
          card: 'bg-gradient-to-br from-yellow-900/30 via-orange-900/30 to-red-900/30 border-2 border-yellow-400/50 shadow-xl shadow-yellow-500/20',
          glow: 'shadow-xl shadow-yellow-500/25',
          text: 'text-white',
          accent: 'text-yellow-300'
        };
      case 'premium':
        return {
          card: 'bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20',
          glow: 'shadow-lg shadow-blue-500/25',
          text: 'text-white',
          accent: 'text-blue-300'
        };
      default:
        return {
          card: 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-600/50 shadow-lg',
          glow: 'shadow-lg',
          text: 'text-white',
          accent: 'text-gray-300'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          card: 'p-4',
          avatar: 'w-16 h-16',
          title: 'text-lg',
          subtitle: 'text-sm',
          text: 'text-xs'
        };
      case 'large':
        return {
          card: 'p-8',
          avatar: 'w-32 h-32',
          title: 'text-3xl',
          subtitle: 'text-xl',
          text: 'text-base'
        };
      default:
        return {
          card: 'p-6',
          avatar: 'w-24 h-24',
          title: 'text-2xl',
          subtitle: 'text-lg',
          text: 'text-sm'
        };
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <div className={`${styles.card} ${styles.glow} ${sizeStyles.card} rounded-2xl ${className}`}>
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`${sizeStyles.avatar} rounded-full bg-gradient-to-br ${getTierColor(data.tier)} flex items-center justify-center text-4xl font-bold ${styles.text} shadow-lg`}>
          {data.avatarUrl ? (
            <img 
              src={data.avatarUrl} 
              alt={data.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`${sizeStyles.title} font-bold ${styles.text}`}>
              @{data.username}
            </h3>
            {data.tier && (
              <span className="text-2xl" title={`${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Tier`}>
                {getTierIcon(data.tier)}
              </span>
            )}
          </div>
          
          <p className={`${sizeStyles.subtitle} ${styles.accent} font-semibold`}>
            {data.displayName}
          </p>
          
          {data.mintNumber && (
            <p className={`${sizeStyles.text} ${styles.accent} opacity-75`}>
              #{data.mintNumber}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {data.bio && (
        <div className="mb-6">
          <p className={`${sizeStyles.text} ${styles.text} leading-relaxed`}>
            {data.bio}
          </p>
        </div>
      )}

      {/* Social Links */}
      <div className="flex flex-wrap gap-3 mb-6">
        {data.twitterHandle && (
          <a 
            href={`https://twitter.com/${data.twitterHandle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
          >
            <span className="text-blue-400">🐦</span>
            <span className={`${sizeStyles.text} ${styles.text}`}>Twitter</span>
          </a>
        )}
        
        {data.website && (
          <a 
            href={data.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors"
          >
            <Globe className="w-4 h-4 text-green-400" />
            <span className={`${sizeStyles.text} ${styles.text}`}>Website</span>
          </a>
        )}
        
        {data.github && (
          <a 
            href={`https://github.com/${data.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gray-600/20 border border-gray-500/30 rounded-lg hover:bg-gray-600/30 transition-colors"
          >
            <Github className="w-4 h-4 text-gray-400" />
            <span className={`${sizeStyles.text} ${styles.text}`}>GitHub</span>
          </a>
        )}
        
        {data.discord && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <span className="text-indigo-400">💬</span>
            <span className={`${sizeStyles.text} ${styles.text}`}>{data.discord}</span>
          </div>
        )}
      </div>

      {/* Stats and Details */}
      {showDetails && (
        <div className="space-y-4">
          {/* Tier and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-1`}>Tier</p>
              <p className={`${sizeStyles.text} font-bold ${styles.text} capitalize`}>
                {data.tier || 'Common'}
              </p>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-1`}>Status</p>
              <p className={`${sizeStyles.text} font-bold ${getStatusColor(data.status)}`}>
                {data.status || 'Active'}
              </p>
            </div>
          </div>

          {/* Power and Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-1`}>Power</p>
              <p className={`${sizeStyles.text} font-bold text-yellow-400`}>
                {data.power || 100}
              </p>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-1`}>Mints</p>
              <p className={`${sizeStyles.text} font-bold ${styles.text}`}>
                {data.totalMints || 0}
              </p>
            </div>
          </div>

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-2`}>Achievements</p>
              <div className="flex flex-wrap gap-2">
                {data.achievements.map((achievement, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs text-yellow-300"
                  >
                    🏆 {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {data.badges && data.badges.length > 0 && (
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-2`}>Badges</p>
              <div className="flex flex-wrap gap-2">
                {data.badges.map((badge, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-xs text-blue-300"
                  >
                    🎖️ {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Referral Code */}
          {data.referralCode && (
            <div className="bg-black/20 rounded-lg p-3">
              <p className={`${sizeStyles.text} ${styles.accent} mb-1`}>Referral Code</p>
              <p className={`${sizeStyles.text} font-mono font-bold ${styles.text}`}>
                {data.referralCode}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
