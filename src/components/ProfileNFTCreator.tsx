/**
 * PROFILE NFT CREATOR
 * Component for creating and minting profile card NFTs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileNFTData } from '@/lib/profile-nft-generator';
import { Loader2, CheckCircle, XCircle, Twitter, Share2, ExternalLink, Coins, Zap } from 'lucide-react';
import NFTMintCelebration from './NFTMintCelebration';
import ProfileCardPreview from './ProfileCardPreview';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ANALOS_PLATFORM_WALLET } from '@/config/analos-programs';

interface ProfileNFTCreatorProps {
  profileData?: {
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    referralCode: string;
    twitterHandle?: string;
    twitterVerified?: boolean;
  };
  onNFTCreated?: (nftData: any) => void;
  onClose?: () => void;
}

export default function ProfileNFTCreator({ 
  profileData, 
  onNFTCreated, 
  onClose 
}: ProfileNFTCreatorProps) {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nftData, setNftData] = useState<any>(null);
  const [hasExistingNFT, setHasExistingNFT] = useState(false);
  const [mintPrice] = useState(4.20); // Default; dynamic pricing used below
  const [showCelebration, setShowCelebration] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<{
    price: number;
    tier: string;
    available: boolean;
  } | null>(null);
  const [mintNumber, setMintNumber] = useState<number | null>(null);
  const [variant, setVariant] = useState<'standard' | 'rare' | 'epic' | 'legendary' | 'mystery'>('standard');
  const [mfpurrsBackground, setMfpurrsBackground] = useState<any>(null);

  // Check if user already has a profile NFT and get pricing info
  useEffect(() => {
    if (connected && publicKey) {
      checkExistingNFT();
      fetchPricingInfo();
      getMintNumber();
    }
  }, [connected, publicKey, profileData?.username]);

  // Check for MF Purrs background when mint number is available
  useEffect(() => {
    if (mintNumber && publicKey) {
      checkMfpurrsBackground();
    }
  }, [mintNumber, publicKey]);

  const checkExistingNFT = async () => {
    try {
      const response = await fetch(`/api/profile-nft/check/${publicKey?.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setHasExistingNFT(data.hasNFT);
      }
    } catch (error) {
      console.error('Error checking existing NFT:', error);
    }
  };

  const getMintNumber = async () => {
    try {
      const response = await fetch('/api/profile-nft/mint-counter');
      if (response.ok) {
        const data = await response.json();
        setMintNumber(data.nextMintNumber);
      }
    } catch (error) {
      console.error('Error getting mint number:', error);
    }
  };

  const checkMfpurrsBackground = async () => {
    if (!publicKey || !mintNumber) return;
    
    try {
      const response = await fetch('/api/profile-nft/mfpurrs-backgrounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          mintNumber: mintNumber
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isMfpurrs && data.background) {
          setMfpurrsBackground(data.background);
        }
      }
    } catch (error) {
      console.error('Error checking MF Purrs background:', error);
    }
  };

  const fetchPricingInfo = async () => {
    if (!profileData?.username) return;
    
    try {
      const response = await fetch(`/api/admin/matrix-collection/pricing-config`);
      if (response.ok) {
        const data = await response.json();
        const config = data.config;
        
        // Calculate price based on username length
        const length = profileData.username.length;
        let price = 4.20;
        let tier = '5+ Characters (Common)';
        let available = config.enabled;
        
        if (length >= 5) {
          price = config.pricingTiers.tier5Plus;
          tier = '5+ Characters (Common)';
        } else if (length === 4) {
          price = config.pricingTiers.tier4;
          tier = '4 Characters (Premium)';
        } else if (length === 3) {
          price = config.pricingTiers.tier3;
          tier = '3 Characters (Ultra Premium)';
        } else if (length === 2) {
          price = config.pricingTiers.tier2;
          tier = '2 Characters (Reserved)';
          available = config.enabled && !config.reservedTiers.tier2;
        } else if (length === 1) {
          price = config.pricingTiers.tier1;
          tier = '1 Character (Reserved)';
          available = config.enabled && !config.reservedTiers.tier1;
        }
        
        setPricingInfo({ price, tier, available });
      }
    } catch (error) {
      console.error('Error fetching pricing info:', error);
    }
  };

  const determineVariant = async () => {
    if (!publicKey || !mintNumber) return 'standard';
    
    try {
      const response = await fetch('/api/profile-nft/mystery-variant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          mintNumber: mintNumber
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVariant(data.variant);
        return data.variant;
      }
    } catch (error) {
      console.error('Error determining variant:', error);
    }
    
    return 'standard';
  };

  const mintProfileNFT = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet to mint your profile NFT');
      return;
    }

    if (!profileData) {
      setError('Profile data is required to create NFT');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine variant first
      const determinedVariant = await determineVariant();
      
      console.log('🚀 Starting NFT minting process...');
      console.log('👤 Wallet:', publicKey.toString());
      console.log('📝 Profile data:', profileData);
      console.log('💰 Mint price:', mintPrice, 'LOS');
      
      // 1) Prompt wallet to pay the mint fee to platform treasury
      const priceLos = pricingInfo?.price ?? mintPrice;
      const lamports = Math.floor(priceLos * LAMPORTS_PER_SOL);
      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey as PublicKey,
          toPubkey: ANALOS_PLATFORM_WALLET,
          lamports,
        })
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transferTx.recentBlockhash = blockhash;
      transferTx.feePayer = publicKey as PublicKey;
      const paymentSignature = await sendTransaction(transferTx, connection, { skipPreflight: false });
      await connection.confirmTransaction({ signature: paymentSignature, blockhash, lastValidBlockHeight }, 'confirmed');

      // 2) Call the API to mint the NFT, providing the payment signature for verification
      const response = await fetch('/api/profile-nft/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          ...profileData,
          mintPrice: priceLos,
          mintNumber: mintNumber,
          variant: determinedVariant,
          mfpurrsBackground: mfpurrsBackground,
          paymentSignature,
          paymentAmountLamports: lamports
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ NFT minting API call successful');
        console.log('📋 NFT Data:', data);
        
        // Increment mint counter
        await fetch('/api/profile-nft/mint-counter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ increment: true }),
        });

        setNftData(data);
        setSuccess(true);
        
        // Show Matrix celebration popup
        setShowCelebration(true);
        
        // Log transaction details for blockchain verification
        if (data.nft?.signature) {
          console.log('🔗 Transaction Signature:', data.nft.signature);
          console.log('🎨 Mint Address:', data.nft.mintAddress);
          console.log('🌐 Explorer URL:', data.nft.explorerUrl);
          
          // In a real implementation, you would:
          // 1. Monitor the transaction status via WebSocket
          // 2. Show real-time confirmation updates
          // 3. Handle transaction failures gracefully
        }
        
        if (onNFTCreated) {
          onNFTCreated(data);
        }
      } else {
        console.error('❌ NFT minting failed:', data.error);
        setError(data.error || 'Failed to mint profile NFT');
      }
    } catch (error) {
      console.error('Error minting profile NFT:', error);
      setError('Failed to mint profile NFT. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!nftData?.socialSharing) return;

    const url = nftData.socialSharing.urls[platform];
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (hasExistingNFT) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🎴 Profile NFT Already Created!
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            You already have a profile NFT. Each user can only have one profile card NFT.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.open('/profile', '_blank')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              View Profile
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (success && nftData) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🎉 Profile NFT Created!
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Your profile card NFT has been successfully minted!
          </p>
        </div>

        {/* NFT Preview */}
        <div className="mb-6">
          <img
            src={nftData.nft.imageUrl}
            alt="Profile NFT"
            className="w-full max-w-sm mx-auto rounded-lg border-2 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* NFT Details */}
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {nftData.nft.name}
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
            {nftData.nft.description}
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Mint Price: {(pricingInfo?.price ?? mintPrice)} LOS
            </span>
            <a
              href={nftData.nft.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 hover:text-blue-600 text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View on Explorer
            </a>
          </div>
          {nftData?.nft?.metadata?.uri && (
            <div className="mt-2 text-right">
              <a
                href={nftData.nft.metadata.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                View Metadata (IPFS)
              </a>
            </div>
          )}
        </div>

        {/* Social Sharing */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Share Your Profile NFT
          </h3>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </button>
            <button
              onClick={() => shareToSocial('telegram')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Telegram
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(nftData.socialSharing.shareText)}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Text
            </button>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.open('/profile', '_blank')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            View Profile
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="text-center mb-6">
        <Zap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🎴 Create Your Profile NFT
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Mint your first NFT - a personalized profile card with your info and referral code!
        </p>
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
            <strong>🏆 Master Open Edition Collection:</strong><br/>
            Your profile NFT will be part of the official "Analos Profile Cards" master open edition collection. 
            Each NFT includes your personalized referral code and becomes part of the Analos NFT Launchpad ecosystem.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Profile Card Preview */}
      {profileData && (
        <div className="mb-6">
          <ProfileCardPreview
            username={profileData.username}
            displayName={profileData.displayName || profileData.username}
            bio={profileData.bio}
            referralCode={profileData.referralCode}
            profilePictureUrl={profileData.avatarUrl}
            bannerImageUrl={profileData.bannerUrl}
            mintNumber={mintNumber}
            variant={variant}
            mfpurrsBackground={mfpurrsBackground}
          />
        </div>
      )}

      {/* Dynamic Pricing */}
      {pricingInfo && (
        <div className={`p-4 rounded-lg mb-6 ${
          !pricingInfo.available 
            ? 'bg-red-900/20 border border-red-700' 
            : theme === 'dark' 
              ? 'bg-blue-900/20 border border-blue-700' 
              : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center justify-center mb-2">
            <Coins className={`w-6 h-6 mr-2 ${!pricingInfo.available ? 'text-red-500' : 'text-yellow-500'}`} />
            <span className={`font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
              {!pricingInfo.available ? 'Minting Disabled' : `Mint Price: ${pricingInfo.price} LOS`}
            </span>
          </div>
          <p className={`text-sm text-center ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
            {!pricingInfo.available 
              ? 'This username tier is currently reserved or minting is disabled'
              : `${pricingInfo.tier} - This is your first NFT - a personalized profile card you can share on social media!`
            }
          </p>
        </div>
      )}

      {/* Mint Button */}
      <div className="text-center">
        <button
          onClick={mintProfileNFT}
          disabled={loading || !connected || !profileData || !pricingInfo?.available}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            loading || !connected || !profileData || !pricingInfo?.available
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Minting NFT...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 inline mr-2" />
              Mint Profile NFT ({mintPrice} LOS)
            </>
          )}
        </button>
        
        {!connected && (
          <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Please connect your wallet to mint your profile NFT
          </p>
        )}
      </div>

      {/* Matrix Celebration Popup */}
      {showCelebration && nftData && (
        <NFTMintCelebration
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          nftData={{
            mintAddress: nftData.nft.mintAddress,
            explorerUrl: nftData.nft.explorerUrl,
            name: nftData.nft.name,
            imageUrl: nftData.nft.imageUrl,
            referralCode: nftData.profileData.referralCode,
            matrixVariant: nftData.nft.matrixVariant,
            isMatrixVariant: nftData.nft.isMatrixVariant
          }}
          profileData={{
            username: profileData?.username || '',
            displayName: profileData?.displayName || ''
          }}
        />
      )}
    </div>
  );
}
