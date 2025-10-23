'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, Save, Edit3, X, Check, Upload, Link as LinkIcon, Mail, Globe, Github, MessageCircle, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfileData {
  username: string;
  customName?: string;
  referralLink?: string;
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

interface UnifiedProfileManagerProps {
  onProfileUpdate?: (profile: UserProfileData) => void;
  showEditButton?: boolean;
  compact?: boolean;
  redirectAfterSave?: boolean;
  redirectPath?: string;
}

const UnifiedProfileManager: React.FC<UnifiedProfileManagerProps> = ({
  onProfileUpdate,
  showEditButton = true,
  compact = false,
  redirectAfterSave = false,
  redirectPath = '/profile'
}) => {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData>({
    username: '',
    customName: '',
    referralLink: '',
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!connected || !publicKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/user-profile/check?walletAddress=${publicKey.toString()}`);
        const data = await response.json();
        
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [connected, publicKey]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('socials.')) {
      const socialField = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        socials: {
          ...prev.socials,
          [socialField]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user-profile/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          userInfo: profile
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile saved successfully!');
        setIsEditing(false);
        
        if (onProfileUpdate) {
          onProfileUpdate(profile);
        }

        if (redirectAfterSave) {
          setTimeout(() => {
            router.push(redirectPath);
          }, 1500);
        }

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reload profile data to reset any unsaved changes
    if (connected && publicKey) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading profile...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-gray-300">Please connect your wallet to manage your profile.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile
          </h3>
          {showEditButton && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-white text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-1">Custom Display Name</label>
              <input
                type="text"
                value={profile.customName || ''}
                onChange={(e) => handleInputChange('customName', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                placeholder="Analos Legend, Drip King, Los Gang Member..."
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-1">Referral Link</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={profile.referralLink || ''}
                  onChange={(e) => handleInputChange('referralLink', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                  placeholder="https://analos.network/ref/yourname"
                />
                <button
                  type="button"
                  onClick={() => {
                    const defaultRef = `https://analos.network/ref/${profile.username || 'user'}`;
                    handleInputChange('referralLink', defaultRef);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Username:</span>
              <span className="text-white font-medium">{profile.username || 'Not set'}</span>
            </div>
            {profile.customName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Display Name:</span>
                <span className="text-white font-medium">{profile.customName}</span>
              </div>
            )}
            {profile.referralLink && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Referral Link:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400 text-sm truncate max-w-32">{profile.referralLink}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(profile.referralLink!)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            {profile.bio && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Bio:</span>
                <span className="text-white text-sm">{profile.bio}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <User className="w-6 h-6 mr-3" />
          Profile Management
        </h2>
        {showEditButton && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          
          <div>
            <label className="block text-white font-medium mb-2">Username *</label>
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
            <label className="block text-white font-medium mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none h-24 resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-300">{profile.bio || 'No bio provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="your@email.com"
              />
            ) : (
              <p className="text-gray-300">{profile.email || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
          
          <div>
            <label className="block text-white font-medium mb-2 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Twitter
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.socials.twitter || ''}
                onChange={(e) => handleInputChange('socials.twitter', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="@username"
              />
            ) : (
              <p className="text-gray-300">{profile.socials.twitter || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Telegram
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.socials.telegram || ''}
                onChange={(e) => handleInputChange('socials.telegram', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="@username"
              />
            ) : (
              <p className="text-gray-300">{profile.socials.telegram || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Website
            </label>
            {isEditing ? (
              <input
                type="url"
                value={profile.socials.website || ''}
                onChange={(e) => handleInputChange('socials.website', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <p className="text-gray-300">{profile.socials.website || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2 flex items-center">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.socials.github || ''}
                onChange={(e) => handleInputChange('socials.github', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                placeholder="username"
              />
            ) : (
              <p className="text-gray-300">{profile.socials.github || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Privacy Level</label>
            {isEditing ? (
              <select
                value={profile.privacyLevel}
                onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private</option>
              </select>
            ) : (
              <p className="text-gray-300 capitalize">{profile.privacyLevel}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={profile.allowDataExport}
                onChange={(e) => handleInputChange('allowDataExport', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-white">Allow data export</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={profile.allowAnalytics}
                onChange={(e) => handleInputChange('allowAnalytics', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-white">Allow analytics</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-300">{success}</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedProfileManager;
