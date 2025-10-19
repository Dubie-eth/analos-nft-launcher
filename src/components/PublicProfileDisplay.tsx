'use client';

import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, Globe, Github, Instagram, Linkedin, Youtube, Copy, ExternalLink, Trophy, Users, Star, Calendar, Image, Coins, Package, TrendingUp, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NFT {
  mint: string;
  name: string;
  image: string;
  collection: string;
  rarity: string;
  rarityScore: number;
  price?: number;
  priceChange24h?: number;
  lastSale?: number;
  traits: Array<{
    trait_type: string;
    value: string;
    rarity: number;
  }>;
}

interface Token {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price: number;
  priceChange24h: number;
  marketCap?: number;
  logo?: string;
}

interface Collection {
  name: string;
  symbol: string;
  description: string;
  image: string;
  floorPrice: number;
  volume24h: number;
  totalSupply: number;
  ownedCount: number;
  rarity: string;
  priceChange24h: number;
}

interface UserProfile {
  id: string;
  walletAddress: string;
  username: string;
  bio: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socials: {
    twitter: string;
    telegram: string;
    discord: string;
    website: string;
    github: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  favoriteCollections: string[];
  referralCode: string;
  totalReferrals: number;
  totalPoints: number;
  rank: number;
  privacyLevel: 'public' | 'friends' | 'private';
  allowDataExport: boolean;
  allowAnalytics: boolean;
  createdAt?: string;
  updatedAt?: string;
  // New fields for NFTs, tokens, and collections
  nfts?: NFT[];
  tokens?: Token[];
  collections?: Collection[];
  totalPortfolioValue?: number;
  portfolioChange24h?: number;
}

interface PublicProfileDisplayProps {
  userWallet: string;
  className?: string;
}

export default function PublicProfileDisplay({
  userWallet,
  className = ''
}: PublicProfileDisplayProps) {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'tokens' | 'collections'>('overview');

  useEffect(() => {
    const loadProfile = async () => {
      if (!userWallet) return;
      
      setLoading(true);
      try {
        // Load profile data
        const profileResponse = await fetch(`/api/user-profiles/${userWallet}`);
        
        if (profileResponse.ok) {
          const userProfile = await profileResponse.json();
          
          // Load additional data (NFTs, tokens, collections)
          const [nftsResponse, tokensResponse, collectionsResponse] = await Promise.all([
            fetch(`/api/user-nfts/${userWallet}`).catch(() => null),
            fetch(`/api/user-tokens/${userWallet}`).catch(() => null),
            fetch(`/api/user-collections/${userWallet}`).catch(() => null)
          ]);

          // Merge the data - ensure we extract the actual data from API responses
          const nftsData = nftsResponse?.ok ? await nftsResponse.json() : null;
          const tokensData = tokensResponse?.ok ? await tokensResponse.json() : null;
          const collectionsData = collectionsResponse?.ok ? await collectionsResponse.json() : null;

          const enhancedProfile = {
            ...userProfile,
            nfts: nftsData?.nfts || nftsData || [],
            tokens: tokensData?.tokens || tokensData || [],
            collections: collectionsData?.collections || collectionsData || [],
            totalPortfolioValue: 0, // Will be calculated
            portfolioChange24h: 0 // Will be calculated
          };

          // Calculate portfolio value - ensure data is array before calling reduce
          const nftValue = Array.isArray(enhancedProfile.nfts) ? enhancedProfile.nfts.reduce((sum: number, nft: NFT) => sum + (nft.price || 0), 0) : 0;
          const tokenValue = Array.isArray(enhancedProfile.tokens) ? enhancedProfile.tokens.reduce((sum: number, token: Token) => sum + (token.balance * token.price), 0) : 0;
          enhancedProfile.totalPortfolioValue = nftValue + tokenValue;

          setProfile(enhancedProfile);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userWallet]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'telegram': return <MessageCircle className="w-5 h-5" />;
      case 'discord': return <MessageCircle className="w-5 h-5" />;
      case 'website': return <Globe className="w-5 h-5" />;
      case 'github': return <Github className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return 'text-blue-400 hover:text-blue-300';
      case 'telegram': return 'text-blue-500 hover:text-blue-400';
      case 'discord': return 'text-indigo-400 hover:text-indigo-300';
      case 'website': return 'text-gray-400 hover:text-gray-300';
      case 'github': return 'text-gray-400 hover:text-gray-300';
      case 'instagram': return 'text-pink-400 hover:text-pink-300';
      case 'linkedin': return 'text-blue-600 hover:text-blue-500';
      case 'youtube': return 'text-red-500 hover:text-red-400';
      default: return 'text-gray-400 hover:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl overflow-hidden">
          {/* Banner skeleton */}
          <div className="h-48 bg-gray-700"></div>
          
          {/* Profile content skeleton */}
          <div className="p-6 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar skeleton */}
              <div className="w-32 h-32 bg-gray-600 rounded-full border-4 border-white"></div>
              
              {/* Info skeleton */}
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-600 rounded w-48"></div>
                <div className="h-4 bg-gray-600 rounded w-64"></div>
                <div className="flex gap-4">
                  <div className="h-6 bg-gray-600 rounded w-20"></div>
                  <div className="h-6 bg-gray-600 rounded w-20"></div>
                  <div className="h-6 bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`${className}`}>
        <div className={`rounded-lg shadow p-6 text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  // Don't show private profiles
  if (profile.privacyLevel === 'private') {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">This profile is private</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-r from-purple-600 to-blue-600">
          {profile.bannerImageUrl ? (
            <img 
              src={profile.bannerImageUrl} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <div className="text-white text-6xl opacity-20">🎨</div>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        {/* Profile Content */}
        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.profilePictureUrl ? (
                <img 
                  src={profile.profilePictureUrl} 
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Online indicator */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.username}</h1>
                  {profile.bio && (
                    <p className="text-gray-200 text-lg mb-4 max-w-2xl">{profile.bio}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm">Rank #{profile.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-400" />
                      <span className="text-sm">{profile.totalPoints} Points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-sm">{profile.totalReferrals} Referrals</span>
                    </div>
                    {profile.totalPortfolioValue && profile.totalPortfolioValue > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm">
                          ${profile.totalPortfolioValue.toLocaleString()} Portfolio
                        </span>
                      </div>
                    )}
                    {profile.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span className="text-sm">
                          Joined {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Code */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-gray-300 mb-2">Referral Code</div>
                  <div className="flex items-center gap-2">
                    <code className="text-white font-mono text-lg">{profile.referralCode}</code>
                    <button
                      onClick={() => copyToClipboard(profile.referralCode)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title="Copy referral code"
                    >
                      <Copy className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <nav className="flex space-x-8 border-b border-white/20">
              {[
                { id: 'overview', label: 'Overview', icon: <Star className="w-4 h-4" /> },
                { id: 'nfts', label: `NFTs (${profile.nfts?.length || 0})`, icon: <Image className="w-4 h-4" /> },
                { id: 'tokens', label: `Tokens (${profile.tokens?.length || 0})`, icon: <Coins className="w-4 h-4" /> },
                { id: 'collections', label: `Collections (${profile.collections?.length || 0})`, icon: <Package className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id 
                      ? 'border-white text-white' 
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Portfolio Summary */}
                {profile.totalPortfolioValue && profile.totalPortfolioValue > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Portfolio Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">${profile.totalPortfolioValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-300">Total Value</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{profile.nfts?.length || 0}</div>
                        <div className="text-sm text-gray-300">NFTs Owned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{profile.tokens?.length || 0}</div>
                        <div className="text-sm text-gray-300">Tokens Held</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity or Featured Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top NFTs */}
                  {profile.nfts && profile.nfts.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Top NFTs
                      </h3>
                      <div className="space-y-3">
                        {profile.nfts.slice(0, 3).map((nft, index) => (
                          <div key={nft.mint} className="flex items-center gap-3">
                            <img 
                              src={nft.image} 
                              alt={nft.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium">{nft.name}</div>
                              <div className="text-sm text-gray-300">{nft.collection}</div>
                            </div>
                            {nft.price && (
                              <div className="text-right">
                                <div className="text-white font-medium">${nft.price.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">{nft.rarity}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Tokens */}
                  {profile.tokens && profile.tokens.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5" />
                        Top Tokens
                      </h3>
                      <div className="space-y-3">
                        {profile.tokens.slice(0, 3).map((token, index) => (
                          <div key={token.mint} className="flex items-center gap-3">
                            {token.logo ? (
                              <img 
                                src={token.logo} 
                                alt={token.symbol}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-white font-medium">{token.symbol}</div>
                              <div className="text-sm text-gray-300">{token.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">
                                ${(token.balance * token.price).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {token.balance.toLocaleString()} {token.symbol}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'nfts' && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    NFT Collection ({profile.nfts?.length || 0})
                  </h3>
                  {profile.nfts && profile.nfts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.nfts.map((nft) => (
                        <div key={nft.mint} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                          <img 
                            src={nft.image} 
                            alt={nft.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="text-white font-semibold mb-1">{nft.name}</h4>
                            <p className="text-gray-300 text-sm mb-2">{nft.collection}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                {nft.rarity}
                              </span>
                              {nft.price && (
                                <span className="text-white font-medium">${nft.price.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center py-8">No NFTs found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Token Holdings ({profile.tokens?.length || 0})
                  </h3>
                  {profile.tokens && profile.tokens.length > 0 ? (
                    <div className="space-y-4">
                      {profile.tokens.map((token) => (
                        <div key={token.mint} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-4">
                            {token.logo ? (
                              <img 
                                src={token.logo} 
                                alt={token.symbol}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="text-white font-bold">{token.symbol.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <div className="text-white font-semibold">{token.symbol}</div>
                              <div className="text-gray-300 text-sm">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">
                              ${(token.balance * token.price).toLocaleString()}
                            </div>
                            <div className="text-gray-300 text-sm">
                              {token.balance.toLocaleString()} {token.symbol}
                            </div>
                            <div className={`text-xs ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center py-8">No tokens found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'collections' && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Collections ({profile.collections?.length || 0})
                  </h3>
                  {profile.collections && profile.collections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.collections.map((collection, index) => (
                        <div key={index} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                          <img 
                            src={collection.image} 
                            alt={collection.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="text-white font-semibold mb-1">{collection.name}</h4>
                            <p className="text-gray-300 text-sm mb-2">{collection.description}</p>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">
                                {collection.ownedCount} owned
                              </span>
                              <span className="text-white font-medium">
                                ${collection.floorPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center py-8">No collections found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {Object.entries(profile.socials).some(([_, url]) => url) && (
            <div className="mt-8 pt-6 border-t border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(profile.socials).map(([platform, url]) => {
                  if (!url) return null;
                  
                  return (
                    <a
                      key={platform}
                      href={url.startsWith('http') ? url : `https://${platform}.com/${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg
                        bg-white/10 backdrop-blur-sm border border-white/20
                        hover:bg-white/20 transition-all duration-200
                        ${getSocialColor(platform)}
                      `}
                    >
                      {getSocialIcon(platform)}
                      <span className="capitalize">{platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Favorite Collections */}
          {profile.favoriteCollections && profile.favoriteCollections.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">Favorite Collections</h3>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteCollections.map((collection, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm border border-white/20"
                  >
                    {collection}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg font-semibold mb-2">Wallet Address</h3>
                <code className="text-gray-300 font-mono text-sm">
                  {profile.walletAddress.slice(0, 8)}...{profile.walletAddress.slice(-8)}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(profile.walletAddress)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy wallet address"
              >
                <Copy className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
