/**
 * TEST DATABASE TABLES API
 * Check if required database tables exist
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔍 Testing database tables...');
    console.log('🔍 Supabase configured:', isSupabaseConfigured);
    console.log('🔍 Supabase admin available:', !!supabaseAdmin);
    
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        tables: {
          profile_nft_mint_counter: 'N/A - No database',
          profile_nfts: 'N/A - No database'
        }
      });
    }

    const results: any = {};

    // Test user_profiles table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      results.user_profiles = {
        exists: !error || error.code !== 'PGRST116',
        error: error?.message || null,
        data: data || null
      };
    } catch (error) {
      results.user_profiles = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    // Test profile_nft_mint_counter table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('profile_nft_mint_counter')
        .select('*')
        .limit(1);
      
      results.profile_nft_mint_counter = {
        exists: !error || error.code !== 'PGRST116',
        error: error?.message || null,
        data: data || null
      };
    } catch (error) {
      results.profile_nft_mint_counter = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    // Test profile_nfts table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('profile_nfts')
        .select('*')
        .limit(1);
      
      results.profile_nfts = {
        exists: !error || error.code !== 'PGRST116',
        error: error?.message || null,
        data: data || null
      };
    } catch (error) {
      results.profile_nfts = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    return NextResponse.json({
      success: true,
      database_configured: isSupabaseConfigured,
      admin_available: !!supabaseAdmin,
      tables: results
    });

  } catch (error) {
    console.error('Error testing database tables:', error);
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
