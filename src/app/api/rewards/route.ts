import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get user's rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('creator_rewards')
      .select(`
        *,
        saved_collections!inner(collection_name, collection_symbol)
      `)
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      );
    }

    // Get total rewards summary
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_user_total_rewards', { user_wallet_param: userWallet });

    if (summaryError) {
      console.error('Error fetching rewards summary:', summaryError);
      return NextResponse.json(
        { error: 'Failed to fetch rewards summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rewards: rewards || [],
      summary: summary?.[0] || { total_claimable: 0, total_claimed: 0, pending_rewards: 0 }
    });

  } catch (error) {
    console.error('Error in get rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, rewardType, amount, tokenMint, tokenSymbol, collectionId } = body;

    // Validate required fields
    if (!userWallet || !rewardType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userWallet, rewardType, amount' },
        { status: 400 }
      );
    }

    // Create new reward
    const { data, error } = await supabase
      .from('creator_rewards')
      .insert({
        user_wallet: userWallet,
        collection_id: collectionId || null,
        reward_type: rewardType,
        amount: amount,
        token_mint: tokenMint || null,
        token_symbol: tokenSymbol || 'LOS',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: data,
      message: 'Reward created successfully'
    });

  } catch (error) {
    console.error('Error in create reward API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
