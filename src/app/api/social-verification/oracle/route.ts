/**
 * SOCIAL VERIFICATION ORACLE API
 * Transaction-based verification that stores data on Analos blockchain
 * Query user verification data from Analos blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSocialVerificationOracle } from '@/lib/social-verification-oracle';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.analos.io';

// POST - Submit verification to on-chain oracle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, platform, username, tweetId, referralCode, followerCount } = body;

    // SECURITY VALIDATION
    if (!walletAddress || !platform || !username || !tweetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SECURITY CHECK: Validate wallet address format (must be public key)
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // SECURITY CHECK: Ensure no private key data in any field
    const privateKeyPatterns = ['private', 'secret', 'seed', 'mnemonic', 'key'];
    const allFields = [walletAddress, platform, username, tweetId, referralCode].join(' ').toLowerCase();
    
    if (privateKeyPatterns.some(pattern => allFields.includes(pattern))) {
      return NextResponse.json(
        { error: 'Private key data not allowed' },
        { status: 400 }
      );
    }

    // Create connection to Analos blockchain
    const connection = new Connection(RPC_URL, 'confirmed');

    // Get oracle instance
    const oracle = getSocialVerificationOracle(connection);

    // Submit verification to on-chain oracle on Analos blockchain
    const result = await oracle.submitVerification(
      new PublicKey(walletAddress),
      platform,
      username,
      tweetId,
      referralCode,
      followerCount || 0
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification submitted to on-chain oracle on Analos blockchain',
      signature: result.signature,
      explorerUrl: `https://explorer.analos.io/tx/${result.signature}`,
      blockchain: 'analos',
    });

  } catch (error) {
    console.error('Oracle submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Query verification data from on-chain oracle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const platform = searchParams.get('platform') || 'twitter';
    const all = searchParams.get('all') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter is required' },
        { status: 400 }
      );
    }

    // For now, return empty verification data since oracle is not fully implemented
    // This prevents 404 errors while the oracle system is being developed
    console.log('⚠️ Social verification oracle not fully implemented yet, returning empty data');
    
    return NextResponse.json({
      success: true,
      verifications: [],
      total: 0,
      message: 'Oracle system under development'
    });

    // TODO: Implement full oracle functionality
    /*
    // Create connection to Analos blockchain
    const connection = new Connection(RPC_URL, 'confirmed');

    // Get oracle instance
    const oracle = getSocialVerificationOracle(connection);

    if (all) {
      // Get all verifications for user
      const result = await oracle.getAllUserVerifications(new PublicKey(walletAddress));

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch verifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        verifications: result.verifications || [],
        total: result.verifications?.length || 0,
      });
    } else {
      // Get verification for specific platform
      const result = await oracle.getVerificationData(new PublicKey(walletAddress), platform);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch verification data' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        verification: result.data,
      });
    }
    */

  } catch (error) {
    console.error('Oracle query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
