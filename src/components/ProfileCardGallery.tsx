'use client';

import React, { useState } from 'react';
import ProfileCard, { ProfileCardData } from './ProfileCard';

interface ProfileCardGalleryProps {
  className?: string;
}

const ProfileCardGallery: React.FC<ProfileCardGalleryProps> = ({ className = '' }) => {
  const [selectedVariant, setSelectedVariant] = useState<'standard' | 'premium' | 'legendary' | 'mythic'>('standard');
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Sample data for different tiers
  const sampleData: Record<string, ProfileCardData> = {
    common: {
      username: 'newuser',
      displayName: 'New User',
      bio: 'Just joined the Analos ecosystem! Excited to explore all the features.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newuser',
      twitterHandle: '@newuser',
      mintNumber: 1,
      tier: 'common',
      power: 50,
      status: 'active',
      totalMints: 1,
      achievements: ['First Mint'],
      badges: ['Newcomer'],
      referralCode: 'NEWUSER'
    },
    rare: {
      username: 'trader',
      displayName: 'Crypto Trader',
      bio: 'Active trader in the Analos ecosystem. Always looking for the next big opportunity.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader',
      twitterHandle: '@cryptotrader',
      website: 'https://trading.example.com',
      github: 'cryptotrader',
      mintNumber: 42,
      tier: 'rare',
      power: 150,
      status: 'active',
      totalMints: 15,
      achievements: ['First Trade', 'Volume Trader'],
      badges: ['Trader', 'Active'],
      referralCode: 'TRADER'
    },
    epic: {
      username: 'creator',
      displayName: 'NFT Creator',
      bio: 'Digital artist and NFT creator. Building the future of digital ownership on Analos.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator',
      twitterHandle: '@nftcreator',
      website: 'https://creator.example.com',
      github: 'nftcreator',
      discord: 'creator#1234',
      mintNumber: 1337,
      tier: 'epic',
      power: 300,
      status: 'active',
      totalMints: 50,
      totalVolume: 1000,
      achievements: ['First Collection', 'Volume Creator', 'Community Builder'],
      badges: ['Creator', 'Artist', 'Builder'],
      referralCode: 'CREATOR'
    },
    legendary: {
      username: 'whale',
      displayName: 'Analos Whale',
      bio: 'Early adopter and major supporter of the Analos ecosystem. Building the future together.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whale',
      twitterHandle: '@analoswhale',
      website: 'https://whale.example.com',
      github: 'analoswhale',
      discord: 'whale#9999',
      telegram: '@analoswhale',
      mintNumber: 1,
      tier: 'legendary',
      power: 500,
      status: 'active',
      totalMints: 200,
      totalVolume: 10000,
      achievements: ['Early Adopter', 'Whale Status', 'Ecosystem Supporter', 'Volume Leader'],
      badges: ['Whale', 'Early Adopter', 'Supporter', 'Leader'],
      referralCode: 'WHALE'
    },
    mythic: {
      username: 'founder',
      displayName: 'Analos Founder',
      bio: 'Founder and visionary behind the Analos ecosystem. Building the future of decentralized finance.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=founder',
      twitterHandle: '@analosfounder',
      website: 'https://analos.io',
      github: 'analosfounder',
      discord: 'founder#0001',
      telegram: '@analosfounder',
      mintNumber: 0,
      tier: 'mythic',
      power: 1000,
      status: 'active',
      totalMints: 1000,
      totalVolume: 100000,
      achievements: ['Founder', 'Visionary', 'Ecosystem Creator', 'Revolutionary', 'Legend'],
      badges: ['Founder', 'Visionary', 'Creator', 'Legend', 'Mythic'],
      referralCode: 'FOUNDER'
    }
  };

  const variants = [
    { key: 'standard', label: 'Standard', color: 'bg-gray-600' },
    { key: 'premium', label: 'Premium', color: 'bg-blue-600' },
    { key: 'legendary', label: 'Legendary', color: 'bg-yellow-600' },
    { key: 'mythic', label: 'Mythic', color: 'bg-purple-600' }
  ] as const;

  const sizes = [
    { key: 'small', label: 'Small' },
    { key: 'medium', label: 'Medium' },
    { key: 'large', label: 'Large' }
  ] as const;

  const tiers = [
    { key: 'common', label: 'Common', data: sampleData.common },
    { key: 'rare', label: 'Rare', data: sampleData.rare },
    { key: 'epic', label: 'Epic', data: sampleData.epic },
    { key: 'legendary', label: 'Legendary', data: sampleData.legendary },
    { key: 'mythic', label: 'Mythic', data: sampleData.mythic }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">🎨 Profile Card Gallery</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Variant Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Card Variants</h3>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.key}
                  onClick={() => setSelectedVariant(variant.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedVariant === variant.key
                      ? `${variant.color} text-white shadow-lg`
                      : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600/70'
                  }`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Card Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setSelectedSize(size.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSize === size.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600/70'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tier Showcase */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Tier Showcase</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.key} className="space-y-2">
              <h4 className="text-lg font-semibold text-white capitalize">
                {tier.label} Tier
              </h4>
              <ProfileCard
                data={tier.data}
                variant={selectedVariant}
                size={selectedSize}
                showDetails={true}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Variant Comparison */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Variant Comparison</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {variants.map((variant) => (
            <div key={variant.key} className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                {variant.label} Variant
              </h4>
              <ProfileCard
                data={sampleData.legendary}
                variant={variant.key}
                size="medium"
                showDetails={true}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size Comparison */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Size Comparison</h3>
        
        <div className="space-y-4">
          {sizes.map((size) => (
            <div key={size.key} className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                {size.label} Size
              </h4>
              <ProfileCard
                data={sampleData.epic}
                variant="premium"
                size={size.key}
                showDetails={true}
                className="w-full max-w-2xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCardGallery;
