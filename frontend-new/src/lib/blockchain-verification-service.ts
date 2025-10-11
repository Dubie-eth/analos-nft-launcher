import {
  Connection,
  PublicKey,
  Transaction,
  ParsedTransactionWithMeta,
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  transactionSignature?: string;
  nftMintAddress?: string;
  paymentAmount?: number;
  paymentToken?: string;
  error?: string;
  blockchainData?: any;
}

export interface SmartContractReference {
  collectionId: string;
  collectionName: string;
  mintPrice: number;
  paymentToken: string;
  feeRecipient: string;
  maxSupply: number;
  currentSupply: number;
  isActive: boolean;
  deployedAt: string;
  contractAddress: string;
}

export class BlockchainVerificationService {
  private connection: Connection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly LOL_TOKEN_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
  private readonly FEE_RECIPIENT = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  constructor(rpcUrl?: string) {
    this.connection = new Connection(rpcUrl || this.ANALOS_RPC_URL, 'confirmed');
    console.log('🔍 Blockchain Verification Service initialized');
  }

  /**
   * Verify a minting transaction against blockchain state
   */
  async verifyMintingTransaction(
    transactionSignature: string,
    expectedCollection: string,
    expectedQuantity: number,
    expectedPayer: string
  ): Promise<VerificationResult> {
    try {
      console.log('🔍 Verifying minting transaction:', transactionSignature);
      
      // Get transaction details from blockchain
      const transaction = await this.connection.getParsedTransaction(transactionSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return {
          success: false,
          verified: false,
          error: 'Transaction not found on blockchain'
        };
      }

      console.log('📊 Transaction found on blockchain, analyzing...');

      // Verify transaction success
      if (transaction.meta?.err) {
        return {
          success: false,
          verified: false,
          error: `Transaction failed: ${JSON.stringify(transaction.meta.err)}`
        };
      }

      // Analyze transaction instructions
      const analysis = await this.analyzeTransactionInstructions(
        transaction,
        expectedCollection,
        expectedQuantity,
        expectedPayer
      );

      return {
        success: true,
        verified: analysis.verified,
        transactionSignature,
        nftMintAddress: analysis.nftMintAddress,
        paymentAmount: analysis.paymentAmount,
        paymentToken: analysis.paymentToken,
        blockchainData: {
          slot: transaction.slot,
          blockTime: transaction.blockTime,
          fee: transaction.meta?.fee,
          computeUnitsConsumed: transaction.meta?.computeUnitsConsumed
        }
      };

    } catch (error) {
      console.error('❌ Error verifying transaction:', error);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  /**
   * Analyze transaction instructions to verify minting and payment
   */
  private async analyzeTransactionInstructions(
    transaction: ParsedTransactionWithMeta,
    expectedCollection: string,
    expectedQuantity: number,
    expectedPayer: string
  ): Promise<{
    verified: boolean;
    nftMintAddress?: string;
    paymentAmount?: number;
    paymentToken?: string;
  }> {
    const instructions = transaction.transaction.message.instructions;
    let nftMintAddress: string | undefined;
    let paymentAmount: number | undefined;
    let paymentToken: string | undefined;
    let mintInstructionsFound = 0;
    let paymentInstructionsFound = 0;

    console.log('🔍 Analyzing transaction instructions...');

    for (const instruction of instructions) {
      if ('parsed' in instruction) {
        const parsed = instruction.parsed as ParsedInstruction;
        
        // Check for token minting instructions
        if (parsed.type === 'initializeMint' || parsed.type === 'mintTo') {
          mintInstructionsFound++;
          if (parsed.type === 'initializeMint') {
            nftMintAddress = parsed.info.mint;
            console.log('🎨 Found NFT mint initialization:', nftMintAddress);
          }
        }

        // Check for token transfer instructions (payment)
        if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
          paymentInstructionsFound++;
          const transferInfo = parsed.info;
          
          // Verify this is a payment (not just NFT transfer)
          if (transferInfo.authority === expectedPayer) {
            paymentAmount = parseFloat(transferInfo.amount);
            paymentToken = transferInfo.mint || 'SOL'; // SOL for native transfers
            console.log('💰 Found payment instruction:', paymentAmount, paymentToken);
          }
        }
      } else if ('programId' in instruction) {
        const partial = instruction as PartiallyDecodedInstruction;
        
        // Check for System Program transfers (SOL payments)
        if (partial.programId.toString() === '11111111111111111111111111111111') {
          // This is a System Program instruction, likely a SOL transfer
          paymentInstructionsFound++;
          paymentToken = 'SOL';
          console.log('💰 Found SOL transfer instruction');
        }
      }
    }

    console.log('📊 Instruction analysis complete:');
    console.log('   Mint instructions:', mintInstructionsFound);
    console.log('   Payment instructions:', paymentInstructionsFound);
    console.log('   NFT mint address:', nftMintAddress);
    console.log('   Payment amount:', paymentAmount);
    console.log('   Payment token:', paymentToken);

    // Verify we found the expected number of instructions
    const expectedMintInstructions = expectedQuantity * 4; // 4 instructions per NFT
    const verified = mintInstructionsFound >= expectedMintInstructions && 
                    paymentInstructionsFound > 0 &&
                    !!nftMintAddress &&
                    !!paymentAmount;

    return {
      verified,
      nftMintAddress,
      paymentAmount,
      paymentToken
    };
  }

  /**
   * Verify NFT ownership on blockchain
   */
  async verifyNFTOwnership(
    nftMintAddress: string,
    ownerAddress: string
  ): Promise<boolean> {
    try {
      console.log('🔍 Verifying NFT ownership:', nftMintAddress, '->', ownerAddress);
      
      const ownerPublicKey = new PublicKey(ownerAddress);
      const mintPublicKey = new PublicKey(nftMintAddress);
      
      // Get associated token account
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        ownerPublicKey
      );
      
      // Check if the token account exists and has the NFT
      const tokenAccount = await getAccount(this.connection, associatedTokenAddress);
      
      const hasNFT = tokenAccount.amount === BigInt(1);
      console.log('🎯 NFT ownership verification:', hasNFT ? '✅ VERIFIED' : '❌ NOT FOUND');
      
      return hasNFT;
      
    } catch (error) {
      console.error('❌ Error verifying NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get smart contract reference data
   */
  async getSmartContractReference(collectionName: string): Promise<SmartContractReference | null> {
    try {
      console.log('🔍 Fetching smart contract reference for:', collectionName);
      
      // In a real implementation, this would query the smart contract
      // For now, we'll return mock data that matches our system
      const collectionId = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
      
      return {
        collectionId,
        collectionName,
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        feeRecipient: this.FEE_RECIPIENT,
        maxSupply: 4200,
        currentSupply: 0, // This would be fetched from blockchain
        isActive: true,
        deployedAt: new Date().toISOString(),
        contractAddress: `contract_${collectionId}_${Date.now()}`
      };
      
    } catch (error) {
      console.error('❌ Error fetching smart contract reference:', error);
      return null;
    }
  }

  /**
   * Verify collection state against smart contract
   */
  async verifyCollectionState(collectionName: string): Promise<{
    verified: boolean;
    blockchainSupply: number;
    contractSupply: number;
    priceMatch: boolean;
    activeStatus: boolean;
  }> {
    try {
      console.log('🔍 Verifying collection state for:', collectionName);
      
      // Get smart contract reference
      const contractRef = await this.getSmartContractReference(collectionName);
      if (!contractRef) {
        throw new Error('Could not fetch smart contract reference');
      }

      // In a real implementation, we would:
      // 1. Query the smart contract for current state
      // 2. Compare with our local state
      // 3. Return verification results
      
      // For now, return mock verification
      return {
        verified: true,
        blockchainSupply: 0, // Would be fetched from blockchain
        contractSupply: contractRef.currentSupply,
        priceMatch: true,
        activeStatus: contractRef.isActive
      };
      
    } catch (error) {
      console.error('❌ Error verifying collection state:', error);
      return {
        verified: false,
        blockchainSupply: 0,
        contractSupply: 0,
        priceMatch: false,
        activeStatus: false
      };
    }
  }

  /**
   * Retry mechanism for failed transactions
   */
  async retryTransactionVerification(
    transactionSignature: string,
    maxRetries: number = 3,
    delayMs: number = 2000
  ): Promise<VerificationResult> {
    console.log(`🔄 Retrying transaction verification (max ${maxRetries} attempts)...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for transaction:`, transactionSignature);
      
      try {
        const result = await this.verifyMintingTransaction(
          transactionSignature,
          'Launch On LOS', // Expected collection
          1, // Expected quantity
          '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW' // Expected payer
        );
        
        if (result.success && result.verified) {
          console.log('✅ Transaction verification successful on attempt', attempt);
          return result;
        }
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    return {
      success: false,
      verified: false,
      error: `Transaction verification failed after ${maxRetries} attempts`
    };
  }

  /**
   * Get transaction status with detailed information
   */
  async getTransactionStatus(transactionSignature: string): Promise<{
    status: 'pending' | 'confirmed' | 'finalized' | 'failed';
    confirmations: number;
    blockTime?: number;
    error?: any;
  }> {
    try {
      const transaction = await this.connection.getTransaction(transactionSignature, {
        commitment: 'confirmed'
      });
      
      if (!transaction) {
        return { status: 'pending', confirmations: 0 };
      }
      
      if (transaction.meta?.err) {
        return {
          status: 'failed',
          confirmations: 0,
          error: transaction.meta.err
        };
      }
      
      return {
        status: 'confirmed',
        confirmations: 1, // Simplified - in reality would calculate based on current slot
        blockTime: transaction.blockTime
      };
      
    } catch (error) {
      console.error('❌ Error getting transaction status:', error);
      return { status: 'pending', confirmations: 0 };
    }
  }
}

export default BlockchainVerificationService;
