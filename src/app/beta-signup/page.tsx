'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { CheckCircle, Wallet, ArrowRight, User, Star, Users, BarChart3, Coins } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const BetaSignupPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [hasExistingProfile, setHasExistingProfile] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      checkExistingProfile();
    }
  }, [connected, publicKey]);

  const checkExistingProfile = async () => {
    if (!publicKey) return;
    
    try {
      const response = await fetch(`/api/user-profile/check?walletAddress=${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasProfile) {
          setHasExistingProfile(true);
          setIsRedirecting(true);
          // Redirect to profile page after a short delay
          setTimeout(() => {
            router.push('/profile');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
    }
  };

  const handleGoToProfile = () => {
    setIsRedirecting(true);
    router.push('/profile');
  };

  // Show redirect message for existing users
  if (hasExistingProfile && isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Welcome Back! 🎉</h1>
            <p className="text-gray-300 mb-6">
              You already have a profile! Redirecting you to your profile page...
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            <p className="text-sm text-gray-400">Redirecting in 2 seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6">Join Analos Beta Program</h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto">
            Connect your wallet and create your profile to participate in our beta program and vote on features!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Connect Wallet */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Step 1: Connect Your Wallet</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Connect your Analos wallet to get started with our beta program.
              </p>
              
              {!connected ? (
                <WalletMultiButton 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                />
              ) : (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-green-300 font-semibold text-lg">Wallet Connected!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Create Profile */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center">
              <User className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Step 2: Create Your Profile</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Set up your profile to participate in feature voting and access all platform features.
              </p>
              
              {connected ? (
                <button
                  onClick={handleGoToProfile}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center mx-auto"
                >
                  Go to Profile Setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-6">
                  <p className="text-gray-400">Please connect your wallet first</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Connect Wallet</h3>
              <p className="text-gray-300">
                Connect your Analos wallet to access the platform and participate in beta features.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Create Profile</h3>
              <p className="text-gray-300">
                Set up your profile with username, bio, and social links to personalize your experience.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Vote on Features</h3>
              <p className="text-gray-300">
                Use your LOL token holdings to vote on which features you want to see developed next.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Beta Program Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Star className="w-6 h-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Early Access</h3>
                  <p className="text-gray-300">Get early access to new features and platform updates before public release.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Coins className="w-6 h-6 text-green-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Weighted Voting</h3>
                  <p className="text-gray-300">Your voting power is based on your LOL token holdings - more tokens = more influence.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Users className="w-6 h-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Community Influence</h3>
                  <p className="text-gray-300">Help shape the future of the platform by voting on features that matter to you.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <BarChart3 className="w-6 h-6 text-purple-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Feature Tracking</h3>
                  <p className="text-gray-300">Track the progress of features you voted for and see development updates.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <User className="w-6 h-6 text-pink-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Profile NFTs</h3>
                  <p className="text-gray-300">Mint unique profile NFTs to represent yourself on the platform.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Star className="w-6 h-6 text-orange-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Exclusive Rewards</h3>
                  <p className="text-gray-300">Earn rewards and special privileges for participating in the beta program.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaSignupPage;