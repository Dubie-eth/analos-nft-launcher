import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userWallet, 
      collectionName, 
      collectionSymbol, 
      description, 
      totalSupply, 
      mintPrice, 
      revealType, 
      revealDate, 
      whitelistEnabled, 
      bondingCurveEnabled, 
      layers, 
      collectionConfig 
    } = body;

    // Validate required fields
    if (!userWallet || !collectionName || !collectionSymbol) {
      return NextResponse.json(
        { error: 'Missing required fields: userWallet, collectionName, collectionSymbol' },
        { status: 400 }
      );
    }

    // Validate layers
    if (!layers || !Array.isArray(layers)) {
      return NextResponse.json(
        { error: 'Layers must be an array' },
        { status: 400 }
      );
    }

    // Save collection to database
    const { data, error } = await supabase
      .from('saved_collections')
      .insert({
        user_wallet: userWallet,
        collection_name: collectionName,
        collection_symbol: collectionSymbol,
        description: description || '',
        total_supply: totalSupply || 1000,
        mint_price: mintPrice || 0.1,
        reveal_type: revealType || 'instant',
        reveal_date: revealDate || null,
        whitelist_enabled: whitelistEnabled || false,
        bonding_curve_enabled: bondingCurveEnabled || false,
        layers: layers,
        collection_config: collectionConfig || {},
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving collection:', error);
      return NextResponse.json(
        { error: 'Failed to save collection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: data,
      message: 'Collection saved successfully'
    });

  } catch (error) {
    console.error('Error in save collection API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    if (!userWallet) {
      return NextResponse.json(
        { error: 'userWallet parameter is required' },
        { status: 400 }
      );
    }

    // Get user's saved collections
    const { data, error } = await supabase
      .from('saved_collections')
      .select('*')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collections: data || []
    });

  } catch (error) {
    console.error('Error in get collections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
