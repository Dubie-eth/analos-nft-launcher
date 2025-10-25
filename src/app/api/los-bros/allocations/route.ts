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

    // Get allocation status directly from table (not view)
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

    console.log('✅ Allocation status fetched:', allocations);

    return NextResponse.json({
      success: true,
      allocations: allocations || [],
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

