import { NextRequest, NextResponse } from 'next/server';
import { blockchainService } from '@/lib/blockchain-service';

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

    // Validate wallet address format (basic validation)
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching NFTs for wallet:', wallet);

    // Fetch user NFTs from blockchain
    const nfts = await blockchainService.getUserNFTs(wallet);
    
    console.log(`✅ Found ${nfts.length} NFTs for wallet`);

    // Transform NFTs to include display information
    const transformedNFTs = nfts.map((nft: any) => ({
      mint: nft.mint,
      name: nft.name || `NFT #${nft.mintNumber || 'Unknown'}`,
      uri: nft.uri || nft.metadata?.uri || '/api/placeholder/400/400',
      collectionAddress: nft.collectionConfig,
      collectionName: nft.collectionName || 'Unknown Collection',
      description: nft.description || '',
      isRevealed: nft.isRevealed,
      rarityScore: nft.rarityScore,
      tier: nft.tier,
      mintNumber: nft.mintNumber
    }));

    // Group by collection
    const collections = new Map<string, any>();
    transformedNFTs.forEach((nft: any) => {
      if (nft.collectionAddress) {
        if (!collections.has(nft.collectionAddress)) {
          collections.set(nft.collectionAddress, {
            address: nft.collectionAddress,
            name: nft.collectionName || 'Unknown Collection',
            count: 0
          });
        }
        collections.get(nft.collectionAddress)!.count++;
      }
    });
    
    const response = {
      wallet: wallet,
      nfts: transformedNFTs,
      total: transformedNFTs.length,
      collections: Array.from(collections.values()),
      message: transformedNFTs.length > 0 ? 'NFTs loaded successfully' : 'No NFTs found for this wallet'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const body = await request.json();

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'NFT operation completed',
      wallet,
      data: body
    });

  } catch (error) {
    console.error('Error processing NFT operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}