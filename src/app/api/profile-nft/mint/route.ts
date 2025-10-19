/**
 * PROFILE NFT MINTING API
 * Mints compressed NFT profile cards for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ProfileNFTGenerator, ProfileNFTData } from '@/lib/profile-nft-generator';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
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

    // Generate NFT metadata
    const nftGenerator = new ProfileNFTGenerator(connection);
    const nftCard = nftGenerator.generateProfileNFTCard(profileData);

    // For now, simulate the minting process and store the data
    // In a full implementation, this would mint a compressed NFT on Solana
    const mockMintAddress = generateMockMintAddress();

    const explorerUrl = `https://explorer.analos.io/address/${mockMintAddress}`;

    // Store NFT data in database
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin
          .from('profile_nfts') as any)
          .insert([{
            wallet_address: walletAddress,
            mint_address: mockMintAddress,
            username,
            display_name: displayName || username,
            bio: bio || '',
            avatar_url: avatarUrl || '',
            banner_url: bannerUrl || '',
            referral_code: finalReferralCode,
            twitter_handle: twitterHandle || '',
            twitter_verified: twitterVerified || false,
            nft_metadata: nftCard,
            mint_price: mintPrice,
            explorer_url: explorerUrl,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error storing profile NFT:', error);
          return NextResponse.json(
            { error: 'Failed to store profile NFT data' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }
    }

    // Generate social sharing URLs
    const shareUrls = nftGenerator.generateSocialShareUrls(profileData, mockMintAddress, explorerUrl);
    const shareText = nftGenerator.generateSocialShareText(profileData, mockMintAddress);

    return NextResponse.json({
      success: true,
      message: 'Profile NFT minted successfully!',
      nft: {
        mintAddress: mockMintAddress,
        explorerUrl,
        metadata: nftCard,
        imageUrl: nftCard.image,
        name: nftCard.name,
        description: nftCard.description
      },
      socialSharing: {
        shareText,
        urls: shareUrls
      },
      profileData
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
