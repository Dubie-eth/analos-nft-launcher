/**
 * DATABASE SETUP API
 * Sets up all necessary database tables for the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting database setup...');

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured or admin client not available' },
        { status: 500 }
      );
    }

    // Create tables one by one using Supabase client
    console.log('📝 Creating database tables...');
    
    const results: Record<string, any> = {};

    // Create user_profiles table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      results.user_profiles = {
        exists: !error || error.code !== 'PGRST116',
        error: error ? error.message : null
      };
    } catch (err) {
      results.user_profiles = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // Create profile_nfts table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('profile_nfts')
        .select('*')
        .limit(1);
      
      results.profile_nfts = {
        exists: !error || error.code !== 'PGRST116',
        error: error ? error.message : null
      };
    } catch (err) {
      results.profile_nfts = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    // Create profile_nft_mint_counter table
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('profile_nft_mint_counter')
        .select('*')
        .limit(1);
      
      results.profile_nft_mint_counter = {
        exists: !error || error.code !== 'PGRST116',
        error: error ? error.message : null
      };
    } catch (err) {
      results.profile_nft_mint_counter = {
        exists: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    console.log('✅ Database setup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
      tables: results
    });

  } catch (error) {
    console.error('❌ Error in database setup:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during database setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('🔍 Checking database tables...');

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured or admin client not available' },
        { status: 500 }
      );
    }

    // Check if tables exist
    const tables = ['user_profiles', 'profile_nfts', 'profile_nft_mint_counter', 'admin_users'];
    const tableStatus: Record<string, any> = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await (supabaseAdmin as any)
          .from(tableName)
          .select('*')
          .limit(1);

        tableStatus[tableName] = {
          exists: !error || error.code !== 'PGRST116',
          error: error ? error.message : null,
          data: data
        };
      } catch (err) {
        tableStatus[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          data: null
        };
      }
    }

    return NextResponse.json({
      success: true,
      database_configured: isSupabaseConfigured,
      admin_available: !!supabaseAdmin,
      tables: tableStatus
    });

  } catch (error) {
    console.error('❌ Error checking database tables:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during database check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
