'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { tierSystemService, SocialProfile } from '@/lib/tier-system-service';

interface SocialProfileManagerProps {
  onProfileUpdate?: (profile: SocialProfile) => void;
  onClose?: () => void;
}

export default function SocialProfileManager({
  onProfileUpdate,
  onClose
}: SocialProfileManagerProps) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Social account states
  const [twitterUsername, setTwitterUsername] = useState('');
  const [twitterFollowers, setTwitterFollowers] = useState(0);
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);

  const [discordUsername, setDiscordUsername] = useState('');
  const [discordServers, setDiscordServers] = useState(0);
  const [discordConnected, setDiscordConnected] = useState(false);

  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramSubscribers, setTelegramSubscribers] = useState(0);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramFollowers, setInstagramFollowers] = useState(0);
  const [instagramConnected, setInstagramConnected] = useState(false);

  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [youtubeSubscribers, setYoutubeSubscribers] = useState(0);
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  const [totalSocialScore, setTotalSocialScore] = useState(0);

  useEffect(() => {
    if (connected && publicKey) {
      loadExistingProfile();
    }
  }, [connected, publicKey]);

  // Calculate social score when accounts change
  useEffect(() => {
    const socialAccounts = {
      twitter: twitterConnected ? {
        username: twitterUsername,
        followers: twitterFollowers,
        verified: twitterVerified,
        connected: twitterConnected
      } : undefined,
      discord: discordConnected ? {
        username: discordUsername,
        serverMemberships: discordServers,
        connected: discordConnected
      } : undefined,
      telegram: telegramConnected ? {
        username: telegramUsername,
        channelSubscribers: telegramSubscribers,
        connected: telegramConnected
      } : undefined,
      instagram: instagramConnected ? {
        username: instagramUsername,
        followers: instagramFollowers,
        connected: instagramConnected
      } : undefined,
      youtube: youtubeConnected ? {
        channelName: youtubeChannel,
        subscribers: youtubeSubscribers,
        connected: youtubeConnected
      } : undefined
    };

    const score = tierSystemService.calculateSocialScore(socialAccounts);
    setTotalSocialScore(score);
  }, [twitterConnected, twitterFollowers, twitterVerified, discordConnected, discordServers, telegramConnected, telegramSubscribers, instagramConnected, instagramFollowers, youtubeConnected, youtubeSubscribers]);

  const loadExistingProfile = async () => {
    // TODO: Load existing profile from backend
    console.log('Loading existing profile for:', publicKey?.toString());
  };

  const connectSocialAccount = async (platform: string) => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implement actual social media connection
      // This would involve OAuth flows for each platform
      console.log(`Connecting ${platform} account...`);
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (platform) {
        case 'twitter':
          setTwitterConnected(true);
          break;
        case 'discord':
          setDiscordConnected(true);
          break;
        case 'telegram':
          setTelegramConnected(true);
          break;
        case 'instagram':
          setInstagramConnected(true);
          break;
        case 'youtube':
          setYoutubeConnected(true);
          break;
      }
      
      setSuccess(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${platform} account`);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const socialProfile: SocialProfile = {
        walletAddress: publicKey.toString(),
        socialAccounts: {
          twitter: twitterConnected ? {
            username: twitterUsername,
            followers: twitterFollowers,
            verified: twitterVerified,
            connected: twitterConnected
          } : undefined,
          discord: discordConnected ? {
            username: discordUsername,
            serverMemberships: discordServers,
            connected: discordConnected
          } : undefined,
          telegram: telegramConnected ? {
            username: telegramUsername,
            channelSubscribers: telegramSubscribers,
            connected: telegramConnected
          } : undefined,
          instagram: instagramConnected ? {
            username: instagramUsername,
            followers: instagramFollowers,
            connected: instagramConnected
          } : undefined,
          youtube: youtubeConnected ? {
            channelName: youtubeChannel,
            subscribers: youtubeSubscribers,
            connected: youtubeConnected
          } : undefined
        },
        totalSocialScore,
        verifiedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // TODO: Save profile to backend
      console.log('Saving social profile:', socialProfile);
      
      setSuccess('Social profile saved successfully!');
      onProfileUpdate?.(socialProfile);
      
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const socialPlatforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: '𝕏',
      color: 'from-blue-400 to-blue-600',
      connected: twitterConnected,
      onConnect: () => connectSocialAccount('twitter')
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      color: 'from-indigo-400 to-purple-600',
      connected: discordConnected,
      onConnect: () => connectSocialAccount('discord')
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: 'from-blue-500 to-cyan-500',
      connected: telegramConnected,
      onConnect: () => connectSocialAccount('telegram')
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: 'from-pink-400 to-purple-500',
      connected: instagramConnected,
      onConnect: () => connectSocialAccount('instagram')
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      color: 'from-red-500 to-red-600',
      connected: youtubeConnected,
      onConnect: () => connectSocialAccount('youtube')
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          👤 Social Profile Manager
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Social Score Display */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-6 mb-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Social Score</h3>
          <div className="text-4xl font-bold text-purple-400 mb-2">{totalSocialScore.toLocaleString()}</div>
          <p className="text-gray-300">
            Higher scores unlock better tiers and benefits
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Social Platform Connections */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {socialPlatforms.map((platform) => (
          <div
            key={platform.id}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              platform.connected
                ? 'border-green-500 bg-green-500/20'
                : 'border-white/20 bg-white/10 hover:bg-white/20'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-2xl">{platform.icon}</div>
              <div>
                <h4 className="text-white font-semibold">{platform.name}</h4>
                <p className={`text-sm ${platform.connected ? 'text-green-400' : 'text-gray-400'}`}>
                  {platform.connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            <button
              onClick={platform.onConnect}
              disabled={loading || platform.connected}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                platform.connected
                  ? 'bg-green-600 text-white cursor-default'
                  : `bg-gradient-to-r ${platform.color} hover:opacity-80 text-white`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Connecting...' : platform.connected ? 'Connected ✓' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      {/* Social Account Details */}
      <div className="space-y-6">
        {/* Twitter Details */}
        {twitterConnected && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-3">𝕏</span>
              Twitter Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Followers</label>
                <input
                  type="number"
                  value={twitterFollowers}
                  onChange={(e) => setTwitterFollowers(parseInt(e.target.value) || 0)}
                  placeholder="Number of followers"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={twitterVerified}
                    onChange={(e) => setTwitterVerified(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Verified account</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Discord Details */}
        {discordConnected && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-3">🎮</span>
              Discord Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="username#1234"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Server Memberships</label>
                <input
                  type="number"
                  value={discordServers}
                  onChange={(e) => setDiscordServers(parseInt(e.target.value) || 0)}
                  placeholder="Number of servers"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Telegram Details */}
        {telegramConnected && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-3">✈️</span>
              Telegram Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Channel Subscribers</label>
                <input
                  type="number"
                  value={telegramSubscribers}
                  onChange={(e) => setTelegramSubscribers(parseInt(e.target.value) || 0)}
                  placeholder="Number of subscribers"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Instagram Details */}
        {instagramConnected && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-3">📸</span>
              Instagram Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={instagramUsername}
                  onChange={(e) => setInstagramUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Followers</label>
                <input
                  type="number"
                  value={instagramFollowers}
                  onChange={(e) => setInstagramFollowers(parseInt(e.target.value) || 0)}
                  placeholder="Number of followers"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* YouTube Details */}
        {youtubeConnected && (
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="text-2xl mr-3">📺</span>
              YouTube Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Channel Name</label>
                <input
                  type="text"
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  placeholder="Channel name"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Subscribers</label>
                <input
                  type="number"
                  value={youtubeSubscribers}
                  onChange={(e) => setYoutubeSubscribers(parseInt(e.target.value) || 0)}
                  placeholder="Number of subscribers"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={saveProfile}
          disabled={loading || !connected}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
        >
          {loading ? 'Saving...' : 'Save Social Profile'}
        </button>
      </div>

      {!connected && (
        <p className="text-red-400 text-sm text-center mt-4">
          Please connect your wallet to manage your social profile
        </p>
      )}
    </div>
  );
}
