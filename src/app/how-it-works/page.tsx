'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_PROGRAMS, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

const HowItWorksPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  
  // Admin wallet addresses - only these wallets can see admin links
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
  ];
  
  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());
  
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Platform Overview', icon: '🎯' },
    { id: 'nft-collections', title: 'NFT Collections', icon: '🎨' },
    { id: 'token-integration', title: 'Token Integration', icon: '🚀' },
    { id: 'staking-rewards', title: 'Staking & Rewards', icon: '💰' },
    { id: 'creator-airdrops', title: 'Creator Airdrops', icon: '🎁' },
    { id: 'platform-fees', title: 'Platform Fees', icon: '💳' },
    { id: 'whitelist-system', title: 'Whitelist System', icon: '📝' },
    { id: 'profile-customization', title: 'Profile Customization', icon: '👤' },
    { id: 'admin-controls', title: 'Admin Controls', icon: '⚙️' },
    { id: 'revenue-model', title: 'Revenue Model', icon: '💎' },
    { id: 'governance', title: 'Governance', icon: '🗳️' },
    { id: 'technical-architecture', title: 'Technical Architecture', icon: '🏗️' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🎯 Analos NFT Launchpad Platform</h2>
              <p className="text-lg text-purple-100 mb-6">
                A complete ecosystem for launching, managing, and trading NFTs with integrated token economics, 
                staking rewards, and democratic governance on the Analos blockchain.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">🎨 NFT Collections</h3>
                  <p className="text-sm text-purple-100">Create and launch NFT collections with whitelist stages, rarity systems, and creator profiles.</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">🚀 Token Integration</h3>
                  <p className="text-sm text-purple-100">NFT-to-Token mode with bonding curves, token claims, and burn mechanisms.</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">💰 Staking Rewards</h3>
                  <p className="text-sm text-purple-100">Stake NFTs and LOS tokens to earn rewards from platform fees.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">🎯 For Creators</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Easy Collection Launch</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Launch NFT collections with our guided wizard</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Flexible Launch Modes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">NFT-Only or NFT-to-Token with bonding curves</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Whitelist Management</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">3-tier whitelist system with incremental pricing</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Creator Verification</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">On-chain social verification and trust scores</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">👥 For Users</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Whitelist Access</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Early access to collections at discounted prices</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">NFT Staking</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Stake NFTs to earn token rewards based on rarity</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">LOS Staking</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Stake LOS to earn 30% of all platform fees</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Governance Rights</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Vote on platform changes via CTO proposals</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'nft-collections':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🎨 NFT Collections</h2>
              <p className="text-lg text-purple-100">
                Launch NFT collections with advanced features including whitelist stages, rarity systems, 
                and creator verification.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📋 Collection Setup Process</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold">Basic Information</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Set collection name, symbol, metadata URIs</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold">Supply & Pricing</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Define max supply, mint price, reveal threshold</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold">Launch Mode</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Choose NFT-Only or NFT-to-Token mode</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold">Whitelist Stages</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Configure 3-tier whitelist with pricing</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h4 className="font-semibold">Deploy Collection</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Launch your collection on Analos blockchain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🎭 Rarity System</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Each NFT gets assigned a rarity tier that determines staking rewards and token multipliers.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Legendary</span>
                      <span className="text-yellow-600 font-bold">5x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Epic</span>
                      <span className="text-purple-600 font-bold">3x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Rare</span>
                      <span className="text-blue-600 font-bold">2x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Common</span>
                      <span className="text-gray-600 dark:text-gray-300 font-bold">1x Multiplier</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">👤 Creator Profiles</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Build trust with on-chain verification of social media and credentials.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Twitter verification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Website verification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>GitHub verification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Trust score calculation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'token-integration':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🚀 Token Integration</h2>
              <p className="text-lg text-blue-100">
                NFT-to-Token mode enables full ecosystem integration with bonding curves, 
                token claims, and burn mechanisms.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📈 Bonding Curve System</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Dynamic pricing system that adjusts token price based on supply and demand.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Initial Price</h4>
                      <p className="text-sm text-blue-700">Starting token price (e.g., 0.001 LOS)</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Target Price</h4>
                      <p className="text-sm text-green-700">Final token price (e.g., 0.01 LOS)</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Curve Type</h4>
                      <p className="text-sm text-purple-700">Linear or exponential price progression</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🔄 Token Claims</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    NFT holders can claim tokens based on their rarity tier.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Legendary NFT</span>
                      <span className="font-bold text-yellow-600">5,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Epic NFT</span>
                      <span className="font-bold text-purple-600">3,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Rare NFT</span>
                      <span className="font-bold text-blue-600">2,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Common NFT</span>
                      <span className="font-bold text-gray-600 dark:text-gray-300">1,000 tokens</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🔥 Burn for Tokens</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    NFT holders can burn their NFTs to receive additional tokens at current market price.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Burn Process</h4>
                    <ol className="text-sm text-red-700 space-y-1">
                      <li>1. Select NFT to burn</li>
                      <li>2. Confirm burn transaction</li>
                      <li>3. Receive tokens at current price</li>
                      <li>4. NFT is permanently destroyed</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💰 Revenue Sharing</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Token launch revenue is distributed according to predefined allocations.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Pool Liquidity</span>
                      <span className="font-semibold text-blue-600">60%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Creator</span>
                      <span className="font-semibold text-green-600">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Team</span>
                      <span className="font-semibold text-purple-600">10%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Community</span>
                      <span className="font-semibold text-orange-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'staking-rewards':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">💰 Staking & Rewards</h2>
              <p className="text-lg text-green-100">
                Earn rewards by staking NFTs and LOS tokens. 30% of all platform fees are distributed to LOS stakers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🎨 NFT Staking</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Stake your NFTs to earn token rewards based on rarity multipliers.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">How It Works</h4>
                      <ol className="text-sm text-purple-700 space-y-1">
                        <li>1. Stake your NFT in the platform</li>
                        <li>2. Earn rewards based on rarity tier</li>
                        <li>3. Claim rewards anytime</li>
                        <li>4. Unstake to regain NFT control</li>
                      </ol>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Reward Calculation</h4>
                      <p className="text-sm text-blue-700">
                        Base reward × Rarity multiplier × Time staked
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💎 LOS Token Staking</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Stake LOS tokens to earn 30% of all platform fees automatically.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Staked Amount</span>
                      <span className="font-semibold">1,000 LOS</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Your Share</span>
                      <span className="font-semibold text-green-600">0.1%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Daily Rewards</span>
                      <span className="font-semibold text-blue-600">~2.5 LOS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📊 Fee Distribution</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Platform fees are automatically distributed to stakers and the platform.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-semibold text-green-800">LOS Holders</span>
                      <span className="text-2xl font-bold text-green-600">30%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-blue-800">Platform Treasury</span>
                      <span className="text-xl font-bold text-blue-600">70%</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Fee Sources</h4>
                    <ul className="text-sm space-y-1">
                      <li>• NFT minting: 2.5%</li>
                      <li>• Token launches: 5%</li>
                      <li>• Trading fees: 1%</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">⏰ Reward Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>NFT Staking</span>
                      <span className="font-semibold text-purple-600">Claim anytime</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>LOS Staking</span>
                      <span className="font-semibold text-green-600">Auto-distributed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Distribution Frequency</span>
                      <span className="font-semibold text-blue-600">Daily</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'creator-airdrops':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🎁 Creator Airdrops</h2>
              <p className="text-lg text-pink-100">
                Enable creators to set up custom airdrop campaigns for their holders with flexible eligibility criteria.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🎨 Creator Campaign Setup</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Creators can define custom airdrop campaigns with their own tokens and eligibility criteria.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <h4 className="font-semibold text-pink-800 mb-2">Campaign Configuration</h4>
                      <ul className="text-sm text-pink-700 space-y-1">
                        <li>• Custom airdrop token selection</li>
                        <li>• Total amount and distribution rules</li>
                        <li>• Start and end dates</li>
                        <li>• Campaign name and description</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Eligibility Types</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Token Holdings (minimum balance)</li>
                        <li>• NFT Ownership (specific collections)</li>
                        <li>• Whitelist (custom address list)</li>
                        <li>• Custom criteria (creator-defined)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💰 Platform Fee System</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    All creator airdrops require a platform fee to ensure sustainability and quality.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Fee Structure</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 2.5% platform fee on total airdrop amount</li>
                        <li>• Fee must be paid before campaign activation</li>
                        <li>• Transparent fee calculation and display</li>
                        <li>• Automatic treasury collection</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Payment Process</h4>
                      <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Creator deposits airdrop tokens</li>
                        <li>2. Creator pays platform fee</li>
                        <li>3. Campaign becomes active</li>
                        <li>4. Users can claim based on eligibility</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🎯 User Experience</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Seamless claiming experience with real-time eligibility checking and automatic distribution.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Eligibility Checking</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Real-time token balance verification</li>
                        <li>• NFT ownership validation</li>
                        <li>• Merkle proof whitelist verification</li>
                        <li>• Custom criteria evaluation</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Claiming Process</h4>
                      <ol className="text-sm text-indigo-700 space-y-1">
                        <li>1. User connects wallet</li>
                        <li>2. System checks eligibility</li>
                        <li>3. User sees claimable amount</li>
                        <li>4. One-click claim execution</li>
                        <li>5. Tokens transferred to wallet</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📊 Analytics & Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Comprehensive tracking and analytics for both creators and platform administrators.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Creator Dashboard</h4>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Campaign performance metrics</li>
                        <li>• Claim statistics and trends</li>
                        <li>• Eligible vs. claimed amounts</li>
                        <li>• User engagement data</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Platform Analytics</h4>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <li>• Total fees collected</li>
                        <li>• Campaign success rates</li>
                        <li>• Revenue trends and forecasting</li>
                        <li>• User adoption metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'platform-fees':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">💳 Platform Fee System</h2>
              <p className="text-lg text-emerald-100">
                Transparent and fair fee structure that ensures platform sustainability while providing value to creators and users.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💰 Fee Structure Overview</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Our fee system is designed to be fair, transparent, and sustainable for all participants.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">NFT Minting Fees</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 2.5% on all NFT mints</li>
                        <li>• Applied to mint price</li>
                        <li>• Distributed across platform operations</li>
                        <li>• 30% goes to LOS stakers</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Token Launch Fees</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 5% on token launches</li>
                        <li>• Covers bonding curve setup</li>
                        <li>• Includes liquidity provision</li>
                        <li>• Platform infrastructure costs</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Creator Airdrop Fees</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• 2.5% on total airdrop amount</li>
                        <li>• Paid before campaign activation</li>
                        <li>• Covers platform maintenance</li>
                        <li>• Ensures campaign quality</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🎯 Fee Distribution</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    All collected fees are distributed transparently across platform operations and stakeholder rewards.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Revenue Allocation</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 40% - Treasury (platform development)</li>
                        <li>• 30% - LOS Staker Rewards</li>
                        <li>• 15% - Development Fund</li>
                        <li>• 10% - Marketing & Growth</li>
                        <li>• 5% - Token Buyback Program</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-indigo-800 mb-2">Transparency Features</h4>
                      <ul className="text-sm text-indigo-700 space-y-1">
                        <li>• Public fee collection records</li>
                        <li>• Monthly revenue reports</li>
                        <li>• Real-time fee analytics</li>
                        <li>• On-chain fee verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💎 Value Proposition</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Our fees provide significant value to all platform participants through comprehensive services and rewards.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <h4 className="font-semibold text-pink-800 mb-2">For Creators</h4>
                      <ul className="text-sm text-pink-700 space-y-1">
                        <li>• Professional launch platform</li>
                        <li>• Built-in marketing tools</li>
                        <li>• Community management features</li>
                        <li>• Analytics and insights</li>
                        <li>• Technical infrastructure</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <h4 className="font-semibold text-cyan-800 mb-2">For Users</h4>
                      <ul className="text-sm text-cyan-700 space-y-1">
                        <li>• Staking rewards (30% of fees)</li>
                        <li>• Access to quality projects</li>
                        <li>• Fair launch mechanisms</li>
                        <li>• Community governance rights</li>
                        <li>• Platform stability</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🔄 Fee Optimization</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Dynamic fee adjustment based on platform performance and community governance.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Governance Control</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• CTO voting on fee adjustments</li>
                        <li>• Community proposal system</li>
                        <li>• Transparent decision making</li>
                        <li>• Implementation delays for safety</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <h4 className="font-semibold text-teal-800 mb-2">Performance Metrics</h4>
                      <ul className="text-sm text-teal-700 space-y-1">
                        <li>• Platform adoption rates</li>
                        <li>• Creator success metrics</li>
                        <li>• User satisfaction scores</li>
                        <li>• Revenue sustainability</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'whitelist-system':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">📝 Whitelist System</h2>
              <p className="text-lg text-orange-100">
                Token-gated whitelist system with anti-bot protection and dynamic pricing for fair distribution.
              </p>
            </div>

            {/* Example: Los Bros NFT Collection */}
            <div className="bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 rounded-lg p-6 border-2 border-purple-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🎨</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Example: Los Bros NFT Collection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real-world implementation with $LOL token gating</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-4 gap-6 mt-6">
                {/* Team Tier */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-yellow-400 dark:border-yellow-500 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">🎖️</div>
                    <h4 className="text-xl font-bold text-yellow-800 dark:text-yellow-400">Team</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Core team allocation</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Price:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Supply:</span>
                      <span className="font-semibold">50 NFTs</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Requirement:</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">Whitelisted</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Holding Period:</span>
                      <span className="font-semibold">None</span>
                    </div>
                  </div>
                </div>

                {/* Community Tier */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-green-400 dark:border-green-500 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">🎁</div>
                    <h4 className="text-xl font-bold text-green-800 dark:text-green-400">Community</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">1M+ $LOL holders</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Price:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">FREE*</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Supply:</span>
                      <span className="font-semibold">500 NFTs</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Requirement:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">1M $LOL</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Holding Period:</span>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">72 hours</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">*Platform fee only (6.9%)</div>
                </div>

                {/* Early Tier */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-blue-400 dark:border-blue-500 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">💎</div>
                    <h4 className="text-xl font-bold text-blue-800 dark:text-blue-400">Early Supporters</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">100k+ $LOL holders</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Price:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">50% OFF</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Supply:</span>
                      <span className="font-semibold">150 NFTs</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Requirement:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">100k $LOL</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Holding Period:</span>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">72 hours</span>
                    </div>
                  </div>
                </div>

                {/* Public Tier */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-purple-400 dark:border-purple-500 shadow-lg">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">🌍</div>
                    <h4 className="text-xl font-bold text-purple-800 dark:text-purple-400">Public Sale</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Open to everyone</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Starting Price:</span>
                      <span className="font-semibold">4,200.69 LOS</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Supply:</span>
                      <span className="font-semibold">1,522 NFTs</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Requirement:</span>
                      <span className="font-semibold">None</span>
                    </div>
                    <div className="flex justify-between text-gray-800 dark:text-gray-300">
                      <span>Dynamic Pricing:</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">+6.9%/mint</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Max: 42,000.69 LOS</div>
                </div>
              </div>
            </div>

            {/* Anti-Bot Protection */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-cyan-400 dark:border-cyan-500 shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">🛡️</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Anti-Bot Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    72-hour $LOL token holding period required for free and discounted mints to prevent bot farming.
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">How It Works</h4>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">1.</span>
                      <span>User acquires $LOL tokens</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">2.</span>
                      <span>System tracks token account creation time</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">3.</span>
                      <span>Holding period must reach 72 hours for whitelist eligibility</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold mt-1">4.</span>
                      <span>Real-time countdown displayed to user</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Prevents bot sniping of free/discounted mints</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Rewards genuine community members</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>On-chain verification (tamper-proof)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Fair distribution mechanism</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dynamic Pricing System */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📈 Dynamic Pricing (Optional Feature)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">How Dynamic Pricing Works</h4>
                  <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">1.</span>
                      <span>Starting price set by creator (e.g., 4,200.69 LOS)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">2.</span>
                      <span>Price increases by percentage with each mint (e.g., +6.9%)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">3.</span>
                      <span>Maximum price cap to protect buyers (e.g., 42,000.69 LOS)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 dark:text-purple-400 font-bold mt-1">4.</span>
                      <span>Real-time price display on mint page</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Rewards early minters with lower prices</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Creates urgency and excitement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Prevents floor dumping</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500 dark:text-green-400">✓</span>
                      <span>Price discovery through demand</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Customizable Whitelist Options */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-4">🎛️ Customizable for Creators</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Flexible Tiers</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Create 1-10 whitelist tiers with custom pricing
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Token Gating</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Gate access by any SPL token balance & holding period
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">On-Chain Verification</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    All verification happens trustlessly on-chain
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile-customization':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">👤 Profile Customization</h2>
              <p className="text-lg text-purple-100">
                Create your unique profile with custom images, username, and personalized referral links.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  🖼️ Image Upload Guidelines
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Profile Picture Requirements:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <strong>Format:</strong> JPEG, PNG, GIF, or WebP</li>
                      <li>• <strong>Size:</strong> Maximum 5MB</li>
                      <li>• <strong>Dimensions:</strong> 800x800px recommended (square)</li>
                      <li>• <strong>Quality:</strong> High resolution for best results</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Banner Image Requirements:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <strong>Format:</strong> JPEG, PNG, GIF, or WebP</li>
                      <li>• <strong>Size:</strong> Maximum 10MB</li>
                      <li>• <strong>Dimensions:</strong> 1920x1080px recommended (wide)</li>
                      <li>• <strong>Ratio:</strong> 16:9 aspect ratio works best</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  🏷️ Username & Referral System
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Username Rules:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <strong>Uniqueness:</strong> Each username can only be used once</li>
                      <li>• <strong>Length:</strong> 3-20 characters</li>
                      <li>• <strong>Characters:</strong> Letters, numbers, and underscores only</li>
                      <li>• <strong>Case:</strong> Automatically converted to lowercase</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Personalized Referral Links:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <strong>Format:</strong> yoursite.com/?ref=YOURUSERNAME</li>
                      <li>• <strong>Automatic:</strong> Generated when you set your username</li>
                      <li>• <strong>Sharing:</strong> Share to earn referral rewards</li>
                      <li>• <strong>Tracking:</strong> All referrals are tracked and rewarded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                💾 Profile Persistence
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">What Gets Saved:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Profile pictures and banner images</li>
                    <li>• Username and bio information</li>
                    <li>• Social media links</li>
                    <li>• Privacy settings and preferences</li>
                    <li>• Referral codes and statistics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Benefits:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• No need to re-upload images</li>
                    <li>• Consistent profile across sessions</li>
                    <li>• Personalized referral tracking</li>
                    <li>• Secure data storage</li>
                    <li>• Cross-device synchronization</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-3">🚀 Getting Started</h3>
              <p className="text-blue-100 mb-4">
                Ready to create your personalized profile? Here's how to get started:
              </p>
              <ol className="text-sm text-blue-100 space-y-2">
                <li>1. <strong>Connect your wallet</strong> to access the profile page</li>
                <li>2. <strong>Upload your images</strong> following the guidelines above</li>
                <li>3. <strong>Set your unique username</strong> (check availability first)</li>
                <li>4. <strong>Write your bio</strong> to tell the community about yourself</li>
                <li>5. <strong>Add social links</strong> to connect with others</li>
                <li>6. <strong>Save your profile</strong> to generate your referral link</li>
              </ol>
            </div>
          </div>
        );

      case 'admin-controls':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">⚙️ Admin Controls</h2>
              <p className="text-lg text-gray-100">
                Comprehensive admin controls for platform management, fee adjustment, and emergency protocols.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">💰 Fee Management</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Adjust platform fees to optimize revenue and user experience.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">NFT Mint Fee</span>
                      <span className="font-semibold text-purple-600">2.5% (adjustable)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Token Launch Fee</span>
                      <span className="font-semibold text-blue-600">5% (adjustable)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Trading Fee</span>
                      <span className="font-semibold text-green-600">1% (adjustable)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📊 Revenue Distribution</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Control how platform revenue is distributed across stakeholders.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">LOS Holders</span>
                      <span className="font-semibold text-green-600">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Platform Treasury</span>
                      <span className="font-semibold text-blue-600">40%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Development</span>
                      <span className="font-semibold text-purple-600">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Marketing</span>
                      <span className="font-semibold text-orange-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🚨 Emergency Controls</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Emergency pause functionality for critical situations.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h4 className="font-semibold text-red-800 mb-2">Emergency Pause</h4>
                      <p className="text-sm text-red-700">
                        Instantly pause all platform operations with reason logging.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="font-semibold text-yellow-800 mb-2">Collection Pause</h4>
                      <p className="text-sm text-yellow-700">
                        Pause individual collections for maintenance or issues.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📈 Platform Limits</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Set platform-wide limits and constraints.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Min Collection Size:</span>
                      <span className="font-semibold">100 NFTs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Collection Size:</span>
                      <span className="font-semibold">100,000 NFTs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Mint Price:</span>
                      <span className="font-semibold">0.001 LOS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Mint Price:</span>
                      <span className="font-semibold">100 LOS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'revenue-model':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">💎 Revenue Model</h2>
              <p className="text-lg text-emerald-100">
                Sustainable revenue model with multiple streams and automatic distribution to token holders.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="text-xl font-bold text-purple-800">NFT Minting Fees</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">2.5% on all NFT mints</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Per mint:</span>
                    <span className="font-semibold">2.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform share:</span>
                    <span className="font-semibold text-blue-600">70%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Holder rewards:</span>
                    <span className="font-semibold text-green-600">30%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="text-xl font-bold text-blue-800">Token Launch Fees</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">5% on token launches</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Per launch:</span>
                    <span className="font-semibold">5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform share:</span>
                    <span className="font-semibold text-blue-600">70%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Holder rewards:</span>
                    <span className="font-semibold text-green-600">30%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">💱</div>
                  <h3 className="text-xl font-bold text-green-800">Trading Fees</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">1% on secondary trading</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Per trade:</span>
                    <span className="font-semibold">1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform share:</span>
                    <span className="font-semibold text-blue-600">70%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Holder rewards:</span>
                    <span className="font-semibold text-green-600">30%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4">💰 Revenue Distribution Flow</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-3">Platform Revenue (70%)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <span>Treasury</span>
                      <span className="font-semibold text-blue-600">40%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                      <span>Development</span>
                      <span className="font-semibold text-purple-600">20%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                      <span>Marketing</span>
                      <span className="font-semibold text-orange-600">10%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Holder Rewards (30%)</h4>
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700 mb-2">
                      Automatically distributed to LOS stakers based on their stake percentage.
                    </p>
                    <p className="text-xs text-green-600">
                      Example: If you stake 1% of total LOS, you receive 1% of all holder rewards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4">🎯 Sustainable Growth Model</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <h4 className="font-semibold text-green-700 mb-2">Revenue Growth</h4>
                  <p className="text-sm text-green-600">
                    Multiple revenue streams scale with platform adoption
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🤝</div>
                  <h4 className="font-semibold text-green-700 mb-2">Holder Alignment</h4>
                  <p className="text-sm text-green-600">
                    30% of all fees go to LOS holders automatically
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <h4 className="font-semibold text-green-700 mb-2">Self-Sustaining</h4>
                  <p className="text-sm text-green-600">
                    Revenue funds development and marketing for growth
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'governance':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🗳️ Democratic Governance</h2>
              <p className="text-lg text-indigo-100">
                CTO (Chief Technology Officer) voting system allows the community to democratically 
                elect new platform administrators.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🗳️ CTO Proposal Process</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Proposal Creation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Any LOS staker can create a CTO proposal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Voting Period</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Community votes on the proposal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Threshold Check</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Must meet minimum approval threshold</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Execution</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Admin authority transferred if approved</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">⚖️ Voting Requirements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Minimum Stake to Propose</span>
                      <span className="font-semibold text-purple-600">1,000 LOS</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Approval Threshold</span>
                      <span className="font-semibold text-green-600">66%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Voting Duration</span>
                      <span className="font-semibold text-blue-600">7 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">Voting Power</span>
                      <span className="font-semibold text-orange-600">Proportional to stake</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">👥 Community Benefits</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Democratic Control</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Community decides platform direction</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Transparency</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">All proposals and votes are on-chain</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Fair Representation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Voting power based on stake amount</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Emergency Override</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Community can replace problematic admins</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🔒 Security Measures</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="font-semibold text-yellow-800 mb-1">High Threshold</h4>
                      <p className="text-sm text-yellow-700">
                        66% approval required to prevent hostile takeovers
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-semibold text-blue-800 mb-1">Stake Requirement</h4>
                      <p className="text-sm text-blue-700">
                        Minimum stake prevents spam proposals
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <h4 className="font-semibold text-green-800 mb-1">Time Lock</h4>
                      <p className="text-sm text-green-700">
                        7-day voting period ensures thoughtful consideration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'technical-architecture':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-slate-600 to-gray-800 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">🏗️ Technical Architecture</h2>
              <p className="text-lg text-slate-100">
                9 Solana programs working together to create a complete NFT launchpad ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">🎨 Core Programs</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded">
                    <h4 className="font-semibold text-purple-800">Mega Launchpad Core</h4>
                    <p className="text-xs text-purple-600">Main platform program</p>
                    <code className="text-xs bg-purple-100 px-2 py-1 rounded font-bold text-purple-900">BioNVjt...Whdr</code>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-800">Price Oracle</h4>
                    <p className="text-xs text-blue-600">LOS price data</p>
                    <code className="text-xs bg-blue-100 px-2 py-1 rounded font-bold text-blue-900">B26WiD...F1D</code>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-800">Token Launch</h4>
                    <p className="text-xs text-green-600">Token economics</p>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded font-bold text-green-900">Eydws6...WCRw</code>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">⚡ Enhanced Programs</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded">
                    <h4 className="font-semibold text-orange-800">OTC Enhanced</h4>
                    <p className="text-xs text-orange-600">P2P trading</p>
                  </div>
                  <div className="p-3 bg-pink-50 rounded">
                    <h4 className="font-semibold text-pink-800">Airdrop Enhanced</h4>
                    <p className="text-xs text-pink-600">Merkle airdrops</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded">
                    <h4 className="font-semibold text-cyan-800">Vesting Enhanced</h4>
                    <p className="text-xs text-cyan-600">Token vesting</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <h4 className="font-semibold text-yellow-800">Token Lock Enhanced</h4>
                    <p className="text-xs text-yellow-600">Time locks</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <h4 className="font-semibold text-red-800">Monitoring System</h4>
                    <p className="text-xs text-red-600">Real-time monitoring</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">🔗 Integration Points</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Cross-Program Calls</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Programs communicate via invoke_signed</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Shared PDAs</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Deterministic account derivation</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Event System</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Real-time event logging</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Security Model</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Multi-sig and authority checks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4">🔐 Security Features</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">On-Chain Security</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Program-derived addresses (PDAs)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Authority validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Integer overflow protection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Reentrancy guards</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Audit & Verification</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Source code public on GitHub</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Security.txt embedded in programs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Ready for third-party audits</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Bug bounty program available</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4">🌐 Analos Blockchain</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-semibold text-blue-700 mb-2">High Performance</h4>
                  <p className="text-sm text-blue-600">
                    Fast transactions and low fees
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <h4 className="font-semibold text-blue-700 mb-2">Secure</h4>
                  <p className="text-sm text-blue-600">
                    Battle-tested Solana architecture
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🌱</div>
                  <h4 className="font-semibold text-blue-700 mb-2">Sustainable</h4>
                  <p className="text-sm text-blue-600">
                    Environmentally friendly blockchain
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-purple-600">
                🎨 Analos NFT Launchpad
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link 
                  href="/admin-login" 
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
