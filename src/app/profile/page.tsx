'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
// import CompleteProfileManager from '@/components/CompleteProfileManager'; // Temporarily disabled to fix build
import PublicProfileDisplay from '@/components/PublicProfileDisplay';
import SimpleProfileEditor from '@/components/SimpleProfileEditor';
import NFTCard from '@/components/NFTCard';
import ProfileNFTDisplay from '@/components/ProfileNFTDisplay';
import { getFreshExample } from '@/lib/wallet-examples';

interface UserNFT {
  mint: string;
  collection: string;
  name: string;
  image: string;
  price?: number;
  rarity?: string;
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UserCollection {
  name: string;
  symbol: string;
  description: string;
  image: string;
  floorPrice: number;
  volume24h: number;
  totalSupply: number;
  ownedCount: number;
}

interface CreatorReward {
  id: string;
  reward_type: string;
  amount: number;
  token_symbol: string;
  status: string;
  created_at: string;
  saved_collections: {
    collection_name: string;
    collection_symbol: string;
  };
}

interface RewardsSummary {
  total_claimable: number;
  total_claimed: number;
  pending_rewards: number;
}

export default function ProfilePage() {
  const { publicKey, connected, disconnect, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [uiNFTs, setUiNFTs] = useState<UserNFT[]>([]);
  const [uiCollections, setUiCollections] = useState<UserCollection[]>([]);
  const [rewards, setRewards] = useState<CreatorReward[]>([]);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary>({
    total_claimable: 0,
    total_claimed: 0,
    pending_rewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile-nft' | 'overview' | 'nfts' | 'collections' | 'rewards' | 'activity' | 'edit' | 'update-profile'>('profile-nft');
  const [exampleData, setExampleData] = useState<any>(null);
  const [pageAccessConfig, setPageAccessConfig] = useState<any>(null);
  const [isPublicAccess, setIsPublicAccess] = useState(false);
  const [useSimpleEditor, setUseSimpleEditor] = useState(true);
  const [profilePricing, setProfilePricing] = useState<{
    tier: string;
    price: number;
    currency: string;
  } | null>(null);
  const [username, setUsername] = useState('');
  const [userProfileNFT, setUserProfileNFT] = useState<UserNFT | null>(null);
  const [mintNumber, setMintNumber] = useState<number | null>(null);
  const [currentCardBackground, setCurrentCardBackground] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [revealedNFT, setRevealedNFT] = useState<UserNFT | null>(null);
  const [revealAnimation, setRevealAnimation] = useState<'cover' | 'dripping' | 'revealed'>('cover');

  // Baseball card background examples for users to preview
  const cardBackgrounds = [
    {
      name: 'Classic',
      gradient: 'from-yellow-100 via-yellow-50 to-yellow-200',
      accent: 'yellow',
      pattern: 'classic',
      description: 'Classic 1950s Topps style with vintage borders',
      textColor: 'text-black',
      borderColor: 'border-yellow-800',
      rarity: 'Common'
    },
    {
      name: 'Rookie',
      gradient: 'from-blue-100 via-blue-50 to-blue-200',
      accent: 'blue',
      pattern: 'rookie',
      description: 'Rookie card style with blue borders and stars',
      textColor: 'text-black',
      borderColor: 'border-blue-800',
      rarity: 'Common'
    },
    {
      name: 'All-Star',
      gradient: 'from-red-100 via-red-50 to-red-200',
      accent: 'red',
      pattern: 'allstar',
      description: 'All-Star edition with red borders and gold accents',
      textColor: 'text-black',
      borderColor: 'border-red-800',
      rarity: 'Rare'
    },
    {
      name: 'Hall of Fame',
      gradient: 'from-purple-100 via-purple-50 to-purple-200',
      accent: 'purple',
      pattern: 'hof',
      description: 'Hall of Fame variant with purple borders and silver',
      textColor: 'text-black',
      borderColor: 'border-purple-800',
      rarity: 'Epic'
    },
    {
      name: 'World Series',
      gradient: 'from-green-100 via-green-50 to-green-200',
      accent: 'green',
      pattern: 'worldseries',
      description: 'World Series champion with green borders and gold',
      textColor: 'text-black',
      borderColor: 'border-green-800',
      rarity: 'Legendary'
    },
    {
      name: 'MFPurrs Cosmic',
      gradient: 'from-pink-100 via-purple-50 to-indigo-200',
      accent: 'pink',
      pattern: 'mfpurrs',
      description: 'Ultra-Rare MFPurrs Cosmic variant with space backgrounds',
      textColor: 'text-black',
      borderColor: 'border-pink-800',
      rarity: 'Ultra-Rare',
      backgroundImage: '/images/backgrounds/mfpurrs-1.png'
    },
    {
      name: 'MFPurrs Galaxy',
      gradient: 'from-purple-100 via-indigo-50 to-pink-200',
      accent: 'purple',
      pattern: 'mfpurrs',
      description: 'Ultra-Rare MFPurrs Galaxy variant with nebula effects',
      textColor: 'text-black',
      borderColor: 'border-purple-800',
      rarity: 'Ultra-Rare',
      backgroundImage: '/images/backgrounds/mfpurrs-2.png'
    },
    {
      name: 'MFPurrs Aurora',
      gradient: 'from-indigo-100 via-pink-50 to-purple-200',
      accent: 'indigo',
      pattern: 'mfpurrs',
      description: 'Ultra-Rare MFPurrs Aurora variant with rainbow lights',
      textColor: 'text-black',
      borderColor: 'border-indigo-800',
      rarity: 'Ultra-Rare',
      backgroundImage: '/images/backgrounds/mfpurrs-3.png'
    },
    {
      name: 'Cosmic',
      gradient: 'from-indigo-100 via-purple-50 to-pink-200',
      accent: 'indigo',
      pattern: 'cosmic',
      description: 'Legendary Cosmic variant with starfield effects',
      textColor: 'text-black',
      borderColor: 'border-indigo-800',
      rarity: 'Legendary'
    },
    {
      name: 'Diamond',
      gradient: 'from-gray-100 via-white to-gray-200',
      accent: 'gray',
      pattern: 'diamond',
      description: 'Ultra-Rare Diamond variant with holographic effects',
      textColor: 'text-black',
      borderColor: 'border-gray-800',
      rarity: 'Ultra-Rare'
    }
  ];
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });
  
  // Profile form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [website, setWebsite] = useState('');
  const [discord, setDiscord] = useState('');
  const [github, setGithub] = useState('');
  const [telegram, setTelegram] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, create a local URL (in production, you'd upload to IPFS or a CDN)
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'avatar') {
        setAvatarUrl(result);
      } else {
        setBannerUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Check username availability
  const checkUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking...' });

    try {
      const response = await fetch(`/api/profile-nft/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (data.success) {
        setUsernameStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: data.error || 'Invalid username'
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({
        checking: false,
        available: null,
        message: 'Failed to check username'
      });
    }
  };

  // Fetch pricing for Profile NFT
  const fetchProfilePricing = async (username: string) => {
    if (!username.trim()) return;
    
    try {
      const response = await fetch(`/api/pricing?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (data.success) {
        setProfilePricing({
          tier: data.tier,
          price: data.price,
          currency: data.currency
        });
      } else {
        // Clear pricing if there's an error (like username too short)
        setProfilePricing(null);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setProfilePricing(null);
    }
  };

  // Fetch current mint count
  const fetchMintCount = async () => {
    try {
      // Use the correct API route
      const response = await fetch('/api/profile-nft/mint-counter');
      const data = await response.json();

      if (data.success) {
        // Prefer nextMintNumber if provided; fallback to currentMintNumber
        const nextNum =
          typeof data.nextMintNumber === 'number'
            ? data.nextMintNumber
            : typeof data.currentMintNumber === 'number'
            ? (data.currentMintNumber as number)
            : 1;
        setMintNumber(nextNum);
      }
    } catch (error) {
      console.error('Error fetching mint count:', error);
    }
  };

  // Trigger NFT reveal animation
  const triggerReveal = (nft: UserNFT) => {
    setRevealedNFT(nft);
    setShowReveal(true);
    setRevealAnimation('cover');
    
    // Start the reveal sequence
    setTimeout(() => {
      setRevealAnimation('dripping');
    }, 1000);
    
    setTimeout(() => {
      setRevealAnimation('revealed');
    }, 3000);
  };

  // Check page access configuration and load user data
  useEffect(() => {
    const checkPageAccessAndLoadData = async () => {
      try {
        // Check page access first
        const response = await fetch('/api/page-access/profile');
        let publicAccess = false;
        
        if (response.ok) {
          const config = await response.json();
          setPageAccessConfig(config);
          publicAccess = config.publicAccess && !config.isLocked;
          setIsPublicAccess(publicAccess);
        } else {
        // Default to requiring wallet if we can't check
        setIsPublicAccess(false);
      }

    // Generate fresh example data each time
    setExampleData(getFreshExample(publicKey?.toString()));
    
      // If public access is allowed and no wallet connected, show public view
        if (publicAccess && (!publicKey || !connected)) {
        setLoading(false);
        return;
      }

      // If wallet is required but not connected, show connect prompt
        if (!publicAccess && (!publicKey || !connected)) {
        setLoading(false);
        return;
      }

        // Load LOS balance (using SOL balance for now, will be updated to LOS token)
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);

        console.log('🔍 Loading user NFTs from API...');
        
        // Load user NFTs from API
        try {
          const nftsResponse = await fetch(`/api/user-nfts/${publicKey.toString()}`);
          const nftsData = await nftsResponse.json();
          
          if (nftsData.nfts && nftsData.nfts.length > 0) {
            console.log(`✅ Loaded ${nftsData.nfts.length} NFTs from blockchain`);
            
            const mappedNFTs = nftsData.nfts.map((nft: any) => ({
              mint: nft.mint,
              collection: nft.collectionName || 'Unknown Collection',
              name: nft.name || 'Unnamed NFT',
              image: nft.uri || '/api/placeholder/400/400',
              collectionAddress: nft.collectionAddress,
              description: nft.description,
              attributes: nft.attributes || []
            }));
            
            // Find Profile NFT (symbol is 'PROFILE')
            const profileNFT = mappedNFTs.find((nft: any) => 
              nft.name.includes('@') || 
              nft.description?.includes('Profile NFT') ||
              nft.attributes?.some((attr: any) => attr.trait_type === 'Type' && attr.value === 'Profile NFT')
            );
            
            if (profileNFT) {
              console.log('🎭 Found Profile NFT:', profileNFT.name);
              setUserProfileNFT(profileNFT);
            }
            
            setUiNFTs(mappedNFTs);
          } else {
            console.log('ℹ️ No NFTs found for this wallet');
            setUiNFTs([]);
            setUserProfileNFT(null);
          }
          
          // Fetch current mint count for preview
          fetchMintCount();
        } catch (error) {
          console.error('❌ Error loading NFTs:', error);
          setUiNFTs([]);
        }

        // Load collections from blockchain
        console.log('📦 Loading collections from blockchain...');
        const collectionProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
        console.log('🔗 NFT Launchpad Program:', collectionProgramId.toString());

        try {
          const collectionAccounts = await connection.getProgramAccounts(collectionProgramId);
          console.log('✅ Loaded', collectionAccounts.length, 'collections from blockchain');
          
          // Process collections (this would need to be implemented based on your program structure)
          setUiCollections([]);
        } catch (error) {
          console.error('❌ Error loading collections:', error);
          setUiCollections([]);
        }

        // Load saved collections
        const collectionsResponse = await fetch(`/api/collections/save?userWallet=${publicKey.toString()}`);
        const collectionsData = await collectionsResponse.json();
        
        if (collectionsData.success) {
          setUiCollections(collectionsData.collections.map((col: any) => ({
            name: col.collection_name,
            symbol: col.collection_symbol,
            description: col.description,
            image: '/default-collection.png',
            floorPrice: 0,
            volume24h: 0,
            totalSupply: col.total_supply,
            ownedCount: 0
          })));
        }

        // Load creator rewards
        const rewardsResponse = await fetch(`/api/rewards?userWallet=${publicKey.toString()}`);
        const rewardsData = await rewardsResponse.json();
        
        if (rewardsData.success) {
          setRewards(rewardsData.rewards);
          setRewardsSummary(rewardsData.summary);
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error checking page access or loading user data:', error);
        setLoading(false);
      }
    };

    checkPageAccessAndLoadData();
  }, [publicKey, connected]);

  // Show loading state while checking page access
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show connect wallet prompt only if wallet is required and not connected
  if (!isPublicAccess && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-300 mb-8">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  const handleClaimRewards = async () => {
    if (!publicKey) return;

    setClaiming(true);
    try {
      const claimableRewards = rewards.filter(r => r.status === 'claimable');
      const rewardIds = claimableRewards.map(r => r.id);

      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          rewardIds: rewardIds,
          txSignature: 'placeholder-tx-signature' // In real implementation, this would be the actual transaction signature
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully claimed ${result.totalClaimed} tokens!`);
        // Reload data
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards');
    } finally {
      setClaiming(false);
    }
  };

  const tabs = connected ? [
    { id: 'profile-nft', label: 'Profile NFT', icon: '🎭' },
    ...(userProfileNFT ? [{ id: 'update-profile', label: 'Update Profile', icon: '🔄' }] : []),
    { id: 'overview', label: 'Overview', icon: '⭐' },
    { id: 'nfts', label: `NFTs (${uiNFTs.length})`, icon: '🎨' },
    { id: 'collections', label: `Collections (${uiCollections.length})`, icon: '📦' },
    { id: 'rewards', label: `Rewards (${rewards.length})`, icon: '💰' },
    { id: 'activity', label: 'Activity', icon: '📊' }
  ] : [
    { id: 'overview', label: 'Community Overview', icon: '⭐' },
    { id: 'nfts', label: 'Public NFTs', icon: '🎨' },
    { id: 'collections', label: 'Public Collections', icon: '📦' },
    { id: 'activity', label: 'Public Activity', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
            🎨 Your Profile
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Manage your profile, showcase your NFTs, and connect with the community
          </p>
        </div>

        {/* Wallet Info Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {connected ? publicKey?.toString().slice(0, 2).toUpperCase() : '👤'}
                </span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {connected ? 'Your Profile' : 'Public Profile View'}
                </h2>
                <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                  {connected ? (
                    <>
                      <div className="break-all">Wallet: {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-6)}</div>
                      <div>LOS Balance: {solBalance.toFixed(4)} LOS</div>
                      <div>Member Since: {new Date().toLocaleDateString()}</div>
                    </>
                  ) : (
                    <>
                      <div>Connect your wallet to view your personal profile</div>
                      <div>Public access enabled - view community profiles</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {connected && (
              <button
                onClick={disconnect}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Disconnect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎨</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{uiNFTs.length}</div>
            <div className="text-xs sm:text-sm text-gray-300">Total NFTs</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📦</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{uiCollections.length}</div>
            <div className="text-xs sm:text-sm text-gray-300">Collections Created</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💎</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">$0</div>
            <div className="text-xs sm:text-sm text-gray-300">Total Spent</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⭐</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">None</div>
            <div className="text-xs sm:text-sm text-gray-300">Favorite Collection</div>
          </div>
        </div>

        {/* Profile NFT Showcase - Only show if user has a Profile NFT */}
        {connected && userProfileNFT && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-purple-500/30">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                  🎭 Your Profile NFT
                </h2>
                <p className="text-sm sm:text-base text-gray-300">
                  Your unique identity on the Analos platform
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <ProfileNFTDisplay
                  nft={{
                    ...userProfileNFT,
                    description: userProfileNFT.description || 'Profile NFT',
                    attributes: userProfileNFT.attributes || []
                  }}
                  onView={() => {
                    window.open(`https://explorer.analos.io/address/${userProfileNFT.mint}`, '_blank');
                  }}
                  onTrade={() => {
                    // TODO: Navigate to marketplace or listing page
                    alert('🚧 Profile NFT trading coming soon!');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-6 sm:mb-8">
          <nav className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm md:text-base
                  ${activeTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                  }
                `}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 sm:space-y-8">
          {activeTab === 'profile-nft' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Profile Card Preview Section */}
              <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-purple-500/30">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                    🎭 Create Your Profile NFT
                  </h2>
                  <p className="text-sm sm:text-base text-gray-300">
                    Set up your blockchain profile and mint your unique NFT
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  {/* Profile Card Preview */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-white">Your Profile Card Preview</h3>
                      <button className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium text-sm sm:text-base">
                        Standard Edition
                      </button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-400/50">
                      <p className="text-sm text-purple-300 mb-4">
                        This is a preview of your standard profile card. Upon minting, you may receive an ultra-rare Matrix variant! 🎆
                      </p>
                      
                      {/* Blind Mint Information */}
                      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30 mb-4">
                        <h4 className="text-yellow-300 font-semibold mb-2">🎲 Blind Mint Information</h4>
                        <div className="text-sm text-yellow-200 space-y-1">
                          <p>• <strong>Standard Edition:</strong> Common profile cards with basic traits</p>
                          <p>• <strong>Rare Variants:</strong> Matrix-themed backgrounds and special effects</p>
                          <p>• <strong>Ultra-Rare:</strong> MFPurrs backgrounds with unique animations</p>
                          <p>• <strong>Legendary:</strong> Exclusive traits and special community access</p>
                        </div>
                      </div>
                      
                      {/* Profile Card Preview */}
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <h3 className="text-lg sm:text-xl font-semibold text-white">Your Profile Card Preview</h3>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {cardBackgrounds.map((bg, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentCardBackground(index)}
                                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                  currentCardBackground === index
                                    ? 'bg-white text-black'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {bg.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Baseball Card Design */}
                        <div className="relative max-w-sm mx-auto">
                          <div className={`bg-gradient-to-br ${cardBackgrounds[currentCardBackground].gradient} rounded-lg p-3 sm:p-4 shadow-2xl border-4 ${cardBackgrounds[currentCardBackground].borderColor} transform hover:scale-105 transition-all duration-300 relative overflow-hidden`}>
                            {/* Custom Background Image */}
                            {cardBackgrounds[currentCardBackground].backgroundImage && (
                              <div className="absolute inset-0 opacity-20">
                                <img src={cardBackgrounds[currentCardBackground].backgroundImage} alt="Card Background" className="w-full h-full object-cover" />
                              </div>
                            )}
                            
                            {/* Card Border Pattern */}
                            <div className="absolute inset-1 border-2 border-black rounded-md z-10"></div>
                            
                            {/* Rarity Badge */}
                            <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded text-xs font-bold ${
                              cardBackgrounds[currentCardBackground].rarity === 'Ultra-Rare' ? 'bg-pink-500 text-white' :
                              cardBackgrounds[currentCardBackground].rarity === 'Legendary' ? 'bg-purple-500 text-white' :
                              cardBackgrounds[currentCardBackground].rarity === 'Epic' ? 'bg-blue-500 text-white' :
                              cardBackgrounds[currentCardBackground].rarity === 'Rare' ? 'bg-green-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {cardBackgrounds[currentCardBackground].rarity}
                            </div>
                            
                            {/* Banner Image */}
                            {bannerUrl && (
                              <div className="relative mb-3 rounded-md overflow-hidden z-10">
                                <img src={bannerUrl} alt="Banner" className="w-full h-16 object-cover" />
                                <div className="absolute inset-0 bg-black/20"></div>
                              </div>
                            )}
                            
                            {/* Card Header */}
                            <div className="text-center mb-3 relative z-10">
                              <h3 className={`text-sm font-bold ${cardBackgrounds[currentCardBackground].textColor} mb-1`}>ANALOS PROFILE CARDS</h3>
                              <p className={`text-xs ${cardBackgrounds[currentCardBackground].textColor} opacity-70`}>2024 Series</p>
                            </div>
                            
                            {/* Profile Section */}
                            <div className="text-center mb-3 relative z-10">
                              <div className="relative inline-block mb-2">
                                <div className={`w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-xl font-bold ${cardBackgrounds[currentCardBackground].textColor} overflow-hidden mx-auto border-2 border-black`}>
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</span>
                                  )}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-white">
                                  <span className="text-white text-xs font-bold">
                                    {userProfileNFT ? 
                                      userProfileNFT.attributes?.find(attr => attr.trait_type === 'Edition')?.value || '1' : 
                                      (mintNumber ? mintNumber : '?')
                                    }
                                  </span>
                                </div>
                              </div>
                              
                              <h4 className={`text-sm font-bold ${cardBackgrounds[currentCardBackground].textColor} mb-1`}>{displayName || 'Your Name'}</h4>
                              <p className={`text-xs ${cardBackgrounds[currentCardBackground].textColor} opacity-80 mb-1`}>@{username || 'username'}</p>
                              {bio && (
                                <p className={`text-xs ${cardBackgrounds[currentCardBackground].textColor} opacity-70 leading-tight`}>{bio}</p>
                              )}
                            </div>
                            
                            {/* Stats Section */}
                            <div className="bg-white/80 rounded border border-black p-2 mb-3 relative z-10">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-center">
                                  <p className="font-bold text-black">REFERRAL</p>
                                  <p className="font-bold text-black">{username ? username.toUpperCase() : 'USER'}</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-bold text-black">TIER</p>
                                  <p className="font-bold text-black">{cardBackgrounds[currentCardBackground].name.toUpperCase()}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Footer */}
                            <div className="text-center relative z-10">
                              <p className={`text-xs ${cardBackgrounds[currentCardBackground].textColor} opacity-60`}>launchonlos.fun • Analos</p>
                            </div>
                            
                            {/* Background Pattern Overlay */}
                            <div className="absolute inset-0 opacity-5 z-0">
                              {cardBackgrounds[currentCardBackground].pattern === 'classic' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'rookie' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'allstar' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'hof' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'worldseries' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'mfpurrs' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'cosmic' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
                              )}
                              {cardBackgrounds[currentCardBackground].pattern === 'diamond' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-600/20 to-transparent"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* Background Description */}
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-300">{cardBackgrounds[currentCardBackground].description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Configuration */}
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Profile Configuration</h3>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Basic Information */}
                        <div className="bg-black/30 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-3">📝 Basic Information</h4>
                      
                          {/* Username */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Username *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your username"
                              value={username}
                              onChange={(e) => {
                                const value = e.target.value;
                                setUsername(value);
                                // Check both username availability and pricing
                                if (value.trim()) {
                                  checkUsername(value);
                                  fetchProfilePricing(value);
                                } else {
                                  setUsernameStatus({ checking: false, available: null, message: '' });
                                  setProfilePricing(null);
                                }
                              }}
                              className={`w-full px-3 py-3 sm:py-2 bg-black/50 border ${
                                usernameStatus.available === true ? 'border-green-500' :
                                usernameStatus.available === false ? 'border-red-500' :
                                'border-gray-600'
                              } rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-base`}
                            />
                            {/* Username availability status */}
                            {usernameStatus.message && (
                              <div className={`text-xs mt-1 flex items-center gap-1 ${
                                usernameStatus.checking ? 'text-gray-400' :
                                usernameStatus.available ? 'text-green-400' :
                                'text-red-400'
                              }`}>
                                {usernameStatus.checking && <span>⏳</span>}
                                {usernameStatus.available === true && <span>✅</span>}
                                {usernameStatus.available === false && <span>❌</span>}
                                <span>{usernameStatus.message}</span>
                              </div>
                            )}
                            {/* Username length validation */}
                            {username && username.length < 3 && (
                              <div className="text-xs mt-1 text-red-400 flex items-center gap-1">
                                <span>❌</span>
                                <span>Username must be at least 3 characters long</span>
                              </div>
                            )}
                          </div>

                          {/* Display Name */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="Enter your display name"
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Bio */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Bio
                            </label>
                            <textarea
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              placeholder="Tell us about yourself..."
                              rows={3}
                              maxLength={500}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">{bio.length}/500 characters</p>
                          </div>
                        </div>

                        {/* Profile Images */}
                        <div className="bg-black/30 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-semibold mb-3">🖼️ Profile Images</h4>
                      
                          {/* Profile Picture */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Profile Picture
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'avatar')}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            {avatarUrl && (
                              <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 mx-auto">
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          {/* Banner Image */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Banner Image
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'banner')}
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            {bannerUrl && (
                              <div className="mt-2 w-24 h-12 rounded overflow-hidden border-2 border-blue-500 mx-auto">
                                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-black/30 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-semibold mb-3">🔗 Social Links (Optional)</h4>
                      
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Twitter */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Twitter
                              </label>
                              <input
                                type="text"
                                value={twitterHandle}
                                onChange={(e) => setTwitterHandle(e.target.value)}
                                placeholder="@username"
                                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Website */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Website
                              </label>
                              <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Discord */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Discord
                              </label>
                              <input
                                type="text"
                                value={discord}
                                onChange={(e) => setDiscord(e.target.value)}
                                placeholder="username#1234"
                                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* GitHub */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                GitHub
                              </label>
                              <input
                                type="text"
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                placeholder="username"
                                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Telegram */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Telegram
                              </label>
                              <input
                                type="text"
                                value={telegram}
                                onChange={(e) => setTelegram(e.target.value)}
                                placeholder="@username"
                                className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Privacy Option */}
                        <div className="bg-black/30 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-semibold mb-3">🔒 Privacy Settings</h4>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="isAnonymous"
                              checked={isAnonymous}
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isAnonymous" className="text-sm text-gray-300">
                              Keep profile anonymous (hide social links from public view)
                            </label>
                          </div>
                        </div>

                        <div className="bg-black/30 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2">💰 Dynamic Pricing</h4>
                      
                          {profilePricing ? (
                            <div className="text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Username:</span>
                                <span className="text-blue-400">{username}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tier:</span>
                                <span className="text-yellow-400">{profilePricing.tier}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-white border-t border-gray-600 pt-2 mt-2">
                                <span>Total Cost:</span>
                                <span className="text-green-400">{profilePricing.price} {profilePricing.currency}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              <p>Enter your username to see pricing</p>
                              <div className="mt-2 text-xs">
                                <p>• 3-digit names: 420 LOS (minimum)</p>
                                <p>• 4-digit names: 42 LOS</p>
                                <p>• 5+ digit names: 4.20 LOS</p>
                                <p className="text-red-400 mt-1">• Usernames under 3 characters are not allowed</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (!username.trim()) {
                              alert('Please enter a username first');
                              return;
                            }
                            
                            if (!profilePricing) {
                              alert('Please check pricing first');
                              return;
                            }

                            if (!publicKey || !signTransaction || !sendTransaction) {
                              alert('Please connect your wallet first');
                              return;
                            }

                            // Check if username is available
                            if (usernameStatus.available === false) {
                              alert('❌ This username is already taken. Please choose a different one.');
                              return;
                            }

                            if (usernameStatus.available !== true) {
                              alert('⏳ Please wait for username availability check to complete.');
                              return;
                            }

                            try {
                              // Dynamically import the Profile NFT minting service
                              const { profileNFTMintingService } = await import('@/lib/profile-nft-minting');

                              alert(`🎭 Minting Profile NFT for @${username}...\n\nThis will require wallet approval.\n\nCost: ${profilePricing.price} ${profilePricing.currency}`);

                              // Call the minting service with wallet functions
                              const result = await profileNFTMintingService.mintProfileNFT({
                                wallet: publicKey.toString(),
                                username: username,
                                price: profilePricing.price,
                                tier: profilePricing.tier,
                                signTransaction: signTransaction,
                                sendTransaction: sendTransaction
                              });

                              if (result.success) {
                                // Register the username as taken
                                try {
                                  await fetch('/api/profile-nft/check-username', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      username: username,
                                      mint: result.mintAddress,
                                      owner: publicKey.toString()
                                    })
                                  });
                                } catch (error) {
                                  console.error('Failed to register username:', error);
                                }

                                // Increment mint count
                                try {
                                  await fetch('/api/profile-nft/mint-counter', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ increment: 1 })
                                  });
                                  // Update local mint count
                                  setMintNumber(prev => prev ? prev + 1 : 1);
                                } catch (error) {
                                  console.error('Failed to update mint count:', error);
                                }

                                // Create the revealed NFT object
                                const newNFT = {
                                  mint: result.mintAddress,
                                  collection: 'Analos Profile Cards',
                                  name: `@${username}`,
                                  image: avatarUrl || '',
                                  description: bio || `Profile NFT for @${username}`,
                                  attributes: [
                                    { trait_type: 'Username', value: username },
                                    { trait_type: 'Display Name', value: displayName },
                                    { trait_type: 'Edition', value: mintNumber?.toString() || '1' },
                                    { trait_type: 'Tier', value: profilePricing.tier },
                                    { trait_type: 'Bio', value: bio || '' },
                                    { trait_type: 'Twitter', value: twitterHandle || '' },
                                    { trait_type: 'Website', value: website || '' },
                                    { trait_type: 'Discord', value: discord || '' },
                                    { trait_type: 'GitHub', value: github || '' },
                                    { trait_type: 'Telegram', value: telegram || '' },
                                    { trait_type: 'Anonymous', value: isAnonymous ? 'true' : 'false' }
                                  ]
                                };

                                // Immediately reflect minted NFT in UI
                                setUserProfileNFT(newNFT as any);

                                // Trigger the reveal animation
                                triggerReveal(newNFT);
                                
                                // Reset form
                                setUsername('');
                                setProfilePricing(null);
                                setUsernameStatus({ checking: false, available: null, message: '' });
                                
                                // Refresh NFTs after a short delay
                                setTimeout(async () => {
                                  try {
                                    const nftsResponse = await fetch(`/api/user-nfts/${publicKey.toString()}`);
                                    const nftsData = await nftsResponse.json();
                                    
                                    if (nftsData.nfts && nftsData.nfts.length > 0) {
                                      const mappedNFTs = nftsData.nfts.map((nft: any) => ({
                                        mint: nft.mint,
                                        collection: nft.collectionName || 'Unknown Collection',
                                        name: nft.name || 'Unnamed NFT',
                                        image: nft.uri || '/api/placeholder/400/400',
                                        collectionAddress: nft.collectionAddress,
                                        description: nft.description,
                                        attributes: nft.attributes || []
                                      }));
                                      
                                      // Find Profile NFT
                                      const profileNFT = mappedNFTs.find((nft: any) => 
                                        nft.name.includes('@') || 
                                        nft.description?.includes('Profile NFT') ||
                                        nft.attributes?.some((attr: any) => attr.trait_type === 'Type' && attr.value === 'Profile NFT')
                                      );
                                      
                                      if (profileNFT) {
                                        setUserProfileNFT(profileNFT);
                                      }
                                      
                                      setUiNFTs(mappedNFTs);
                                    }
                                  } catch (error) {
                                    console.error('Error refreshing NFTs:', error);
                                  }
                                }, 3000);
                              } else {
                                alert(`❌ Error: ${result.message}\n\n${result.error || ''}`);
                              }
                            } catch (error: any) {
                              console.error('Minting error:', error);
                              alert(`❌ Failed to mint Profile NFT.\n\nError: ${error.message || 'Unknown error'}\n\nPlease try again.`);
                            }
                          }}
                          disabled={!username.trim() || username.length < 3 || !profilePricing || usernameStatus.available !== true}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          {!username.trim() ? '⚡ Enter Username First' :
                          username.length < 3 ? '❌ Username Too Short (Min 3 chars)' :
                          usernameStatus.available === false ? '❌ Username Taken' :
                          usernameStatus.checking ? '⏳ Checking...' :
                          usernameStatus.available !== true ? '⏳ Check Availability' :
                          !profilePricing ? '⚡ Check Pricing First' :
                          `⚡ Mint Profile NFT (${profilePricing.price} ${profilePricing.currency})`}
                        </button>
                      </div>
                    </div>
                  </div>

              </div>

              {/* Profile NFT Status */}
              <div className="mt-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-6 border border-green-500/30">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">🎉 Ready to Create Your Profile NFT?</h3>
                  <p className="text-gray-300 mb-4">
                    Your profile NFT will be your unique identity in the Analos ecosystem. 
                    It's more than just an NFT - it's your digital passport to exclusive features and community benefits.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        // TODO: Implement profile NFT minting
                        alert('Profile NFT minting coming soon!');
                      }}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      🚀 Start Minting
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Show more info about profile NFTs
                        alert('Learn more about Profile NFTs coming soon!');
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
                    >
                      📚 Learn More
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* NFT Reveal Animation */}
          {showReveal && revealedNFT && (
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowReveal(false);
                setRevealAnimation('cover');
                setRevealedNFT(null);
              }}
            >
              <div
                className="relative max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close (X) button */}
                <button
                  aria-label="Close reveal"
                  className="absolute -top-2 -right-2 z-50 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-2 border border-gray-600"
                  onClick={() => {
                    setShowReveal(false);
                    setRevealAnimation('cover');
                    setRevealedNFT(null);
                  }}
                >
                  ✕
                </button>
                {/* Reveal Card Container */}
                <div className="relative">
                  {/* Cover Card */}
                  {revealAnimation === 'cover' && (
                    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl p-6 shadow-2xl border-2 border-gray-600 transform scale-110 transition-all duration-500">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 mx-auto mb-4">
                          🎭
                        </div>
                        <h3 className="text-2xl font-bold text-gray-300 mb-2">MYSTERY CARD</h3>
                        <p className="text-gray-400 text-sm">Preparing your reveal...</p>
                        <div className="mt-4 flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dripping Animation */}
                  {revealAnimation === 'dripping' && (
                    <div className="relative">
                      {/* Matrix Drips */}
                      <div className="absolute inset-0 z-20">
                        <div className="absolute top-0 left-1/4 w-1 h-20 bg-green-400 animate-pulse"></div>
                        <div className="absolute top-0 left-1/2 w-1 h-16 bg-green-400 animate-pulse delay-200"></div>
                        <div className="absolute top-0 left-3/4 w-1 h-24 bg-green-400 animate-pulse delay-500"></div>
                        <div className="absolute top-0 right-1/4 w-1 h-18 bg-green-400 animate-pulse delay-300"></div>
                        <div className="absolute top-0 right-1/3 w-1 h-22 bg-green-400 animate-pulse delay-700"></div>
                      </div>
                      
                      {/* Revealing Card */}
                      <div className="bg-gradient-to-br from-green-900 via-black to-green-800 rounded-2xl p-6 shadow-2xl border-2 border-green-500/50 transform scale-105 transition-all duration-1000">
                        <div className="absolute inset-2 border border-green-400/30 rounded-xl"></div>
                        
                        {/* Card Header */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-sm font-bold">A</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">ANALOS</h3>
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center ml-2">
                              <span className="text-white text-sm font-bold">♠</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300">PROFILE CARDS</p>
                        </div>
                        
                        {/* Profile Section */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="relative inline-block mb-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden mx-auto border-2 border-green-400">
                              {revealedNFT.image ? (
                                <img src={revealedNFT.image} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span>{revealedNFT.name ? revealedNFT.name.charAt(0).toUpperCase() : 'U'}</span>
                              )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-800 rounded-full flex items-center justify-center border border-green-400">
                              <span className="text-white text-xs font-bold">
                                {revealedNFT.attributes?.find(attr => attr.trait_type === 'Edition')?.value || '1'}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-bold text-white mb-1">{revealedNFT.name || 'Your Name'}</h4>
                          <p className="text-gray-300 text-sm mb-2">@{revealedNFT.attributes?.find(attr => attr.trait_type === 'Username')?.value || 'username'}</p>
                        </div>
                        
                        {/* Referral Code Section */}
                        <div className="bg-green-900/50 border border-green-400/50 rounded-lg p-3 mb-4 relative z-10">
                          <div className="text-center">
                            <p className="text-xs font-semibold text-gray-300 mb-1">REFERRAL CODE</p>
                            <p className="text-xl font-bold text-green-300">
                              {revealedNFT.attributes?.find(attr => attr.trait_type === 'Username')?.value || 'USER'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Card Footer */}
                        <div className="text-center relative z-10">
                          <p className="text-xs text-gray-400">launchonlos.fun • Analos</p>
                        </div>
                        
                        {/* Background Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fully Revealed Card with Traits */}
                  {revealAnimation === 'revealed' && (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Main Card */}
                      <div className="bg-gradient-to-br from-green-900 via-black to-green-800 rounded-2xl p-6 shadow-2xl border-2 border-green-500/50 transform scale-100 transition-all duration-1000">
                        <div className="absolute inset-2 border border-green-400/30 rounded-xl"></div>
                        
                        {/* Card Header */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-sm font-bold">A</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">ANALOS</h3>
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center ml-2">
                              <span className="text-white text-sm font-bold">♠</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300">PROFILE CARDS</p>
                        </div>
                        
                        {/* Profile Section */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="relative inline-block mb-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden mx-auto border-2 border-green-400">
                              {revealedNFT.image ? (
                                <img src={revealedNFT.image} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span>{revealedNFT.name ? revealedNFT.name.charAt(0).toUpperCase() : 'U'}</span>
                              )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-800 rounded-full flex items-center justify-center border border-green-400">
                              <span className="text-white text-xs font-bold">
                                {revealedNFT.attributes?.find(attr => attr.trait_type === 'Edition')?.value || '1'}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-bold text-white mb-1">{revealedNFT.name || 'Your Name'}</h4>
                          <p className="text-gray-300 text-sm mb-2">@{revealedNFT.attributes?.find(attr => attr.trait_type === 'Username')?.value || 'username'}</p>
                        </div>
                        
                        {/* Referral Code Section */}
                        <div className="bg-green-900/50 border border-green-400/50 rounded-lg p-3 mb-4 relative z-10">
                          <div className="text-center">
                            <p className="text-xs font-semibold text-gray-300 mb-1">REFERRAL CODE</p>
                            <p className="text-xl font-bold text-green-300">
                              {revealedNFT.attributes?.find(attr => attr.trait_type === 'Username')?.value || 'USER'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Card Footer */}
                        <div className="text-center relative z-10">
                          <p className="text-xs text-gray-400">launchonlos.fun • Analos</p>
                        </div>
                        
                        {/* Background Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
                        </div>
                      </div>

                      {/* Traits and Rarity Display */}
                      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                        <h4 className="text-lg font-bold text-white mb-3 text-center">🎉 Your Revealed Traits</h4>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-black/30 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">RARITY</p>
                              <p className="text-lg font-bold text-yellow-400">ULTRA-RARE</p>
                            </div>
                          </div>
                          <div className="bg-black/30 rounded-lg p-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-1">VARIANT</p>
                              <p className="text-lg font-bold text-green-400">MATRIX</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-white font-semibold text-sm">Special Traits:</h5>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-green-600/30 text-green-300 rounded text-xs border border-green-500/30">Digital Rain</span>
                            <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded text-xs border border-blue-500/30">Neon Glow</span>
                            <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs border border-purple-500/30">Holographic</span>
                            <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 rounded text-xs border border-yellow-500/30">Rare Edition</span>
                          </div>
                        </div>
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={() => {
                          setShowReveal(false);
                          setRevealAnimation('cover');
                          setRevealedNFT(null);
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        ✨ Awesome! Close Reveal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'update-profile' && userProfileNFT && (
            <div className="space-y-6 sm:space-y-8">
              {/* Update Profile Section */}
              <div className="bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-green-500/30">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    🔄 Update Your Profile NFT
                  </h2>
                  <p className="text-gray-300">
                    Modify your Profile NFT information for a small platform fee
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Current Profile Display */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-xl font-semibold text-white">Current Profile</h3>
                    
                    <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
                      {/* Current Playing Card Design */}
                      <div className="bg-gradient-to-br from-green-900 via-black to-green-800 rounded-2xl p-6 shadow-2xl border-2 border-green-500/50">
                        {/* Card Border Pattern */}
                        <div className="absolute inset-2 border border-green-400/30 rounded-xl"></div>
                        
                        {/* Card Header */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-sm font-bold">A</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">ANALOS</h3>
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center ml-2">
                              <span className="text-white text-sm font-bold">♠</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300">PROFILE CARDS</p>
                        </div>
                        
                        {/* Profile Section */}
                        <div className="text-center mb-4 relative z-10">
                          <div className="relative inline-block mb-3">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden mx-auto border-2 border-green-400">
                              {userProfileNFT.image ? (
                                <img src={userProfileNFT.image} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span>{userProfileNFT.name ? userProfileNFT.name.charAt(0).toUpperCase() : 'P'}</span>
                              )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-800 rounded-full flex items-center justify-center border border-green-400">
                              <span className="text-white text-xs font-bold">
                                {userProfileNFT.attributes?.find(attr => attr.trait_type === 'Edition')?.value || '1'}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="text-lg font-bold text-white mb-1">{userProfileNFT.name || 'Profile NFT'}</h4>
                          <p className="text-gray-300 text-sm mb-2">{userProfileNFT.description || 'No description'}</p>
                        </div>
                        
                        {/* Referral Code Section */}
                        <div className="bg-green-900/50 border border-green-400/50 rounded-lg p-3 mb-4 relative z-10">
                          <div className="text-center">
                            <p className="text-xs font-semibold text-gray-300 mb-1">REFERRAL CODE</p>
                            <p className="text-xl font-bold text-green-300">
                              {userProfileNFT.attributes?.find(attr => attr.trait_type === 'Username')?.value || 'USER'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Card Footer */}
                        <div className="text-center relative z-10">
                          <p className="text-xs text-gray-400">launchonlos.fun • Analos</p>
                        </div>
                        
                        {/* Background Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Update Form */}
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-xl font-semibold text-white">Update Information</h3>
                    
                    <div className="bg-black/30 rounded-lg p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Display Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        {/* Bio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        {/* Profile Picture */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture URL</label>
                          <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/your-image.jpg"
                            className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        {/* Social Links */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
                            <input
                              type="text"
                              value={twitterHandle}
                              onChange={(e) => setTwitterHandle(e.target.value)}
                              placeholder="@username"
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                            <input
                              type="url"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://yourwebsite.com"
                              className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Platform Fee Info */}
                        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                          <h4 className="text-green-400 font-semibold mb-2">💰 Platform Fee</h4>
                          <p className="text-sm text-gray-300 mb-2">Update fee: 1.0 LOS</p>
                          <p className="text-xs text-gray-400">
                            This fee covers the cost of updating your Profile NFT metadata on-chain.
                          </p>
                        </div>

                        {/* Update Button */}
                        <button
                          onClick={async () => {
                            if (!publicKey || !signTransaction || !sendTransaction) {
                              alert('Please connect your wallet first');
                              return;
                            }

                            try {
                              // Call the profile update API
                              const response = await fetch('/api/profile-nft/update', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  mintAddress: userProfileNFT.mint,
                                  updates: {
                                    displayName,
                                    bio,
                                    avatarUrl,
                                    twitterHandle,
                                    website,
                                    discord,
                                    github,
                                    telegram,
                                    isAnonymous
                                  }
                                })
                              });

                              const result = await response.json();

                              if (result.success) {
                                alert('✅ Profile updated successfully!\n\nYour Profile NFT has been updated with the new information.');
                                
                                // Refresh the profile data
                                window.location.reload();
                              } else {
                                alert(`❌ Failed to update profile.\n\nError: ${result.error}`);
                              }
                            } catch (error: any) {
                              console.error('Update error:', error);
                              alert(`❌ Failed to update profile.\n\nError: ${error.message || 'Unknown error'}`);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          🔄 Update Profile NFT (1.0 LOS)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <PublicProfileDisplay
              userWallet={publicKey?.toString() || ''}
              className="profile-display"
            />
          )}

          {activeTab === 'nfts' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">My NFTs</h2>
                <button
                  onClick={() => {
                    // Reload NFTs
                    if (publicKey) {
                      fetch(`/api/user-nfts/${publicKey.toString()}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.nfts && data.nfts.length > 0) {
                            setUiNFTs(data.nfts.map((nft: any) => ({
                              mint: nft.mint,
                              collection: nft.collectionName || 'Unknown Collection',
                              name: nft.name || 'Unnamed NFT',
                              image: nft.uri || '/api/placeholder/400/400',
                              collectionAddress: nft.collectionAddress,
                              description: nft.description
                            })));
                          }
                        });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading your NFTs...</p>
                </div>
              ) : uiNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {uiNFTs.map((nft) => (
                    <NFTCard
                      key={nft.mint}
                      nft={{
                        mint: nft.mint,
                        name: nft.name,
                        image: nft.image,
                        collectionName: nft.collection,
                        collectionAddress: (nft as any).collectionAddress,
                        description: (nft as any).description
                      }}
                      showListButton={true}
                      onListed={() => {
                        alert('NFT has been listed! View it on the marketplace.');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
                  <p className="text-gray-300 mb-4">Start collecting NFTs to see them here!</p>
                  <p className="text-gray-400 text-sm">
                    NFTs you mint or purchase will appear here. Make sure you've minted from a collection!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">My Collections</h2>
              {uiCollections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {uiCollections.map((collection, index) => (
                    <div key={index} className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={collection.image} 
                        alt={collection.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-1">{collection.name}</h3>
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
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Collections Yet</h3>
                  <p className="text-gray-300">Create your first collection to get started!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rewards Summary */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">💰 Creator Rewards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
                      {rewardsSummary.total_claimable.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300">Claimable (LOS)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
                      {rewardsSummary.total_claimed.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300">Total Claimed (LOS)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-2">
                      {rewardsSummary.pending_rewards.toFixed(2)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300">Pending (LOS)</div>
                  </div>
                </div>
                
                {rewardsSummary.total_claimable > 0 && (
                  <div className="text-center">
                    <button
                      onClick={handleClaimRewards}
                      disabled={claiming}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {claiming ? 'Claiming...' : `Claim ${rewardsSummary.total_claimable.toFixed(2)} LOS`}
                    </button>
                  </div>
                )}
              </div>

              {/* Rewards List */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Rewards History</h3>
                {rewards.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                              <span className="text-2xl">💰</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white capitalize">
                                {reward.reward_type.replace('_', ' ')} Reward
                              </h4>
                              <p className="text-sm text-gray-300">
                                From: {reward.saved_collections.collection_name}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              {reward.amount.toFixed(4)} {reward.token_symbol}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              reward.status === 'claimable' 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                : reward.status === 'claimed'
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {reward.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          Created: {new Date(reward.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💰</div>
                    <h4 className="text-lg font-semibold text-white mb-2">No Rewards Yet</h4>
                    <p className="text-gray-300">Rewards will appear here when your collections generate sales and fees.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Activity History</h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
                <p className="text-gray-300">Your activity history will appear here as you interact with the platform.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
