/**
 * On-Chain Ticker Service
 * Interacts with the smart contract's ticker registry for collision prevention
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

export interface OnChainTickerInfo {
  symbol: string;
  collectionName: string;
  collectionAddress: string;
  creator: string;
  registeredAt: number;
  status: 'active' | 'inactive' | 'reserved';
}

export interface TickerValidationResult {
  available: boolean;
  reason?: string;
  tickerInfo?: OnChainTickerInfo;
}

class OnChainTickerService {
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly PROGRAM_ID = '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk'; // New program ID with ticker collision prevention
  private connection: Connection;

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
    console.log('🔗 On-Chain Ticker Service initialized');
  }

  /**
   * Check if a ticker is available by calling the smart contract
   */
  async checkTickerAvailability(symbol: string): Promise<TickerValidationResult> {
    try {
      const upperSymbol = symbol.toUpperCase().trim();
      
      console.log(`🔍 Checking on-chain ticker availability: ${upperSymbol}`);
      
      // Format validation (client-side)
      const formatValidation = this.validateTickerFormat(upperSymbol);
      if (!formatValidation.valid) {
        return {
          available: false,
          reason: formatValidation.message
        };
      }

      // Check if ticker entry exists on-chain
      const tickerEntryPDA = await this.getTickerEntryPDA(upperSymbol);
      const tickerAccountInfo = await this.connection.getAccountInfo(tickerEntryPDA);
      
      if (tickerAccountInfo) {
        // Ticker exists, parse the account data
        const tickerInfo = this.parseTickerEntryAccount(tickerAccountInfo.data);
        return {
          available: false,
          reason: `Ticker "${upperSymbol}" is already registered by "${tickerInfo.collectionName}"`,
          tickerInfo
        };
      }

      // Check reserved tickers (this could also be on-chain)
      const reservedTickers = ['SOL', 'BTC', 'ETH', 'USDC', 'USDT', 'LOS', 'LOL', '404', 'NFT', 'DAO', 'DEFI', 'WEB3'];
      if (reservedTickers.includes(upperSymbol)) {
        return {
          available: false,
          reason: `Ticker "${upperSymbol}" is reserved`
        };
      }

      return {
        available: true,
        reason: `Ticker "${upperSymbol}" is available`
      };

    } catch (error) {
      console.error('❌ Error checking on-chain ticker availability:', error);
      return {
        available: false,
        reason: 'Unable to verify ticker availability'
      };
    }
  }

  /**
   * Register a ticker on-chain
   */
  async registerTicker(
    symbol: string,
    collectionName: string,
    collectionAddress: string,
    wallet: { publicKey: PublicKey; signTransaction: any }
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        return { success: false, error: 'Wallet not connected' };
      }

      const upperSymbol = symbol.toUpperCase().trim();
      
      console.log(`📝 Registering ticker on-chain: ${upperSymbol}`);

      // Create register ticker instruction
      const instruction = await this.createRegisterTickerInstruction(
        upperSymbol,
        collectionName,
        collectionAddress,
        wallet.publicKey
      );

      // Create and sign transaction
      const transaction = new Transaction().add(instruction);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: true }
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log(`✅ Ticker registered on-chain: ${signature}`);
      return { success: true, signature };

    } catch (error) {
      console.error('❌ Error registering ticker on-chain:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get ticker information from on-chain registry
   */
  async getTickerInfo(symbol: string): Promise<OnChainTickerInfo | null> {
    try {
      const upperSymbol = symbol.toUpperCase().trim();
      const tickerEntryPDA = await this.getTickerEntryPDA(upperSymbol);
      const tickerAccountInfo = await this.connection.getAccountInfo(tickerEntryPDA);
      
      if (!tickerAccountInfo) {
        return null;
      }

      return this.parseTickerEntryAccount(tickerAccountInfo.data);
    } catch (error) {
      console.error('❌ Error getting ticker info:', error);
      return null;
    }
  }

  /**
   * Get ticker entry PDA
   */
  private async getTickerEntryPDA(symbol: string): Promise<PublicKey> {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from('ticker_entry'), Buffer.from(symbol)],
      new PublicKey(this.PROGRAM_ID)
    );
    return pda;
  }

  /**
   * Create register ticker instruction
   */
  private async createRegisterTickerInstruction(
    symbol: string,
    collectionName: string,
    collectionAddress: string,
    creator: PublicKey
  ) {
    // This would call your program's register_ticker instruction
    // You'll need to implement this based on your program's instruction structure
    
    const tickerEntryPDA = await this.getTickerEntryPDA(symbol);
    const tickerRegistryPDA = await this.getTickerRegistryPDA();
    
    // Create the instruction data for your program
    const instructionData = Buffer.concat([
      Buffer.from([0x01, 0x00, 0x00, 0x00]), // Instruction discriminator for register_ticker
      Buffer.from(symbol, 'utf8'),
      Buffer.from(collectionName, 'utf8'),
    ]);

    return {
      keys: [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: tickerRegistryPDA, isSigner: false, isWritable: true },
        { pubkey: tickerEntryPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: new PublicKey(this.PROGRAM_ID),
      data: instructionData,
    };
  }

  /**
   * Get ticker registry PDA
   */
  private async getTickerRegistryPDA(): Promise<PublicKey> {
    const [pda] = await PublicKey.findProgramAddress(
      [Buffer.from('ticker_registry')],
      new PublicKey(this.PROGRAM_ID)
    );
    return pda;
  }

  /**
   * Parse ticker entry account data
   */
  private parseTickerEntryAccount(data: Buffer): OnChainTickerInfo {
    // Parse the account data based on your program's structure
    // This is a simplified version - you'll need to match your actual account layout
    
    let offset = 8; // Skip discriminator
    
    // Read symbol length and symbol
    const symbolLen = data.readUInt32LE(offset);
    offset += 4;
    const symbol = data.slice(offset, offset + symbolLen).toString('utf8');
    offset += symbolLen;
    
    // Read collection name length and name
    const collectionNameLen = data.readUInt32LE(offset);
    offset += 4;
    const collectionName = data.slice(offset, offset + collectionNameLen).toString('utf8');
    offset += collectionNameLen;
    
    // Read creator (32 bytes)
    const creator = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Read registered at timestamp (8 bytes)
    const registeredAt = Number(data.readBigInt64LE(offset));
    offset += 8;
    
    // Read status (1 byte)
    const statusByte = data.readUInt8(offset);
    const status = statusByte === 0 ? 'active' : statusByte === 1 ? 'inactive' : 'reserved';
    
    return {
      symbol,
      collectionName,
      collectionAddress: '', // You'll need to store this in your account structure
      creator: creator.toBase58(),
      registeredAt,
      status
    };
  }

  /**
   * Validate ticker format
   */
  private validateTickerFormat(symbol: string): { valid: boolean; message?: string } {
    if (!symbol || symbol.length === 0) {
      return { valid: false, message: 'Ticker symbol is required' };
    }
    
    if (symbol.length < 1 || symbol.length > 10) {
      return { valid: false, message: 'Ticker must be 1-10 characters long' };
    }
    
    if (!/^[A-Z0-9]+$/.test(symbol)) {
      return { valid: false, message: 'Ticker can only contain letters and numbers' };
    }
    
    if (/^[0-9]/.test(symbol)) {
      return { valid: false, message: 'Ticker should not start with a number' };
    }
    
    return { valid: true };
  }
}

// Export singleton instance
export const onChainTickerService = new OnChainTickerService();
export default onChainTickerService;
