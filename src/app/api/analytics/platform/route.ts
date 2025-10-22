import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Platform analytics API called');

    const analytics = await analyticsService.getPlatformAnalytics();

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Error fetching platform analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

