import { NextRequest, NextResponse } from 'next/server';
import { readPricingHistory, getPricingAnalytics } from '@/lib/pricing-history';

export async function GET(_req: NextRequest) {
  try {
    const [history, analytics] = await Promise.all([
      readPricingHistory(),
      getPricingAnalytics(),
    ]);

    return NextResponse.json({ success: true, history, analytics });
  } catch (error) {
    console.error('Error fetching pricing history:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing history' }, { status: 500 });
  }
}
