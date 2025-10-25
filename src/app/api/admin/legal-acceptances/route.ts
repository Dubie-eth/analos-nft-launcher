import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all legal acceptances
    const { data: acceptances, error } = await supabase
      .from('legal_acceptances')
      .select('*')
      .order('accepted_at', { ascending: false })
      .limit(500); // Last 500 acceptances

    if (error) {
      console.error('Error fetching legal acceptances:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch acceptances',
        acceptances: [],
        stats: { total: 0, safety: 0, legal: 0, uniqueWallets: 0 }
      });
    }

    // Calculate stats
    const total = acceptances?.length || 0;
    const safety = acceptances?.filter((a: any) => a.disclaimer_type === 'safety_disclaimer').length || 0;
    const legal = acceptances?.filter((a: any) => a.disclaimer_type === 'legal_banner').length || 0;
    const uniqueWallets = acceptances ? new Set(acceptances.map((a: any) => a.wallet_address)).size : 0;

    return NextResponse.json({
      success: true,
      acceptances: acceptances || [],
      stats: {
        total,
        safety,
        legal,
        uniqueWallets
      }
    });

  } catch (error: any) {
    console.error('❌ Error in legal-acceptances API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch legal acceptances',
        acceptances: [],
        stats: { total: 0, safety: 0, legal: 0, uniqueWallets: 0 }
      },
      { status: 500 }
    );
  }
}

