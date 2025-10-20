/**
 * TEST USER_PROFILES TABLE API
 * Direct test for user_profiles table
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Testing user_profiles table...');
    
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      });
    }

    // Test user_profiles table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      return NextResponse.json({
        success: true,
        table_exists: !error || error.code !== 'PGRST116',
        error: error?.message || null,
        data: data || null,
        message: error ? `Table check failed: ${error.message}` : 'Table exists and accessible'
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        table_exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        message: 'Exception occurred while checking table'
      });
    }

  } catch (error) {
    console.error('Error testing user_profiles table:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
