import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Collections analytics API called');

    const collections = await analyticsService.getCollectionStats();

    return NextResponse.json({
      success: true,
      collections
    });

  } catch (error) {
    console.error('❌ Error fetching collections analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

