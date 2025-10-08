'use client';

import { useState, useEffect } from 'react';
import { socialVerificationService, SocialAccount, SocialPlatform } from '@/lib/social-verification-service';

interface SocialVerificationProps {
  walletAddress: string;
  onVerificationComplete?: (eligible: boolean, score: number) => void;
}

// Fast Verification Form Component
function FastVerificationForm({ walletAddress, onComplete }: { walletAddress: string; onComplete: () => void }) {
  const [tweetUrl, setTweetUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFastVerification = async () => {
    if (!tweetUrl || !verificationCode) {
      setError('Please provide both tweet URL and verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { verificationService } = await import('@/lib/verification-service');
      
      // Start verification process first
      const startResult = await verificationService.startVerification(
        `collection_${walletAddress}`,
        walletAddress,
        'twitter',
        ''
      );

      // Complete with fast verification
      const result = await verificationService.fastCompleteVerification(
        startResult.verificationId,
        tweetUrl,
        verificationCode
      );

      if (result.success) {
        setSuccess('✅ Verification completed successfully! Your collection is now verified for 90 days.');
        setTweetUrl('');
        setVerificationCode('');
        onComplete();
      } else {
        setError('Verification failed. Please check your tweet URL and code.');
      }
    } catch (error: any) {
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tweet URL
        </label>
        <input
          type="url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          placeholder="https://twitter.com/username/status/1234567890"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Paste the full URL of your tweet containing the verification code
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="LOS123456🎯"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          Enter the verification code from your tweet
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      <button
        onClick={handleFastVerification}
        disabled={loading || !tweetUrl || !verificationCode}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Verifying...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <span>⚡</span>
            <span>Verify Instantly (30s)</span>
          </span>
        )}
      </button>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <h5 className="text-blue-300 font-medium text-sm mb-2">💡 How it works:</h5>
        <ol className="text-blue-200 text-xs space-y-1 list-decimal list-inside">
          <li>Post a tweet with your verification code</li>
          <li>Copy the tweet URL</li>
          <li>Paste it here with the verification code</li>
          <li>Get verified instantly!</li>
        </ol>
      </div>
    </div>
  );
}

export default function SocialVerification({ walletAddress, onVerificationComplete }: SocialVerificationProps) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [newAccount, setNewAccount] = useState<Partial<SocialAccount>>({
    platform: 'twitter',
    username: '',
    verificationStatus: 'pending',
    verificationMethod: 'manual'
  });
  const [verificationStatus, setVerificationStatus] = useState<{
    eligible: boolean;
    currentScore: number;
    requiredScore: number;
    missingRequirements: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'verify' | 'fast' | 'status'>('add');

  const platforms: SocialPlatform[] = [
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', verificationUrl: 'https://twitter.com' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', verificationUrl: 'https://t.me' },
    { id: 'discord', name: 'Discord', icon: '💬', verificationUrl: 'https://discord.com' }
  ];

  useEffect(() => {
    loadVerificationStatus();
  }, [walletAddress]);

  const loadVerificationStatus = async () => {
    try {
      const accounts = socialVerificationService.getWalletSocialAccounts(walletAddress);
      setSocialAccounts(accounts);
      
      const eligibility = socialVerificationService.checkWhitelistEligibility(walletAddress);
      setVerificationStatus(eligibility);
      
      if (onVerificationComplete) {
        onVerificationComplete(eligibility.eligible, eligibility.currentScore);
      }
    } catch (error) {
      console.error('❌ Error loading verification status:', error);
    }
  };

  const addSocialAccount = async () => {
    if (!newAccount.platform || !newAccount.username) {
      alert('Please select a platform and enter your username');
      return;
    }

    setLoading(true);
    try {
      // Start verification process
      await socialVerificationService.startVerification(walletAddress, [newAccount as SocialAccount]);
      await loadVerificationStatus();
      setNewAccount({ platform: 'twitter', username: '', verificationStatus: 'pending', verificationMethod: 'manual' });
      setActiveTab('verify');
      alert('✅ Social account added! Please complete verification.');
    } catch (error) {
      console.error('❌ Error adding social account:', error);
      alert('❌ Failed to add social account');
    } finally {
      setLoading(false);
    }
  };

  const submitManualVerification = async (account: SocialAccount) => {
    if (!account.verificationData?.verificationCode) {
      alert('No verification code found');
      return;
    }

    setLoading(true);
    try {
      // In a real implementation, this would submit the verification
      // For now, we'll simulate it
      const success = await socialVerificationService.submitManualVerification(
        `verify_${Date.now()}`,
        account.platform,
        { verificationCode: account.verificationData.verificationCode }
      );

      if (success) {
        await loadVerificationStatus();
        alert('✅ Verification submitted successfully!');
      } else {
        alert('❌ Verification failed. Please check your post and try again.');
      }
    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      alert('❌ Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">🔐 Social Media Verification</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'add' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Add Account
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'verify' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Verify ({socialAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('fast')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'fast' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ⚡ Fast (30s)
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeTab === 'status' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Verification Status */}
      {verificationStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          verificationStatus.eligible 
            ? 'bg-green-900/20 border-green-500/30' 
            : 'bg-yellow-900/20 border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold ${verificationStatus.eligible ? 'text-green-400' : 'text-yellow-400'}`}>
              {verificationStatus.eligible ? '✅ ELIGIBLE' : '⏳ PENDING VERIFICATION'}
            </span>
            <span className="text-white font-medium">
              Score: {verificationStatus.currentScore}/{verificationStatus.requiredScore}
            </span>
          </div>
          {verificationStatus.missingRequirements.length > 0 && (
            <div className="text-sm text-gray-300">
              <p className="font-medium mb-1">Missing Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                {verificationStatus.missingRequirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium text-lg">Add Social Media Account</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform
              </label>
              <select
                value={newAccount.platform || 'twitter'}
                onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value as SocialPlatform['id'] })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={newAccount.username || ''}
                onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                placeholder={`Enter your ${newAccount.platform} username`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
            </div>

            <button
              onClick={addSocialAccount}
              disabled={loading || !newAccount.username}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Account...' : 'Add Social Account'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium text-lg">Complete Verification</h4>
          
          {socialAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No social accounts added yet.</p>
              <p className="text-sm mt-1">Add accounts in the "Add Account" tab first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {socialAccounts.map((account, index) => (
                <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {platforms.find(p => p.id === account.platform)?.icon}
                      </span>
                      <div>
                        <h5 className="text-white font-medium">
                          {platforms.find(p => p.id === account.platform)?.name}
                        </h5>
                        <p className="text-gray-400 text-sm">@{account.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      account.verificationStatus === 'verified' 
                        ? 'bg-green-600 text-white'
                        : account.verificationStatus === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {account.verificationStatus.toUpperCase()}
                    </span>
                  </div>

                  {account.verificationStatus === 'pending' && account.verificationMethod === 'manual' && (
                    <div className="space-y-3">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <h6 className="text-blue-400 font-medium mb-2">Manual Verification Required</h6>
                        <p className="text-blue-300 text-sm mb-3">
                          Post the following message on your {platforms.find(p => p.id === account.platform)?.name} account:
                        </p>
                        <div className="bg-gray-800 rounded p-3 mb-3">
                          <code className="text-white text-sm">
                            {account.verificationData?.tweetText || account.verificationData?.messageText}
                          </code>
                        </div>
                        <button
                          onClick={() => copyToClipboard(account.verificationData?.tweetText || account.verificationData?.messageText || '')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          📋 Copy Text
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => submitManualVerification(account)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          ✅ I Posted It
                        </button>
                        <button
                          onClick={() => window.open(`https://${account.platform}.com/${account.username}`, '_blank')}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        >
                          🔗 View Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {account.verificationStatus === 'verified' && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400">✅</span>
                        <span className="text-green-300 text-sm">
                          Verified on {account.verifiedAt?.toLocaleDateString()}
                        </span>
                      </div>
                      {account.followerCount && (
                        <p className="text-green-300 text-sm mt-1">
                          {account.followerCount.toLocaleString()} followers
                        </p>
                      )}
                    </div>
                  )}

                  {account.verificationStatus === 'failed' && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">❌</span>
                        <span className="text-red-300 text-sm">Verification failed</span>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'fast' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium text-lg">⚡ Fast Verification (30 seconds)</h4>
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">⚡</span>
              <span className="text-white font-medium">Lightning Fast Verification</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Submit your tweet URL directly for instant verification. No waiting for manual approval!
            </p>
            
            <FastVerificationForm walletAddress={walletAddress} onComplete={() => loadVerificationStatus()} />
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="space-y-4">
          <h4 className="text-white font-medium text-lg">Verification Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{socialAccounts.length}</div>
              <div className="text-sm text-gray-400">Accounts Added</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {socialAccounts.filter(a => a.verificationStatus === 'verified').length}
              </div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {verificationStatus?.currentScore || 0}
              </div>
              <div className="text-sm text-gray-400">Verification Score</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Verification Requirements</h5>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Minimum Score Required:</span>
                <span className="text-white font-medium">{verificationStatus?.requiredScore || 500}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Score:</span>
                <span className={`font-medium ${(verificationStatus?.currentScore || 0) >= (verificationStatus?.requiredScore || 500) ? 'text-green-400' : 'text-yellow-400'}`}>
                  {verificationStatus?.currentScore || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${verificationStatus?.eligible ? 'text-green-400' : 'text-yellow-400'}`}>
                  {verificationStatus?.eligible ? 'ELIGIBLE' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
