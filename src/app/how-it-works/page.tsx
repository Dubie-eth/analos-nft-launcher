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
    { id: 'whitelist-system', title: 'Whitelist System', icon: '📝' },
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
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">🎯 For Creators</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Easy Collection Launch</h4>
                      <p className="text-sm text-gray-600">Launch NFT collections with our guided wizard</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Flexible Launch Modes</h4>
                      <p className="text-sm text-gray-600">NFT-Only or NFT-to-Token with bonding curves</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Whitelist Management</h4>
                      <p className="text-sm text-gray-600">3-tier whitelist system with incremental pricing</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Creator Verification</h4>
                      <p className="text-sm text-gray-600">On-chain social verification and trust scores</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">👥 For Users</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Whitelist Access</h4>
                      <p className="text-sm text-gray-600">Early access to collections at discounted prices</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">NFT Staking</h4>
                      <p className="text-sm text-gray-600">Stake NFTs to earn token rewards based on rarity</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">LOS Staking</h4>
                      <p className="text-sm text-gray-600">Stake LOS to earn 30% of all platform fees</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold">Governance Rights</h4>
                      <p className="text-sm text-gray-600">Vote on platform changes via CTO proposals</p>
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">📋 Collection Setup Process</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold">Basic Information</h4>
                        <p className="text-sm text-gray-600">Set collection name, symbol, metadata URIs</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold">Supply & Pricing</h4>
                        <p className="text-sm text-gray-600">Define max supply, mint price, reveal threshold</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold">Launch Mode</h4>
                        <p className="text-sm text-gray-600">Choose NFT-Only or NFT-to-Token mode</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold">Whitelist Stages</h4>
                        <p className="text-sm text-gray-600">Configure 3-tier whitelist with pricing</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h4 className="font-semibold">Deploy Collection</h4>
                        <p className="text-sm text-gray-600">Launch your collection on Analos blockchain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🎭 Rarity System</h3>
                  <p className="text-gray-600 mb-4">
                    Each NFT gets assigned a rarity tier that determines staking rewards and token multipliers.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">Legendary</span>
                      <span className="text-yellow-600 font-bold">5x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">Epic</span>
                      <span className="text-purple-600 font-bold">3x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">Rare</span>
                      <span className="text-blue-600 font-bold">2x Multiplier</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">Common</span>
                      <span className="text-gray-600 font-bold">1x Multiplier</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">👤 Creator Profiles</h3>
                  <p className="text-gray-600 mb-4">
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">📈 Bonding Curve System</h3>
                  <p className="text-gray-600 mb-4">
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

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🔄 Token Claims</h3>
                  <p className="text-gray-600 mb-4">
                    NFT holders can claim tokens based on their rarity tier.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Legendary NFT</span>
                      <span className="font-bold text-yellow-600">5,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Epic NFT</span>
                      <span className="font-bold text-purple-600">3,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Rare NFT</span>
                      <span className="font-bold text-blue-600">2,000 tokens</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Common NFT</span>
                      <span className="font-bold text-gray-600">1,000 tokens</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🔥 Burn for Tokens</h3>
                  <p className="text-gray-600 mb-4">
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

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">💰 Revenue Sharing</h3>
                  <p className="text-gray-600 mb-4">
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🎨 NFT Staking</h3>
                  <p className="text-gray-600 mb-4">
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

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">💎 LOS Token Staking</h3>
                  <p className="text-gray-600 mb-4">
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">📊 Fee Distribution</h3>
                  <p className="text-gray-600 mb-4">
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

                <div className="bg-white p-6 rounded-lg border">
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

      case 'whitelist-system':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">📝 Whitelist System</h2>
              <p className="text-lg text-orange-100">
                3-tier whitelist system with incremental pricing and supply limits for fair distribution.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-purple-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                  <h3 className="text-xl font-bold text-purple-800">Early Birds</h3>
                  <p className="text-sm text-gray-600">Most exclusive tier</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-semibold">20% discount</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supply:</span>
                    <span className="font-semibold">100 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max per wallet:</span>
                    <span className="font-semibold">2 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Duration:</span>
                    <span className="font-semibold">24 hours</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-blue-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                  <h3 className="text-xl font-bold text-blue-800">Friends</h3>
                  <p className="text-sm text-gray-600">Community supporters</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-semibold">10% discount</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supply:</span>
                    <span className="font-semibold">200 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max per wallet:</span>
                    <span className="font-semibold">3 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Duration:</span>
                    <span className="font-semibold">48 hours</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-green-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                  <h3 className="text-xl font-bold text-green-800">Community</h3>
                  <p className="text-sm text-gray-600">General community</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-semibold">5% discount</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supply:</span>
                    <span className="font-semibold">300 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max per wallet:</span>
                    <span className="font-semibold">5 NFTs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Duration:</span>
                    <span className="font-semibold">72 hours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-xl font-bold mb-4">🔐 Merkle Proof Verification</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">How Whitelist Works</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold mt-1">1.</span>
                      <span>Creator generates merkle tree from whitelist addresses</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold mt-1">2.</span>
                      <span>Merkle root is stored on-chain for verification</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold mt-1">3.</span>
                      <span>Users provide merkle proof when minting</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-600 font-bold mt-1">4.</span>
                      <span>Smart contract verifies proof on-chain</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Gas-efficient verification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Privacy-preserving (no address list on-chain)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Tamper-proof whitelist</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Fair distribution mechanism</span>
                    </li>
                  </ul>
                </div>
              </div>
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">💰 Fee Management</h3>
                  <p className="text-gray-600 mb-4">
                    Adjust platform fees to optimize revenue and user experience.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>NFT Mint Fee</span>
                      <span className="font-semibold text-purple-600">2.5% (adjustable)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Token Launch Fee</span>
                      <span className="font-semibold text-blue-600">5% (adjustable)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Trading Fee</span>
                      <span className="font-semibold text-green-600">1% (adjustable)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">📊 Revenue Distribution</h3>
                  <p className="text-gray-600 mb-4">
                    Control how platform revenue is distributed across stakeholders.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>LOS Holders</span>
                      <span className="font-semibold text-green-600">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Platform Treasury</span>
                      <span className="font-semibold text-blue-600">40%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Development</span>
                      <span className="font-semibold text-purple-600">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Marketing</span>
                      <span className="font-semibold text-orange-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🚨 Emergency Controls</h3>
                  <p className="text-gray-600 mb-4">
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

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">📈 Platform Limits</h3>
                  <p className="text-gray-600 mb-4">
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
              <div className="bg-white p-6 rounded-lg border">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="text-xl font-bold text-purple-800">NFT Minting Fees</h3>
                  <p className="text-sm text-gray-600">2.5% on all NFT mints</p>
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

              <div className="bg-white p-6 rounded-lg border">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="text-xl font-bold text-blue-800">Token Launch Fees</h3>
                  <p className="text-sm text-gray-600">5% on token launches</p>
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

              <div className="bg-white p-6 rounded-lg border">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">💱</div>
                  <h3 className="text-xl font-bold text-green-800">Trading Fees</h3>
                  <p className="text-sm text-gray-600">1% on secondary trading</p>
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

            <div className="bg-white p-6 rounded-lg border">
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
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">🗳️ CTO Proposal Process</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold">Proposal Creation</h4>
                        <p className="text-sm text-gray-600">Any LOS staker can create a CTO proposal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold">Voting Period</h4>
                        <p className="text-sm text-gray-600">Community votes on the proposal</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold">Threshold Check</h4>
                        <p className="text-sm text-gray-600">Must meet minimum approval threshold</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold">Execution</h4>
                        <p className="text-sm text-gray-600">Admin authority transferred if approved</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">⚖️ Voting Requirements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Minimum Stake to Propose</span>
                      <span className="font-semibold text-purple-600">1,000 LOS</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Approval Threshold</span>
                      <span className="font-semibold text-green-600">66%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Voting Duration</span>
                      <span className="font-semibold text-blue-600">7 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>Voting Power</span>
                      <span className="font-semibold text-orange-600">Proportional to stake</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-xl font-bold mb-4">👥 Community Benefits</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Democratic Control</h4>
                        <p className="text-sm text-gray-600">Community decides platform direction</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Transparency</h4>
                        <p className="text-sm text-gray-600">All proposals and votes are on-chain</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Fair Representation</h4>
                        <p className="text-sm text-gray-600">Voting power based on stake amount</p>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <div>
                        <h4 className="font-semibold">Emergency Override</h4>
                        <p className="text-sm text-gray-600">Community can replace problematic admins</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg border">
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
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">🎨 Core Programs</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded">
                    <h4 className="font-semibold text-purple-800">Mega Launchpad Core</h4>
                    <p className="text-xs text-purple-600">Main platform program</p>
                    <code className="text-xs bg-purple-100 px-1 rounded">BioNVjt...Whdr</code>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-800">Price Oracle</h4>
                    <p className="text-xs text-blue-600">LOS price data</p>
                    <code className="text-xs bg-blue-100 px-1 rounded">B26WiD...F1D</code>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-800">Token Launch</h4>
                    <p className="text-xs text-green-600">Token economics</p>
                    <code className="text-xs bg-green-100 px-1 rounded">Eydws6...WCRw</code>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border">
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

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-xl font-bold mb-4">🔗 Integration Points</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Cross-Program Calls</h4>
                    <p className="text-xs text-gray-600">Programs communicate via invoke_signed</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Shared PDAs</h4>
                    <p className="text-xs text-gray-600">Deterministic account derivation</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Event System</h4>
                    <p className="text-xs text-gray-600">Real-time event logging</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold">Security Model</h4>
                    <p className="text-xs text-gray-600">Multi-sig and authority checks</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
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
            <div className="bg-white rounded-lg border p-6 sticky top-8">
              <h2 className="text-lg font-bold mb-4">How It Works</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
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
