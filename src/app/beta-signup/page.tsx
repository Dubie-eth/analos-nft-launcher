'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, Wallet, Star, Users, TrendingUp, Zap } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface FeatureRequest {
  id: string;
  name: string;
  description: string;
  votes: number;
  userVoted: boolean;
}

interface UserInfo {
  username: string;
  bio?: string;
  email?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
  };
  profilePicture?: string;
  bannerImage?: string;
  privacyLevel: 'public' | 'private' | 'friends';
  allowDataExport: boolean;
  allowAnalytics: boolean;
}

const BetaSignupPage: React.FC = () => {
  const { theme } = useTheme();
  const { publicKey, connected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '',
    bio: '',
    email: '',
    socials: {
      twitter: '',
      telegram: '',
      discord: '',
      website: '',
      github: ''
    },
    profilePicture: '',
    bannerImage: '',
    privacyLevel: 'public',
    allowDataExport: true,
    allowAnalytics: true
  });

  // Sample feature requests
  const defaultFeatures: FeatureRequest[] = [
    {
      id: 'profile-nft',
      name: 'Profile NFTs',
      description: 'Mint unique profile NFTs with custom avatars and metadata',
      votes: 0,
      userVoted: false
    },
    {
      id: 'nft-marketplace',
      name: 'NFT Marketplace',
      description: 'Buy and sell NFTs with advanced filtering and analytics',
      votes: 0,
      userVoted: false
    },
    {
      id: 'collection-launcher',
      name: 'Collection Launcher',
      description: 'Launch your own NFT collections with custom metadata',
      votes: 0,
      userVoted: false
    },
    {
      id: 'staking-rewards',
      name: 'NFT Staking',
      description: 'Stake your NFTs to earn rewards and passive income',
      votes: 0,
      userVoted: false
    },
    {
      id: 'referral-system',
      name: 'Referral System',
      description: 'Earn rewards for referring new users to the platform',
      votes: 0,
      userVoted: false
    },
    {
      id: 'token-swap',
      name: 'Token Swap',
      description: 'Swap tokens directly on the Analos blockchain',
      votes: 0,
      userVoted: false
    }
  ];

  useEffect(() => {
    setFeatureRequests(defaultFeatures);
  }, []);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (selectedFeatures.length === 0) {
      alert('Please select at least one feature you\'re interested in');
      return;
    }

    if (!userInfo.username || userInfo.username.length < 3) {
      alert('Please enter a username (at least 3 characters)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          requestedFeatures: selectedFeatures,
          userInfo: userInfo,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        // Update feature votes
        setFeatureRequests(prev => 
          prev.map(feature => ({
            ...feature,
            votes: selectedFeatures.includes(feature.id) ? feature.votes + 1 : feature.votes,
            userVoted: selectedFeatures.includes(feature.id)
          }))
        );
      } else {
        throw new Error('Failed to submit beta signup');
      }
    } catch (error) {
      console.error('Error submitting beta signup:', error);
      alert('Failed to submit beta signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to Analos! 🎉</h1>
            <p className="text-gray-300 mb-6">
              Thanks for joining our beta program! We'll keep you updated on the features you're interested in.
            </p>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Your Feature Requests:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatures.map(featureId => {
                    const feature = featureRequests.find(f => f.id === featureId);
                    return feature ? (
                      <span key={featureId} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                        {feature.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <a 
                  href="/profile" 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Go to Profile
                </a>
                <a 
                  href="/features" 
                  className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all"
                >
                  View Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Join Analos Beta Program</h1>
          <p className="text-gray-300 text-lg">
            Help us build the future of NFTs on Analos by telling us which features you want to see next!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Connect Wallet */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-center">
              <Wallet className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">
                Connect your Analos wallet to participate in our beta program and vote on features.
              </p>
              
              {!connected ? (
                <button
                  onClick={connect}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-semibold">Wallet Connected!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Info Section - Show after wallet connection */}
          {connected && !showUserInfo && (
            <div className="md:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Complete Your Profile</h2>
              <p className="text-gray-300 mb-6 text-center">
                Help us personalize your experience by providing some basic information.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Username *</label>
                  <input
                    type="text"
                    value={userInfo.username}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    required
                  />
                  {userInfo.username && userInfo.username.length < 3 && (
                    <p className="text-red-400 text-sm mt-1">Username must be at least 3 characters</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white font-semibold mb-2">Bio</label>
                  <textarea
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Twitter</label>
                  <input
                    type="text"
                    value={userInfo.socials.twitter}
                    onChange={(e) => setUserInfo(prev => ({ 
                      ...prev, 
                      socials: { ...prev.socials, twitter: e.target.value }
                    }))}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Telegram</label>
                  <input
                    type="text"
                    value={userInfo.socials.telegram}
                    onChange={(e) => setUserInfo(prev => ({ 
                      ...prev, 
                      socials: { ...prev.socials, telegram: e.target.value }
                    }))}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Discord</label>
                  <input
                    type="text"
                    value={userInfo.socials.discord}
                    onChange={(e) => setUserInfo(prev => ({ 
                      ...prev, 
                      socials: { ...prev.socials, discord: e.target.value }
                    }))}
                    placeholder="username#1234"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Website</label>
                  <input
                    type="url"
                    value={userInfo.socials.website}
                    onChange={(e) => setUserInfo(prev => ({ 
                      ...prev, 
                      socials: { ...prev.socials, website: e.target.value }
                    }))}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">GitHub</label>
                  <input
                    type="text"
                    value={userInfo.socials.github}
                    onChange={(e) => setUserInfo(prev => ({ 
                      ...prev, 
                      socials: { ...prev.socials, github: e.target.value }
                    }))}
                    placeholder="username"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-white font-semibold mb-3">Privacy Settings</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Allow data export</span>
                      <input
                        type="checkbox"
                        checked={userInfo.allowDataExport}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, allowDataExport: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Allow analytics tracking</span>
                      <input
                        type="checkbox"
                        checked={userInfo.allowAnalytics}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, allowAnalytics: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowUserInfo(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Continue to Features
                </button>
              </div>
            </div>
          )}

          {/* Right Column - Feature Requests */}
          {connected && showUserInfo && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-6">
              <Star className="w-6 h-6 text-yellow-400 mr-2" />
              <h2 className="text-2xl font-bold text-white">Vote on Features</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Select the features you're most excited about. This helps us prioritize development!
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {featureRequests.map((feature) => (
                <div
                  key={feature.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedFeatures.includes(feature.id)
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => handleFeatureToggle(feature.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{feature.name}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </div>
                    <div className="flex items-center ml-4">
                      {selectedFeatures.includes(feature.id) && (
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Submit Button */}
        {connected && showUserInfo && (
          <div className="text-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading || selectedFeatures.length === 0}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : `Submit ${selectedFeatures.length} Feature Request${selectedFeatures.length !== 1 ? 's' : ''}`}
            </button>
            <p className="text-gray-400 text-sm mt-2">
              Selected {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">1,234</p>
            <p className="text-gray-400 text-sm">Beta Users</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">89%</p>
            <p className="text-gray-400 text-sm">Feature Requests</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">15</p>
            <p className="text-gray-400 text-sm">Features Built</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaSignupPage;