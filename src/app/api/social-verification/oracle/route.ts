/**
 * SOCIAL VERIFICATION ORACLE API
 * Transaction-based verification that stores data on-chain
 * Query user verification data from blockchain
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

    if (!walletAddress || !platform || !username || !tweetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create connection to Solana
    const connection = new Connection(RPC_URL, 'confirmed');

    // Get oracle instance
    const oracle = getSocialVerificationOracle(connection);

    // Submit verification to on-chain oracle
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
      message: 'Verification submitted to on-chain oracle',
      signature: result.signature,
      explorerUrl: `https://explorer.analos.io/tx/${result.signature}`,
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

    // Create connection to Solana
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

  } catch (error) {
    console.error('Oracle query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
