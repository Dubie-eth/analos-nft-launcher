import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/execute-sale
 * Execute an NFT sale with platform fee distribution
 * 
 * Flow:
 * 1. Buyer pays sale price to escrow
 * 2. Platform takes 6.9% fee
 * 3. Seller receives 93.1% of sale price
 * 4. NFT transfers to buyer
 * 5. Record sale in database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nftMint,
      nftType,
      sellerWallet,
      buyerWallet,
      salePrice,
      currency = 'LOS',
      saleType, // 'listing' | 'offer' | 'direct'
      listingId,
      offerId,
      transactionSignature,
      nftName
    } = body;

    // Validation
    if (!nftMint || !sellerWallet || !buyerWallet || !salePrice || !transactionSignature) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    if (sellerWallet === buyerWallet) {
      return NextResponse.json({
        success: false,
        error: 'Cannot buy your own NFT'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();

    // Calculate fees manually (6.9% platform fee)
    const platformFee = salePrice * 0.069; // 6.9%
    const creatorRoyalty = 0; // Not implemented yet
    const sellerReceives = salePrice - platformFee - creatorRoyalty;

    console.log(`💰 Fee Calculation:`);
    console.log(`  Sale Price: ${salePrice} ${currency}`);
    console.log(`  Platform Fee (6.9%): ${platformFee} ${currency}`);
    console.log(`  Creator Royalty: ${creatorRoyalty} ${currency}`);
    console.log(`  Seller Receives: ${sellerReceives} ${currency}`);

    // Record sale
    return await recordSale(supabase, {
      nftMint,
      nftType,
      nftName,
      sellerWallet,
      buyerWallet,
      salePrice,
      currency,
      platformFee,
      creatorRoyalty,
      sellerReceives,
      saleType,
      listingId,
      offerId,
      transactionSignature
    });

  } catch (error: any) {
    console.error('❌ Error executing sale:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Helper function to record a sale
 */
async function recordSale(supabase: any, saleData: any) {
  try {
    // 1. Record the sale
    const { data: sale, error: saleError } = await (supabase
      .from('nft_sales') as any)
      .insert({
        nft_mint: saleData.nftMint,
        nft_type: saleData.nftType || 'profile_nft',
        nft_name: saleData.nftName,
        seller_wallet: saleData.sellerWallet,
        buyer_wallet: saleData.buyerWallet,
        sale_price: saleData.salePrice,
        currency: saleData.currency,
        platform_fee: saleData.platformFee,
        creator_royalty: saleData.creatorRoyalty,
        seller_receives: saleData.sellerReceives,
        sale_type: saleData.saleType,
        listing_id: saleData.listingId,
        offer_id: saleData.offerId,
        transaction_signature: saleData.transactionSignature,
        sold_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saleError) {
      console.error('❌ Error recording sale:', saleError);
      throw saleError;
    }

    // 2. Mark listing as sold (if from listing)
    if (saleData.listingId) {
      await (supabase
        .from('nft_listings') as any)
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          sale_signature: saleData.transactionSignature
        })
        .eq('id', saleData.listingId);
    }

    // 3. Mark offer as accepted (if from offer)
    if (saleData.offerId) {
      await (supabase
        .from('nft_offers') as any)
        .update({
          status: 'accepted',
          seller_wallet: saleData.sellerWallet,
          responded_at: new Date().toISOString(),
          acceptance_signature: saleData.transactionSignature
        })
        .eq('id', saleData.offerId);
    }

    // 4. Cancel all other pending offers for this NFT
    await (supabase
      .from('nft_offers') as any)
      .update({ status: 'cancelled' })
      .eq('nft_mint', saleData.nftMint)
      .eq('status', 'pending')
      .neq('id', saleData.offerId || '00000000-0000-0000-0000-000000000000');

    console.log(`✅ Sale recorded: ${saleData.nftMint} sold for ${saleData.salePrice} ${saleData.currency}`);
    console.log(`💵 Seller receives: ${saleData.sellerReceives} ${saleData.currency}`);
    console.log(`🏦 Platform fee: ${saleData.platformFee} ${saleData.currency}`);

    return NextResponse.json({
      success: true,
      message: 'Sale executed successfully',
      sale: {
        id: sale.id,
        nftMint: sale.nft_mint,
        salePrice: sale.sale_price,
        platformFee: sale.platform_fee,
        sellerReceives: sale.seller_receives,
        buyer: sale.buyer_wallet,
        seller: sale.seller_wallet,
        signature: sale.transaction_signature
      }
    });

  } catch (error: any) {
    console.error('❌ Error recording sale:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record sale',
      details: error.message
    }, { status: 500 });
  }
}

