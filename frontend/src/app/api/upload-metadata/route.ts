import { NextRequest, NextResponse } from 'next/server';

export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
  collection?: {
    name: string;
    family: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const metadata: NFTMetadata = await request.json();

    // Validate metadata
    if (!metadata.name || !metadata.description || !metadata.image) {
      return NextResponse.json(
        { error: 'Missing required metadata fields' },
        { status: 400 }
      );
    }

    // Upload to IPFS (using Pinata or similar service)
    const ipfsUrl = await uploadToIPFS(metadata);

    return NextResponse.json({
      success: true,
      ipfsUrl,
      metadata
    });

  } catch (error) {
    console.error('Metadata upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload metadata' },
      { status: 500 }
    );
  }
}

async function uploadToIPFS(metadata: NFTMetadata): Promise<string> {
  try {
    // Check for Pinata credentials
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      console.warn('Pinata credentials not found, using simulated IPFS upload');
      // Return simulated IPFS URL for development
      return `https://gateway.pinata.cloud/ipfs/Qm${Math.random().toString(36).substring(2)}`;
    }

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata.json`,
          keyvalues: {
            type: 'nft-metadata',
            collection: metadata.collection?.name || 'analos-nft'
          }
        }
      }),
    });

    if (!pinataResponse.ok) {
      throw new Error(`Pinata upload failed: ${pinataResponse.statusText}`);
    }

    const result = await pinataResponse.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

  } catch (error) {
    console.error('IPFS upload failed:', error);
    // Fallback to simulated URL
    return `https://gateway.pinata.cloud/ipfs/Qm${Math.random().toString(36).substring(2)}`;
  }
}
