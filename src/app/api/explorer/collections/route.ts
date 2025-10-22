/**
 * EXPLORER COLLECTIONS API
 * Fetches real collection data from Analos blockchain and database
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL, ANALOS_PROGRAMS } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Initialize connection
// Configure connection for Analos network with extended timeouts
const connection = new Connection(ANALOS_RPC_URL, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
});

// Force disable WebSocket to prevent connection issues
(connection as any)._rpcWebSocket = null;
(connection as any)._rpcWebSocketConnected = false;

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Fetching collection data from Analos blockchain...');

    const collections = [];

    // Get Profile NFT Collection data
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        // Get profile NFT collection stats
        const { data: profileNFTs } = await (supabaseAdmin as any)
          .from('profile_nfts')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: mintCounter } = await (supabaseAdmin as any)
          .from('profile_nft_mint_counter')
          .select('*')
          .limit(1)
          .single();

        if (profileNFTs && profileNFTs.length > 0) {
          const totalMints = profileNFTs.length;
          const lastActivity = profileNFTs[0]?.created_at || new Date().toISOString();

          collections.push({
            collectionName: 'Analos Profile Cards',
            collectionAddress: 'ProfileNFTCollection',
            collectionType: 'profile_nft',
            totalMints: totalMints,
            totalSupply: mintCounter?.total_minted || totalMints,
            mintPrice: 4.20,
            token: 'LOS',
            lastActivity: lastActivity,
            recentActivity: profileNFTs.slice(0, 5).map((nft: any) => ({
              signature: nft.transaction_signature || 'pending',
              timestamp: nft.created_at,
              type: 'profile_mint',
              user: nft.wallet_address,
              username: nft.username,
              displayName: nft.display_name,
              mintNumber: nft.mint_number,
              status: 'success'
            })),
            description: 'Master Open Edition Collection - The first open edition NFT collection on Analos',
            features: [
              'Personalized profile cards',
              'Mystery variants (Matrix, Neo, Oracle)',
              'MF Purrs rare backgrounds',
              'Referral system',
              'Real-time minting'
            ]
          });
        }

        // Get other collections from database if they exist
        // This would be expanded when other collections are created
        const { data: otherCollections } = await (supabaseAdmin as any)
          .from('saved_collections')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (otherCollections) {
          for (const collection of otherCollections) {
            collections.push({
              collectionName: collection.collection_name || 'Custom Collection',
              collectionAddress: collection.collection_address || 'Unknown',
              collectionType: 'custom',
              totalMints: 0, // Would need to be calculated from actual mints
              totalSupply: collection.max_supply || 'Unlimited',
              mintPrice: collection.mint_price || 0,
              token: 'LOS',
              lastActivity: collection.created_at,
              recentActivity: [],
              description: collection.description || 'Custom NFT collection',
              features: ['Custom collection']
            });
          }
        }

      } catch (dbError) {
        console.error('❌ Error fetching collection data from database:', dbError);
      }
    }

    // Try to get collection data from blockchain
    try {
      const nftProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
      
      // Get recent collection creation transactions
      const signatures = await connection.getSignaturesForAddress(
        nftProgramId,
        { limit: 20 }
      );

      // This would be expanded to parse actual collection creation events
      // For now, we'll focus on the database data

    } catch (blockchainError) {
      console.warn('⚠️ Error fetching blockchain collection data:', blockchainError);
    }

    console.log(`✅ Found ${collections.length} collections`);

    return NextResponse.json({
      success: true,
      collections: collections,
      total: collections.length,
      source: 'analos_blockchain_and_database'
    });

  } catch (error) {
    console.error('❌ Error in explorer collections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
