/**
 * PROFILE NFT MINTING API
 * Mints compressed NFT profile cards for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ProfileNFTGenerator, ProfileNFTData } from '@/lib/profile-nft-generator';
import { AnalosNFTMintingService } from '@/lib/analos-nft-minting-service';
import { ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Initialize connection
const connection = new Connection(ANALOS_RPC_URL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      referralCode,
      twitterHandle,
      twitterVerified,
      mintPrice = 4.20 // 4.20 LOS fee
    } = body;

    // Validation
    if (!walletAddress || !username || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, username, referralCode' },
        { status: 400 }
      );
    }

    // Check if user already has a profile NFT
    const existingNFT = await checkExistingProfileNFT(walletAddress);
    if (existingNFT) {
      return NextResponse.json(
        { error: 'User already has a profile NFT' },
        { status: 400 }
      );
    }

    // Generate proper referral code from username if not provided or if it's just the wallet address
    const { generateReferralCode } = await import('@/lib/wallet-examples');
    const finalReferralCode = referralCode && referralCode !== walletAddress.slice(0, 8).toUpperCase() 
      ? referralCode 
      : generateReferralCode(username);

    // Create profile NFT data
    const profileData: ProfileNFTData = {
      wallet: walletAddress,
      username,
      displayName: displayName || username,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      bannerUrl: bannerUrl || '',
      referralCode: finalReferralCode,
      twitterHandle: twitterHandle || '',
      twitterVerified: twitterVerified || false,
      createdAt: Date.now(),
      mintPrice
    };

    // Initialize the Analos NFT minting service
    const nftService = new AnalosNFTMintingService();
    
    // Create user wallet keypair (in production, this would come from the user's wallet)
    const userWallet = Keypair.generate(); // This should be the user's actual wallet
    
    // Prepare profile data for NFT minting
    const nftProfileData = {
      wallet: new PublicKey(walletAddress),
      username,
      displayName: displayName || username,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      bannerUrl: bannerUrl || '',
      referralCode: finalReferralCode,
      twitterHandle: twitterHandle || '',
      twitterVerified: twitterVerified || false,
      website: '',
      discord: '',
      telegram: '',
      github: '',
      createdAt: Date.now(),
      mintPrice: mintPrice * LAMPORTS_PER_SOL
    };

    // Mint the profile NFT using the real Analos NFT program
    let mintResult;
    try {
      mintResult = await nftService.mintProfileNFT(nftProfileData, userWallet);
      } catch (error) {
        console.error('NFT minting failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
          { error: `Failed to mint profile NFT on Analos blockchain: ${errorMessage}` },
          { status: 500 }
        );
      }

    const explorerUrl = ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD;

    // Store NFT data in database
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin
          .from('profile_nfts') as any)
          .insert([{
            wallet_address: walletAddress,
            mint_address: mintResult.mintAddress.toString(),
            username,
            display_name: displayName || username,
            bio: bio || '',
            avatar_url: avatarUrl || '',
            banner_url: bannerUrl || '',
            referral_code: finalReferralCode,
            twitter_handle: twitterHandle || '',
            twitter_verified: twitterVerified || false,
            nft_metadata: mintResult.metadata,
            mint_price: mintPrice,
            explorer_url: explorerUrl,
            mint_signature: mintResult.signature,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error storing profile NFT:', error);
          // Don't fail the request, NFT minting was successful
        }
      } catch (error) {
        console.error('Database error:', error);
        // Don't fail the request, NFT minting was successful
      }
    }

    // Generate social sharing URLs
    const nftGenerator = new ProfileNFTGenerator(connection);
    const shareUrls = nftGenerator.generateSocialShareUrls(profileData, mintResult.mintAddress.toString(), explorerUrl);
    const shareText = nftGenerator.generateSocialShareText(profileData, mintResult.mintAddress.toString());

    return NextResponse.json({
      success: true,
      message: 'Profile NFT minted successfully as part of the Analos Profile Cards Master Open Edition!',
      nft: {
        mintAddress: mintResult.mintAddress.toString(),
        explorerUrl,
        signature: mintResult.signature,
        metadata: mintResult.metadata,
        imageUrl: mintResult.metadata.image,
        name: mintResult.metadata.name,
        description: mintResult.metadata.description
      },
      socialSharing: {
        shareText,
        urls: shareUrls
      },
      profileData,
      collectionInfo: {
        name: 'Analos Profile Cards',
        type: 'Master Open Edition',
        symbol: 'APC',
        family: 'Analos NFT Launchpad',
        mintPrice: '4.20 LOS',
        supply: 'Open Edition (Unlimited)',
        royalty: '2.5%'
      },
      programInfo: {
        programId: ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD,
        network: 'Analos Mainnet',
        verified: true
      }
    });

  } catch (error) {
    console.error('Error minting profile NFT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user already has a profile NFT
 */
async function checkExistingProfileNFT(walletAddress: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false; // If no database, allow minting
  }

  try {
    const { data, error } = await (supabaseAdmin
      .from('profile_nfts') as any)
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error('Error checking existing profile NFT:', error);
    return false;
  }
}

/**
 * Generate a mock mint address for simulation
 */
function generateMockMintAddress(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
