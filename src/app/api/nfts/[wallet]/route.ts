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

    // Basic validation
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const userNfts = await blockchainService.getUserNFTs(wallet);

    const transformed = userNfts.map((nft: any) => ({
      mint: nft.mint,
      name: nft.name || `NFT #${nft.mintNumber || 'Unknown'}`,
      image: nft.uri || nft.metadata?.json?.image || '/api/placeholder/400/400',
      collectionAddress: nft.collectionConfig,
      collectionName: nft.collectionName || 'Unknown Collection',
      description: nft.description || '',
      attributes: nft.metadata?.json?.attributes || [],
    }));

    const collections = new Map<string, { address: string; name: string; verified: boolean; count: number }>();
    transformed.forEach((nft) => {
      if (nft.collectionAddress) {
        if (!collections.has(nft.collectionAddress)) {
          collections.set(nft.collectionAddress, {
            address: nft.collectionAddress,
            name: nft.collectionName || 'Unknown Collection',
            verified: true,
            count: 0,
          });
        }
        collections.get(nft.collectionAddress)!.count++;
      }
    });

    return NextResponse.json({
      wallet,
      nfts: transformed,
      total: transformed.length,
      collections: Array.from(collections.values()),
      message: transformed.length ? 'NFTs loaded successfully' : 'No NFTs found for this wallet',
    });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}