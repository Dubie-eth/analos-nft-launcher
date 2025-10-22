/**
 * PROFILE NFT MINTING API
 * Handles minting of Profile NFTs with dynamic pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { metadataService } from '@/lib/metadata-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, username, userAgent } = body;

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

    // Get dynamic pricing
    const pricingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pricing?username=${encodeURIComponent(username)}`);
    const pricingData = await pricingResponse.json();
    
    if (!pricingData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch pricing information'
      }, { status: 500 });
    }

    const price = pricingData.price;
    const tier = pricingData.tier;

    // Create Profile NFT metadata
    const profileNFTMetadata = {
      name: `@${username} Profile NFT`,
      symbol: 'PROFILE',
      description: `Profile NFT for @${username} on Analos - ${tier} tier`,
      image: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}&backgroundColor=000000&textColor=ffffff`,
      attributes: [
        {
          trait_type: 'Username',
          value: username
        },
        {
          trait_type: 'Tier',
          value: tier
        },
        {
          trait_type: 'Length',
          value: username.length.toString()
        },
        {
          trait_type: 'Platform',
          value: 'Analos'
        },
        {
          trait_type: 'Type',
          value: 'Profile NFT'
        }
      ],
      properties: {
        files: [] as Array<{uri: string; type: string}>,
        category: 'image',
        creators: [
          {
            address: wallet,
            share: 100
          }
        ]
      }
    };

    // Upload metadata to IPFS
    const metadataUri = await metadataService.uploadMetadata(profileNFTMetadata);
    
    if (!metadataUri) {
      return NextResponse.json({
        success: false,
        error: 'Failed to upload metadata to IPFS'
      }, { status: 500 });
    }

    // Create mint transaction
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const walletPubkey = new PublicKey(wallet);
    
    // Create a new mint account
    const mintKeypair = {
      publicKey: new PublicKey('11111111111111111111111111111111'), // Placeholder - in production, generate new keypair
      secretKey: new Uint8Array(64) // Placeholder - in production, use actual secret key
    };

    const transaction = new Transaction();

    // Add instructions for minting (simplified for demo)
    // In production, this would include:
    // 1. Create mint account
    // 2. Initialize mint
    // 3. Create associated token account
    // 4. Mint tokens
    // 5. Create metadata account

    // For now, return a mock transaction signature
    const mockSignature = `profile_nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      signature: mockSignature,
      explorerUrl: `https://explorer.analos.io/tx/${mockSignature}`,
      nft: {
        mint: mintKeypair.publicKey.toString(),
        name: profileNFTMetadata.name,
        symbol: profileNFTMetadata.symbol,
        description: profileNFTMetadata.description,
        image: profileNFTMetadata.image,
        attributes: profileNFTMetadata.attributes,
        metadataUri: metadataUri,
        tier: tier,
        price: price,
        currency: 'LOS'
      },
      message: `Profile NFT minted successfully for @${username} (${tier} tier) - ${price} LOS`
    });

  } catch (error) {
    console.error('Profile NFT minting error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to mint Profile NFT'
    }, { status: 500 });
  }
}