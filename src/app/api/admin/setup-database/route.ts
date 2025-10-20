/**
 * ADMIN DATABASE SETUP API
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

    // Create tables using raw SQL queries
    const tables = [
      {
        name: 'user_profiles',
        sql: `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            wallet_address TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            bio TEXT,
            avatar_url TEXT,
            banner_url TEXT,
            twitter_handle TEXT,
            twitter_verified BOOLEAN DEFAULT false,
            website TEXT,
            discord TEXT,
            telegram TEXT,
            github TEXT,
            is_anonymous BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );
        `
      },
      {
        name: 'profile_nfts',
        sql: `
          CREATE TABLE IF NOT EXISTS public.profile_nfts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            wallet_address TEXT NOT NULL,
            mint_address TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            display_name TEXT,
            bio TEXT,
            avatar_url TEXT,
            banner_url TEXT,
            referral_code TEXT NOT NULL,
            twitter_handle TEXT,
            twitter_verified BOOLEAN DEFAULT false,
            nft_metadata JSONB NOT NULL,
            mint_price DECIMAL(10,2) DEFAULT 4.20,
            explorer_url TEXT,
            transaction_signature TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );
        `
      },
      {
        name: 'profile_nft_mint_counter',
        sql: `
          CREATE TABLE IF NOT EXISTS public.profile_nft_mint_counter (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            current_mint_number INTEGER NOT NULL DEFAULT 0,
            total_minted INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
          );
        `
      }
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
      try {
        console.log(`📝 Creating table: ${table.name}`);
        
        // Use the Supabase client to execute raw SQL
        const { data, error } = await (supabaseAdmin as any)
          .rpc('exec', { sql: table.sql });

        if (error) {
          console.error(`❌ Error creating table ${table.name}:`, error);
          results[table.name] = {
            success: false,
            error: error.message
          };
        } else {
          console.log(`✅ Table ${table.name} created successfully`);
          results[table.name] = {
            success: true,
            message: 'Table created successfully'
          };
        }
      } catch (err) {
        console.error(`❌ Exception creating table ${table.name}:`, err);
        results[table.name] = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    // Insert initial counter if it doesn't exist
    try {
      const { data: existingCounter } = await (supabaseAdmin as any)
        .from('profile_nft_mint_counter')
        .select('*')
        .limit(1);

      if (!existingCounter || existingCounter.length === 0) {
        const { error: insertError } = await (supabaseAdmin as any)
          .from('profile_nft_mint_counter')
          .insert({
            current_mint_number: 1,
            total_minted: 0
          });

        if (insertError) {
          console.error('❌ Error inserting initial counter:', insertError);
        } else {
          console.log('✅ Initial mint counter inserted');
        }
      }
    } catch (err) {
      console.error('❌ Error with initial counter:', err);
    }

    console.log('✅ Database setup completed');

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      results: results
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
    const tables = ['user_profiles', 'profile_nfts', 'profile_nft_mint_counter'];
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
