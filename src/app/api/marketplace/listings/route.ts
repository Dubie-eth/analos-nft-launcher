import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo (in production, use database)
const listings = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection');
    const seller = searchParams.get('seller');

    let allListings = Array.from(listings.values());

    // Filter by collection if specified
    if (collection) {
      allListings = allListings.filter(l => l.collectionAddress === collection);
    }

    // Filter by seller if specified
    if (seller) {
      allListings = allListings.filter(l => l.seller === seller);
    }

    // Sort by date (newest first)
    allListings.sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());

    return NextResponse.json({
      success: true,
      listings: allListings,
      total: allListings.length
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftMint, collectionAddress, collectionName, seller, price, nftName, nftImage } = body;

    // Validate required fields
    if (!nftMint || !seller || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: nftMint, seller, price' },
        { status: 400 }
      );
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Create listing
    const listing = {
      id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nftMint,
      collectionAddress: collectionAddress || 'unknown',
      collectionName: collectionName || 'Unknown Collection',
      nftName: nftName || 'Unnamed NFT',
      nftImage: nftImage || '/api/placeholder/400/400',
      seller,
      price,
      status: 'active',
      listedAt: new Date().toISOString(),
      views: 0
    };

    listings.set(listing.id, listing);

    console.log('✅ Created listing:', listing);

    return NextResponse.json({
      success: true,
      message: 'NFT listed successfully',
      listing
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('id');

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (listings.has(listingId)) {
      listings.delete(listingId);
      return NextResponse.json({
        success: true,
        message: 'Listing removed successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

