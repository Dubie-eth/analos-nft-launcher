'use client';

import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import InlineSocialVerification from '@/components/InlineSocialVerification';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface UserProfile {
  walletAddress: string;
  username: string;
  bio: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
  };
  profilePicture?: string;
  bannerImage?: string;
}

const BetaSignupPage: React.FC = () => {
  const { theme } = useTheme();
  const { publicKey, connected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'connect' | 'profile' | 'socials' | 'verify' | 'complete'>('connect');
  const [lockedPage, setLockedPage] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // Check for locked page and custom message from URL params
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const lockedPageParam = urlParams.get('locked_page');
      const messageParam = urlParams.get('message');
      
      if (lockedPageParam) {
        setLockedPage(lockedPageParam);
      }
      if (messageParam) {
        setCustomMessage(messageParam);
      }
    }
  }, []);
  
  const [profile, setProfile] = useState<UserProfile>({
    walletAddress: '',
    username: '',
    bio: '',
    socials: {}
  });

  const [socials, setSocials] = useState({
    twitter: '',
    telegram: '',
    discord: '',
    website: '',
    github: ''
  });

  const [selectedSocial, setSelectedSocial] = useState<'twitter' | 'telegram' | 'discord' | 'website' | 'github'>('twitter');
  const [customSocial, setCustomSocial] = useState('');
  const [customSocialValue, setCustomSocialValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleConnectWallet = async () => {
    if (!connected) {
      await connect();
    } else {
      setProfile(prev => ({ ...prev, walletAddress: publicKey?.toString() || '' }));
      setStep('profile');
    }
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialUpdate = (platform: string, value: string) => {
    setSocials(prev => ({ ...prev, [platform]: value }));
    setProfile(prev => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value }
    }));
  };

  const handleFileUpload = (type: 'profile' | 'banner', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'profile') {
        setProfile(prev => ({ ...prev, profilePicture: result }));
      } else {
        setProfile(prev => ({ ...prev, bannerImage: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addCustomSocial = () => {
    if (customSocial && customSocialValue) {
      setProfile(prev => ({
        ...prev,
        socials: { ...prev.socials, [customSocial]: customSocialValue }
      }));
      setCustomSocial('');
      setCustomSocialValue('');
    }
  };

  const validateRequiredSocial = () => {
    const hasRequiredSocial = Object.values(profile.socials).some(value => value && value.trim() !== '');
    return hasRequiredSocial;
  };

  const submitApplication = async () => {
    if (!validateRequiredSocial()) {
      alert('Please provide at least one social media contact.');
      return;
    }

    if (!profile.username.trim()) {
      alert('Please enter a username.');
      return;
    }

    try {
      setLoading(true);
      
      // Submit to Supabase database
      const response = await fetch('/api/database/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: profile.walletAddress,
          username: profile.username,
          bio: profile.bio,
          socials: profile.socials,
          profilePicture: profile.profilePicture,
          bannerImage: profile.bannerImage,
          customMessage: customMessage,
          lockedPageRequested: lockedPage,
          accessLevel: 'beta_user'
        }),
      });

      if (response.ok) {
        setStep('complete');
      } else {
        const errorData = await response.json();
        alert(`Failed to submit application: ${errorData.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'telegram': return '📱';
      case 'discord': return '💬';
      case 'website': return '🌐';
      case 'github': return '🐙';
      default: return '🔗';
    }
  };

  const getSocialPlaceholder = (platform: string) => {
    switch (platform) {
      case 'twitter': return '@username';
      case 'telegram': return '@username';
      case 'discord': return 'username#1234';
      case 'website': return 'https://yourwebsite.com';
      case 'github': return 'username';
      default: return 'Enter value';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-white">
              🎨 Analos NFT Launchpad
            </Link>
            <div className="text-white">
              {lockedPage ? 'Page Locked - Beta Access Required' : 'Beta Access Application'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-1 sm:space-x-4 overflow-x-auto pb-2">
            {[
              { id: 'connect', label: 'Connect Wallet', icon: '🔗' },
              { id: 'profile', label: 'Profile Setup', icon: '👤' },
              { id: 'socials', label: 'Social Links', icon: '📱' },
              { id: 'verify', label: 'Verify Twitter', icon: '🐦' },
              { id: 'complete', label: 'Complete', icon: '✅' }
            ].map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center flex-shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                  step === stepItem.id 
                    ? 'border-purple-400 bg-purple-400 text-white' 
                    : 'border-gray-400 text-gray-400'
                }`}>
                  <span className="text-xs sm:text-sm">{stepItem.icon}</span>
                </div>
                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm whitespace-nowrap ${
                  step === stepItem.id ? 'text-white' : 'text-gray-400'
                }`}>
                  <span className="hidden sm:inline">{stepItem.label}</span>
                  <span className="sm:hidden">{stepItem.label.split(' ')[0]}</span>
                </span>
                {index < 4 && (
                  <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-4 ${
                    step === stepItem.id ? 'bg-purple-400' : 'bg-gray-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          
          {/* Step 1: Connect Wallet */}
          {step === 'connect' && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">
                {lockedPage ? '🔒 Page Access Required' : '🔗 Connect Your Analos Wallet'}
              </h1>
              {lockedPage ? (
                <div className="mb-8">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                    <p className="text-red-300">
                      ⚠️ The page <strong>{lockedPage}</strong> is currently locked and requires beta access.
                    </p>
                  </div>
                  {customMessage && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                      <p className="text-blue-300">
                        📝 <strong>Message from Admin:</strong> {customMessage}
                      </p>
                    </div>
                  )}
                  <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                    To access this page, please connect your Analos wallet and apply for beta access. 
                    We'll review your application and grant access if approved.
                  </p>
                </div>
              ) : (
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  To apply for beta access, please connect your Analos wallet. We'll use this address 
                  to verify your identity and grant access to platform features.
                </p>
              )}
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Make sure you're connected to the Analos network (https://rpc.analos.io)
                </p>
              </div>

              <button
                onClick={handleConnectWallet}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                {connected ? 'Continue to Profile Setup' : 'Connect Wallet'}
              </button>

              {connected && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-300">
                    ✅ Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {step === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-6">
                👤 Create Your Profile
              </h1>
              
              <div className="space-y-6">
                {/* Profile Picture and Banner */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      {profile.profilePicture ? (
                        <img 
                          src={profile.profilePicture} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Upload Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('profile', file);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Banner Image (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      {profile.bannerImage ? (
                        <img 
                          src={profile.bannerImage} 
                          alt="Banner" 
                          className="w-32 h-16 rounded-lg object-cover border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-32 h-16 rounded-lg bg-gray-600 flex items-center justify-center">
                          <span className="text-sm">🎨</span>
                        </div>
                      )}
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Upload Banner
                      </button>
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('banner', file);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => handleProfileUpdate('username', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your username"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className={`block font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Bio (Optional)
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Tell us about yourself..."
                    data-1p-ignore
                    data-lpignore="true"
                    autoComplete="off"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('connect')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('socials')}
                    disabled={!profile.username.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Continue to Socials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Social Links */}
          {step === 'socials' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-6">
                📱 Social Media Links
              </h1>
              <p className="text-gray-300 mb-8">
                Please provide at least one social media contact for verification. 
                This helps us build trust and community.
              </p>

              <div className="space-y-6">
                {/* Predefined Social Platforms */}
                <div className="grid md:grid-cols-2 gap-4">
                  {['twitter', 'telegram', 'discord', 'website', 'github'].map((platform) => (
                    <div key={platform}>
                      <label className="block text-white font-semibold mb-2">
                        {getSocialIcon(platform)} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </label>
                      <input
                        type="text"
                        value={socials[platform as keyof typeof socials]}
                        onChange={(e) => handleSocialUpdate(platform, e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={getSocialPlaceholder(platform)}
                      />
                    </div>
                  ))}
                </div>

                {/* Custom Social Platform */}
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-white font-semibold mb-4">Add Custom Social Platform</h3>
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={customSocial}
                      onChange={(e) => setCustomSocial(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Platform name (e.g., Instagram, LinkedIn)"
                    />
                    <input
                      type="text"
                      value={customSocialValue}
                      onChange={(e) => setCustomSocialValue(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Username or URL"
                    />
                    <button
                      onClick={addCustomSocial}
                      disabled={!customSocial || !customSocialValue}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Current Socials */}
                {Object.keys(profile.socials).length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Current Social Links</h3>
                    <div className="space-y-2">
                      {Object.entries(profile.socials).map(([platform, value]) => (
                        value && (
                          <div key={platform} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <span>{getSocialIcon(platform)}</span>
                              <span className="text-white capitalize">{platform}</span>
                              <span className="text-gray-300">{value}</span>
                            </div>
                            <button
                              onClick={() => handleSocialUpdate(platform, '')}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('profile')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('verify')}
                    disabled={!validateRequiredSocial()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Next: Verify Twitter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Twitter Verification */}
          {step === 'verify' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-6">
                🐦 Verify Your Twitter Account
              </h1>
              <p className="text-gray-300 mb-8">
                Verify your Twitter account to earn 100 points and unlock exclusive features!
                This is optional but highly recommended.
              </p>

              <InlineSocialVerification
                walletAddress={publicKey?.toString() || ''}
                referralCode={profile.username || publicKey?.toString().slice(0, 8).toUpperCase()}
                entityType="user"
                entityId={publicKey?.toString()}
                onVerificationComplete={(success, data) => {
                  if (success) {
                    console.log('✅ Twitter verification successful:', data);
                  }
                }}
              />

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep('socials')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('complete')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Skip / Continue to Review
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-6">
                📋 Review Your Application
              </h1>

              <div className="bg-gray-800/30 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-white font-semibold mb-4">Application Summary</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-300">Wallet Address:</span>
                    <p className="text-white font-mono text-sm break-all">
                      {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-gray-300">Username:</span>
                    <p className="text-white">{profile.username}</p>
                  </div>
                  
                  {profile.bio && (
                    <div>
                      <span className="text-gray-300">Bio:</span>
                      <p className="text-white">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-300">Social Links:</span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(profile.socials).map(([platform, value]) => (
                        value && (
                          <div key={platform} className="flex items-center space-x-2">
                            <span>{getSocialIcon(platform)}</span>
                            <span className="text-white capitalize">{platform}:</span>
                            <span className="text-gray-300">{value}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
                <p className="text-blue-300 text-sm">
                  📝 Your application will be reviewed by our team. You'll receive a notification 
                  once your access is approved. This usually takes 24-48 hours.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setStep('socials')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  onClick={submitApplication}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Need help? Contact us at{' '}
            <a href="mailto:support@launchonlos.fun" className="text-purple-400 hover:text-purple-300">
              support@launchonlos.fun
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BetaSignupPage;
