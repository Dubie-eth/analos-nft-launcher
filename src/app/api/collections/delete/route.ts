import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, userWallet } = body;

    if (!collectionId || !userWallet) {
      return NextResponse.json(
        { success: false, error: 'Collection ID and user wallet are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Deleting collection:', collectionId, 'for wallet:', userWallet);

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Supabase not configured');
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    // First, verify the collection belongs to this user
    const { data: collection, error: fetchError } = await (supabaseAdmin
      .from('saved_collections') as any)
      .select('id, user_wallet, collection_name')
      .eq('id', collectionId)
      .eq('user_wallet', userWallet)
      .single() as { data: any; error: any };

    if (fetchError) {
      console.error('❌ Error fetching collection:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Check if collection has been launched (has a deployed contract)
    // For now, we'll allow deletion of all saved collections
    // In the future, you might want to check for deployed status
    
    // Delete the collection
    const { error: deleteError } = await (supabaseAdmin
      .from('saved_collections') as any)
      .delete()
      .eq('id', collectionId)
      .eq('user_wallet', userWallet);

    if (deleteError) {
      console.error('❌ Error deleting collection:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete collection' },
        { status: 500 }
      );
    }

    console.log('✅ Collection deleted successfully:', collection.collection_name);

    return NextResponse.json({
      success: true,
      message: `Collection "${collection.collection_name}" deleted successfully`
    });

  } catch (error) {
    console.error('💥 Error in delete collection API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
