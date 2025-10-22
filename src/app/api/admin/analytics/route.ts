import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

type AnalyticsResponse = {
  success: boolean;
  overall: {
    totalMints: number;
    totalRevenueLOS: number;
    uniqueHolders: number;
    last24hMints: number;
  };
  mintsByDay: Record<string, number>;
  revenueByDay: Record<string, number>;
};

export async function GET(_req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      const empty: AnalyticsResponse = {
        success: true,
        overall: { totalMints: 0, totalRevenueLOS: 0, uniqueHolders: 0, last24hMints: 0 },
        mintsByDay: {},
        revenueByDay: {},
      };
      return NextResponse.json(empty);
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('profile_nfts')
      .select('wallet_address, created_at, mint_price')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Analytics query error:', error);
      return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 });
    }

    const items = (data || []) as Array<{ wallet_address: string; created_at: string; mint_price: number | null }>;
    const mintsByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    const holders = new Set<string>();

    let totalRevenueLOS = 0;
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    let last24hMints = 0;

    for (const it of items) {
      holders.add(it.wallet_address);
      const day = it.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
      mintsByDay[day] = (mintsByDay[day] || 0) + 1;
      const price = typeof it.mint_price === 'number' ? it.mint_price : 4.2;
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(price);
      totalRevenueLOS += Number(price);
      if (new Date(it.created_at).getTime() >= last24h) last24hMints += 1;
    }

    const resp: AnalyticsResponse = {
      success: true,
      overall: {
        totalMints: items.length,
        totalRevenueLOS,
        uniqueHolders: holders.size,
        last24hMints,
      },
      mintsByDay,
      revenueByDay,
    };
    return NextResponse.json(resp);
  } catch (e) {
    console.error('Analytics error:', e);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
