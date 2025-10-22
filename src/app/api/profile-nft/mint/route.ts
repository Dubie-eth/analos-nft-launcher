/**
 * PROFILE NFT MINTING API
 * Handles minting of Profile NFTs with dynamic pricing
 * Returns serialized transaction for client-side signing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { profileNFTMintingService } from '@/lib/profile-nft-minting';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, username, serializedTransaction } = body;

    if (!wallet || !username) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address and username are required'
      }, { status: 400 });
    }

    // Validate username
    if (username.length < 1 || username.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Username must be between 1 and 50 characters'
      }, { status: 400 });
    }

    // Validate username format (alphanumeric + underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores'
      }, { status: 400 });
    }

    // Get dynamic pricing
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000');
    
    const pricingResponse = await fetch(`${baseUrl}/api/pricing?username=${encodeURIComponent(username)}`);
    const pricingData = await pricingResponse.json();
    
    if (!pricingData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch pricing information'
      }, { status: 500 });
    }

    const price = pricingData.price;
    const tier = pricingData.tier;

    console.log('🎭 Profile NFT mint request:', { wallet, username, price, tier });

    // Return minting parameters for client-side execution
    // The actual minting will happen client-side with wallet signing
    return NextResponse.json({
      success: true,
      mintParams: {
        wallet,
        username,
        price,
        tier
      },
      message: 'Ready to mint Profile NFT',
      instructions: 'Use the returned parameters to mint the NFT client-side with wallet signing'
    });

  } catch (error) {
    console.error('Profile NFT minting error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to mint Profile NFT'
    }, { status: 500 });
  }
}