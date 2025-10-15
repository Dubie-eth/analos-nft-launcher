/**
 * SOCIAL VERIFICATION MANAGER
 * Admin component for managing social verification system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  SocialAccount, 
  SocialVerificationRequest, 
  SocialVerificationConfig,
  VerificationEligibility 
} from '../lib/database/types';
import { socialVerificationService } from '../lib/social-verification-service';

interface SocialVerificationManagerProps {
  className?: string;
}

export default function SocialVerificationManager({ className = '' }: SocialVerificationManagerProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'accounts' | 'configs' | 'eligibility'>('requests');
  const [verificationRequests, setVerificationRequests] = useState<SocialVerificationRequest[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [verificationConfigs, setVerificationConfigs] = useState<SocialVerificationConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<VerificationEligibility | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requests, configs] = await Promise.all([
        socialVerificationService.getAllVerificationRequests(),
        socialVerificationService.getVerificationConfigs('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6')
      ]);
      
      setVerificationRequests(requests);
      setVerificationConfigs(configs);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async (accountId: string, verificationCode: string) => {
    try {
      await socialVerificationService.verifySocialAccount(accountId, verificationCode);
      await loadData();
      alert('✅ Account verified successfully!');
    } catch (error) {
      console.error('❌ Error verifying account:', error);
      alert('❌ Failed to verify account');
    }
  };

  const handleRevokeVerification = async (accountId: string, reason: string) => {
    try {
      await socialVerificationService.revokeVerification(accountId, reason, 'admin');
      await loadData();
      alert('✅ Verification revoked successfully!');
    } catch (error) {
      console.error('❌ Error revoking verification:', error);
      alert('❌ Failed to revoke verification');
    }
  };

  const checkEligibility = async () => {
    if (!selectedWallet) return;
    
    setLoading(true);
    try {
      const eligibility = await socialVerificationService.checkVerificationEligibility(selectedWallet);
      setEligibilityResult(eligibility);
    } catch (error) {
      console.error('❌ Error checking eligibility:', error);
      alert('❌ Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-900/20';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'failed': return 'text-red-400 bg-red-900/20';
      case 'expired': return 'text-orange-400 bg-orange-900/20';
      case 'revoked': return 'text-red-600 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      twitter: '🐦',
      telegram: '✈️',
      discord: '💬',
      instagram: '📷',
      youtube: '📺',
      tiktok: '🎵',
      github: '🐙'
    };
    return icons[platform as keyof typeof icons] || '🔗';
  };

  return (
    <div className={`bg-gray-900/50 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">🔐 Social Verification Manager</h2>
        <p className="text-gray-400">Manage social media verification and whitelist eligibility</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'requests', label: 'Verification Requests', icon: '📋' },
          { id: 'accounts', label: 'Social Accounts', icon: '👥' },
          { id: 'configs', label: 'Configurations', icon: '⚙️' },
          { id: 'eligibility', label: 'Check Eligibility', icon: '✅' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading...</span>
          </div>
        )}

        {/* Verification Requests */}
        {activeTab === 'requests' && !loading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Verification Requests</h3>
              <span className="text-sm text-gray-400">
                {verificationRequests.length} total requests
              </span>
            </div>

            {verificationRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No verification requests found
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map(request => (
                  <div key={request.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-white">{request.walletAddress}</p>
                        <p className="text-sm text-gray-400">
                          Score: {request.totalScore}/{request.requiredScore} • 
                          {request.verificationCount} accounts • 
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {request.socialAccounts.map(account => (
                        <div key={account.id} className="bg-gray-900/50 rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getPlatformIcon(account.platform)}</span>
                            <span className="font-medium text-white">{account.platform}</span>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(account.verificationStatus)}`}>
                              {account.verificationStatus}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">@{account.username}</p>
                          <p className="text-xs text-gray-500">{account.followerCount.toLocaleString()} followers</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social Accounts */}
        {activeTab === 'accounts' && !loading && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">All Social Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialAccounts.map(account => (
                <div key={account.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(account.platform)}</span>
                      <span className="font-medium text-white capitalize">{account.platform}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(account.verificationStatus)}`}>
                      {account.verificationStatus}
                    </span>
                  </div>
                  
                  <p className="text-white font-medium">@{account.username}</p>
                  <p className="text-sm text-gray-400">{account.followerCount.toLocaleString()} followers</p>
                  
                  {account.verificationStatus === 'pending' && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => handleVerifyAccount(account.id, socialVerificationService.generateVerificationCode(account.platform))}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        ✅ Verify Account
                      </button>
                    </div>
                  )}
                  
                  {account.verificationStatus === 'verified' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for revocation:');
                        if (reason) handleRevokeVerification(account.id, reason);
                      }}
                      className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      🚫 Revoke Verification
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configurations */}
        {activeTab === 'configs' && !loading && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Verification Configurations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationConfigs.map(config => (
                <div key={config.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{getPlatformIcon(config.platform)}</span>
                    <span className="font-medium text-white capitalize">{config.platform}</span>
                    <span className={`px-2 py-1 rounded text-xs ${config.isActive ? 'bg-green-900/20 text-green-400' : 'bg-gray-900/20 text-gray-400'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Official Handle:</span> <span className="text-white">@{config.officialHandle}</span></p>
                    <p><span className="text-gray-400">Method:</span> <span className="text-white capitalize">{config.verificationMethod}</span></p>
                    <p><span className="text-gray-400">Required Score:</span> <span className="text-white">{config.requiredScore}</span></p>
                    <p><span className="text-gray-400">Min Followers:</span> <span className="text-white">{config.minimumFollowers.toLocaleString()}</span></p>
                    <p><span className="text-gray-400">Expiration:</span> <span className="text-white">{config.expirationDays === 0 ? 'Never' : `${config.expirationDays} days`}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility Check */}
        {activeTab === 'eligibility' && !loading && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Check Wallet Eligibility</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter wallet address..."
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={checkEligibility}
                  disabled={!selectedWallet || loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Check Eligibility
                </button>
              </div>
            </div>

            {eligibilityResult && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">Eligibility Results</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium mb-4 ${
                      eligibilityResult.eligible 
                        ? 'bg-green-900/20 text-green-400' 
                        : 'bg-red-900/20 text-red-400'
                    }`}>
                      {eligibilityResult.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400">Current Score:</span>
                        <span className="ml-2 text-white font-medium">{eligibilityResult.currentScore}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Required Score:</span>
                        <span className="ml-2 text-white font-medium">{eligibilityResult.requiredScore}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Verified Accounts:</span>
                        <span className="ml-2 text-white font-medium">{eligibilityResult.verifiedAccounts}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Accounts:</span>
                        <span className="ml-2 text-white font-medium">{eligibilityResult.totalAccounts}</span>
                      </div>
                    </div>
                  </div>

                  {eligibilityResult.missingRequirements.length > 0 && (
                    <div>
                      <h5 className="text-white font-medium mb-3">Missing Requirements:</h5>
                      <ul className="space-y-2">
                        {eligibilityResult.missingRequirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-2 text-red-400">
                            <span>•</span>
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
