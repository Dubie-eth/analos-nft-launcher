/**
 * PROFILE NFT MINTING API
 * Mints compressed NFT profile cards for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import IDL from '@/idl/analos_monitoring_system.json';
import type { AnalosMonitoringSystem } from '@/idl/analos_monitoring_system';
import { ProfileNFTGenerator, ProfileNFTData } from '@/lib/profile-nft-generator';
import { BlockchainProfileNFTService } from '@/lib/blockchain-profile-nft-service';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
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

    // Initialize blockchain services
    const wallet = new PublicKey(walletAddress);
    const dummyKeypair = Keypair.generate();
    const provider = new AnchorProvider(connection, { publicKey: dummyKeypair.publicKey, signTransaction: async () => dummyKeypair, signAllTransactions: async () => [dummyKeypair] } as any, {});
    const program = new Program<AnalosMonitoringSystem>(IDL as any, ANALOS_PROGRAMS.MONITORING_SYSTEM, provider);
    const nftService = new BlockchainProfileNFTService(connection, program, provider);

    // Check if user already has a profile NFT on blockchain
    const hasNFT = await nftService.hasProfileNFT(wallet);
    if (hasNFT) {
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

    // Create profile NFT on blockchain
    const result = await nftService.createProfileNFT(
      wallet,
      {
        ...profileData,
        nftMetadata: JSON.stringify(nftCard),
        mintPrice: mintPrice * 1e9, // Convert to lamports
        mintSignature: 'pending' // Will be updated after actual minting
      },
      dummyKeypair
    );

    const explorerUrl = `https://explorer.analos.io/address/${result.nftAccount.toString()}`;

    // Also store a reference in database for easier querying (optional)
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin
          .from('profile_nfts') as any)
          .insert([{
            wallet_address: walletAddress,
            mint_address: result.nftAccount.toString(),
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
            mint_signature: result.signature,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error storing profile NFT reference:', error);
          // Don't fail the request, blockchain storage is primary
        }
      } catch (error) {
        console.error('Database error:', error);
        // Don't fail the request, blockchain storage is primary
      }
    }

    // Generate social sharing URLs
    const shareUrls = nftGenerator.generateSocialShareUrls(profileData, result.nftAccount.toString(), explorerUrl);
    const shareText = nftGenerator.generateSocialShareText(profileData, result.nftAccount.toString());

    return NextResponse.json({
      success: true,
      message: 'Profile NFT minted successfully on blockchain!',
      nft: {
        mintAddress: result.nftAccount.toString(),
        explorerUrl,
        signature: result.signature,
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
