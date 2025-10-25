import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/marketplace/list
 * Create a new NFT listing on the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftMint, collectionAddress, collectionName, seller, price, nftName, nftImage } = body;

    // Validate required fields
    if (!nftMint || !seller || !price) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: nftMint, seller, price' 
        },
        { status: 400 }
      );
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Price must be greater than 0' 
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if NFT is already listed
    const { data: existing } = await (supabase
      .from('marketplace_listings') as any)
      .select('id')
      .eq('nft_mint', nftMint)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'NFT is already listed on the marketplace'
      }, { status: 400 });
    }

    // Create new listing
    const { data, error } = await (supabase
      .from('marketplace_listings') as any)
      .insert({
        nft_mint: nftMint,
        collection_address: collectionAddress || 'los-bros',
        collection_name: collectionName || 'Los Bros',
        nft_name: nftName || 'Unnamed NFT',
        nft_image: nftImage,
        seller_wallet: seller,
        list_price: price,
        status: 'active',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating listing:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create listing',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ NFT listed successfully:', nftMint, 'at', price, 'LOS');

    return NextResponse.json({
      success: true,
      message: 'NFT listed successfully',
      listing: data
    });

  } catch (error: any) {
    console.error('❌ Error in list API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

