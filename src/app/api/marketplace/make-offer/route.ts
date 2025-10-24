import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/make-offer
 * Make an offer on an NFT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nftMint,
      nftType,
      buyerWallet,
      offerPrice,
      currency = 'LOS',
      expiresInDays = 7,
      offerSignature
    } = body;

    // Validation
    if (!nftMint || !buyerWallet || !offerPrice) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: nftMint, buyerWallet, offerPrice'
      }, { status: 400 });
    }

    if (offerPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Offer price must be greater than 0'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Check if buyer already has a pending offer on this NFT
    const { data: existingOffer } = await (supabase
      .from('nft_offers') as any)
      .select('id, offer_price')
      .eq('nft_mint', nftMint)
      .eq('buyer_wallet', buyerWallet)
      .eq('status', 'pending')
      .single();

    if (existingOffer) {
      // Cancel old offer and create new one
      await (supabase
        .from('nft_offers') as any)
        .update({ status: 'cancelled' })
        .eq('id', existingOffer.id);
      
      console.log(`🔄 Updated existing offer from ${existingOffer.offer_price} to ${offerPrice}`);
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create offer
    const { data: offer, error } = await (supabase
      .from('nft_offers') as any)
      .insert({
        nft_mint: nftMint,
        nft_type: nftType || 'profile_nft',
        buyer_wallet: buyerWallet,
        offer_price: offerPrice,
        currency,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        offer_signature: offerSignature,
        offered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating offer:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create offer',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Offer created: ${offerPrice} ${currency} for ${nftMint} by ${buyerWallet}`);

    return NextResponse.json({
      success: true,
      message: 'Offer created successfully',
      offer: {
        id: offer.id,
        nftMint: offer.nft_mint,
        offerPrice: offer.offer_price,
        currency: offer.currency,
        expiresAt: offer.expires_at
      }
    });

  } catch (error: any) {
    console.error('❌ Error in make-offer API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/marketplace/make-offer?offerId=xxx
 * Accept or reject an offer
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');
    
    const body = await request.json();
    const { action, sellerWallet, acceptanceSignature } = body;

    if (!offerId || !action || !sellerWallet) {
      return NextResponse.json({
        success: false,
        error: 'Missing offerId, action, or sellerWallet'
      }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Action must be "accept" or "reject"'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Get offer details
    const { data: offer, error: fetchError } = await (supabase
      .from('nft_offers') as any)
      .select('*')
      .eq('id', offerId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({
        success: false,
        error: 'Offer not found or already processed'
      }, { status: 404 });
    }

    // Update offer status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { error: updateError } = await (supabase
      .from('nft_offers') as any)
      .update({
        status: newStatus,
        seller_wallet: sellerWallet,
        responded_at: new Date().toISOString(),
        acceptance_signature: acceptanceSignature
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('❌ Error updating offer:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update offer',
        details: updateError.message
      }, { status: 500 });
    }

    console.log(`✅ Offer ${newStatus}: ${offer.offer_price} ${offer.currency} for ${offer.nft_mint}`);

    return NextResponse.json({
      success: true,
      message: `Offer ${newStatus} successfully`,
      offer: {
        id: offer.id,
        status: newStatus,
        nftMint: offer.nft_mint,
        offerPrice: offer.offer_price
      }
    });

  } catch (error: any) {
    console.error('❌ Error responding to offer:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/marketplace/make-offer?offerId=xxx
 * Cancel your own offer
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');
    const buyerWallet = searchParams.get('buyerWallet');

    if (!offerId || !buyerWallet) {
      return NextResponse.json({
        success: false,
        error: 'Missing offerId or buyerWallet'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Cancel offer
    const { data, error } = await (supabase
      .from('nft_offers') as any)
      .update({
        status: 'cancelled'
      })
      .eq('id', offerId)
      .eq('buyer_wallet', buyerWallet)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('❌ Error cancelling offer:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to cancel offer',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Offer not found or already processed'
      }, { status: 404 });
    }

    console.log(`✅ Offer cancelled: ${offerId}`);

    return NextResponse.json({
      success: true,
      message: 'Offer cancelled successfully'
    });

  } catch (error: any) {
    console.error('❌ Error cancelling offer:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

