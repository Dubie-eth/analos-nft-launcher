'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, Save, Edit3, X, Check } from 'lucide-react';

interface UserProfileData {
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

interface UserProfileManagerProps {
  onProfileUpdate?: (profile: UserProfileData) => void;
  showEditButton?: boolean;
  compact?: boolean;
}

const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  onProfileUpdate,
  showEditButton = true,
  compact = false
}) => {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<UserProfileData>({
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load profile data
  useEffect(() => {
    if (connected && publicKey) {
      loadProfile();
    }
  }, [connected, publicKey]);

  const loadProfile = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      // In a real app, this would fetch from your database
      // For now, we'll use localStorage or a mock API
      const savedProfile = localStorage.getItem(`profile_${publicKey.toString()}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!publicKey) return;
    
    setSaving(true);
    try {
      // Validate required fields
      if (!profile.username || profile.username.length < 3) {
        alert('Username must be at least 3 characters');
        return;
      }

      // Save to localStorage (in production, save to database)
      localStorage.setItem(`profile_${publicKey.toString()}`, JSON.stringify(profile));
      
      // Call the callback if provided
      if (onProfileUpdate) {
        onProfileUpdate(profile);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => {
        if (!prev) return prev;
        const parentValue = prev[parent as keyof UserProfileData];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      setProfile(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };

  if (!connected) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Connect your wallet to manage your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <User className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">User Profile</h3>
        </div>
        {showEditButton && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        )}
      </div>

      {compact ? (
        // Compact view
        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Username</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="Enter username"
              />
            ) : (
              <p className="text-gray-300">{profile.username || 'Not set'}</p>
            )}
          </div>
          
          {profile.bio && (
            <div>
              <label className="block text-white font-semibold mb-2">Bio</label>
              <p className="text-gray-300">{profile.bio}</p>
            </div>
          )}
        </div>
      ) : (
        // Full view
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Username *</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter username"
                  required
                />
              ) : (
                <p className="text-gray-300">{profile.username || 'Not set'}</p>
              )}
            </div>
            
            <div>
              <label className="block text-white font-semibold mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  placeholder="your@email.com"
                />
              ) : (
                <p className="text-gray-300">{profile.email || 'Not set'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-300">{profile.bio || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">Social Links</label>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(profile.socials).map(([platform, value]) => (
                <div key={platform}>
                  <label className="block text-gray-300 text-sm mb-1 capitalize">{platform}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleInputChange(`socials.${platform}`, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      placeholder={`@username`}
                    />
                  ) : (
                    <p className="text-gray-300">{value || 'Not set'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-3">Privacy Settings</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Allow data export</span>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.allowDataExport}
                    onChange={(e) => handleInputChange('allowDataExport', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                ) : (
                  <span className="text-gray-300">{profile.allowDataExport ? 'Yes' : 'No'}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Allow analytics tracking</span>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={profile.allowAnalytics}
                    onChange={(e) => handleInputChange('allowAnalytics', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                ) : (
                  <span className="text-gray-300">{profile.allowAnalytics ? 'Yes' : 'No'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-500/20 text-white rounded-lg hover:bg-gray-500/30 transition-all border border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            disabled={saving || !profile.username || profile.username.length < 3}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileManager;