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
        // Load profile from database
        const response = await fetch(`/api/user-profiles/${userWallet}`);
        
        if (response.ok) {
          const userProfile = await response.json();
          setProfile(userProfile);
          setFormData({
            username: userProfile.username || '',
            bio: userProfile.bio || '',
            privacyLevel: userProfile.privacyLevel || 'public',
            allowDataExport: userProfile.allowDataExport ?? true,
            allowAnalytics: userProfile.allowAnalytics ?? true
          });
          logger.log('Profile loaded from database:', userProfile.username);
        } else {
          // Create new profile if none exists
          const newProfile: UserProfile = {
            id: '1',
            walletAddress: userWallet,
            username: userWallet.slice(0, 8) + '...',
            bio: '',
            profilePictureUrl: '',
            bannerImageUrl: '',
            socials: {
              twitter: '',
              telegram: '',
              discord: '',
              website: '',
              github: '',
              instagram: '',
              linkedin: '',
              youtube: ''
            },
            favoriteCollections: [],
            referralCode: userWallet.slice(0, 8).toUpperCase(),
            totalReferrals: 0,
            totalPoints: 0,
            rank: 999,
            privacyLevel: 'public',
            allowDataExport: true,
            allowAnalytics: true
          };

          setProfile(newProfile);
          setFormData({
            username: newProfile.username,
            bio: newProfile.bio,
            privacyLevel: newProfile.privacyLevel,
            allowDataExport: newProfile.allowDataExport,
            allowAnalytics: newProfile.allowAnalytics
          });
          logger.log('New profile created:', newProfile.username);
        }
      } catch (error) {
        logger.error('Failed to load profile:', error);
        // Fallback to empty profile
        const emptyProfile: UserProfile = {
          id: '1',
          walletAddress: userWallet,
          username: '',
          bio: '',
          profilePictureUrl: '',
          bannerImageUrl: '',
          socials: {
            twitter: '',
            telegram: '',
            discord: '',
            website: '',
            github: '',
            instagram: '',
            linkedin: '',
            youtube: ''
          },
          favoriteCollections: [],
          referralCode: userWallet.slice(0, 8).toUpperCase(),
          totalReferrals: 0,
          totalPoints: 0,
          rank: 999,
          privacyLevel: 'public',
          allowDataExport: true,
          allowAnalytics: true
        };

        setProfile(emptyProfile);
        setFormData({
          username: '',
          bio: '',
          privacyLevel: 'public',
          allowDataExport: true,
          allowAnalytics: true
        });
      } finally {
        setLoading(false);
      }
    };

    if (userWallet) {
      loadProfile();
    }
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
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }

      if (formData.bio.length > 500) {
        newErrors.bio = 'Bio must be less than 500 characters';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      // Check username uniqueness if username has changed
      if (formData.username !== profile?.username) {
        const usernameCheckResponse = await fetch(`/api/user-profiles/check-username/${formData.username}`);
        if (usernameCheckResponse.ok) {
          const { available } = await usernameCheckResponse.json();
          if (!available) {
            newErrors.username = 'Username is already taken';
            setErrors(newErrors);
            setSaving(false);
            return;
          }
        }
      }

      // Generate personalized referral code based on username
      const personalizedReferralCode = formData.username.toUpperCase();

      // Save profile to database
      const response = await fetch(`/api/user-profiles/${userWallet}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          profilePictureUrl: profile?.profilePictureUrl,
          bannerImageUrl: profile?.bannerImageUrl,
          socials: profile?.socials,
          referralCode: personalizedReferralCode,
          privacyLevel: formData.privacyLevel,
          allowDataExport: formData.allowDataExport,
          allowAnalytics: formData.allowAnalytics
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('username')) {
          setErrors({ username: 'Username is already taken' });
          setSaving(false);
          return;
        }
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const updatedProfile = await response.json();
      
      // Update local state with saved data
      if (profile) {
        setProfile({
          ...profile,
          username: updatedProfile.username,
          bio: updatedProfile.bio,
          profilePictureUrl: updatedProfile.profilePictureUrl,
          bannerImageUrl: updatedProfile.bannerImageUrl,
          socials: updatedProfile.socials,
          referralCode: updatedProfile.referralCode,
          privacyLevel: updatedProfile.privacyLevel,
          allowDataExport: updatedProfile.allowDataExport,
          allowAnalytics: updatedProfile.allowAnalytics
        });
      }

      logger.log('Profile updated successfully');
      
      // Show success message with referral link
      const referralLink = `${window.location.origin}/?ref=${personalizedReferralCode}`;
      alert(`Profile saved successfully!\n\nYour personalized referral link:\n${referralLink}`);
      
    } catch (error) {
      logger.error('Failed to update profile:', error);
      alert('Failed to save profile. Please try again.');
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
            <div className="bg-white bg-opacity-90 rounded-lg p-1">
              <ProfilePictureUpload
                currentImage={profile.bannerImageUrl}
                type="banner"
                onUploadComplete={handleBannerUpload}
                className=""
              />
            </div>
          </div>
        </div>

        {/* Profile Picture and Info - Mobile Stack */}
        <div className="px-4 pb-4">
          {/* Profile Picture - Centered */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <ProfilePictureUpload
                currentImage={profile.profilePictureUrl}
                type="profile"
                onUploadComplete={handleProfilePictureUpload}
                className=""
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
                    onChange={(e) => {
                      setFormData({ ...formData, bio: e.target.value });
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    rows={3}
                    className={`
                      w-full px-3 py-2 border rounded-md resize-none overflow-hidden
                      ${errors.bio ? 'border-red-300' : 'border-gray-300'}
                      focus:border-blue-500 focus:ring-blue-500
                    `}
                    placeholder="Tell the community about yourself..."
                    style={{ minHeight: '80px', maxHeight: '120px' }}
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
