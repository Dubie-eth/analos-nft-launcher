import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Return mock NFT data
    const mockNFTs = {
      wallet,
      nfts: [
        {
          mint: `mock-mint-${wallet.slice(-4)}-1`,
          name: 'Analos Profile #1',
          image: '/api/placeholder/300/300',
          collection: 'analos-profiles',
          verified: true,
          attributes: [
            { trait_type: 'Background', value: 'Matrix' },
            { trait_type: 'Rarity', value: 'Ultra Rare' }
          ]
        }
      ],
      total: 1,
      collections: [
        {
          address: 'analos-profiles',
          name: 'Analos Profile Cards',
          verified: true,
          count: 1,
          image: '/api/placeholder/300/300'
        }
      ],
      message: 'Mock NFT data - will be replaced with real blockchain data'
    };

    return NextResponse.json(mockNFTs);

  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}