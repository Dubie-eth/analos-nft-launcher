import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAccount } from '@solana/spl-token';

const ANALOS_RPC = process.env.NEXT_PUBLIC_ANALOS_RPC_URL || 'https://rpc.analos.io';
const LOL_TOKEN_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';

/**
 * POST /api/los-bros/check-holding-period
 * Check how long a wallet has been holding $LOL tokens
 * Anti-bot measure: Requires 72 hours of holding for free/discounted mints
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('⏰ Checking $LOL holding period for:', walletAddress);

    const connection = new Connection(ANALOS_RPC, 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(LOL_TOKEN_MINT);

    // Get associated token account
    const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
    const ata = getAssociatedTokenAddressSync(
      mintPubkey,
      walletPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log('📊 Token Account:', ata.toString());

    // Get account info
    const accountInfo = await connection.getAccountInfo(ata);
    
    if (!accountInfo) {
      console.log('❌ No token account found');
      return NextResponse.json({
        success: true,
        hasTokens: false,
        holdingPeriodHours: 0,
        meetsRequirement: false,
        message: 'No $LOL tokens found',
      });
    }

    // Get token account creation time via transaction signatures
    const signatures = await connection.getSignaturesForAddress(ata, {
      limit: 1000, // Get all signatures
    });

    if (signatures.length === 0) {
      return NextResponse.json({
        success: true,
        hasTokens: true,
        holdingPeriodHours: 0,
        meetsRequirement: false,
        message: 'No transaction history found',
      });
    }

    // Find the first transaction (account creation)
    const oldestSignature = signatures[signatures.length - 1];
    
    // Get transaction details to find block time
    const tx = await connection.getTransaction(oldestSignature.signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.blockTime) {
      console.warn('⚠️ Could not get transaction block time');
      return NextResponse.json({
        success: true,
        hasTokens: true,
        holdingPeriodHours: 0,
        meetsRequirement: false,
        message: 'Could not verify holding period',
      });
    }

    // Calculate holding period
    const accountCreationTime = tx.blockTime * 1000; // Convert to milliseconds
    const now = Date.now();
    const holdingPeriodMs = now - accountCreationTime;
    const holdingPeriodHours = holdingPeriodMs / (1000 * 60 * 60);

    const MIN_HOLDING_HOURS = 72;
    const meetsRequirement = holdingPeriodHours >= MIN_HOLDING_HOURS;

    console.log(`⏰ Holding Period: ${holdingPeriodHours.toFixed(1)} hours`);
    console.log(`✅ Meets 72h requirement: ${meetsRequirement}`);

    return NextResponse.json({
      success: true,
      hasTokens: true,
      holdingPeriodHours: holdingPeriodHours,
      holdingPeriodDays: holdingPeriodHours / 24,
      meetsRequirement: meetsRequirement,
      requiredHours: MIN_HOLDING_HOURS,
      accountCreatedAt: new Date(accountCreationTime).toISOString(),
      message: meetsRequirement
        ? `✅ Held for ${holdingPeriodHours.toFixed(1)} hours (${(holdingPeriodHours / 24).toFixed(1)} days)`
        : `⏰ Need ${(MIN_HOLDING_HOURS - holdingPeriodHours).toFixed(1)} more hours (currently ${holdingPeriodHours.toFixed(1)}h)`,
    });
  } catch (error: any) {
    console.error('❌ Error checking holding period:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hasTokens: false,
        holdingPeriodHours: 0,
        meetsRequirement: false,
      },
      { status: 500 }
    );
  }
}

