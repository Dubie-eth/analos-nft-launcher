/**
 * Blockchain Transfer Service
 * Tracks and logs NFT transfers to the blockchain
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { blockchainFirstService } from './blockchain-first-service';

export interface TransferEvent {
  fromWallet: string;
  toWallet: string;
  tokenId: string;
  collectionName: string;
  timestamp: number;
  signature: string;
}

export class BlockchainTransferService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('🔄 Blockchain Transfer Service initialized');
  }

  /**
   * Create NFT transfer transaction
   */
  async createTransferTransaction(
    tokenMintAddress: string,
    fromWallet: string,
    toWallet: string,
    quantity: number = 1
  ): Promise<Transaction> {
    try {
      console.log(`🔄 Creating transfer transaction: ${tokenMintAddress} from ${fromWallet} to ${toWallet}`);

      const fromPublicKey = new PublicKey(fromWallet);
      const toPublicKey = new PublicKey(toWallet);
      const mintPublicKey = new PublicKey(tokenMintAddress);

      // Get associated token addresses
      const fromTokenAddress = await getAssociatedTokenAddress(mintPublicKey, fromPublicKey);
      const toTokenAddress = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAddress,
        toTokenAddress,
        fromPublicKey,
        quantity * Math.pow(10, 0), // Assuming 0 decimals for NFTs
        [],
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      );

      // Create transaction
      const transaction = new Transaction().add(transferInstruction);

      // Set recent blockhash and fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      console.log(`✅ Transfer transaction created`);
      return transaction;

    } catch (error) {
      console.error('❌ Error creating transfer transaction:', error);
      throw error;
    }
  }

  /**
   * Log transfer event to blockchain via smart contract
   */
  async logTransferEvent(
    collectionName: string,
    fromWallet: string,
    toWallet: string,
    tokenId: string,
    transactionSignature: string
  ): Promise<void> {
    try {
      console.log(`📝 Logging transfer event to blockchain: ${tokenId} from ${fromWallet} to ${toWallet}`);

      // Log transfer event to smart contract
      await blockchainFirstService.logTransferEvent(
        collectionName,
        fromWallet,
        toWallet,
        tokenId
      );

      console.log(`✅ Transfer event logged to blockchain via smart contract`);

    } catch (error) {
      console.error('❌ Error logging transfer event to blockchain:', error);
      // Don't throw - logging failure shouldn't break transfer
    }
  }

  /**
   * Monitor NFT transfers for a collection
   */
  async monitorCollectionTransfers(collectionName: string, callback: (event: TransferEvent) => void): Promise<void> {
    try {
      console.log(`🔍 Starting transfer monitoring for collection: ${collectionName}`);

      // This would implement real-time transfer monitoring
      // For now, this is a placeholder for future implementation
      
    } catch (error) {
      console.error('❌ Error monitoring transfers:', error);
    }
  }

  /**
   * Get transfer history for a specific NFT
   */
  async getTransferHistory(tokenId: string): Promise<TransferEvent[]> {
    try {
      console.log(`📜 Getting transfer history for NFT: ${tokenId}`);

      // This would scan blockchain for transfer events
      // For now, return empty array as placeholder
      return [];

    } catch (error) {
      console.error('❌ Error getting transfer history:', error);
      return [];
    }
  }

  /**
   * Get transfer history for a wallet
   */
  async getWalletTransferHistory(walletAddress: string): Promise<TransferEvent[]> {
    try {
      console.log(`📜 Getting transfer history for wallet: ${walletAddress}`);

      // This would scan blockchain for transfer events involving this wallet
      // For now, return empty array as placeholder
      return [];

    } catch (error) {
      console.error('❌ Error getting wallet transfer history:', error);
      return [];
    }
  }
}

export const blockchainTransferService = new BlockchainTransferService();
