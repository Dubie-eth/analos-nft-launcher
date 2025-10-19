import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// GET - Fetch all visible features for public display
export async function GET(request: NextRequest) {
  try {
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
            ]
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
      console.error('Error fetching features:', error);
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      );
    }

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error in GET /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Admin only: Update feature status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, updates, adminWallet } = body;

    if (!featureId || !updates || !adminWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Feature updated (database not configured)',
        _warning: 'Database not configured - changes not persisted'
      });
    }

    // Add admin wallet to updates
    const updateData = {
      ...updates,
      updated_by: adminWallet,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await (supabaseAdmin
      .from('feature_management') as any)
      .update(updateData)
      .eq('id', featureId)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature:', error);
      return NextResponse.json(
        { error: 'Failed to update feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feature updated successfully',
      feature: data
    });
  } catch (error) {
    console.error('Error in POST /api/features:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
