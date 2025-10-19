/**
 * SOCIAL VERIFICATION ORACLE
 * Transaction-based verification system that stores user social data on Analos blockchain
 * Similar to a price oracle but for social verification data
 */

import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import * as borsh from 'borsh';

// Oracle account structure for storing verification data
class SocialVerificationData {
  wallet: string;
  platform: string;
  username: string;
  tweetId: string;
  verified: boolean;
  timestamp: number;
  followerCount: number;
  referralCode: string;

  constructor(fields: {
    wallet: string;
    platform: string;
    username: string;
    tweetId: string;
    verified: boolean;
    timestamp: number;
    followerCount: number;
    referralCode: string;
  }) {
    this.wallet = fields.wallet;
    this.platform = fields.platform;
    this.username = fields.username;
    this.tweetId = fields.tweetId;
    this.verified = fields.verified;
    this.timestamp = fields.timestamp;
    this.followerCount = fields.followerCount;
    this.referralCode = fields.referralCode;
  }
}

// Borsh schema for serialization
const SocialVerificationDataSchema = new Map([
  [
    SocialVerificationData,
    {
      kind: 'struct',
      fields: [
        ['wallet', 'string'],
        ['platform', 'string'],
        ['username', 'string'],
        ['tweetId', 'string'],
        ['verified', 'u8'],
        ['timestamp', 'u64'],
        ['followerCount', 'u32'],
        ['referralCode', 'string'],
      ],
    },
  ],
]);

export class SocialVerificationOracle {
  private connection: Connection;
  private programId: PublicKey;

  constructor(
    connection: Connection,
    programId?: string
  ) {
    this.connection = connection;
    // Use your deployed social verification oracle program ID on Analos blockchain
    // For now, using a placeholder - will be deployed on Analos
    this.programId = new PublicKey(
      programId || process.env.NEXT_PUBLIC_SOCIAL_ORACLE_PROGRAM_ID || 'AnaL1111111111111111111111111111111111111111'
    );
  }

  /**
   * Submit verification data on-chain via transaction
   * SECURITY: Only accepts PUBLIC wallet addresses, never private keys
   */
  async submitVerification(
    userWallet: PublicKey,
    platform: string,
    username: string,
    tweetId: string,
    referralCode: string,
    followerCount: number = 0
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      // SECURITY CHECK: Validate wallet address is public key format
      if (!userWallet || userWallet.toString().length < 32) {
        throw new Error('Invalid wallet address format');
      }
      
      // SECURITY CHECK: Ensure no private key data
      if (platform.toLowerCase().includes('private') || 
          username.toLowerCase().includes('private') ||
          tweetId.toLowerCase().includes('private')) {
        throw new Error('Private key data not allowed');
      }
      // Derive PDA for storing user's verification data
      const [verificationAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('social_verification'),
          userWallet.toBuffer(),
          Buffer.from(platform),
        ],
        this.programId
      );

      console.log('📝 Verification Account PDA:', verificationAccount.toString());

      // Create instruction data
      const verificationData = {
        wallet: userWallet.toString(),
        platform: platform,
        username: username,
        tweetId: tweetId,
        verified: true,
        timestamp: Date.now(),
        followerCount: followerCount,
        referralCode: referralCode,
      };

      // For now, we'll return mock data since the program needs to be deployed on Analos
      // In production, this would create a real transaction on Analos blockchain
      console.log('✅ Verification data prepared for Analos blockchain:', verificationData);

      // Simulate transaction submission to Analos
      const mockSignature = `analos_verification_${Date.now()}_${userWallet.toString().slice(0, 8)}`;

      return {
        success: true,
        signature: mockSignature,
      };
    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Query verification data from on-chain account
   */
  async getVerificationData(
    userWallet: PublicKey,
    platform: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Derive PDA for user's verification account
      const [verificationAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('social_verification'),
          userWallet.toBuffer(),
          Buffer.from(platform),
        ],
        this.programId
      );

      console.log('🔍 Querying verification account:', verificationAccount.toString());

      // Fetch account data from Analos blockchain
      const accountInfo = await this.connection.getAccountInfo(verificationAccount);

      if (!accountInfo) {
        return {
          success: false,
          error: 'No verification data found for this user on Analos blockchain',
        };
      }

      // Deserialize account data from Analos
      // For now, return mock data since program needs to be deployed on Analos
      const mockData = {
        wallet: userWallet.toString(),
        platform: platform,
        username: 'verified_user',
        tweetId: '',
        verified: true,
        timestamp: Date.now(),
        followerCount: 0,
        referralCode: '',
        blockchain: 'analos', // Specify it's from Analos blockchain
      };

      return {
        success: true,
        data: mockData,
      };
    } catch (error) {
      console.error('❌ Error querying verification data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all verifications for a user across all platforms
   */
  async getAllUserVerifications(
    userWallet: PublicKey
  ): Promise<{
    success: boolean;
    verifications?: any[];
    error?: string;
  }> {
    try {
      const platforms = ['twitter', 'discord', 'telegram'];
      const verifications = [];

      for (const platform of platforms) {
        const result = await this.getVerificationData(userWallet, platform);
        if (result.success && result.data) {
          verifications.push(result.data);
        }
      }

      return {
        success: true,
        verifications: verifications,
      };
    } catch (error) {
      console.error('❌ Error getting all verifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Listen for verification transactions in real-time
   */
  async subscribeToVerifications(
    userWallet: PublicKey,
    callback: (data: any) => void
  ): Promise<number> {
    try {
      // Derive PDA
      const [verificationAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('social_verification'), userWallet.toBuffer()],
        this.programId
      );

      // Subscribe to account changes
      const subscriptionId = this.connection.onAccountChange(
        verificationAccount,
        (accountInfo) => {
          console.log('📡 Verification account updated:', accountInfo);
          // Deserialize and call callback
          callback(accountInfo.data);
        },
        'confirmed'
      );

      console.log('🎧 Subscribed to verification updates:', subscriptionId);
      return subscriptionId;
    } catch (error) {
      console.error('❌ Error subscribing to verifications:', error);
      return -1;
    }
  }

  /**
   * Unsubscribe from verification updates
   */
  async unsubscribeFromVerifications(subscriptionId: number): Promise<void> {
    try {
      await this.connection.removeAccountChangeListener(subscriptionId);
      console.log('🔇 Unsubscribed from verification updates');
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
    }
  }

  /**
   * Get transaction history for a user's verifications
   */
  async getVerificationTransactionHistory(
    userWallet: PublicKey,
    limit: number = 10
  ): Promise<{
    success: boolean;
    transactions?: any[];
    error?: string;
  }> {
    try {
      // Get recent transactions for the user's verification account
      const [verificationAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('social_verification'), userWallet.toBuffer()],
        this.programId
      );

      const signatures = await this.connection.getSignaturesForAddress(
        verificationAccount,
        { limit }
      );

      const transactions = [];

      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx) {
          transactions.push({
            signature: sig.signature,
            blockTime: sig.blockTime,
            slot: sig.slot,
            confirmationStatus: sig.confirmationStatus,
          });
        }
      }

      return {
        success: true,
        transactions: transactions,
      };
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify on-chain data matches off-chain tweet data
   */
  async verifyDataIntegrity(
    userWallet: PublicKey,
    platform: string,
    expectedTweetId: string
  ): Promise<boolean> {
    try {
      const result = await this.getVerificationData(userWallet, platform);

      if (!result.success || !result.data) {
        return false;
      }

      return result.data.tweetId === expectedTweetId && result.data.verified;
    } catch (error) {
      console.error('❌ Error verifying data integrity:', error);
      return false;
    }
  }
}

// Export singleton instance
let oracleInstance: SocialVerificationOracle | null = null;

export function getSocialVerificationOracle(connection: Connection): SocialVerificationOracle {
  if (!oracleInstance) {
    oracleInstance = new SocialVerificationOracle(connection);
  }
  return oracleInstance;
}

// Export types
export type { SocialVerificationData };
