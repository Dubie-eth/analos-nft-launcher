import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';
import { isAdminWallet } from '@/lib/admin-utils';

// GET - Admin only: Fetch all features for management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminWallet = searchParams.get('adminWallet');

    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured) {
      // Return mock data if database not configured
      return NextResponse.json({
        features: [
          {
            id: '1',
            feature_key: 'nft_collection_creation',
            feature_name: 'NFT Collection Creation',
            description: 'Create and deploy your own NFT collections with custom traits, rarity systems, and metadata.',
            icon: '🎨',
            completion_percentage: 0,
            access_level: 'locked',
            status: 'development',
            is_visible: false,
            details: [
              'Custom trait layers and rarity weights',
              'Automated metadata generation',
              'On-chain collection deployment',
              'Royalty management',
              'Batch minting capabilities'
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: null
          }
        ],
        _warning: 'Database not configured - showing mock data'
      });
    }

    const { data: features, error } = await (supabaseAdmin
      .from('feature_management') as any)
      .select('*')
      .order('feature_name');

    if (error) {
      console.error('Error fetching admin features:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      );
    }

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error in GET /api/admin/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Admin only: Bulk update features
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, adminWallet } = body;

    if (!updates || !adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Features updated (database not configured)',
        _warning: 'Database not configured - changes not persisted'
      });
    }

    const updatePromises = updates.map((update: any) => {
      const updateData = {
        ...update.updates,
        updated_by: adminWallet,
        updated_at: new Date().toISOString()
      };

      return (supabaseAdmin
        .from('feature_management') as any)
        .update(updateData)
        .eq('id', update.featureId)
        .select()
        .single();
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error('Errors updating features:', errors);
      return NextResponse.json(
        { error: 'Some features failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Features updated successfully',
      updatedCount: results.length
    });
  } catch (error) {
    console.error('Error in POST /api/admin/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
