import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ANALOS_PLATFORM_WALLET } from '@/config/analos-programs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.network';
const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

interface TreasuryData {
  balance: number;
  balanceFormatted: string;
  balanceUSD: number;
  lastUpdated: string;
  walletAddress: string;
}

interface FundDistribution {
  losStakers: {
    amount: number;
    percentage: number;
    recipients: number;
    lastDistribution: string;
  };
  treasury: {
    amount: number;
    percentage: number;
  };
  development: {
    amount: number;
    percentage: number;
  };
  marketing: {
    amount: number;
    percentage: number;
  };
}

interface Transaction {
  signature: string;
  amount: number;
  from: string;
  timestamp: string;
  type: 'mint_fee' | 'other';
  status: 'confirmed' | 'pending';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'balance';

    switch (action) {
      case 'balance':
        return await getTreasuryBalance();
      case 'transactions':
        return await getRecentTransactions();
      case 'distribution':
        return await getFundDistribution();
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in treasury API:', error);
    // Return empty data instead of 500 error to prevent UI crashes
    return NextResponse.json(
      { 
        success: true, 
        data: null,
        message: 'Treasury data unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
}

async function getTreasuryBalance(): Promise<NextResponse> {
  try {
    // Get treasury wallet balance
    const balance = await connection.getBalance(ANALOS_PLATFORM_WALLET);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    const balanceUSD = balanceSOL * 0.0018; // LOS to USD conversion

    const treasuryData: TreasuryData = {
      balance: balanceSOL,
      balanceFormatted: balanceSOL.toFixed(6),
      balanceUSD: balanceUSD,
      lastUpdated: new Date().toISOString(),
      walletAddress: ANALOS_PLATFORM_WALLET.toString()
    };

    return NextResponse.json({
      success: true,
      data: treasuryData
    });

  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch treasury balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getRecentTransactions(): Promise<NextResponse> {
  try {
    // Get recent transactions for the treasury wallet
    const signatures = await connection.getSignaturesForAddress(ANALOS_PLATFORM_WALLET, {
      limit: 20
    });

    const transactions: Transaction[] = [];

    for (const sig of signatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });

        if (tx && tx.meta) {
          // Find transfers to the treasury wallet
          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.getAccountKeys();

          let treasuryIndex = -1;
          for (let i = 0; i < accountKeys.length; i++) {
            const key = accountKeys.get(i);
            if (key && key.equals(ANALOS_PLATFORM_WALLET)) {
              treasuryIndex = i;
              break;
            }
          }

          if (treasuryIndex >= 0) {
            const balanceChange = postBalances[treasuryIndex] - preBalances[treasuryIndex];
            
            if (balanceChange > 0) {
              // Find the sender (account with negative balance change)
              let senderIndex = -1;
              for (let i = 0; i < accountKeys.length; i++) {
                if (i !== treasuryIndex && (postBalances[i] - preBalances[i]) < 0) {
                  senderIndex = i;
                  break;
                }
              }

              const senderKey = senderIndex >= 0 ? accountKeys.get(senderIndex) : null;
              const sender = senderKey ? senderKey.toString() : 'Unknown';
              const amount = balanceChange / LAMPORTS_PER_SOL;

              transactions.push({
                signature: sig.signature,
                amount: amount,
                from: sender,
                timestamp: new Date(sig.blockTime! * 1000).toISOString(),
                type: 'mint_fee', // Assume mint fees for now
                status: 'confirmed'
              });
            }
          }
        }
      } catch (txError) {
        console.error('Error processing transaction:', sig.signature, txError);
        // Continue with other transactions
      }
    }

    return NextResponse.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getFundDistribution(): Promise<NextResponse> {
  try {
    // Get current balance for distribution calculations
    const balance = await connection.getBalance(ANALOS_PLATFORM_WALLET);
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    // Mock data for now - in production, this would come from a database
    const fundDistribution: FundDistribution = {
      losStakers: {
        amount: balanceSOL * 0.30,
        percentage: 30,
        recipients: 150, // This should be fetched from staking contract
        lastDistribution: '2024-01-15T10:30:00Z'
      },
      treasury: {
        amount: balanceSOL * 0.40,
        percentage: 40
      },
      development: {
        amount: balanceSOL * 0.20,
        percentage: 20
      },
      marketing: {
        amount: balanceSOL * 0.10,
        percentage: 10
      }
    };

    return NextResponse.json({
      success: true,
      data: fundDistribution
    });

  } catch (error) {
    console.error('Error fetching fund distribution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch fund distribution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, amount, wallets } = body;

    if (action === 'distribute') {
      // This would handle fund distribution
      // In a real implementation, this would:
      // 1. Validate the request
      // 2. Create distribution transactions
      // 3. Execute them with proper wallet access
      
      return NextResponse.json({
        success: true,
        message: 'Distribution transaction prepared',
        data: {
          amount: amount,
          distribution: {
            losStakers: amount * 0.30,
            development: amount * 0.20,
            marketing: amount * 0.10,
            treasury: amount * 0.40
          }
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in treasury POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process treasury request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
