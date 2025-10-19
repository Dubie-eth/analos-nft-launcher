/**
 * BLOCKCHAIN PROFILE INTEGRATION
 * Comprehensive component showing the integration between blockchain profiles and social verification
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { BlockchainProfile } from '@/lib/blockchain-profile-service';
import { CheckCircle, XCircle, AlertCircle, Twitter, Link as LinkIcon, Shield, Zap } from 'lucide-react';

interface BlockchainProfileIntegrationProps {
  onProfileUpdate?: (profile: BlockchainProfile) => void;
  onSocialVerification?: () => void;
}

interface SocialVerificationStatus {
  twitterVerified: boolean;
  verificationInProgress: boolean;
  verificationData?: any;
}

export default function BlockchainProfileIntegration({ 
  onProfileUpdate, 
  onSocialVerification 
}: BlockchainProfileIntegrationProps) {
  const { publicKey, connected } = useWallet();
  const { theme } = useTheme();
  
  const [profile, setProfile] = useState<BlockchainProfile | null>(null);
  const [socialVerification, setSocialVerification] = useState<SocialVerificationStatus>({
    twitterVerified: false,
    verificationInProgress: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blockchain profile and social verification status
  useEffect(() => {
    if (connected && publicKey) {
      loadBlockchainData();
    }
  }, [connected, publicKey]);

  const loadBlockchainData = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load blockchain profile
      const profileResponse = await fetch(`/api/blockchain-profiles/${publicKey.toString()}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Load social verification status
      const verificationResponse = await fetch(`/api/social-verification/oracle?walletAddress=${publicKey.toString()}&platform=twitter`);
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        if (verificationData.success && verificationData.verification) {
          setSocialVerification(prev => ({
            ...prev,
            twitterVerified: true,
            verificationData: verificationData.verification
          }));
        }
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error);
      setError('Failed to load blockchain profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialVerification = async () => {
    if (!publicKey) return;

    setSocialVerification(prev => ({ ...prev, verificationInProgress: true }));
    
    try {
      if (onSocialVerification) {
        onSocialVerification();
      } else {
        window.open('/social-verification', '_blank');
      }
    } catch (error) {
      console.error('Error initiating social verification:', error);
    } finally {
      setSocialVerification(prev => ({ ...prev, verificationInProgress: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className={`ml-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Loading blockchain profile...
        </span>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🔗 Blockchain Profile Integration
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Your profile data is stored on the Analos blockchain with integrated social verification.
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

      {/* Profile Status */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Blockchain Profile Status */}
        <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <Shield className={`w-6 h-6 mr-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Blockchain Profile
            </h3>
          </div>
          
          {profile && profile.username ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Profile exists on Analos blockchain
                </span>
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Username:</strong> {profile.username}
              </div>
              {profile.displayName && (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Display Name:</strong> {profile.displayName}
                </div>
              )}
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Created:</strong> {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                No blockchain profile found
              </span>
            </div>
          )}
        </div>

        {/* Social Verification Status */}
        <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center mb-4">
            <Twitter className={`w-6 h-6 mr-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Social Verification
            </h3>
          </div>
          
          {socialVerification.twitterVerified ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Twitter account verified
                </span>
              </div>
              {socialVerification.verificationData && (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>Handle:</strong> @{socialVerification.verificationData.username}
                </div>
              )}
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Verified on:</strong> Analos blockchain
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Twitter not verified
                </span>
              </div>
              <button
                onClick={handleSocialVerification}
                disabled={socialVerification.verificationInProgress}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  socialVerification.verificationInProgress
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {socialVerification.verificationInProgress ? 'Verifying...' : 'Verify Twitter'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Integration Benefits */}
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-start">
          <Zap className={`w-6 h-6 mr-3 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
              🚀 Blockchain Integration Benefits
            </h4>
            <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
              <li className="flex items-start">
                <span className="mr-2">🔒</span>
                <span>Your profile data is stored permanently on the Analos blockchain</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌍</span>
                <span>Username is globally unique across the entire platform</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Social verification status is stored on-chain for maximum security</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔗</span>
                <span>Profile and verification data are linked and synchronized</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚡</span>
                <span>Fast and secure access to your verified identity</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => window.open('/profile', '_blank')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          Manage Full Profile
        </button>
        
        {!socialVerification.twitterVerified && (
          <button
            onClick={handleSocialVerification}
            disabled={socialVerification.verificationInProgress}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              socialVerification.verificationInProgress
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Twitter className="w-4 h-4 inline mr-2" />
            {socialVerification.verificationInProgress ? 'Verifying...' : 'Verify Twitter'}
          </button>
        )}
      </div>
    </div>
  );
}
