import { Connection, PublicKey } from '@solana/web3.js';

export interface MintedToken {
  mintAddress: string;
  ownerAddress: string;
  transactionSignature: string;
  timestamp: number;
  slot: number;
}

export interface CollectionStats {
  totalMinted: number;
  totalSupply: number;
  mintedTokens: MintedToken[];
  lastUpdated: number;
}

export class MintTrackingService {
  private readonly ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';
  private readonly ANALOS_PROGRAM_ID = '3FNWoNWiBcbA67yYXrczCj8KdUo2TphCZXYHthqewwcX';
  private readonly COLLECTION_NAME = 'Los Bros';
  private readonly MAX_SUPPLY = 2222; // Your collection's max supply
  
  private connection: Connection;
  private mintedTokens: Map<string, MintedToken> = new Map();
  private lastProcessedSlot: number = 0;

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
    console.log('🔍 Mint Tracking Service initialized for Analos');
  }

  /**
   * Get current collection statistics
   */
  getCollectionStats(): CollectionStats {
    const tokens = Array.from(this.mintedTokens.values());
    return {
      totalMinted: tokens.length,
      totalSupply: this.MAX_SUPPLY,
      mintedTokens: tokens.sort((a, b) => b.timestamp - a.timestamp),
      lastUpdated: Date.now()
    };
  }

  /**
   * Scan for new mint transactions by monitoring program activity
   */
  async scanForNewMints(): Promise<MintedToken[]> {
    try {
      console.log('🔍 Scanning for new mint transactions...');
      
      const programId = new PublicKey(this.ANALOS_PROGRAM_ID);
      
      // Get recent signatures for the program
      const signatures = await this.connection.getSignaturesForAddress(programId, {
        limit: 100,
        before: this.lastProcessedSlot > 0 ? undefined : undefined
      });

      const newMints: MintedToken[] = [];

      for (const sigInfo of signatures) {
        // Skip if we've already processed this signature
        if (this.mintedTokens.has(sigInfo.signature)) {
          continue;
        }

        try {
          // Get the full transaction details
          const transaction = await this.connection.getTransaction(sigInfo.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          });

          if (!transaction || !transaction.meta || transaction.meta.err) {
            continue; // Skip failed transactions
          }

          // Check if this is a mint transaction by looking for token mint creation
          const mintToken = this.extractMintFromTransaction(transaction, sigInfo.signature);
          if (mintToken) {
            this.mintedTokens.set(sigInfo.signature, mintToken);
            newMints.push(mintToken);
            console.log(`✅ Found new mint: ${mintToken.mintAddress}`);
          }

        } catch (error) {
          console.log(`⚠️ Error processing transaction ${sigInfo.signature}:`, error);
        }
      }

      // Update last processed slot
      if (signatures.length > 0) {
        this.lastProcessedSlot = Math.max(...signatures.map(s => s.slot));
      }

      console.log(`📊 Found ${newMints.length} new mints. Total: ${this.mintedTokens.size}`);
      return newMints;

    } catch (error) {
      console.error('❌ Error scanning for new mints:', error);
      return [];
    }
  }

  /**
   * Extract mint information from a transaction
   */
  private extractMintFromTransaction(transaction: any, signature: string): MintedToken | null {
    try {
      // Look for token mint creation in the transaction
      const instructions = transaction.transaction.message.instructions;
      
      for (const instruction of instructions) {
        // Check if this is a "Create Account" instruction that creates a token mint
        if (instruction.programId === '11111111111111111111111111111111') { // System Program
          const accounts = instruction.accounts;
          if (accounts && accounts.length >= 2) {
            // Check if the new account is assigned to the Token Program
            const newAccountIndex = accounts[1];
            const accountKeys = transaction.transaction.message.accountKeys;
            
            if (newAccountIndex < accountKeys.length) {
              const newAccount = accountKeys[newAccountIndex];
              
              // Check if this account is assigned to Token Program
              const assignedProgramIndex = instruction.data[0];
              if (assignedProgramIndex < accountKeys.length) {
                const assignedProgram = accountKeys[assignedProgramIndex];
                
                if (assignedProgram === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                  // This is a token mint creation
                  const mintAddress = newAccount;
                  
                  // Find the owner (usually the fee payer)
                  const ownerAddress = accountKeys[0]; // Fee payer is usually first
                  
                  return {
                    mintAddress,
                    ownerAddress,
                    transactionSignature: signature,
                    timestamp: transaction.blockTime ? transaction.blockTime * 1000 : Date.now(),
                    slot: transaction.slot
                  };
                }
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.log(`⚠️ Error extracting mint from transaction:`, error);
      return null;
    }
  }

  /**
   * Get minted tokens for a specific owner
   */
  getMintedTokensForOwner(ownerAddress: string): MintedToken[] {
    return Array.from(this.mintedTokens.values())
      .filter(token => token.ownerAddress === ownerAddress);
  }

  /**
   * Check if a specific mint address has been minted
   */
  isMintAddressMinted(mintAddress: string): boolean {
    return Array.from(this.mintedTokens.values())
      .some(token => token.mintAddress === mintAddress);
  }

  /**
   * Start continuous monitoring for new mints
   */
  startMonitoring(intervalMs: number = 30000): void {
    console.log(`🔄 Starting mint monitoring (every ${intervalMs}ms)`);
    
    // Initial scan
    this.scanForNewMints();
    
    // Set up interval
    setInterval(async () => {
      await this.scanForNewMints();
    }, intervalMs);
  }

  /**
   * Force refresh by scanning recent transactions
   */
  async forceRefresh(): Promise<CollectionStats> {
    console.log('🔄 Force refreshing mint data...');
    await this.scanForNewMints();
    return this.getCollectionStats();
  }
}
