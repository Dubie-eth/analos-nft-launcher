import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/list-nft
 * List an NFT for sale in the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nftMint,
      nftType,
      sellerWallet,
      listPrice,
      currency = 'LOS',
      nftName,
      nftImage,
      nftMetadata,
      expiresInDays = 30,
      listingSignature
    } = body;

    // Validation
    if (!nftMint || !sellerWallet || !listPrice) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: nftMint, sellerWallet, listPrice'
      }, { status: 400 });
    }

    if (listPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'List price must be greater than 0'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Check if NFT already has an active listing
    const { data: existingListing } = await (supabase
      .from('nft_listings') as any)
      .select('id, seller_wallet, list_price')
      .eq('nft_mint', nftMint)
      .eq('status', 'active')
      .single();

    if (existingListing) {
      return NextResponse.json({
        success: false,
        error: 'NFT already listed',
        details: `This NFT is already listed for ${existingListing.list_price} ${currency} by ${existingListing.seller_wallet}`
      }, { status: 409 });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create listing
    const { data: listing, error } = await (supabase
      .from('nft_listings') as any)
      .insert({
        nft_mint: nftMint,
        nft_type: nftType || 'profile_nft',
        seller_wallet: sellerWallet,
        list_price: listPrice,
        currency,
        status: 'active',
        nft_name: nftName,
        nft_image: nftImage,
        nft_metadata: nftMetadata,
        expires_at: expiresAt.toISOString(),
        listing_signature: listingSignature,
        listed_at: new Date().toISOString()
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

    console.log(`✅ NFT listed: ${nftMint} for ${listPrice} ${currency} by ${sellerWallet}`);

    return NextResponse.json({
      success: true,
      message: 'NFT listed successfully',
      listing: {
        id: listing.id,
        nftMint: listing.nft_mint,
        listPrice: listing.list_price,
        currency: listing.currency,
        expiresAt: listing.expires_at
      }
    });

  } catch (error: any) {
    console.error('❌ Error in list-nft API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/marketplace/list-nft?nftMint=xxx&sellerWallet=xxx
 * Cancel an active listing
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nftMint = searchParams.get('nftMint');
    const sellerWallet = searchParams.get('sellerWallet');

    if (!nftMint || !sellerWallet) {
      return NextResponse.json({
        success: false,
        error: 'Missing nftMint or sellerWallet'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Update listing status to cancelled
    const { data, error } = await (supabase
      .from('nft_listings') as any)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('nft_mint', nftMint)
      .eq('seller_wallet', sellerWallet)
      .eq('status', 'active')
      .select();

    if (error) {
      console.error('❌ Error cancelling listing:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to cancel listing',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active listing found for this NFT'
      }, { status: 404 });
    }

    console.log(`✅ Listing cancelled for ${nftMint}`);

    return NextResponse.json({
      success: true,
      message: 'Listing cancelled successfully'
    });

  } catch (error: any) {
    console.error('❌ Error cancelling listing:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

