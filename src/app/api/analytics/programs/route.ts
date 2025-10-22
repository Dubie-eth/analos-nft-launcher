import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Programs analytics API called');

    const programs = await analyticsService.getProgramStatus();

    return NextResponse.json({
      success: true,
      programs
    });

  } catch (error) {
    console.error('❌ Error fetching programs analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

