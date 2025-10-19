import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import { PAGE_ACCESS } from '@/config/access-control';

// Mapping between page paths and feature keys
const PAGE_TO_FEATURE_MAPPING: Record<string, string> = {
  '/create-collection': 'nft_collection_creation',
  '/marketplace': 'advanced_marketplace',
  '/swap': 'token_swapping',
  '/staking': 'nft_staking',
  '/vesting': 'token_vesting',
  '/token-lock': 'token_locking',
  '/evolving-nfts': 'evolving_nfts',
  '/living-portfolio': 'living_portfolio',
  '/airdrops': 'airdrop_system',
  '/otc-marketplace': 'advanced_marketplace', // OTC is part of marketplace
  '/collections': 'nft_collection_creation', // Collections browsing is part of collection creation
  '/launch-collection': 'nft_collection_creation', // Launching is part of collection creation
};

// Sync feature status based on page access configuration
export async function POST(request: NextRequest) {
  try {
    const { adminWallet } = await request.json();

    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet required' },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Features synced (database not configured)',
        _warning: 'Database not configured - changes not persisted'
      });
    }

    const updates = [];
    
    // Process each page configuration and update corresponding features
    for (const page of PAGE_ACCESS) {
      const featureKey = PAGE_TO_FEATURE_MAPPING[page.path];
      if (!featureKey) continue;

      // Determine feature status based on page configuration
      let accessLevel: 'locked' | 'beta' | 'public' = 'locked';
      let status: 'development' | 'testing' | 'live' | 'deprecated' = 'development';
      let isVisible = true;
      let completionPercentage = 0;

      if (page.isLocked) {
        accessLevel = 'locked';
        status = 'development';
        completionPercentage = Math.floor(Math.random() * 40) + 10; // 10-50% for locked features
      } else if (page.requiredLevel === 'beta_user') {
        accessLevel = 'beta';
        status = 'testing';
        completionPercentage = Math.floor(Math.random() * 30) + 70; // 70-100% for beta features
      } else if (page.requiredLevel === 'public') {
        accessLevel = 'public';
        status = 'live';
        completionPercentage = Math.floor(Math.random() * 10) + 90; // 90-100% for public features
      } else if (page.requiredLevel === 'premium_user') {
        accessLevel = 'beta';
        status = 'live';
        completionPercentage = Math.floor(Math.random() * 15) + 85; // 85-100% for premium features
      }

      // Special handling for specific features
      if (featureKey === 'nft_collection_creation') {
        completionPercentage = 95;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'advanced_marketplace') {
        completionPercentage = 85;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'token_swapping') {
        completionPercentage = 70;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'nft_staking') {
        completionPercentage = 90;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'token_vesting') {
        completionPercentage = 80;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'token_locking') {
        completionPercentage = 75;
        status = 'live';
        accessLevel = 'public';
      } else if (featureKey === 'airdrop_system') {
        completionPercentage = 85;
        status = 'live';
        accessLevel = 'public';
      }

      // Update the feature in the database
      const { data, error } = await (supabaseAdmin
        .from('feature_management') as any)
        .update({
          access_level: accessLevel,
          status: status,
          is_visible: isVisible,
          completion_percentage: completionPercentage,
          updated_by: adminWallet,
          updated_at: new Date().toISOString()
        })
        .eq('feature_key', featureKey)
        .select()
        .single();

      if (error) {
        console.error(`Error updating feature ${featureKey}:`, error);
        continue;
      }

      updates.push({
        featureKey,
        pagePath: page.path,
        updates: {
          access_level: accessLevel,
          status: status,
          is_visible: isVisible,
          completion_percentage: completionPercentage
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Features synced with page access configuration',
      updates,
      syncedFeatures: updates.length
    });

  } catch (error) {
    console.error('Error in POST /api/sync-features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get sync status
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        message: 'Database not configured',
        syncAvailable: false
      });
    }

    const { data: features, error } = await (supabaseAdmin
      .from('feature_management') as any)
      .select('feature_key, access_level, status, completion_percentage, is_visible')
      .order('feature_name');

    if (error) {
      console.error('Error fetching features for sync status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      );
    }

    const syncStatus = features.map((feature: any) => ({
      featureKey: feature.feature_key,
      accessLevel: feature.access_level,
      status: feature.status,
      completionPercentage: feature.completion_percentage,
      isVisible: feature.is_visible
    }));

    return NextResponse.json({
      syncStatus,
      totalFeatures: features.length,
      mappedPages: Object.keys(PAGE_TO_FEATURE_MAPPING).length
    });

  } catch (error) {
    console.error('Error in GET /api/sync-features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
