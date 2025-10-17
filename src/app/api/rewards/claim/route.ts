import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, rewardIds, txSignature } = body;

    // Validate required fields
    if (!userWallet || !rewardIds || !Array.isArray(rewardIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: userWallet, rewardIds' },
        { status: 400 }
      );
    }

    // Update rewards to claimed status
    const { data, error } = await (supabaseAdmin
      .from('creator_rewards') as any)
      .update({
        status: 'claimed',
        claim_tx_signature: txSignature || null,
        claimed_at: new Date().toISOString()
      })
      .in('id', rewardIds)
      .eq('user_wallet', userWallet)
      .eq('status', 'claimable')
      .select() as { data: any; error: any };

    if (error) {
      console.error('Error claiming rewards:', error);
      return NextResponse.json(
        { error: 'Failed to claim rewards' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No claimable rewards found or already claimed' },
        { status: 400 }
      );
    }

    // Calculate total claimed amount
    const totalClaimed = data.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);

    return NextResponse.json({
      success: true,
      claimedRewards: data,
      totalClaimed: totalClaimed,
      message: `Successfully claimed ${data.length} rewards totaling ${totalClaimed} tokens`
    });

  } catch (error) {
    console.error('Error in claim rewards API:', error);
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

    // Get claimable rewards for user
    const { data, error } = await (supabaseAdmin
      .from('creator_rewards') as any)
      .select(`
        *,
        saved_collections!inner(collection_name, collection_symbol)
      `)
      .eq('user_wallet', userWallet)
      .eq('status', 'claimable')
      .order('created_at', { ascending: false }) as { data: any; error: any };

    if (error) {
      console.error('Error fetching claimable rewards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claimable rewards' },
        { status: 500 }
      );
    }

    // Calculate total claimable amount
    const totalClaimable = data?.reduce((sum, reward) => sum + parseFloat(reward.amount), 0) || 0;

    return NextResponse.json({
      success: true,
      claimableRewards: data || [],
      totalClaimable: totalClaimable
    });

  } catch (error) {
    console.error('Error in get claimable rewards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
