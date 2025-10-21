/**
 * SIMPLE PROFILE EDITOR
 * Clean, streamlined profile creation with single "Mint Profile NFT" button
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2, CheckCircle, XCircle, Upload, Image, User, Globe, MessageCircle, Send, Github, Zap } from 'lucide-react';
import ProfileCardPreview from './ProfileCardPreview';

interface SimpleProfileEditorProps {
  onProfileSaved?: (profile: any) => void;
  onNFTCreated?: (nft: any) => void;
}

export default function SimpleProfileEditor({ 
  onProfileSaved, 
  onNFTCreated 
}: SimpleProfileEditorProps) {
  const { publicKey, connected } = useWallet();
  const { theme } = useTheme();
  
  // Form state
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
    github: '',
    isAnonymous: false
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mintNumber, setMintNumber] = useState<number | null>(null);

  // Load existing profile data and mint number on component mount
  useEffect(() => {
    if (connected && publicKey) {
      getMintNumber();
      loadExistingProfile();
    }
  }, [connected, publicKey]);

  // Load existing profile data
  const loadExistingProfile = async () => {
    if (!publicKey) return;
    
    try {
      console.log('🔄 Loading existing profile for wallet:', publicKey.toString());
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`);
      
      if (response.ok) {
        const profileData = await response.json();
        console.log('📋 Loaded profile data:', profileData);
        
        if (profileData && profileData.username) {
          setFormData({
            username: profileData.username || '',
            displayName: profileData.display_name || '',
            bio: profileData.bio || '',
            avatarUrl: profileData.avatar_url || '',
            bannerUrl: profileData.banner_url || '',
            twitterHandle: profileData.twitter_handle || '',
            website: profileData.website || '',
            discord: profileData.discord || '',
            telegram: profileData.telegram || '',
            github: profileData.github || '',
            isAnonymous: profileData.is_anonymous || false
          });
          console.log('✅ Profile data loaded into form');
        }
      } else {
        console.log('ℹ️ No existing profile found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading existing profile:', error);
    }
  };

  const getMintNumber = async () => {
    try {
      const response = await fetch('/api/profile-nft/mint-counter');
      if (response.ok) {
        const data = await response.json();
        setMintNumber(data.nextMintNumber);
      }
    } catch (error) {
      console.error('Error getting mint number:', error);
    }
  };

  // Check if username is available
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username.trim()) return false;
    
    try {
      // Check in user_profiles table
      const profileResponse = await fetch(`/api/blockchain-profiles/${username}`);
      if (profileResponse.ok) {
        return false; // Username exists
      }
      
      // Check in profile_nfts table
      const nftResponse = await fetch(`/api/profile-nft/check/${username}`);
      if (nftResponse.ok) {
        return false; // Username exists as NFT
      }
      
      return true; // Username is available
    } catch (error) {
      console.error('Error checking username availability:', error);
      return true; // Allow if check fails
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type === 'avatar' ? 'logo' : 'banner');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (type === 'avatar') {
          setFormData(prev => ({ ...prev, avatarUrl: data.url }));
        } else {
          setFormData(prev => ({ ...prev, bannerUrl: data.url }));
        }
        setSuccess(`${type === 'avatar' ? 'Profile picture' : 'Banner'} uploaded successfully!`);
      } else {
        setError(data.error || `Failed to upload ${type}`);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setError(`Error uploading ${type}. Please try again.`);
    }
  };

  const generateReferralCode = (username: string) => {
    return username.toUpperCase();
  };

  const mintProfileNFT = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet to mint your profile NFT');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    // Check if username is available
    const isUsernameAvailable = await checkUsernameAvailability(formData.username);
    if (!isUsernameAvailable) {
      setError(`Username "${formData.username}" is already taken. Please choose a different username.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🚀 Starting profile NFT minting...');
      console.log('👤 Wallet:', publicKey.toString());
      console.log('📝 Form data:', formData);
      
      // First, save the profile to blockchain
      const profileResponse = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName || formData.username,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
          bannerUrl: formData.bannerUrl,
          twitterHandle: formData.twitterHandle,
          website: formData.website,
          discord: formData.discord,
          telegram: formData.telegram,
          github: formData.github,
          isAnonymous: formData.isAnonymous
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      console.log('✅ Profile saved successfully');

      // Then, mint the NFT
      const nftResponse = await fetch('/api/profile-nft/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          username: formData.username,
          displayName: formData.displayName || formData.username,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
          bannerUrl: formData.bannerUrl,
          referralCode: generateReferralCode(formData.username),
          twitterHandle: formData.twitterHandle,
          twitterVerified: false,
          website: formData.website,
          discord: formData.discord,
          telegram: formData.telegram,
          github: formData.github,
          mintPrice: 4.20,
          mintNumber: mintNumber
        })
      });

      const nftData = await nftResponse.json();

      if (nftResponse.ok && nftData.success) {
        console.log('✅ NFT minted successfully');
        console.log('📋 NFT Data:', nftData);
        
        setSuccess('Profile NFT minted successfully! 🎉');
        setShowPreview(true);
        
        // Reload profile data to show the saved information
        await loadExistingProfile();
        
        if (onProfileSaved) {
          onProfileSaved(formData);
        }
        
        if (onNFTCreated) {
          onNFTCreated(nftData);
        }
      } else {
        throw new Error(nftData.error || 'Failed to mint NFT');
      }
    } catch (error) {
      console.error('Error minting profile NFT:', error);
      setError(error instanceof Error ? error.message : 'Failed to mint profile NFT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.username.trim().length > 0;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Create Your Profile
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Set up your blockchain profile and mint your unique NFT
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h3>
            
            {/* Username */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your username"
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Display Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter your display name"
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Bio */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
              />
              <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Profile Images
            </h3>
            
            {/* Profile Picture */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Profile Picture
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'avatar')}
                  className={`w-full sm:flex-1 min-w-0 max-w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {formData.avatarUrl && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500">
                    <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Banner Image
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  className={`w-full sm:flex-1 min-w-0 max-w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {formData.bannerUrl && (
                  <div className="w-24 h-12 rounded overflow-hidden border-2 border-blue-500">
                    <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Social Links (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Twitter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Twitter
                </label>
                <input
                  type="text"
                  value={formData.twitterHandle}
                  onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
                  placeholder="@username"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Website */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* Discord */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Discord
                </label>
                <input
                  type="text"
                  value={formData.discord}
                  onChange={(e) => handleInputChange('discord', e.target.value)}
                  placeholder="username#1234"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {/* GitHub */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  GitHub
                </label>
                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  placeholder="username"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Privacy Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAnonymous" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Keep profile anonymous (hide social links from public view)
            </label>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Mint Button */}
          <div className="pt-6">
            <button
              onClick={mintProfileNFT}
              disabled={loading || !connected || !isFormValid}
              className={`w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                loading || !connected || !isFormValid
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Minting Profile NFT...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 inline mr-2" />
                  Mint Profile NFT (4.20 LOS)
                </>
              )}
            </button>
            
            {!connected && (
              <p className={`mt-3 text-sm text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Please connect your wallet to mint your profile NFT
              </p>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Profile Card Preview
          </h3>
          
          <div className="flex justify-center">
            <ProfileCardPreview
              username={formData.username || 'username'}
              displayName={formData.displayName || formData.username || 'Display Name'}
              bio={formData.bio}
              referralCode={generateReferralCode(formData.username || 'username')}
              profilePictureUrl={formData.avatarUrl}
              bannerImageUrl={formData.bannerUrl}
              mintNumber={mintNumber}
              variant="standard"
            />
          </div>

          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
              <strong>🏆 Master Open Edition Collection:</strong><br/>
              Your profile NFT will be part of the official "Analos Profile Cards" master open edition collection. 
              Each NFT includes your personalized referral code and becomes part of the Analos NFT Launchpad ecosystem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}