/**
 * EXPLORER TRANSACTIONS API
 * Fetches real blockchain transaction data from Analos
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL, ANALOS_PROGRAMS } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Initialize connection
const connection = new Connection(ANALOS_RPC_URL);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'all';

    console.log('🔍 Fetching real blockchain transactions from Analos...');
    console.log('📊 Limit:', limit, 'Type:', type);

    // Get recent transactions from the NFT Launchpad Core program
    const nftProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
    
    try {
      // Get recent signatures for the NFT program
      const signatures = await connection.getSignaturesForAddress(
        nftProgramId,
        { limit: limit }
      );

      console.log(`📋 Found ${signatures.length} signatures for NFT program`);

      // Parse transactions to extract relevant data
      const transactions = [];
      
      for (const sigInfo of signatures.slice(0, 10)) { // Limit to 10 for performance
        try {
          const tx = await connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0
          });

          if (tx && tx.meta) {
            // Determine transaction type based on logs
            const logs = tx.meta.logMessages || [];
            let txType = 'unknown';
            let collection = null;
            let user = null;
            let amount = null;

            // Parse logs to determine transaction type
            for (const log of logs) {
              if (log.includes('Program log: Instruction: Mint')) {
                txType = 'mint';
              } else if (log.includes('Program log: Instruction: CreateCollection')) {
                txType = 'collection_create';
              } else if (log.includes('Program log: Instruction: Reveal')) {
                txType = 'reveal';
              }
            }

            // Get user from transaction accounts
            if (tx.transaction.message.accountKeys.length > 0) {
              user = tx.transaction.message.accountKeys[0].toString();
            }

            // Calculate fee
            const fee = tx.meta.fee || 0;

            transactions.push({
              signature: sigInfo.signature,
              timestamp: new Date(sigInfo.blockTime! * 1000).toISOString(),
              type: txType,
              collection: collection,
              user: user,
              amount: fee / 1e9, // Convert lamports to SOL/LOS
              token: 'LOS',
              status: tx.meta.err ? 'failed' : 'success',
              slot: sigInfo.slot,
              blockTime: sigInfo.blockTime
            });
          }
        } catch (txError) {
          console.warn('⚠️ Error parsing transaction:', sigInfo.signature, txError);
        }
      }

      console.log(`✅ Successfully parsed ${transactions.length} transactions`);

      // Also get profile NFT data from database if available
      let profileNFTs = [];
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: nfts } = await (supabaseAdmin as any)
            .from('profile_nfts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (nfts) {
            profileNFTs = nfts.map(nft => ({
              signature: nft.transaction_signature || 'pending',
              timestamp: nft.created_at,
              type: 'profile_mint',
              collection: 'Analos Profile Cards',
              user: nft.wallet_address,
              amount: nft.mint_price || 4.20,
              token: 'LOS',
              status: 'success',
              username: nft.username,
              displayName: nft.display_name,
              mintNumber: nft.mint_number
            }));
          }
        } catch (dbError) {
          console.warn('⚠️ Error fetching profile NFTs from database:', dbError);
        }
      }

      // Combine blockchain and database transactions
      const allTransactions = [...transactions, ...profileNFTs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        transactions: allTransactions,
        total: allTransactions.length,
        source: 'analos_blockchain'
      });

    } catch (blockchainError) {
      console.error('❌ Error fetching blockchain data:', blockchainError);
      
      // Fallback to database-only data
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: nfts } = await (supabaseAdmin as any)
            .from('profile_nfts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (nfts) {
            const fallbackTransactions = nfts.map(nft => ({
              signature: nft.transaction_signature || 'pending',
              timestamp: nft.created_at,
              type: 'profile_mint',
              collection: 'Analos Profile Cards',
              user: nft.wallet_address,
              amount: nft.mint_price || 4.20,
              token: 'LOS',
              status: 'success',
              username: nft.username,
              displayName: nft.display_name,
              mintNumber: nft.mint_number
            }));

            return NextResponse.json({
              success: true,
              transactions: fallbackTransactions,
              total: fallbackTransactions.length,
              source: 'database_fallback'
            });
          }
        } catch (dbError) {
          console.error('❌ Database fallback also failed:', dbError);
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch transaction data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in explorer transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
