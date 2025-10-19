/**
 * PROFILE NFT CHECK API
 * Checks if user already has a profile NFT
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import IDL from '@/idl/analos_monitoring_system.json';
import type { AnalosMonitoringSystem } from '@/idl/analos_monitoring_system';
import { BlockchainProfileNFTService } from '@/lib/blockchain-profile-nft-service';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Initialize blockchain services
    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const wallet = new PublicKey(walletAddress);
    const dummyKeypair = Keypair.generate();
    const provider = new AnchorProvider(connection, { publicKey: dummyKeypair.publicKey, signTransaction: async () => dummyKeypair, signAllTransactions: async () => [dummyKeypair] } as any, {});
    const program = new Program<AnalosMonitoringSystem>(IDL as any, ANALOS_PROGRAMS.MONITORING_SYSTEM, provider);
    const nftService = new BlockchainProfileNFTService(connection, program, provider);

    // Check if user has a profile NFT on blockchain
    const nft = await nftService.getProfileNFTByWallet(wallet);

    // Also check database for reference (optional)
    let dbNft = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin
          .from('profile_nfts') as any)
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (!error) {
          dbNft = data;
        }
      } catch (error) {
        console.error('Error checking database reference:', error);
      }
    }

    return NextResponse.json({
      hasNFT: !!nft,
      nft: nft || null,
      dbReference: dbNft || null
    });

  } catch (error) {
    console.error('Error in GET /api/profile-nft/check/[walletAddress]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
