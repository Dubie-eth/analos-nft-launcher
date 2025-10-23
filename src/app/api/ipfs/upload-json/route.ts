/**
 * API Route: Upload JSON/HTML content to IPFS
 * Handles animated NFT HTML uploads
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, filename } = await request.json();

    if (!content || !filename) {
      return NextResponse.json(
        { success: false, error: 'Content and filename are required' },
        { status: 400 }
      );
    }

    // Get Pinata API credentials from environment
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.error('Pinata API credentials not configured');
      return NextResponse.json(
        { success: false, error: 'IPFS service not configured' },
        { status: 500 }
      );
    }

    // Upload to Pinata IPFS
    const pinataData = {
      pinataContent: content,
      pinataMetadata: {
        name: filename,
      },
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify(pinataData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pinata upload failed:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.error?.details || 'Failed to upload to IPFS' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    return NextResponse.json({
      success: true,
      url: ipfsUrl,
      cid: result.IpfsHash
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}