'use client';

import React, { useState } from 'react';
import { Twitter, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface Props {
  walletAddress: string;
  referralCode?: string;
  entityType?: 'user' | 'collection';
  entityId?: string; // collection mint or user wallet
  onVerificationComplete?: (success: boolean, data: any) => void;
}

export default function InlineSocialVerification({ 
  walletAddress, 
  referralCode, 
  entityType = 'user',
  entityId,
  onVerificationComplete 
}: Props) {
  const [tweetUrl, setTweetUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string; rewards?: any} | null>(null);

  // Generate referral code if not provided
  const displayReferralCode = referralCode || walletAddress?.slice(0, 8).toUpperCase() || '';

  const handleVerify = async () => {
    if (!tweetUrl || !displayReferralCode) {
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
          walletAddress: walletAddress,
          tweetUrl: tweetUrl,
          referralCode: displayReferralCode,
          entityType: entityType,
          entityId: entityId || walletAddress
        }),
      });

      const data = await response.json();
      setResult(data);

      if (onVerificationComplete) {
        onVerificationComplete(data.success, data);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        message: 'Failed to verify tweet. Please try again.'
      });

      if (onVerificationComplete) {
        onVerificationComplete(false, null);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(displayReferralCode);
    alert('Referral code copied to clipboard!');
  };

  const generateExampleTweet = () => {
    if (entityType === 'collection') {
      return `Just discovered this verified NFT collection on @onlyanal.fun! Code: ${displayReferralCode} #AnalosNFT #NFTs`;
    }
    return `Just joined @onlyanal.fun! My referral code: ${displayReferralCode} #AnalosNFT #NFTLaunchpad 🚀`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Twitter className="w-6 h-6 text-blue-400" />
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white">
            {entityType === 'collection' ? 'Verify Collection' : 'Twitter Verification'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {entityType === 'collection' 
              ? 'Verify collection ownership by tweeting your code'
              : 'Earn 100 points by verifying your Twitter account'}
          </p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Your {entityType === 'collection' ? 'Collection' : 'Referral'} Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayReferralCode}
            readOnly
            className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
          />
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Example Tweet */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Example Tweet:</p>
        <p className="text-sm text-blue-700 dark:text-blue-300 italic">
          "{generateExampleTweet()}"
        </p>
      </div>

      {/* Tweet URL Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Tweet URL
        </label>
        <input
          type="url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="https://twitter.com/username/status/..."
        />
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={isVerifying || !tweetUrl}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 mb-4"
      >
        {isVerifying ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Verify Tweet
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-lg border ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.message}
              </p>
              {result.rewards && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  🎉 {result.rewards.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>1. Tweet your code with @onlyanal.fun mention</p>
        <p>2. Copy and paste the tweet URL above</p>
        <p>3. Click "Verify Tweet" to confirm</p>
        {entityType === 'user' && <p>4. Earn 100 points instantly! 🎁</p>}
        {entityType === 'collection' && <p>4. Get verified collection badge! ✅</p>}
      </div>
    </div>
  );
}
