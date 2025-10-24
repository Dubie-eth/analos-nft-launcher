import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

const LOL_TOKEN_MINT = new PublicKey('ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const tokenMint = searchParams.get('tokenMint') || LOL_TOKEN_MINT.toString();

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking balance for wallet:', wallet);
    console.log('🪙 Token mint:', tokenMint);

    const connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    const walletPubkey = new PublicKey(wallet);
    const mintPubkey = new PublicKey(tokenMint);

    try {
      // Get associated token account for Token-2022
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log('📊 Token account:', tokenAccount.toString());

      // Get account info
      const accountInfo = await getAccount(
        connection,
        tokenAccount,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      const rawBalance = Number(accountInfo.amount);
      const decimals = 9; // $LOL has 9 decimals
      const actualBalance = rawBalance / Math.pow(10, decimals);

      console.log('✅ Balance found:', actualBalance.toLocaleString(), '$LOL');

      return NextResponse.json({
        success: true,
        wallet,
        tokenMint,
        tokenAccount: tokenAccount.toString(),
        balance: {
          raw: rawBalance,
          actual: actualBalance,
          decimals: decimals,
          formatted: actualBalance.toLocaleString()
        },
        whitelist: {
          isFree: actualBalance >= 1_000_000,
          hasDiscount: actualBalance >= 100_000,
          discount: actualBalance >= 1_000_000 ? 100 : actualBalance >= 100_000 ? 50 : 0
        }
      });

    } catch (accountError: any) {
      console.warn('⚠️ Token account not found or error:', accountError.message);
      
      return NextResponse.json({
        success: true,
        wallet,
        tokenMint,
        balance: {
          raw: 0,
          actual: 0,
          decimals: 9,
          formatted: '0'
        },
        whitelist: {
          isFree: false,
          hasDiscount: false,
          discount: 0
        },
        message: 'No token account found for this wallet'
      });
    }

  } catch (error) {
    console.error('❌ Error checking wallet balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check wallet balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

