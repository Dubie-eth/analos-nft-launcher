/**
 * SIMPLE PROFILE EDITOR
 * Mobile-first, simplified profile creation and editing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, XCircle, Loader2, Upload, Save, Sparkles } from 'lucide-react';

interface SimpleProfileEditorProps {
  onProfileSaved?: (profile: any) => void;
  onNFTCreated?: (nft: any) => void;
}

export default function SimpleProfileEditor({ onProfileSaved, onNFTCreated }: SimpleProfileEditorProps) {
  const { theme } = useTheme();
  const { publicKey } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: '',
    twitterHandle: '',
    website: '',
    discord: '',
    telegram: '',
    github: ''
  });

  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    valid: false,
    available: false,
    message: ''
  });

  const USERNAME_RULES = {
    minLength: 3,
    maxLength: 20
  };

  // Load existing profile
  useEffect(() => {
    if (publicKey) {
      loadProfile();
    }
  }, [publicKey]);

  const loadProfile = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`);
      if (response.ok) {
        const profile = await response.json();
        setFormData({
          username: profile.username || '',
          displayName: profile.displayName || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl || '',
          bannerUrl: profile.bannerUrl || '',
          twitterHandle: profile.twitterHandle || '',
          website: profile.website || '',
          discord: profile.discord || '',
          telegram: profile.telegram || '',
          github: profile.github || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (username: string) => {
    if (!username || username.length < USERNAME_RULES.minLength) {
      setUsernameValidation({
        checking: false,
        valid: false,
        available: false,
        message: username.length > 0 ? `Username must be at least ${USERNAME_RULES.minLength} characters` : ''
      });
      return;
    }

    setUsernameValidation(prev => ({ ...prev, checking: true }));

    try {
      const response = await fetch(`/api/blockchain-profiles/validate-username/${username}`);
      const result = await response.json();
      
      setUsernameValidation({
        checking: false,
        valid: result.valid,
        available: result.available,
        message: result.message
      });
    } catch (error) {
      setUsernameValidation({
        checking: false,
        valid: false,
        available: false,
        message: 'Error checking username availability'
      });
    }
  };

  const handleUsernameChange = (username: string) => {
    setFormData(prev => ({ ...prev, username }));
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (type === 'logo') {
          setFormData(prev => ({ ...prev, avatarUrl: data.url }));
        } else {
          setFormData(prev => ({ ...prev, bannerUrl: data.url }));
        }
        setSuccess(`${type === 'logo' ? 'Profile picture' : 'Banner'} uploaded successfully!`);
      } else {
        setError(data.error || `Failed to upload ${type}`);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Error uploading ${type}. Please try again.`);
    }
  };

  const handleSaveProfile = async () => {
    if (!publicKey) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wallet: publicKey.toString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile saved successfully!');
        onProfileSaved?.(data.profile);
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMintNFT = async () => {
    if (!publicKey) return;
    
    setMinting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile-nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
          bannerUrl: formData.bannerUrl,
          referralCode: formData.username,
          twitterHandle: formData.twitterHandle,
          twitterVerified: false,
          website: formData.website,
          discord: formData.discord,
          telegram: formData.telegram,
          github: formData.github,
          mintPrice: 4.20
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile NFT minted successfully!');
        onNFTCreated?.(data.nft);
      } else {
        setError(data.error || 'Failed to mint NFT');
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError('Error minting NFT. Please try again.');
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md mx-auto p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Create Your Profile
        </h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Set up your blockchain profile and mint your unique NFT
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-300 text-sm">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Username *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Choose a unique username"
              maxLength={USERNAME_RULES.maxLength}
            />
            {usernameValidation.checking && (
              <div className="absolute right-2 top-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            {!usernameValidation.checking && formData.username && (
              <div className="absolute right-2 top-2">
                {usernameValidation.valid && usernameValidation.available ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}
          </div>
          {formData.username && usernameValidation.message && (
            <p className={`mt-1 text-xs ${
              usernameValidation.valid && usernameValidation.available 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {usernameValidation.message}
            </p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Your display name"
          />
        </div>

        {/* Bio */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Tell us about yourself..."
            maxLength={200}
          />
        </div>

        {/* Profile Picture Upload */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Profile Picture
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'logo')}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {formData.avatarUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500">
                <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Banner Image
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'banner')}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {formData.bannerUrl && (
              <div className="w-16 h-8 rounded overflow-hidden border-2 border-blue-500">
                <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Social Links (Optional)
          </h3>
          
          {/* Twitter */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Twitter
            </label>
            <input
              type="text"
              value={formData.twitterHandle}
              onChange={(e) => setFormData(prev => ({ ...prev, twitterHandle: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="@username"
            />
          </div>

          {/* Website */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Discord */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Discord
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="username#1234"
            />
          </div>

          {/* Telegram */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Telegram
            </label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="@username"
            />
          </div>

          {/* GitHub */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              GitHub
            </label>
            <input
              type="text"
              value={formData.github}
              onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="username"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={saving || !formData.username || !usernameValidation.valid || !usernameValidation.available}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
              saving || !formData.username || !usernameValidation.valid || !usernameValidation.available
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </button>

          <button
            onClick={handleMintNFT}
            disabled={minting || !formData.username || !usernameValidation.valid || !usernameValidation.available}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
              minting || !formData.username || !usernameValidation.valid || !usernameValidation.available
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {minting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting NFT...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Mint Profile NFT (4.20 LOS)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
