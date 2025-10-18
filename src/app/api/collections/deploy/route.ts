import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCollection } from '@/lib/blockchain-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      collectionConfig, 
      whitelistConfig, 
      bondingCurveConfig, 
      layers,
      userWallet 
    } = body;

    console.log('🚀 Starting Analos collection deployment preparation...', {
      name: collectionConfig.name,
      symbol: collectionConfig.symbol,
      supply: collectionConfig.supply,
      userWallet
    });

    // Validate required fields
    if (!collectionConfig.name || !collectionConfig.symbol || !userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, or userWallet' },
        { status: 400 }
      );
    }

    // Create collection on Analos blockchain
    console.log('🚀 Creating collection on Analos blockchain...');
    
    const blockchainResult = await createCollection({
      name: collectionConfig.name,
      symbol: collectionConfig.symbol,
      description: collectionConfig.description,
      supply: collectionConfig.supply,
      mintPrice: collectionConfig.mintPrice,
      image: collectionConfig.image,
      logo: collectionConfig.logo,
      banner: collectionConfig.banner,
      whitelistConfig: whitelistConfig,
      bondingCurveConfig: bondingCurveConfig
    }, userWallet);

    const collectionMint = blockchainResult.collectionMint;
    const metadataAccount = blockchainResult.metadataAccount;
    const deploymentCost = blockchainResult.deploymentCost;

    console.log('✅ Collection created on blockchain:', {
      collectionMint,
      metadataAccount,
      deploymentCost
    });

    // Create the NFT collection metadata for Analos
    const metadata = {
      name: collectionConfig.name,
      symbol: collectionConfig.symbol,
      description: collectionConfig.description,
      image: collectionConfig.image || '',
      attributes: [],
      properties: {
        files: [],
        category: 'image',
        creators: [
          {
            address: userWallet,
            share: 100
          }
        ]
      },
      blockchain: 'Analos',
      network: 'mainnet'
    };

    // Deployment cost is calculated by the blockchain service

    // Save the collection configuration to database
    const collectionData = {
      user_wallet: userWallet,
      collection_name: collectionConfig.name,
      collection_symbol: collectionConfig.symbol,
      description: collectionConfig.description,
      supply: collectionConfig.supply,
      mint_price: collectionConfig.mintPrice,
      logo_url: collectionConfig.logo || '',
      banner_url: collectionConfig.banner || '',
      cover_image_url: collectionConfig.coverImage || '',
      image_url: collectionConfig.image || '',
      whitelist_enabled: collectionConfig.whitelistEnabled,
      bonding_curve_enabled: collectionConfig.bondingCurveEnabled,
      reveal_type: collectionConfig.revealType,
      deployed: true,
      collection_mint: collectionMint,
      metadata_account: metadataAccount,
      deployment_cost: deploymentCost,
      deployment_info: {
        collectionMint,
        metadataAccount,
        deploymentCost,
        deployed: true,
        deployedAt: new Date().toISOString(),
        blockchain: 'Analos'
      },
      whitelist_config: whitelistConfig,
      bonding_curve_config: bondingCurveConfig,
      layers: layers,
      metadata: metadata
    };

    console.log('💾 Saving collection to database...');

    // Check if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await (supabaseAdmin
          .from('saved_collections') as any)
          .insert([collectionData])
          .select()
          .single() as { data: any; error: any };

        if (error) {
          console.error('❌ Error saving collection to database:', error);
          // Continue with deployment even if database save fails
        } else {
          console.log('✅ Collection saved to database:', data.id);
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Continue with deployment even if database save fails
      }
    } else {
      console.log('⚠️ Supabase not configured, skipping database save');
    }

    // Prepare Analos deployment configuration
    const deploymentConfig = {
      collectionConfig,
      whitelistConfig,
      bondingCurveConfig,
      layers,
      userWallet,
      collectionMint,
      metadataAccount,
      metadata,
      blockchain: 'Analos',
      rpcUrl: 'https://rpc.analos.io',
      explorerUrl: 'https://explorer.analos.io'
    };

    // Return deployment configuration for Analos blockchain
    const response = {
      success: true,
      collectionMint,
      metadataAccount,
      deploymentCost,
      transactionSignature: blockchainResult.transactionSignature,
      metadata,
      deploymentConfig,
      message: `Collection "${collectionConfig.name}" successfully deployed on Analos!`,
      instructions: [
        '1. Collection has been created on the Analos blockchain',
        '2. Transaction signature: ' + blockchainResult.transactionSignature,
        '3. Your collection is now live and ready for minting',
        '4. View on Analos explorer to verify deployment',
        '5. Share your collection with the community!'
      ],
      blockchain: 'Analos',
      explorerUrl: `https://explorer.analos.io/address/${collectionMint}`,
      collectionUrl: `https://www.onlyanal.fun/collection/${collectionMint}`
    };

    console.log('✅ Analos deployment configuration prepared successfully');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Analos deployment error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to prepare Analos deployment configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
