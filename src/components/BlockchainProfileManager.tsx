'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { BlockchainProfile, BlockchainProfileService, USERNAME_RULES } from '@/lib/blockchain-profile-service';
import { Loader2, CheckCircle, XCircle, AlertCircle, Twitter, Globe, MessageCircle, Send, Github } from 'lucide-react';

interface BlockchainProfileManagerProps {
  onProfileUpdate?: (profile: BlockchainProfile) => void;
  onSocialVerification?: () => void;
}

export default function BlockchainProfileManager({ 
  onProfileUpdate, 
  onSocialVerification 
}: BlockchainProfileManagerProps) {
  const { publicKey, connected, signTransaction } = useWallet();
  const { theme } = useTheme();
  
  // Profile state
  const [profile, setProfile] = useState<BlockchainProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Validation state
  const [usernameValidation, setUsernameValidation] = useState<{
    checking: boolean;
    valid: boolean;
    available: boolean;
    message: string;
  }>({
    checking: false,
    valid: false,
    available: false,
    message: ''
  });

  // Social verification state
  const [socialVerification, setSocialVerification] = useState<{
    twitterVerified: boolean;
    verificationInProgress: boolean;
  }>({
    twitterVerified: false,
    verificationInProgress: false
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');

  // Load existing profile and check social verification
  useEffect(() => {
    if (connected && publicKey) {
      loadProfile();
      checkExistingSocialVerification();
    }
  }, [connected, publicKey]);

  const checkExistingSocialVerification = async () => {
    if (!publicKey) return;
    
    try {
      const verificationResponse = await fetch(`/api/social-verification/oracle?walletAddress=${publicKey.toString()}&platform=twitter`);
      
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        if (verificationData.success && verificationData.verification) {
          setSocialVerification(prev => ({ ...prev, twitterVerified: true }));
          setFormData(prev => ({ 
            ...prev, 
            twitterHandle: verificationData.verification.username 
          }));
        }
      }
    } catch (error) {
      console.error('Error checking existing social verification:', error);
    }
  };

  const loadProfile = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`);
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          username: profileData.username || '',
          displayName: profileData.displayName || '',
          bio: profileData.bio || '',
          avatarUrl: profileData.avatarUrl || '',
          bannerUrl: profileData.bannerUrl || '',
          twitterHandle: profileData.twitterHandle || '',
          website: profileData.website || '',
          discord: profileData.discord || '',
          telegram: profileData.telegram || '',
          github: profileData.github || '',
          isAnonymous: profileData.isAnonymous || false
        });
        setSocialVerification({
          twitterVerified: profileData.twitterVerified || false,
          verificationInProgress: false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (username: string) => {
    if (!username) {
      setUsernameValidation({
        checking: false,
        valid: false,
        available: false,
        message: ''
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

  const handleSocialVerification = async () => {
    if (!publicKey) return;

    if (!formData.twitterHandle) {
      setError('Please enter your Twitter handle first');
      return;
    }

    setSocialVerification(prev => ({ ...prev, verificationInProgress: true }));
    
    try {
      // First check if user already has a verified Twitter account in the database
      const verificationResponse = await fetch(`/api/social-verification/twitter?walletAddress=${publicKey.toString()}`);
      
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        if (verificationData.verifications && verificationData.verifications.length > 0) {
          const verifiedTwitter = verificationData.verifications.find((v: any) => v.verification_status === 'verified');
          if (verifiedTwitter) {
            // User already has verified Twitter, update profile
            setSocialVerification(prev => ({ ...prev, twitterVerified: true }));
            setFormData(prev => ({ 
              ...prev, 
              twitterHandle: verifiedTwitter.twitter_username || verifiedTwitter.username 
            }));
            
            // Update blockchain profile with verified Twitter handle
            await updateBlockchainProfileWithVerification(verifiedTwitter);
            setSuccess('Twitter already verified!');
            return;
          }
        }
      }
      
      // If no existing verification, try the oracle endpoint
      const oracleResponse = await fetch(`/api/social-verification/oracle?walletAddress=${publicKey.toString()}&platform=twitter`);
      
      if (oracleResponse.ok) {
        const oracleData = await oracleResponse.json();
        if (oracleData.success && oracleData.verification) {
          // User has verified Twitter on blockchain, update profile
          setSocialVerification(prev => ({ ...prev, twitterVerified: true }));
          setFormData(prev => ({ 
            ...prev, 
            twitterHandle: oracleData.verification.username 
          }));
          
          // Update blockchain profile with verified Twitter handle
          await updateBlockchainProfileWithVerification(oracleData.verification);
          setSuccess('Twitter verified from blockchain!');
          return;
        }
      }
      
      // If no existing verification, show inline verification modal
      setError('No existing verification found. Please share a tweet with your referral code to verify your Twitter account.');
      setShowVerificationModal(true);
      
    } catch (error) {
      console.error('Error checking social verification:', error);
      setError('Error checking verification status. Please try again.');
    } finally {
      setSocialVerification(prev => ({ ...prev, verificationInProgress: false }));
    }
  };

  const handleModalVerification = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter your tweet URL');
      return;
    }

    const referralCode = formData.username || 'ANALOS';
    await verifyTweetWithUrl(tweetUrl, referralCode);
    setShowVerificationModal(false);
    setTweetUrl('');
  };

  const verifyTweetWithUrl = async (tweetUrl: string, referralCode: string) => {
    try {
      const response = await fetch('/api/social-verification/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey?.toString(),
          tweetUrl: tweetUrl,
          referralCode: referralCode
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSocialVerification(prev => ({ ...prev, twitterVerified: true }));
        setSuccess('Twitter verification successful! You earned 100 points.');
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying tweet:', error);
      setError('Error verifying tweet. Please try again.');
    }
  };

  const updateBlockchainProfileWithVerification = async (verification: any) => {
    if (!publicKey) return;
    
    try {
      // Update the blockchain profile with verified Twitter handle
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          twitterHandle: verification.username,
          twitterVerified: true,
          wallet: publicKey.toString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.profile);
        if (onProfileUpdate) {
          onProfileUpdate(result.profile);
        }
      }
    } catch (error) {
      console.error('Error updating blockchain profile with verification:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet to save your profile');
      return;
    }

    if (!usernameValidation.valid || !usernameValidation.available) {
      setError('Please fix username validation errors before saving');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wallet: publicKey.toString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Profile saved successfully on the Analos blockchain!');
        setProfile(result.profile);
        if (onProfileUpdate) {
          onProfileUpdate(result.profile);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🔗 Blockchain Profile
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Create your unique profile on the Analos blockchain. Your username will be globally unique across the entire platform.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-300">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h3>

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
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Choose a unique username"
                maxLength={USERNAME_RULES.maxLength}
              />
              {usernameValidation.checking && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              )}
              {!usernameValidation.checking && formData.username && (
                <div className="absolute right-3 top-3">
                  {usernameValidation.valid && usernameValidation.available ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {formData.username && usernameValidation.message && (
              <p className={`mt-2 text-sm ${
                usernameValidation.valid && usernameValidation.available 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {usernameValidation.message}
              </p>
            )}
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {USERNAME_RULES.minLength}-{USERNAME_RULES.maxLength} characters, letters, numbers, underscores, and hyphens only
            </p>
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
              className={`w-full px-4 py-3 rounded-lg border ${
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
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Anonymous Mode */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="mr-3"
            />
            <label htmlFor="isAnonymous" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Keep profile anonymous (hide social links from public view)
            </label>
          </div>
        </div>

        {/* Social Links & Verification */}
        <div className="space-y-6">
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Social Links & Verification
          </h3>

          {/* Twitter */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Twitter className="w-4 h-4 inline mr-2" />
              Twitter Handle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.twitterHandle}
                onChange={(e) => setFormData(prev => ({ ...prev, twitterHandle: e.target.value }))}
                className={`flex-1 px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="@username"
              />
              <button
                onClick={handleSocialVerification}
                disabled={!formData.twitterHandle || socialVerification.verificationInProgress}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  socialVerification.twitterVerified
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {socialVerification.verificationInProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : socialVerification.twitterVerified ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>
            {socialVerification.twitterVerified && (
              <p className="mt-2 text-sm text-green-500">
                ✅ Twitter account verified
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Globe className="w-4 h-4 inline mr-2" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Discord */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Discord
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="username#1234"
            />
          </div>

          {/* Telegram */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Send className="w-4 h-4 inline mr-2" />
              Telegram
            </label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="@username"
            />
          </div>

          {/* GitHub */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Github className="w-4 h-4 inline mr-2" />
              GitHub
            </label>
            <input
              type="text"
              value={formData.github}
              onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="username"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={saving || !usernameValidation.valid || !usernameValidation.available}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            saving || !usernameValidation.valid || !usernameValidation.available
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Saving to Blockchain...
            </>
          ) : (
            '💾 Save Profile to Blockchain'
          )}
        </button>
      </div>

      {/* Blockchain Info */}
      <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start">
          <AlertCircle className={`w-5 h-5 mr-3 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h4 className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
              🔗 Stored on Analos Blockchain
            </h4>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
              Your profile data is stored permanently on the Analos blockchain. Usernames are globally unique and cannot be changed once set. 
              Social verification status is also stored on-chain for maximum security.
            </p>
          </div>
        </div>
      </div>

      {/* Twitter Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 ${theme === 'dark' ? 'border border-gray-700' : 'border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <Twitter className="w-5 h-5 inline mr-2 text-blue-500" />
                Verify Twitter Account
              </h3>
              <button
                onClick={() => setShowVerificationModal(false)}
                className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Share this text on Twitter, then paste your tweet URL below:
              </p>
              
              <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                <div className={`text-sm font-mono whitespace-pre-line ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  {`🚀 Join me on Analos NFT Launcher! 

Use my referral code: ${formData.username || 'ANALOS'}

Create your unique NFT collection and launch it on the Analos blockchain! 🎨✨

#Analos #NFT #Blockchain #Web3 #$LOL 🚀`}
                </div>
                <button
                  onClick={() => {
                    const text = `🚀 Join me on Analos NFT Launcher! 

Use my referral code: ${formData.username || 'ANALOS'}

Create your unique NFT collection and launch it on the Analos blockchain! 🎨✨

#Analos #NFT #Blockchain #Web3 #$LOL 🚀`;
                    navigator.clipboard.writeText(text);
                    alert('Tweet text copied to clipboard!');
                  }}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-600 underline"
                >
                  📋 Copy to clipboard
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Tweet URL
              </label>
              <input
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://twitter.com/username/status/..."
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVerificationModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleModalVerification}
                disabled={!tweetUrl.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !tweetUrl.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Verify Tweet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
