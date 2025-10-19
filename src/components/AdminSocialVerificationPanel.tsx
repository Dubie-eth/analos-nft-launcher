'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Twitter, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface PendingVerification {
  id: string;
  wallet_address: string;
  platform: string;
  tweet_id: string;
  tweet_url: string;
  referral_code: string;
  username: string;
  verification_status: string;
  created_at: string;
  metadata: any;
}

export default function AdminSocialVerificationPanel() {
  const { publicKey } = useWallet();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const loadVerifications = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/social-verification/admin?adminWallet=${publicKey.toString()}&status=${filter}`
      );
      const data = await response.json();
      
      if (data.verifications) {
        setPendingVerifications(data.verifications);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      alert('Failed to load verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (verificationId: string, action: 'approve' | 'reject', rejectedReason?: string) => {
    if (!publicKey) return;

    setProcessingId(verificationId);
    try {
      const response = await fetch('/api/social-verification/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminWallet: publicKey.toString(),
          verificationId: verificationId,
          action: action,
          rejectedReason: rejectedReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        await loadVerifications(); // Reload list
      } else {
        alert(`Failed: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('Error processing verification:', error);
      alert('Failed to process verification');
    } finally {
      setProcessingId(null);
    }
  };

  const openTweet = (tweetUrl: string) => {
    window.open(tweetUrl, '_blank');
  };

  useEffect(() => {
    loadVerifications();
  }, [publicKey, filter]);

  if (!publicKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <p className="text-center text-gray-600 dark:text-gray-300">
          Please connect your admin wallet to access this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Twitter className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold">Social Verification Admin Panel</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Review and approve user verification requests
              </p>
            </div>
          </div>
          <button
            onClick={loadVerifications}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading verifications...</p>
          </div>
        ) : pendingVerifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              No {filter} verifications found.
            </p>
          </div>
        ) : (
          pendingVerifications.map((verification) => (
            <div key={verification.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Twitter className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold">
                        {verification.wallet_address.slice(0, 8)}...{verification.wallet_address.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(verification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Referral Code:</p>
                      <p className="text-lg font-mono">{verification.referral_code}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tweet ID:</p>
                      <p className="text-sm font-mono">{verification.tweet_id}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openTweet(verification.tweet_url)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Tweet on Twitter
                  </button>
                </div>

                {filter === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleAction(verification.id, 'approve')}
                      disabled={processingId === verification.id}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        handleAction(verification.id, 'reject', reason || undefined);
                      }}
                      disabled={processingId === verification.id}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}

                {filter === 'verified' && (
                  <div className="ml-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Verified
                    </span>
                  </div>
                )}

                {filter === 'rejected' && (
                  <div className="ml-4">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg font-semibold">
                      <XCircle className="w-5 h-5" />
                      Rejected
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4">Statistics</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {filter === 'pending' ? pendingVerifications.length : '-'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {filter === 'verified' ? pendingVerifications.length : '-'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {filter === 'rejected' ? pendingVerifications.length : '-'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
