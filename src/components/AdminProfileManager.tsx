'use client';

import React, { useState, useEffect } from 'react';
import { User, Search, Edit3, Save, X, Trash2, Users, Mail, Globe, Github, MessageCircle, Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  walletAddress: string;
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
  createdAt: string;
  updatedAt: string;
}

const AdminProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load all profiles
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/profiles');
      const data = await response.json();
      
      if (data.success) {
        setProfiles(data.profiles || []);
      } else {
        setError('Failed to load profiles');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profile: UserProfile) => {
    setEditingProfile({ ...profile });
    setSelectedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/profiles/${editingProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProfile)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile updated successfully!');
        setEditingProfile(null);
        setSelectedProfile(null);
        loadProfiles(); // Reload profiles
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile deleted successfully!');
        setSelectedProfile(null);
        setEditingProfile(null);
        loadProfiles(); // Reload profiles
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!editingProfile) return;

    if (field.startsWith('socials.')) {
      const socialField = field.split('.')[1];
      setEditingProfile({
        ...editingProfile,
        socials: {
          ...editingProfile.socials,
          [socialField]: value
        }
      });
    } else {
      setEditingProfile({
        ...editingProfile,
        [field]: value
      });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.email && profile.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-white">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3" />
          Admin Profile Management
        </h2>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search profiles by username, wallet, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Profiles List */}
        <div className="grid gap-4">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{profile.username}</h3>
                    <p className="text-gray-300 text-sm">{profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}</p>
                    {profile.email && (
                      <p className="text-gray-400 text-xs flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {profile.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.privacyLevel === 'public' 
                      ? 'bg-green-500/20 text-green-300' 
                      : profile.privacyLevel === 'private'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {profile.privacyLevel}
                  </span>
                  <button
                    onClick={() => handleEditProfile(profile)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No profiles found</p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => {
                    setEditingProfile(null);
                    setSelectedProfile(null);
                  }}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={editingProfile.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={editingProfile.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-white font-medium mb-2">Bio</label>
                    <textarea
                      value={editingProfile.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none h-24 resize-none"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Social Links</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={editingProfile.socials.twitter || ''}
                        onChange={(e) => handleInputChange('socials.twitter', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Telegram
                      </label>
                      <input
                        type="text"
                        value={editingProfile.socials.telegram || ''}
                        onChange={(e) => handleInputChange('socials.telegram', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </label>
                      <input
                        type="url"
                        value={editingProfile.socials.website || ''}
                        onChange={(e) => handleInputChange('socials.website', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </label>
                      <input
                        type="text"
                        value={editingProfile.socials.github || ''}
                        onChange={(e) => handleInputChange('socials.github', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Privacy Settings</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Privacy Level</label>
                      <select
                        value={editingProfile.privacyLevel}
                        onChange={(e) => handleInputChange('privacyLevel', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={editingProfile.allowDataExport}
                          onChange={(e) => handleInputChange('allowDataExport', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white">Allow data export</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={editingProfile.allowAnalytics}
                          onChange={(e) => handleInputChange('allowAnalytics', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                        />
                        <span className="text-white">Allow analytics</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-6 border-t border-white/20">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(editingProfile.id)}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-300">{success}</p>
        </div>
      )}
    </div>
  );
};

export default AdminProfileManager;
