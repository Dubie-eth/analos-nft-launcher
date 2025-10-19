'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Twitter, CheckCircle, XCircle, ExternalLink, Copy } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  verification?: any;
  rewards?: {
    points: number;
    message: string;
  };
  details?: any;
}

export default function SocialVerificationForm() {
  const { publicKey, connected } = useWallet();
  const [tweetUrl, setTweetUrl] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [existingVerifications, setExistingVerifications] = useState<any[]>([]);

  // Generate a sample referral code for the user
  const generateReferralCode = () => {
    if (publicKey) {
      const code = publicKey.toString().slice(0, 8).toUpperCase();
      setReferralCode(code);
    }
  };

  const handleVerify = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!tweetUrl || !referralCode) {
      alert('Please provide both tweet URL and referral code');
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch('/api/social-verification/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          tweetUrl: tweetUrl,
          referralCode: referralCode
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Refresh verifications list
        await loadExistingVerifications();
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        message: 'Failed to verify tweet. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const loadExistingVerifications = async () => {
    if (!connected || !publicKey) return;

    try {
      const response = await fetch(`/api/social-verification/twitter?walletAddress=${publicKey.toString()}`);
      const data = await response.json();
      setExistingVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
  };

  const openTweet = (tweetId: string) => {
    window.open(`https://twitter.com/i/web/status/${tweetId}`, '_blank');
  };

  React.useEffect(() => {
    if (connected && publicKey) {
      generateReferralCode();
      loadExistingVerifications();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div className="text-center">
          <Twitter className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Connect Wallet to Verify</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to access social verification features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Verification Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Twitter className="w-8 h-8 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold">Twitter Social Verification</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Tweet your referral code and get verified to earn rewards!
            </p>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Your Referral Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Generate your referral code"
            />
            <button
              onClick={copyReferralCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Share this code in your tweet to get verified
          </p>
        </div>

        {/* Tweet Instructions */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            📝 How to Tweet for Verification:
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Go to Twitter/X and create a new tweet</li>
            <li>2. Include your referral code: <strong>{referralCode}</strong></li>
            <li>3. Mention @onlyanal.fun or use #AnalosNFT hashtag</li>
            <li>4. Copy the tweet URL and paste it below</li>
            <li>5. Click "Verify Tweet" to get your rewards!</li>
          </ol>
          
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
            <p className="text-sm font-medium mb-1">Example Tweet:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              "Just joined @onlyanal.fun! My referral code: {referralCode} #AnalosNFT #NFTLaunchpad 🚀"
            </p>
          </div>
        </div>

        {/* Tweet URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Tweet URL
          </label>
          <input
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="https://twitter.com/username/status/..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Paste the full URL of your tweet here
          </p>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || !tweetUrl || !referralCode}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Verifying Tweet...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Verify Tweet
            </>
          )}
        </button>
      </div>

      {/* Verification Result */}
      {result && (
        <div className={`rounded-lg border p-4 ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold ${
                result.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.success ? 'Verification Successful!' : 'Verification Failed'}
              </h4>
              <p className={`text-sm mt-1 ${
                result.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.message}
              </p>
              
              {result.note && (
                <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800/30 rounded">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    ℹ️ {result.note}
                  </p>
                </div>
              )}

              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    View Details
                  </summary>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Verifications */}
      {existingVerifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">Your Verified Tweets</h3>
          <div className="space-y-3">
            {existingVerifications.map((verification, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">
                      Twitter Verification #{index + 1}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verified: {new Date(verification.verified_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openTweet(verification.tweet_id)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Tweet
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
