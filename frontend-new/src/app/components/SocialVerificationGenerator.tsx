'use client';

import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, Users, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { socialVerificationService, SocialAccount } from '@/lib/social-verification-service';
import { verificationService } from '@/lib/verification-service';

interface SocialVerificationGeneratorProps {
  walletAddress: string;
  onVerificationComplete: (verified: boolean, score: number) => void;
}

export default function SocialVerificationGenerator({ 
  walletAddress, 
  onVerificationComplete 
}: SocialVerificationGeneratorProps) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [verificationRequest, setVerificationRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [requiredScore, setRequiredScore] = useState(500);

  useEffect(() => {
    loadExistingAccounts();
  }, [walletAddress]);

  const loadExistingAccounts = async () => {
    const accounts = socialVerificationService.getWalletSocialAccounts(walletAddress);
    setSocialAccounts(accounts);
    
    // Calculate current score
    const eligibility = socialVerificationService.checkWhitelistEligibility(walletAddress);
    setCurrentScore(eligibility.currentScore);
    setRequiredScore(eligibility.requiredScore);
  };

  const addSocialAccount = async (platform: 'twitter' | 'telegram' | 'discord') => {
    try {
      // Get verification code from backend with emojis
      const verificationResult = await verificationService.startVerification(
        `collection_${walletAddress}`,
        walletAddress,
        platform,
        '' // username will be filled later
      );

      const newAccount: SocialAccount = {
        platform,
        username: '',
        verificationStatus: 'pending',
        verificationMethod: 'manual',
        verificationData: {
          verificationCode: verificationResult.verificationCode,
          verificationId: verificationResult.verificationId,
          expiresAt: new Date(verificationResult.expiresAt)
        }
      };
      
      setSocialAccounts(prev => [...prev, newAccount]);
    } catch (error) {
      console.error('Error getting verification code:', error);
      // Fallback to local generation if backend fails
      const newAccount: SocialAccount = {
        platform,
        username: '',
        verificationStatus: 'pending',
        verificationMethod: 'manual',
        verificationData: {
          verificationCode: generateVerificationCode(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      };
      
      setSocialAccounts(prev => [...prev, newAccount]);
    }
  };

  const updateAccountUsername = (index: number, username: string) => {
    setSocialAccounts(prev => prev.map((account, i) => 
      i === index ? { ...account, username } : account
    ));
  };

  const removeAccount = (index: number) => {
    setSocialAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const startVerification = async () => {
    if (socialAccounts.length === 0) {
      alert('Please add at least one social account');
      return;
    }

    setLoading(true);
    try {
      const accountsToVerify = socialAccounts.map(account => ({
        platform: account.platform,
        username: account.username,
        userId: account.userId,
        displayName: account.displayName
      }));

      const request = await socialVerificationService.startVerification(walletAddress, accountsToVerify);
      setVerificationRequest(request);
      
      // Update local accounts with verification data
      setSocialAccounts(request.socialAccounts);
      
    } catch (error) {
      console.error('Error starting verification:', error);
      alert('Failed to start verification process');
    } finally {
      setLoading(false);
    }
  };

  const submitManualVerification = async (account: SocialAccount, verificationCode: string) => {
    if (!verificationRequest) return;
    
    setLoading(true);
    try {
      const success = await socialVerificationService.submitManualVerification(
        verificationRequest.id,
        account.platform,
        { verificationCode }
      );
      
      if (success) {
        // Reload accounts to get updated status
        await loadExistingAccounts();
        onVerificationComplete(true, currentScore);
      }
    } catch (error) {
      console.error('Error submitting manual verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVerificationCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'telegram': return <MessageCircle className="w-5 h-5" />;
      case 'discord': return <Users className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getVerificationInstructions = (platform: string, account: SocialAccount) => {
    const code = account.verificationData?.verificationCode || 'Loading...';
    
    switch (platform) {
      case 'twitter':
        return {
          title: 'Post a Tweet',
          instructions: `Post the following tweet with the verification code:`,
          message: `🎯 Verifying my NFT collection on LosLauncher! Code: ${code} #LosLauncher #Analos`,
          link: `https://twitter.com/compose/tweet?text=${encodeURIComponent(`🎯 Verifying my NFT collection on LosLauncher! Code: ${code} #LosLauncher #Analos`)}`
        };
      case 'telegram':
        return {
          title: 'Send a Message',
          instructions: `Send a message to our Telegram bot with the verification code:`,
          message: `🎯 Verifying my NFT collection on LosLauncher! Code: ${code}`,
          link: 'https://t.me/LosLauncherBot'
        };
      case 'discord':
        return {
          title: 'Join Discord Server',
          instructions: `Join our Discord server and send a message with the verification code:`,
          message: `🎯 Verifying my NFT collection on LosLauncher! Code: ${code}`,
          link: 'https://discord.gg/loslauncher'
        };
      default:
        return null;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-4xl mx-auto text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Social Verification</h2>
        <p className="text-white/70 text-lg mb-6">
          Verify your social media accounts to unlock generator access and earn verification badges
        </p>
        
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/70">Current Score:</span>
            <span className="text-2xl font-bold text-blue-400">{currentScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">Required Score:</span>
            <span className="text-2xl font-bold text-green-400">{requiredScore}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (currentScore / requiredScore) * 100)}%` }}
            ></div>
          </div>
          <p className="text-white/70 text-sm mt-2">
            {currentScore >= requiredScore ? '✅ Verification Complete!' : `Need ${requiredScore - currentScore} more points`}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => addSocialAccount('twitter')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Add Twitter
          </button>
          <button
            onClick={() => addSocialAccount('telegram')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Add Telegram
          </button>
          <button
            onClick={() => addSocialAccount('discord')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Add Discord
          </button>
        </div>

        {socialAccounts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Social Accounts</h3>
            {socialAccounts.map((account, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(account.platform)}
                    <div>
                      <h4 className="font-medium capitalize">{account.platform}</h4>
                      {account.username && (
                        <p className="text-white/70 text-sm">@{account.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${getStatusColor(account.verificationStatus)} flex items-center gap-1`}>
                      {getStatusIcon(account.verificationStatus)}
                      {account.verificationStatus}
                    </span>
                    <button
                      onClick={() => removeAccount(index)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {account.verificationStatus === 'pending' && !account.username && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} Username
                    </label>
                    <input
                      type="text"
                      value={account.username}
                      onChange={(e) => updateAccountUsername(index, e.target.value)}
                      placeholder={`Enter your ${account.platform} username`}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50"
                    />
                  </div>
                )}

                {account.verificationStatus === 'pending' && account.username && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="font-medium mb-3">Verification Instructions</h5>
                    {(() => {
                      const instructions = getVerificationInstructions(account.platform, account);
                      if (!instructions) return null;
                      
                      return (
                        <div className="space-y-3">
                          <p className="text-white/70 text-sm">{instructions.instructions}</p>
                          <div className="bg-black/20 rounded-lg p-3">
                            <code className="text-green-400 text-sm break-all">{instructions.message}</code>
                          </div>
                          <a
                            href={instructions.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {instructions.title}
                          </a>
                          <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">
                              Verification Code (for manual submission)
                            </label>
                            <input
                              type="text"
                              placeholder="Enter verification code"
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/50"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const code = (e.target as HTMLInputElement).value;
                                  submitManualVerification(account, code);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {account.verificationStatus === 'verified' && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Verified!</span>
                    </div>
                    {account.followerCount && (
                      <p className="text-white/70 text-sm">
                        {account.followerCount.toLocaleString()} followers
                      </p>
                    )}
                    {account.isVerified && (
                      <p className="text-blue-400 text-sm">✓ Verified Account</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="text-center pt-6">
              <button
                onClick={startVerification}
                disabled={loading || socialAccounts.some(a => !a.username)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Start Verification
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {socialAccounts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Social Accounts Added</h3>
            <p className="text-white/70">
              Add your social media accounts above to start the verification process
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
