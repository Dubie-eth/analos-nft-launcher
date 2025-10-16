'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PublicProfileDisplay from '@/components/PublicProfileDisplay';
import { ArrowLeft, Share2, Flag } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [userWallet, setUserWallet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = params?.username as string;

  useEffect(() => {
    const findUserByUsername = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        // For now, we'll need to implement a way to find users by username
        // This could be done with a search API or by storing username-to-wallet mappings
        // For demonstration, let's assume we have a way to get the wallet from username
        
        // TODO: Implement username-to-wallet lookup
        // This could be done by:
        // 1. Creating a search API that finds users by username
        // 2. Storing username mappings in the database
        // 3. Using a separate lookup table
        
        // For now, we'll show an error that this feature needs to be implemented
        setError('Username lookup not yet implemented. Please use wallet address directly.');
        setLoading(false);
      } catch (err) {
        setError('Failed to find user');
        setLoading(false);
      }
    };

    findUserByUsername();
  }, [username]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${username}'s Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-32 mb-8"></div>
            <div className="bg-gray-700 rounded-2xl h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">User Profile</h1>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white text-lg mb-4">{error}</p>
            <p className="text-gray-300">
              To view a profile, you'll need to use the wallet address directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">{username}'s Profile</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Share profile"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Report profile"
            >
              <Flag className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Profile Display */}
        <PublicProfileDisplay userWallet={userWallet} />
      </div>
    </div>
  );
}
