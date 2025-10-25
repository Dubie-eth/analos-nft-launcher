import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/los-bros/allocations
 * Returns current allocation status for all tiers
 */
export async function GET(request: NextRequest) {
  // Lazy initialize Supabase client at runtime (not build time)
  const supabase = getSupabaseAdmin();
  try {
    console.log('📊 Fetching Los Bros allocation status...');

    // Get base allocations
    const { data: allocations, error } = await supabase
      .from('los_bros_allocations')
      .select('*')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Error fetching allocations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get live counts from profile_nfts table (actual minted NFTs)
    const { data: mintCounts, error: countError } = await supabase
      .from('profile_nfts')
      .select('los_bros_tier')
      .not('los_bros_token_id', 'is', null);

    if (countError) {
      console.warn('⚠️ Error fetching mint counts:', countError);
    }

    // Count mints per tier
    const tierCounts: Record<string, number> = {};
    if (mintCounts) {
      mintCounts.forEach((row: any) => {
        const tier = row.los_bros_tier;
        if (tier) {
          tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        }
      });
    }

    // Merge live counts with allocations
    const allocationsWithLiveCounts = (allocations || []).map((alloc: any) => ({
      ...alloc,
      minted_count: tierCounts[alloc.tier] || 0,
      live_minted_count: tierCounts[alloc.tier] || 0,
      remaining: alloc.total_allocated - (tierCounts[alloc.tier] || 0),
    }));

    console.log('✅ Allocation status with live counts:', allocationsWithLiveCounts);

    return NextResponse.json({
      success: true,
      allocations: allocationsWithLiveCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error in allocations endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

