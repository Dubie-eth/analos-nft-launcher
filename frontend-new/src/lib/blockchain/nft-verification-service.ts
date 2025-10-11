import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

export interface NFTOwnershipInfo {
  mintAddress: string;
  ownerAddress: string;
  tokenAccount: string;
  amount: number;
  isOwned: boolean;
  lastUpdated: Date;
}

export interface NFTVerificationResult {
  success: boolean;
  ownership?: NFTOwnershipInfo;
  error?: string;
}

/**
 * NFT Verification and Ownership Tracking Service
 * Provides comprehensive NFT ownership verification and tracking
 */
export class NFTVerificationService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Verify NFT ownership for a specific mint and wallet
   */
  async verifyNFTOwnership(
    mintAddress: string,
    walletAddress: string
  ): Promise<NFTVerificationResult> {
    try {
      console.log('🔍 Verifying NFT ownership...');
      console.log('🎨 Mint Address:', mintAddress);
      console.log('👤 Wallet Address:', walletAddress);

      // Convert addresses to PublicKeys
      const mintPublicKey = new PublicKey(mintAddress);
      const walletPublicKey = new PublicKey(walletAddress);

      // Get the associated token account address
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );

      console.log('🔗 Associated Token Account:', associatedTokenAccount.toBase58());

      // Get the token account info
      const tokenAccountInfo = await getAccount(this.connection, associatedTokenAccount);
      
      if (!tokenAccountInfo) {
        console.log('❌ Token account not found - NFT not owned');
        return {
          success: true,
          ownership: {
            mintAddress,
            ownerAddress: walletAddress,
            tokenAccount: associatedTokenAccount.toBase58(),
            amount: 0,
            isOwned: false,
            lastUpdated: new Date()
          }
        };
      }

      const isOwned = tokenAccountInfo.amount > 0n;
      console.log('💰 Token Amount:', tokenAccountInfo.amount.toString());
      console.log('✅ NFT Ownership:', isOwned ? 'OWNED' : 'NOT OWNED');

      return {
        success: true,
        ownership: {
          mintAddress,
          ownerAddress: walletAddress,
          tokenAccount: associatedTokenAccount.toBase58(),
          amount: Number(tokenAccountInfo.amount),
          isOwned,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('❌ NFT ownership verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all NFTs owned by a wallet
   */
  async getWalletNFTs(walletAddress: string): Promise<{
    success: boolean;
    nfts?: Array<NFTOwnershipInfo>;
    error?: string;
  }> {
    try {
      console.log('🔍 Getting all NFTs for wallet:', walletAddress);

      const walletPublicKey = new PublicKey(walletAddress);
      
      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token program
        }
      );

      const nfts: Array<NFTOwnershipInfo> = [];

      for (const accountInfo of tokenAccounts.value) {
        const tokenAccount = accountInfo.account;
        const parsedData = tokenAccount.data.parsed.info;

        // Only include NFTs (amount = 1, decimals = 0)
        if (parsedData.tokenAmount.amount === '1' && parsedData.tokenAmount.decimals === 0) {
          nfts.push({
            mintAddress: parsedData.mint,
            ownerAddress: walletAddress,
            tokenAccount: accountInfo.pubkey.toBase58(),
            amount: 1,
            isOwned: true,
            lastUpdated: new Date()
          });
        }
      }

      console.log('✅ Found', nfts.length, 'NFTs for wallet');
      
      return {
        success: true,
        nfts
      };
    } catch (error) {
      console.error('❌ Failed to get wallet NFTs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify multiple NFT ownerships at once
   */
  async verifyMultipleNFTOwnership(
    mintAddresses: string[],
    walletAddress: string
  ): Promise<{
    success: boolean;
    results?: Array<NFTVerificationResult>;
    error?: string;
  }> {
    try {
      console.log('🔍 Verifying multiple NFT ownerships...');
      console.log('📊 Mint Addresses:', mintAddresses.length);
      console.log('👤 Wallet Address:', walletAddress);

      const results: Array<NFTVerificationResult> = [];

      // Verify each NFT ownership
      for (const mintAddress of mintAddresses) {
        const result = await this.verifyNFTOwnership(mintAddress, walletAddress);
        results.push(result);
      }

      const successCount = results.filter(r => r.success && r.ownership?.isOwned).length;
      console.log('✅ Verification complete:', successCount, 'of', mintAddresses.length, 'NFTs owned');

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('❌ Multiple NFT verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a wallet owns any NFTs from a specific collection
   */
  async checkCollectionOwnership(
    collectionMintAddresses: string[],
    walletAddress: string
  ): Promise<{
    success: boolean;
    ownedNFTs?: string[];
    totalOwned?: number;
    error?: string;
  }> {
    try {
      console.log('🔍 Checking collection ownership...');
      console.log('📊 Collection Size:', collectionMintAddresses.length);
      console.log('👤 Wallet Address:', walletAddress);

      const result = await this.verifyMultipleNFTOwnership(collectionMintAddresses, walletAddress);
      
      if (!result.success || !result.results) {
        throw new Error(result.error || 'Verification failed');
      }

      const ownedNFTs = result.results
        .filter(r => r.success && r.ownership?.isOwned)
        .map(r => r.ownership!.mintAddress);

      console.log('✅ Collection ownership check complete:', ownedNFTs.length, 'NFTs owned');

      return {
        success: true,
        ownedNFTs,
        totalOwned: ownedNFTs.length
      };
    } catch (error) {
      console.error('❌ Collection ownership check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
