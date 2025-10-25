import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/nft/transfer
 * Record NFT transfer in database after on-chain transfer completes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nftMint, 
      fromWallet, 
      toWallet, 
      signature,
      tokenId,
      collectionType // 'losbros' or 'profile'
    } = body;

    if (!nftMint || !fromWallet || !toWallet || !signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Update NFT ownership in database
    const { data, error } = await (supabase
      .from('profile_nfts') as any)
      .update({
        wallet_address: toWallet,
        updated_at: new Date().toISOString()
      })
      .eq('mint_address', nftMint)
      .select();

    if (error) {
      console.error('❌ Error updating NFT ownership:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update ownership in database',
        details: error.message
      }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ NFT not found in database:', nftMint);
      // Not a critical error - on-chain transfer still succeeded
      return NextResponse.json({
        success: true,
        message: 'Transfer completed on-chain (NFT not in database)',
        signature,
        warning: 'NFT not found in database'
      });
    }

    // Record transfer in transfer history (optional)
    try {
      await (supabase
        .from('nft_transfers') as any)
        .insert({
          nft_mint: nftMint,
          from_wallet: fromWallet,
          to_wallet: toWallet,
          transaction_signature: signature,
          collection_type: collectionType || 'unknown',
          token_id: tokenId,
          transferred_at: new Date().toISOString()
        });
    } catch (historyError) {
      console.warn('⚠️ Failed to record transfer history (non-critical):', historyError);
    }

    console.log('✅ NFT ownership updated in database');
    console.log(`  ${nftMint}: ${fromWallet} → ${toWallet}`);

    return NextResponse.json({
      success: true,
      message: 'NFT transferred and ownership updated',
      signature,
      nft: data[0]
    });

  } catch (error: any) {
    console.error('❌ Error in transfer API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

