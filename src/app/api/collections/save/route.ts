import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { withRateLimit, RATE_LIMITS, getClientIdentifier } from '@/lib/rate-limiter';
import { withSecurityValidation, SecurityValidator } from '@/lib/security-middleware';
import { SaveRestriction } from '@/lib/save-restriction';
import { ImageCleanupService } from '@/lib/image-cleanup-service';

// Apply rate limiting and security validation
const secureHandler = withSecurityValidation(
  withRateLimit(
    RATE_LIMITS.SAVE_COLLECTION,
    (request: any) => {
      return getClientIdentifier(request);
    }
  )(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { 
        userWallet, 
        collectionName, 
        collectionSymbol, 
        description, 
        totalSupply, 
        mintPrice, 
        revealType, 
        revealDate, 
        whitelistEnabled, 
        bondingCurveEnabled, 
        layers, 
        collectionConfig,
        collectionId, // Optional: if provided, update existing collection
        logoFile, // Optional: logo file data
        bannerFile, // Optional: banner file data
        pageLoadId // Required: page load ID for save restriction
      } = body;

      // Validate required fields
      if (!userWallet || !collectionName || !collectionSymbol || !pageLoadId) {
        return NextResponse.json(
          { error: 'Missing required fields: userWallet, collectionName, collectionSymbol, pageLoadId' },
          { status: 400 }
        );
      }

      // Validate wallet address
      const walletValidation = SecurityValidator.validateWalletAddress(userWallet);
      if (!walletValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid wallet address', details: walletValidation.errors },
          { status: 400 }
        );
      }

      // Check save restriction
      const saveRestriction = SaveRestriction.getInstance();
      const canSave = saveRestriction.canSave(userWallet, pageLoadId, 'save_collection');
      if (!canSave.allowed) {
        return NextResponse.json(
          { error: canSave.reason },
          { status: 429 }
        );
      }

      // Validate collection configuration
      const configValidation = SecurityValidator.validateCollectionConfig({
        name: collectionName,
        symbol: collectionSymbol,
        supply: totalSupply,
        mintPrice: mintPrice
      });
      if (!configValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid collection configuration', details: configValidation.errors },
          { status: 400 }
        );
      }

      // Validate layers
      if (!layers || !Array.isArray(layers)) {
        return NextResponse.json(
          { error: 'Layers must be an array' },
          { status: 400 }
        );
      }

    // Prepare collection data
    const collectionData = {
      user_wallet: userWallet,
      collection_name: collectionName,
      collection_symbol: collectionSymbol,
      description: description || '',
      total_supply: totalSupply || 1000,
      mint_price: mintPrice || 0.1,
      reveal_type: revealType || 'instant',
      reveal_date: revealDate || null,
      whitelist_enabled: whitelistEnabled || false,
      bonding_curve_enabled: bondingCurveEnabled || false,
      layers: layers,
      collection_config: collectionConfig || {},
      status: 'draft',
      updated_at: new Date().toISOString(),
      // Note: In a real implementation, you would upload logoFile and bannerFile to a storage service
      // and store the URLs here. For now, we'll store placeholder values.
      logo_url: logoFile ? 'uploaded_logo_url' : null,
      banner_url: bannerFile ? 'uploaded_banner_url' : null
    };

      // Get current data for image cleanup if updating
      let currentData = null;
      if (collectionId) {
        const { data: existingData } = await (supabaseAdmin
          .from('saved_collections') as any)
          .select('*')
          .eq('id', collectionId)
          .eq('user_wallet', userWallet)
          .single() as { data: any; error: any };
        currentData = existingData;
      }

      // If collectionId is provided, update existing collection, otherwise create new one
      let data, error;
      if (collectionId) {
        // Update existing collection
        const result = await (supabaseAdmin
          .from('saved_collections') as any)
          .update(collectionData)
          .eq('id', collectionId)
          .eq('user_wallet', userWallet) // Ensure user can only update their own collections
          .select()
          .single() as { data: any; error: any };
        data = result.data;
        error = result.error;
      } else {
        // Create new collection
        const result = await (supabaseAdmin
          .from('saved_collections') as any)
          .insert(collectionData)
          .select()
          .single() as { data: any; error: any };
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error saving collection:', error);
        return NextResponse.json(
          { error: 'Failed to save collection' },
          { status: 500 }
        );
      }

      // Record save attempt
      saveRestriction.recordSaveAttempt(userWallet, pageLoadId, 'save_collection');

      // Clean up old images if updating
      if (collectionId && currentData) {
        const imageCleanup = ImageCleanupService.getInstance();
        await imageCleanup.cleanupCollectionImages(collectionId, collectionData, currentData);
      }

      return NextResponse.json({
        success: true,
        collection: data,
        message: 'Collection saved successfully'
      });

    } catch (error) {
      console.error('Error in save collection API:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })
);

// Export the secure handler
export const POST = secureHandler;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('userWallet');

    if (!userWallet) {
      return NextResponse.json(
        { error: 'userWallet parameter is required' },
        { status: 400 }
      );
    }

    // Get user's saved collections
    const { data, error } = await supabaseAdmin
      .from('saved_collections')
      .select('*')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collections: data || []
    });

  } catch (error) {
    console.error('Error in get collections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
