'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { userProfileService, UserProfile, LeaderboardEntry } from '@/lib/database/page-access-service';

interface UserProfileManagerProps {
  className?: string;
}

const UserProfileManager: React.FC<UserProfileManagerProps> = ({ className = '' }) => {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'referrals'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    bio: '',
    description: '',
    profilePictureUrl: '',
    bannerImageUrl: '',
    socials: {
      twitter: '',
      telegram: '',
      discord: '',
      website: '',
      github: ''
    },
    favoriteCollections: [] as string[],
    privacyLevel: 'public'
  });

  useEffect(() => {
    if (connected && publicKey) {
      loadUserProfile();
      loadLeaderboard();
    }
  }, [connected, publicKey]);

  const loadUserProfile = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const userProfile = await userProfileService.getUserProfile(publicKey.toString());
      
      if (userProfile) {
        setProfile(userProfile);
        setProfileForm({
          username: userProfile.username,
          bio: userProfile.bio || '',
          description: userProfile.description || '',
          profilePictureUrl: userProfile.profilePictureUrl || '',
          bannerImageUrl: userProfile.bannerImageUrl || '',
          socials: userProfile.socials,
          favoriteCollections: userProfile.favoriteCollections,
          privacyLevel: userProfile.privacyLevel
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=20');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const saveProfile = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const updatedProfile = await userProfileService.upsertUserProfile(profileForm, publicKey.toString());
      setProfile(updatedProfile);
      setEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('❌ Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialChange = (platform: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value
      }
    }));
  };

  const addFavoriteCollection = () => {
    const address = prompt('Enter collection address:');
    if (address && !profileForm.favoriteCollections.includes(address)) {
      setProfileForm(prev => ({
        ...prev,
        favoriteCollections: [...prev.favoriteCollections, address]
      }));
    }
  };

  const removeFavoriteCollection = (address: string) => {
    setProfileForm(prev => ({
      ...prev,
      favoriteCollections: prev.favoriteCollections.filter(addr => addr !== address)
    }));
  };

  if (!connected) {
    return (
      <div className={`bg-white p-6 rounded-lg border ${className}`}>
        <h2 className="text-xl font-bold mb-4">👤 User Profile</h2>
        <p className="text-gray-600">Please connect your wallet to view and manage your profile.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">👤 User Profile</h2>
          {profile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Rank #{profile.rank}</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                {profile.totalPoints} pts
              </span>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
            { id: 'referrals', label: 'Referrals', icon: '🔗' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {editing ? (
              <div className="space-y-4">
                {/* Profile Picture & Banner */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.profilePictureUrl}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, profilePictureUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Image URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.bannerImageUrl}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bannerImageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Username & Bio */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="Your username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Level
                    </label>
                    <select
                      value={profileForm.privacyLevel}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, privacyLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Bio & Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    placeholder="Short bio..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    placeholder="Extended description..."
                  />
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🔗 Social Links</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'twitter', label: 'Twitter', placeholder: '@username' },
                      { key: 'telegram', label: 'Telegram', placeholder: '@username' },
                      { key: 'discord', label: 'Discord', placeholder: 'username#1234' },
                      { key: 'website', label: 'Website', placeholder: 'https://...' },
                      { key: 'github', label: 'GitHub', placeholder: 'username' }
                    ].map(social => (
                      <div key={social.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {social.label}
                        </label>
                        <input
                          type="text"
                          value={profileForm.socials[social.key as keyof typeof profileForm.socials]}
                          onChange={(e) => handleSocialChange(social.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                          placeholder={social.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Favorite Collections */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">⭐ Favorite Collections</h3>
                    <button
                      onClick={addFavoriteCollection}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
                    >
                      + Add Collection
                    </button>
                  </div>
                  <div className="space-y-2">
                    {profileForm.favoriteCollections.map((address, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-mono">{address}</span>
                        <button
                          onClick={() => removeFavoriteCollection(address)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {profileForm.favoriteCollections.length === 0 && (
                      <p className="text-gray-500 text-sm">No favorite collections added yet.</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Display */}
                {profile && (
                  <div className="space-y-4">
                    {/* Profile Header */}
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        {profile.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{profile.username}</h3>
                        <p className="text-gray-600">{profile.bio}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">Rank #{profile.rank}</span>
                          <span className="text-sm text-gray-500">{profile.totalPoints} points</span>
                          <span className="text-sm text-gray-500">{profile.totalReferrals} referrals</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {profile.description && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-gray-700">{profile.description}</p>
                      </div>
                    )}

                    {/* Social Links */}
                    {Object.values(profile.socials).some(link => link) && (
                      <div>
                        <h4 className="font-semibold mb-2">🔗 Social Links</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(profile.socials).map(([platform, link]) => 
                            link && (
                              <a
                                key={platform}
                                href={platform === 'website' ? link : `https://${platform}.com/${link.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                              >
                                {platform}: {link}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Favorite Collections */}
                    {profile.favoriteCollections.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">⭐ Favorite Collections</h4>
                        <div className="space-y-1">
                          {profile.favoriteCollections.map((address, index) => (
                            <div key={index} className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                              {address}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🏆 Leaderboard</h3>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 text-center font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{entry.username}</div>
                      <div className="text-sm text-gray-500">{entry.totalPoints} points</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-purple-600">{entry.referralPoints} ref</div>
                    <div className="text-blue-600">{entry.activityPoints} act</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔗 Referrals</h3>
            {profile && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Your Referral Code</h4>
                  <div className="flex items-center space-x-2">
                    <code className="px-3 py-1 bg-white border rounded font-mono">
                      {profile.referralCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(profile.referralCode)}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Share this code with friends to earn referral points!
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.totalReferrals}</div>
                    <div className="text-sm text-gray-600">Total Referrals</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.referralPoints}</div>
                    <div className="text-sm text-gray-600">Referral Points</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{profile.rank}</div>
                    <div className="text-sm text-gray-600">Leaderboard Rank</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileManager;
