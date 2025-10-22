'use client';

import React, { useState } from 'react';
import ProfileCard, { ProfileCardData } from './ProfileCard';
import { Upload, Download, Copy, Share2 } from 'lucide-react';

interface ProfileCardBuilderProps {
  className?: string;
}

const ProfileCardBuilder: React.FC<ProfileCardBuilderProps> = ({ className = '' }) => {
  const [cardData, setCardData] = useState<ProfileCardData>({
    username: 'username',
    displayName: 'Display Name',
    bio: 'Enter your bio here...',
    avatarUrl: '',
    bannerUrl: '',
    twitterHandle: '',
    website: '',
    discord: '',
    github: '',
    telegram: '',
    mintNumber: 1,
    referralCode: 'USERNAME',
    tier: 'common',
    power: 100,
    status: 'active',
    totalMints: 0,
    totalVolume: 0,
    achievements: [],
    badges: []
  });

  const [variant, setVariant] = useState<'standard' | 'premium' | 'legendary' | 'mythic'>('standard');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showDetails, setShowDetails] = useState(true);

  const handleInputChange = (field: keyof ProfileCardData, value: any) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: 'achievements' | 'badges', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setCardData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const generateReferralCode = (username: string) => {
    return username.toUpperCase();
  };

  const exportCardData = () => {
    const dataStr = JSON.stringify(cardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-card-${cardData.username}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyCardData = () => {
    navigator.clipboard.writeText(JSON.stringify(cardData, null, 2));
    alert('Card data copied to clipboard!');
  };

  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: `@${cardData.username} Profile Card`,
        text: `Check out @${cardData.username}'s profile card on Analos!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Card link copied to clipboard!');
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">🛠️ Profile Card Builder</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Builder Form */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Card Configuration</h3>
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={cardData.username}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('username', value);
                    handleInputChange('referralCode', generateReferralCode(value));
                  }}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={cardData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={cardData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Enter your bio..."
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Social Links</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={cardData.twitterHandle}
                    onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={cardData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="https://website.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discord
                  </label>
                  <input
                    type="text"
                    value={cardData.discord}
                    onChange={(e) => handleInputChange('discord', e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="username#1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub
                  </label>
                  <input
                    type="text"
                    value={cardData.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Stats & Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tier
                  </label>
                  <select
                    value={cardData.tier}
                    onChange={(e) => handleInputChange('tier', e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                    <option value="mythic">Mythic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Power
                  </label>
                  <input
                    type="number"
                    value={cardData.power}
                    onChange={(e) => handleInputChange('power', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    min="0"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mint Number
                  </label>
                  <input
                    type="number"
                    value={cardData.mintNumber}
                    onChange={(e) => handleInputChange('mintNumber', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Mints
                  </label>
                  <input
                    type="number"
                    value={cardData.totalMints}
                    onChange={(e) => handleInputChange('totalMints', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Achievements (comma-separated)
                </label>
                <input
                  type="text"
                  value={cardData.achievements?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('achievements', e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="First Mint, Volume Trader, Community Builder"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Badges (comma-separated)
                </label>
                <input
                  type="text"
                  value={cardData.badges?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('badges', e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="Trader, Creator, Builder, Leader"
                />
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Display Options</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Variant
                  </label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="legendary">Legendary</option>
                    <option value="mythic">Mythic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="showDetails"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showDetails" className="text-sm text-gray-300">
                  Show detailed stats and information
                </label>
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Export & Share</h4>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportCardData}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
                
                <button
                  onClick={copyCardData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Data
                </button>
                
                <button
                  onClick={shareCard}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Card
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Live Preview</h3>
            
            <div className="flex justify-center">
              <ProfileCard
                data={cardData}
                variant={variant}
                size={size}
                showDetails={showDetails}
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCardBuilder;
