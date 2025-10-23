/**
 * EXPLORER TRANSACTIONS API
 * Fetches real blockchain transaction data from Analos
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'all';
    const addressParam = searchParams.get('address');
    const signatureParam = searchParams.get('signature');

    console.log('🔍 Fetching real blockchain transactions from Analos...');
    console.log('📊 Limit:', limit, 'Type:', type, 'Address:', addressParam, 'Signature:', signatureParam);

    // Helper to parse a parsed transaction into our explorer Transaction shape
    const toExplorerTx = (sig: string, tx: any, sigInfo?: { slot?: number; blockTime?: number }) => {
      // Default classification
      let txType: string = 'unknown';
      let user: string | null = null;
      let collection: string | null = null;
      let amountLos = 0;

      const meta = tx?.meta || {};
      const message = tx?.transaction?.message || {};
      const accountKeys = message?.accountKeys || [];

      // Prefer first signer as user
      const signerKey = accountKeys.find((k: any) => k?.signer)?.pubkey || accountKeys[0]?.pubkey;
      if (signerKey) {
        user = signerKey.toString ? signerKey.toString() : String(signerKey);
      }

      // Fee in LOS (lamports -> LOS)
      amountLos = (meta?.fee || 0) / 1e9;

      // Detect SPL mint events using parsed instructions and token balances
      try {
        const postTokenBalances = meta?.postTokenBalances || [];
        const hasZeroDecimalMint = postTokenBalances.some((b: any) => b?.uiTokenAmount?.decimals === 0);
        const parsedInstructions = (message?.instructions || []).filter((ix: any) => ix?.program || ix?.parsed);

        const hasInitializeMint = parsedInstructions.some((ix: any) =>
          (ix?.program === 'spl-token' || ix?.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') &&
          ix?.parsed?.type === 'initializeMint'
        );

        const hasMintTo = parsedInstructions.some((ix: any) =>
          (ix?.program === 'spl-token' || ix?.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') &&
          ix?.parsed?.type === 'mintTo'
        );

        if (hasMintTo || hasInitializeMint || hasZeroDecimalMint) {
          txType = 'mint';
        }
      } catch (_e) {
        // Best-effort parsing
      }

      return {
        signature: sig,
        timestamp: new Date((sigInfo?.blockTime || tx?.blockTime || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        type: txType,
        collection,
        user: user || undefined,
        amount: amountLos,
        token: 'LOS',
        status: meta?.err ? 'failed' : 'success',
        slot: sigInfo?.slot || tx?.slot,
        blockTime: sigInfo?.blockTime || tx?.blockTime,
      } as any;
    };
    
    try {
      // If a direct signature is provided, fetch and return just that one
      if (signatureParam) {
        const parsed = await connection.getParsedTransaction(signatureParam, {
          maxSupportedTransactionVersion: 0,
        } as any);

        if (!parsed) {
          return NextResponse.json({ success: true, transactions: [], total: 0, source: 'analos_blockchain' });
        }

        const one = toExplorerTx(signatureParam, parsed);
        return NextResponse.json({ success: true, transactions: [one], total: 1, source: 'analos_blockchain' });
      }

      // If an address is provided, fetch signatures for that address (e.g., mint or wallet)
      if (addressParam) {
        const addressPk = new PublicKey(addressParam);
        const signatures = await connection.getSignaturesForAddress(addressPk, { limit });
        console.log(`📋 Found ${signatures.length} signatures for address ${addressParam}`);

        const top = signatures.slice(0, Math.min(signatures.length, 10)); // cap per-request work
        const parsedTxs = await Promise.all(
          top.map(async (s) => {
            try {
              const parsed = await connection.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 } as any);
              if (!parsed) return null;
              return toExplorerTx(s.signature, parsed, { slot: s.slot, blockTime: s.blockTime });
            } catch (e) {
              console.warn('⚠️ Error parsing transaction for address:', s.signature, e);
              return null;
            }
          })
        );

        const txs = parsedTxs.filter(Boolean) as any[];
        console.log(`✅ Successfully parsed ${txs.length} transactions for address ${addressParam}`);

        return NextResponse.json({ success: true, transactions: txs, total: txs.length, source: 'analos_blockchain' });
      }

      // Default: Get recent transactions from the NFT Launchpad Core program
      const nftProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
      const signatures = await connection.getSignaturesForAddress(nftProgramId, { limit });
      console.log(`📋 Found ${signatures.length} signatures for NFT program`);

      // Parse transactions to extract relevant data
      const transactions: any[] = [];

      for (const sigInfo of signatures.slice(0, 10)) {
        try {
          const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 } as any);
          if (tx && tx.meta) {
            // Keep legacy log-based detection when logs are available; otherwise rely on parsed detection
            const logs = tx.meta.logMessages || [];
            let txType = 'unknown';

            for (const log of logs) {
              if (log.includes('Program log: Instruction: Mint')) txType = 'mint';
              else if (log.includes('Program log: Instruction: CreateCollection')) txType = 'collection_create';
              else if (log.includes('Program log: Instruction: Reveal')) txType = 'reveal';
            }

            if (txType === 'unknown') {
              // Try parsed-based detection
              const classified = toExplorerTx(sigInfo.signature, tx, { slot: sigInfo.slot, blockTime: sigInfo.blockTime });
              transactions.push(classified);
            } else {
              const accountKeys = tx.transaction?.message?.accountKeys || [];
              const signerKey = accountKeys.find((k: any) => k?.signer)?.pubkey || accountKeys[0]?.pubkey;
              const user = signerKey ? (signerKey.toString ? signerKey.toString() : String(signerKey)) : '';
              const fee = tx.meta.fee || 0;
              transactions.push({
                signature: sigInfo.signature,
                timestamp: new Date((sigInfo.blockTime || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
                type: txType,
                collection: null,
                user,
                amount: fee / 1e9,
                token: 'LOS',
                status: tx.meta.err ? 'failed' : 'success',
                slot: sigInfo.slot,
                blockTime: sigInfo.blockTime,
              });
            }
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
            profileNFTs = nfts.map((nft: any) => ({
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
              mintNumber: nft.mint_number,
              nftImage: nft.image_url || nft.metadata?.image || '/api/placeholder/64/64'
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
            const fallbackTransactions = nfts.map((nft: any) => ({
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
              mintNumber: nft.mint_number,
              nftImage: nft.image_url || nft.metadata?.image || '/api/placeholder/64/64'
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
