import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { withRateLimit, RATE_LIMITS, getClientIdentifier } from '@/lib/rate-limiter';
import { withSecurityValidation, SecurityValidator } from '@/lib/security-middleware';
import { SaveRestriction } from '@/lib/save-restriction';
import { ImageCleanupService } from '@/lib/image-cleanup-service';
import { UserIsolationService } from '@/lib/user-isolation-service';
import { SavedCollection } from '@/types/database';

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
        logo_url, // Optional: logo URL (base64 data URL)
        banner_url, // Optional: banner URL (base64 data URL)
        pageLoadId // Required: page load ID for save restriction
      } = body;

      // Debug: Log the received data
      console.log('Received save request data:', {
        userWallet,
        collectionName,
        collectionSymbol,
        description,
        totalSupply,
        mintPrice,
        layers: layers ? `Array with ${layers.length} items` : 'null/undefined',
        pageLoadId
      });

      // Validate required fields
      if (!userWallet || !collectionName || !collectionSymbol || !pageLoadId) {
        return NextResponse.json(
          { error: 'Missing required fields: userWallet, collectionName, collectionSymbol, pageLoadId' },
          { status: 400 }
        );
      }

      // Validate and sanitize user wallet with isolation service
      const userIsolation = UserIsolationService.getInstance();
      const walletValidation = userIsolation.validateUserWallet(userWallet);
      if (!walletValidation.isValid) {
        userIsolation.logUserIsolationEvent('INVALID_WALLET_ATTEMPT', userWallet, walletValidation.errors);
        return NextResponse.json(
          { error: 'Invalid wallet address', details: walletValidation.errors },
          { status: 400 }
        );
      }

      // Use sanitized wallet address
      const sanitizedUserWallet = walletValidation.sanitizedWallet;
      userIsolation.logUserIsolationEvent('COLLECTION_SAVE_ATTEMPT', sanitizedUserWallet);

      // Check save restriction with sanitized wallet
      const saveRestriction = SaveRestriction.getInstance();
      const canSave = saveRestriction.canSave(sanitizedUserWallet, pageLoadId, 'save_collection');
      if (!canSave.allowed) {
        userIsolation.logUserIsolationEvent('SAVE_RESTRICTION_VIOLATION', sanitizedUserWallet, { reason: canSave.reason });
        return NextResponse.json(
          { error: canSave.reason },
          { status: 429 }
        );
      }

      // Validate collection configuration (temporarily disabled for debugging)
      // const configValidation = SecurityValidator.validateCollectionConfig({
      //   name: collectionName,
      //   symbol: collectionSymbol,
      //   supply: totalSupply,
      //   mintPrice: mintPrice || 0 // Default to 0 if not provided
      // });
      // if (!configValidation.isValid) {
      //   console.log('Validation failed for config:', {
      //     name: collectionName,
      //     symbol: collectionSymbol,
      //     supply: totalSupply,
      //     mintPrice: mintPrice || 0
      //   });
      //   console.log('Validation errors:', configValidation.errors);
      //   return NextResponse.json(
      //     { error: 'Invalid collection configuration', details: configValidation.errors },
      //     { status: 400 }
      //   );
      // }

      // Validate layers (temporarily disabled for debugging)
      // if (!layers || !Array.isArray(layers)) {
      //   return NextResponse.json(
      //     { error: 'Layers must be an array' },
      //     { status: 400 }
      //   );
      // }

    // Get current data for image cleanup if updating (with ownership validation)
    let currentData = null;
    if (collectionId) {
      const ownershipValidation = await userIsolation.validateCollectionOwnership(
        collectionId, 
        sanitizedUserWallet, 
        supabaseAdmin
      );
      
      if (!ownershipValidation.isValid) {
        userIsolation.logUserIsolationEvent('UNAUTHORIZED_COLLECTION_ACCESS', sanitizedUserWallet, { collectionId });
        return NextResponse.json(
          { error: ownershipValidation.error || 'Access denied' },
          { status: 403 }
        );
      }
      
      currentData = ownershipValidation.collection;
    }

    // Prepare collection data with image cleanup
    const newImageData = {
      logo_url: logo_url || null,
      banner_url: banner_url || null
    };

    // Apply image cleanup to prevent data bloat
    const cleanedImageData = ImageCleanupService.getInstance().cleanupCollectionImages(
      newImageData,
      currentData
    );

    // Log storage usage for monitoring
    ImageCleanupService.getInstance().logStorageUsage(cleanedImageData, collectionName);

    // Prepare raw collection data
    const rawCollectionData = {
      user_wallet: sanitizedUserWallet, // Use sanitized wallet
      collection_name: collectionName,
      collection_symbol: collectionSymbol,
      description: description || '',
      total_supply: totalSupply || 1000,
      mint_price: mintPrice || 0.1,
      reveal_type: (revealType || 'instant') as 'instant' | 'delayed',
      reveal_date: revealDate || null,
      whitelist_enabled: whitelistEnabled || false,
      bonding_curve_enabled: bondingCurveEnabled || false,
      layers: layers,
      collection_config: collectionConfig || {},
      status: 'draft',
      updated_at: new Date().toISOString(),
      // Use cleaned image data
      logo_url: cleanedImageData.logo_url,
      banner_url: cleanedImageData.banner_url
    };

    // Sanitize collection data to ensure user isolation
    const collectionData = userIsolation.sanitizeCollectionData(rawCollectionData, sanitizedUserWallet);

      // If collectionId is provided, update existing collection, otherwise create new one
      let data: SavedCollection | null, error: any;
      if (collectionId) {
        // Update existing collection with secure query
        const result = await (supabaseAdmin as any)
          .from('saved_collections')
          .update(collectionData)
          .eq('id', collectionId)
          .eq('user_wallet', sanitizedUserWallet) // Critical: Only user's own collections
          .select()
          .single();
        data = result.data as SavedCollection | null;
        error = result.error;
        
        if (error) {
          userIsolation.logUserIsolationEvent('COLLECTION_UPDATE_ERROR', sanitizedUserWallet, { error: error.message });
        } else {
          userIsolation.logUserIsolationEvent('COLLECTION_UPDATED', sanitizedUserWallet, { collectionId });
        }
      } else {
        // Create new collection
        const result = await (supabaseAdmin as any)
          .from('saved_collections')
          .insert(collectionData)
          .select()
          .single();
        data = result.data as SavedCollection | null;
        error = result.error;
        
        if (error) {
          userIsolation.logUserIsolationEvent('COLLECTION_CREATE_ERROR', sanitizedUserWallet, { error: error.message });
        } else {
          userIsolation.logUserIsolationEvent('COLLECTION_CREATED', sanitizedUserWallet, { collectionId: data?.id });
        }
      }

      if (error) {
        console.error('Error saving collection:', error);
        console.error('Collection data that failed:', collectionData);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return NextResponse.json(
          { error: 'Failed to save collection', details: error.message },
          { status: 500 }
        );
      }

      // Record save attempt with sanitized wallet
      saveRestriction.recordSaveAttempt(sanitizedUserWallet, pageLoadId, 'save_collection');

      return NextResponse.json({
        success: true,
        collection: data,
        message: 'Collection saved successfully'
      });

    } catch (error) {
      console.error('Error in save collection API:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Validate and sanitize user wallet with isolation service
    const userIsolation = UserIsolationService.getInstance();
    const walletValidation = userIsolation.validateUserWallet(userWallet);
    if (!walletValidation.isValid) {
      userIsolation.logUserIsolationEvent('INVALID_WALLET_GET_ATTEMPT', userWallet, walletValidation.errors);
      return NextResponse.json(
        { error: 'Invalid wallet address', details: walletValidation.errors },
        { status: 400 }
      );
    }

    const sanitizedUserWallet = walletValidation.sanitizedWallet;
    userIsolation.logUserIsolationEvent('COLLECTIONS_FETCH_ATTEMPT', sanitizedUserWallet);

    // Get user's saved collections with strict user isolation
    const { data, error } = await (supabaseAdmin as any)
      .from('saved_collections')
      .select('*')
      .eq('user_wallet', sanitizedUserWallet) // Critical: Only user's own collections
      .order('created_at', { ascending: false });

    if (error) {
      userIsolation.logUserIsolationEvent('COLLECTIONS_FETCH_ERROR', sanitizedUserWallet, { error: error.message });
      console.error('Error fetching collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    userIsolation.logUserIsolationEvent('COLLECTIONS_FETCHED', sanitizedUserWallet, { count: data?.length || 0 });
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
