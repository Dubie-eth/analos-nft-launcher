/**
 * TEST DATABASE CONNECTION
 * Simple test to check if database is working
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    return NextResponse.json({
      databaseConfigured: isSupabaseConfigured,
      timestamp: new Date().toISOString(),
      message: 'Database test endpoint working'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
