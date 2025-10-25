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

