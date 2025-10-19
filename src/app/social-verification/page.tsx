/**
 * SOCIAL VERIFICATION PAGE
 * Dedicated page for social verification process
 */

'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Twitter, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';

export default function SocialVerificationPage() {
  const { publicKey, connected } = useWallet();
  const { theme } = useTheme();
  
  const [step, setStep] = useState<'info' | 'tweet' | 'verify' | 'success'>('info');
  const [tweetUrl, setTweetUrl] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate referral code based on wallet address
  const generateReferralCode = () => {
    if (!publicKey) return 'ANALOS';
    const address = publicKey.toString();
    return address.slice(0, 8).toUpperCase();
  };

  const handleTweetSubmit = async () => {
    if (!publicKey || !tweetUrl) {
      setError('Please connect your wallet and provide a tweet URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/social-verification/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          tweetUrl,
          referralCode: referralCode || generateReferralCode()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setStep('success');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode || generateReferralCode());
  };

  if (!connected) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-16">
          <div className={`max-w-md mx-auto p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Connect Your Wallet
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Please connect your wallet to proceed with social verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-16">
        <div className={`max-w-2xl mx-auto p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <Twitter className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Twitter Verification
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Verify your Twitter account to unlock enhanced profile features
            </p>
          </div>

          {/* Step 1: Information */}
          {step === 'info' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
                  How Twitter Verification Works
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Create a Tweet
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Post a tweet mentioning your referral code: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{referralCode || generateReferralCode()}</code>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Submit Tweet URL
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Copy the tweet URL and paste it below for verification
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Get Verified
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Our system will verify your tweet and update your profile
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Code */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your Referral Code (include this in your tweet)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralCode || generateReferralCode()}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-600 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    readOnly
                  />
                  <button
                    onClick={copyReferralCode}
                    className={`px-3 py-2 rounded border ${
                      theme === 'dark'
                        ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep('tweet')}
                className={`w-full py-3 px-6 rounded-lg font-semibold ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Continue to Tweet Submission
              </button>
            </div>
          )}

          {/* Step 2: Tweet Submission */}
          {step === 'tweet' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>
                  Submit Your Tweet
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                  Make sure your tweet includes your referral code: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{referralCode || generateReferralCode()}</code>
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tweet URL
                </label>
                <input
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://twitter.com/username/status/1234567890"
                  className={`w-full px-3 py-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold ${
                    theme === 'dark'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleTweetSubmit}
                  disabled={loading || !tweetUrl}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold ${
                    loading || !tweetUrl
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {loading ? 'Verifying...' : 'Submit Verification'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Verification Submitted!
              </h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Your Twitter verification has been submitted. It will be reviewed and processed shortly.
              </p>
              <button
                onClick={() => window.close()}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  theme === 'dark'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
