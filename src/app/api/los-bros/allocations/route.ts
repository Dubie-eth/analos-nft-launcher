import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/los-bros/allocations
 * Returns current allocation status for all tiers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching Los Bros allocation status...');

    // Get allocation status from view
    const { data: allocations, error } = await supabase
      .from('los_bros_allocation_status')
      .select('*')
      .order('tier', { ascending: true });

    if (error) {
      console.error('❌ Error fetching allocations:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Also get live mint counts from profile_nfts
    const { data: mintCounts, error: countError } = await supabase
      .from('profile_nfts')
      .select('los_bros_tier')
      .not('los_bros_tier', 'is', null);

    if (countError) {
      console.warn('⚠️ Error fetching mint counts:', countError);
    }

    // Count mints per tier
    const tierCounts = (mintCounts || []).reduce((acc: any, { los_bros_tier }) => {
      acc[los_bros_tier] = (acc[los_bros_tier] || 0) + 1;
      return acc;
    }, {});

    // Merge live counts with allocation data
    const enrichedAllocations = (allocations || []).map((alloc: any) => ({
      ...alloc,
      live_minted_count: tierCounts[alloc.tier] || 0,
    }));

    console.log('✅ Allocation status fetched:', enrichedAllocations);

    return NextResponse.json({
      success: true,
      allocations: enrichedAllocations,
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

