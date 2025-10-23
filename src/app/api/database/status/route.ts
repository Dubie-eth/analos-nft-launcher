import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Supabase environment variables not configured',
        tables: [],
        rls_status: [],
        admin_users: 0,
        feature_flags: 0,
        page_access_config: 0,
        mint_counter: null
      });
    }

    const supabase = getSupabaseAdmin();

    // Check if tables exist
    const requiredTables = [
      'user_profiles',
      'profile_nfts', 
      'profile_nft_mint_counter',
      'admin_users',
      'feature_flags',
      'page_access_config',
      'social_verification',
      'saved_collections',
      'free_mint_usage',
      'whitelist_registry'
    ];

    const tableStatus = [];
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await (supabase
          .from(tableName) as any)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          tableStatus.push({
            table: tableName,
            exists: false,
            error: error.message,
            row_count: 0
          });
        } else {
          tableStatus.push({
            table: tableName,
            exists: true,
            row_count: data?.length || 0
          });
        }
      } catch (err) {
        tableStatus.push({
          table: tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          row_count: 0
        });
      }
    }

    // Check admin users
    let adminCount = 0;
    try {
      const { count } = await (supabase
        .from('admin_users') as any)
        .select('*', { count: 'exact', head: true });
      adminCount = count || 0;
    } catch (err) {
      console.error('Error checking admin users:', err);
    }

    // Check feature flags
    let featureFlagCount = 0;
    try {
      const { count } = await (supabase
        .from('feature_flags') as any)
        .select('*', { count: 'exact', head: true });
      featureFlagCount = count || 0;
    } catch (err) {
      console.error('Error checking feature flags:', err);
    }

    // Check page access config
    let pageAccessCount = 0;
    try {
      const { count } = await (supabase
        .from('page_access_config') as any)
        .select('*', { count: 'exact', head: true });
      pageAccessCount = count || 0;
    } catch (err) {
      console.error('Error checking page access config:', err);
    }

    // Check mint counter
    let mintCounter = null;
    try {
      const { data } = await (supabase
        .from('profile_nft_mint_counter') as any)
        .select('*')
        .limit(1)
        .single();
      mintCounter = data;
    } catch (err) {
      console.error('Error checking mint counter:', err);
    }

    return NextResponse.json({
      status: 'configured',
      message: 'Database status check complete',
      tables: tableStatus,
      admin_users: adminCount,
      feature_flags: featureFlagCount,
      page_access_config: pageAccessCount,
      mint_counter: mintCounter,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check database status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
