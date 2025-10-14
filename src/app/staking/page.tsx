'use client';

import React from 'react';
import { useWalletContext } from '@/contexts/WalletContext';

const StakingPage: React.FC = () => {
  const { hasAccess } = useWalletContext();

  // Check if user has access to this page
  if (!hasAccess('/staking')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              You need premium user access or higher to stake NFTs.
            </p>
            <a
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🪙 NFT Staking</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Stake your NFTs to earn rewards with rarity-based multipliers.
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-white mb-4">Staking Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              The NFT staking feature is currently under development.
            </p>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Planned Features</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>• Rarity-based reward multipliers</li>
                  <li>• Flexible staking periods</li>
                  <li>• Real-time reward tracking</li>
                  <li>• Automated compound rewards</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingPage;
