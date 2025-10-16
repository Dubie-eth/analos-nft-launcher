/**
 * COMPLETE PROFILE MANAGER
 * Comprehensive user profile management with all features
 */

'use client';

import React, { useState, useEffect } from 'react';
import ProfilePictureUpload from './ProfilePictureUpload';
import SocialLinksManager from './SocialLinksManager';
import Leaderboard from './Leaderboard';
import { logger } from '@/lib/logger';

interface UserProfile {
  id: string;
  walletAddress: string;
  username: string;
  bio: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socials: {
    twitter: string;
    telegram: string;
    discord: string;
    website: string;
    github: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  favoriteCollections: string[];
  referralCode: string;
  totalReferrals: number;
  totalPoints: number;
  rank: number;
  privacyLevel: 'public' | 'friends' | 'private';
  allowDataExport: boolean;
  allowAnalytics: boolean;
}

interface CompleteProfileManagerProps {
  userWallet: string;
  className?: string;
}

const PRIVACY_LEVELS = [
  { value: 'public', label: 'Public', description: 'Everyone can see your profile' },
  { value: 'friends', label: 'Friends Only', description: 'Only your connections can see your profile' },
  { value: 'private', label: 'Private', description: 'Only you can see your profile' }
];

export default function CompleteProfileManager({
  userWallet,
  className = ''
}: CompleteProfileManagerProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'leaderboard' | 'settings'>('profile');
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    privacyLevel: 'public' as 'public' | 'friends' | 'private',
    allowDataExport: true,
    allowAnalytics: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        const mockProfile: UserProfile = {
          id: '1',
          walletAddress: userWallet,
          username: 'NFTCollector',
          bio: 'Passionate NFT collector and blockchain enthusiast. Always looking for the next great project!',
          profilePictureUrl: 'https://via.placeholder.com/150',
          bannerImageUrl: 'https://via.placeholder.com/800x200',
          socials: {
            twitter: 'https://twitter.com/nftcollector',
            telegram: 'https://t.me/nftcollector',
            discord: 'NFTCollector#1234',
            website: 'https://nftcollector.com',
            github: 'https://github.com/nftcollector',
            instagram: 'https://instagram.com/nftcollector',
            linkedin: 'https://linkedin.com/in/nftcollector',
            youtube: 'https://youtube.com/@nftcollector'
          },
          favoriteCollections: ['Analos Punks', 'Crypto Kitties', 'Bored Apes'],
          referralCode: 'NFT2024',
          totalReferrals: 12,
          totalPoints: 8500,
          rank: 15,
          privacyLevel: 'public',
          allowDataExport: true,
          allowAnalytics: true
        };

        setProfile(mockProfile);
        setFormData({
          username: mockProfile.username,
          bio: mockProfile.bio,
          privacyLevel: mockProfile.privacyLevel,
          allowDataExport: mockProfile.allowDataExport,
          allowAnalytics: mockProfile.allowAnalytics
        });

        logger.log('Profile loaded:', mockProfile.username);
      } catch (error) {
        logger.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userWallet]);

  const updateProfile = async () => {
    setSaving(true);
    setErrors({});

    try {
      // Validate form
      const newErrors: Record<string, string> = {};
      
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (formData.bio.length > 500) {
        newErrors.bio = 'Bio must be less than 500 characters';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      logger.log('Profile updated successfully');
      // Show success message
    } catch (error) {
      logger.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = (url: string) => {
    if (profile) {
      setProfile({ ...profile, profilePictureUrl: url });
    }
  };

  const handleBannerUpload = (url: string) => {
    if (profile) {
      setProfile({ ...profile, bannerImageUrl: url });
    }
  };

  const handleSocialLinksChange = (socials: any) => {
    if (profile) {
      setProfile({ ...profile, socials });
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-6 ${className}`}>
      {/* Mobile-First Profile Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        {/* Banner Section */}
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          {profile.bannerImageUrl && (
            <img
              src={profile.bannerImageUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Banner Upload - Mobile Optimized */}
          <div className="absolute top-2 right-2">
            <div className="bg-white bg-opacity-90 rounded-lg p-2">
              <ProfilePictureUpload
                currentImage={profile.bannerImageUrl}
                type="banner"
                onUploadComplete={handleBannerUpload}
                className="w-20 h-12"
              />
            </div>
          </div>
        </div>

        {/* Profile Picture and Info - Mobile Stack */}
        <div className="px-4 pb-4">
          {/* Profile Picture - Centered */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <ProfilePictureUpload
                currentImage={profile.profilePictureUrl}
                type="profile"
                onUploadComplete={handleProfilePictureUpload}
                className="w-24 h-24"
              />
            </div>
          </div>

          {/* User Info - Clean Layout */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
            <p className="text-gray-600 text-sm leading-relaxed px-4">{profile.bio}</p>
            
            {/* Stats - Horizontal Layout */}
            <div className="flex justify-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900">#{profile.rank}</div>
                <div className="text-gray-500">Rank</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{profile.totalPoints.toLocaleString()}</div>
                <div className="text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{profile.totalReferrals}</div>
                <div className="text-gray-500">Referrals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex px-4 overflow-x-auto">
            {[
              { key: 'profile', label: 'Profile', icon: '👤' },
              { key: 'social', label: 'Social Links', icon: '🔗' },
              { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { key: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  py-3 px-4 border-b-2 font-medium text-sm transition-colors flex-shrink-0 whitespace-nowrap mr-2
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`
                      w-full px-3 py-2 border rounded-md
                      ${errors.username ? 'border-red-300' : 'border-gray-300'}
                      focus:border-blue-500 focus:ring-blue-500
                    `}
                    placeholder="Enter your username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={profile.referralCode}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.referralCode)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className={`
                      w-full px-3 py-2 border rounded-md
                      ${errors.bio ? 'border-red-300' : 'border-gray-300'}
                      focus:border-blue-500 focus:ring-blue-500
                    `}
                    placeholder="Tell the community about yourself..."
                  />
                  <div className="flex justify-between mt-1">
                    {errors.bio && (
                      <p className="text-sm text-red-600">{errors.bio}</p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <SocialLinksManager
              initialLinks={profile.socials}
              onLinksChange={handleSocialLinksChange}
            />
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <Leaderboard currentUserWallet={userWallet} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Privacy Level
                </label>
                <div className="space-y-3">
                  {PRIVACY_LEVELS.map((level) => (
                    <label key={level.value} className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="privacyLevel"
                        value={level.value}
                        checked={formData.privacyLevel === level.value}
                        onChange={(e) => setFormData({ ...formData, privacyLevel: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowDataExport}
                    onChange={(e) => setFormData({ ...formData, allowDataExport: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Allow Data Export</div>
                    <div className="text-sm text-gray-500">Allow you to export your data</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowAnalytics}
                    onChange={(e) => setFormData({ ...formData, allowAnalytics: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Allow Analytics</div>
                    <div className="text-sm text-gray-500">Help improve the platform with anonymous usage data</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
