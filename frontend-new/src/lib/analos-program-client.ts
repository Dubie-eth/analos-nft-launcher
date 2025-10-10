/**
 * Analos NFT Launchpad Program Client (Frontend)
 * Handles all frontend interactions with the Analos NFT Launchpad smart contract
 * Program ID: 28YCSetmG6PSRdhQV6iBFuAE7NqWtLCryr3GYtR3qS6p
 */

import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

const PROGRAM_ID = new PublicKey('28YCSetmG6PSRdhQV6iBFuAE7NqWtLCryr3GYtR3qS6p');
const ANALOS_RPC_URL = process.env.NEXT_PUBLIC_ANALOS_RPC_URL || 'https://rpc.analos.io';

export interface CollectionConfig {
  authority: PublicKey;
  maxSupply: number;
  currentSupply: number;
  priceLamports: number;
  revealThreshold: number;
  isRevealed: boolean;
  isPaused: boolean;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
}

export interface MintRecord {
  mintIndex: number;
  minter: PublicKey;
  isRevealed: boolean;
  rarityScore: number;
}

export interface RarityTier {
  name: string;
  minScore: number;
  maxScore: number;
  probability: string;
  color: string;
}

export class AnalosLaunchpadClient {
  private connection: Connection;
  private programId: PublicKey;

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    this.programId = PROGRAM_ID;
    console.log('🎯 Analos Launchpad Client initialized');
    console.log(`   Program ID: ${this.programId.toString()}`);
  }

  /**
   * Get rarity tier based on rarity score
   */
  getRarityTier(rarityScore: number): RarityTier {
    if (rarityScore <= 4) {
      return { 
        name: 'Legendary', 
        minScore: 0, 
        maxScore: 4, 
        probability: '5%',
        color: '#FFD700' // Gold
      };
    } else if (rarityScore <= 19) {
      return { 
        name: 'Epic', 
        minScore: 5, 
        maxScore: 19, 
        probability: '15%',
        color: '#9932CC' // Purple
      };
    } else if (rarityScore <= 49) {
      return { 
        name: 'Rare', 
        minScore: 20, 
        maxScore: 49, 
        probability: '30%',
        color: '#1E90FF' // Blue
      };
    } else {
      return { 
        name: 'Common', 
        minScore: 50, 
        maxScore: 99, 
        probability: '50%',
        color: '#C0C0C0' // Silver
      };
    }
  }

  /**
   * Derive collection config PDA
   * Seeds: ["collection", authority]
   */
  deriveCollectionConfigPDA(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('collection'), authority.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive mint record PDA
   * Seeds: ["mint", collection_config, mint_index]
   */
  deriveMintRecordPDA(collectionConfig: PublicKey, mintIndex: number): [PublicKey, number] {
    const mintIndexBuffer = Buffer.alloc(8);
    mintIndexBuffer.writeBigUInt64LE(BigInt(mintIndex));
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), collectionConfig.toBuffer(), mintIndexBuffer],
      this.programId
    );
  }

  /**
   * Get collection configuration from blockchain
   */
  async getCollectionConfig(authority: PublicKey): Promise<CollectionConfig | null> {
    try {
      const [collectionConfigPDA] = this.deriveCollectionConfigPDA(authority);
      
      const accountInfo = await this.connection.getAccountInfo(collectionConfigPDA);
      
      if (!accountInfo) {
        console.log('Collection config not found');
        return null;
      }

      // Parse account data
      // This is a simplified parser - in production you'd use proper Anchor/Borsh deserialization
      const data = accountInfo.data;
      
      // For now, return mock data structure
      // TODO: Implement proper account parsing
      return {
        authority,
        maxSupply: 10000,
        currentSupply: 0,
        priceLamports: 4200690000000,
        revealThreshold: 5000,
        isRevealed: false,
        isPaused: false,
        collectionName: 'Analos Mystery Box',
        collectionSymbol: 'AMB',
        placeholderUri: 'https://placeholder.com/mystery.json'
      };
    } catch (error) {
      console.error('Error fetching collection config:', error);
      return null;
    }
  }

  /**
   * Build mint placeholder transaction
   */
  async buildMintTransaction(params: {
    payer: PublicKey;
    authority: PublicKey;
  }): Promise<Transaction> {
    try {
      const { payer, authority } = params;

      // Derive PDAs
      const [collectionConfig] = this.deriveCollectionConfigPDA(authority);
      
      // Get current supply to calculate mint index
      const config = await this.getCollectionConfig(authority);
      if (!config) {
        throw new Error('Collection not found');
      }

      if (config.isPaused) {
        throw new Error('Collection minting is paused');
      }

      if (config.currentSupply >= config.maxSupply) {
        throw new Error('Collection is sold out');
      }

      const mintIndex = config.currentSupply;
      const [mintRecord] = this.deriveMintRecordPDA(collectionConfig, mintIndex);

      // Create transaction
      const transaction = new Transaction();

      // Build instruction data for mintPlaceholder (no args needed)
      const instructionData = Buffer.from([/* instruction discriminator for mintPlaceholder */]);

      // Create mint instruction
      const mintInstruction = new TransactionInstruction({
        keys: [
          { pubkey: collectionConfig, isSigner: false, isWritable: true },
          { pubkey: mintRecord, isSigner: false, isWritable: true },
          { pubkey: payer, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: this.programId,
        data: instructionData,
      });

      transaction.add(mintInstruction);

      // Set fee payer and get recent blockhash
      transaction.feePayer = payer;
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      console.log('✅ Mint transaction built successfully');
      console.log(`   Mint Index: ${mintIndex}`);
      console.log(`   Price: ${config.priceLamports / 1_000_000_000} LOS`);

      return transaction;
    } catch (error) {
      console.error('❌ Error building mint transaction:', error);
      throw error;
    }
  }

  /**
   * Get mint record for a specific NFT
   */
  async getMintRecord(collectionConfig: PublicKey, mintIndex: number): Promise<MintRecord | null> {
    try {
      const [mintRecordPDA] = this.deriveMintRecordPDA(collectionConfig, mintIndex);
      
      const accountInfo = await this.connection.getAccountInfo(mintRecordPDA);
      
      if (!accountInfo) {
        return null;
      }

      // Parse mint record data
      // TODO: Implement proper account parsing
      return {
        mintIndex,
        minter: new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'),
        isRevealed: false,
        rarityScore: Math.floor(Math.random() * 100)
      };
    } catch (error) {
      console.error('Error fetching mint record:', error);
      return null;
    }
  }

  /**
   * Get user's minted NFTs
   */
  async getUserMints(userWallet: PublicKey, authority: PublicKey): Promise<MintRecord[]> {
    try {
      const config = await this.getCollectionConfig(authority);
      if (!config) {
        return [];
      }

      const userMints: MintRecord[] = [];

      // Scan through all minted NFTs to find user's
      for (let i = 0; i < config.currentSupply; i++) {
        const mintRecord = await this.getMintRecord(
          this.deriveCollectionConfigPDA(authority)[0],
          i
        );
        
        if (mintRecord && mintRecord.minter.equals(userWallet)) {
          userMints.push(mintRecord);
        }
      }

      return userMints;
    } catch (error) {
      console.error('Error fetching user mints:', error);
      return [];
    }
  }

  /**
   * Calculate mint price in SOL/LOS
   */
  calculateMintPrice(priceLamports: number): number {
    return priceLamports / 1_000_000_000;
  }

  /**
   * Format rarity score for display
   */
  formatRarityScore(score: number): string {
    const tier = this.getRarityTier(score);
    return `${tier.name} (${score}/99)`;
  }

  /**
   * Check if collection is ready to mint
   */
  async canMint(authority: PublicKey): Promise<{
    canMint: boolean;
    reason?: string;
    config?: CollectionConfig;
  }> {
    try {
      const config = await this.getCollectionConfig(authority);
      
      if (!config) {
        return { canMint: false, reason: 'Collection not found' };
      }

      if (config.isPaused) {
        return { canMint: false, reason: 'Collection minting is paused', config };
      }

      if (config.currentSupply >= config.maxSupply) {
        return { canMint: false, reason: 'Collection is sold out', config };
      }

      return { canMint: true, config };
    } catch (error) {
      console.error('Error checking mint eligibility:', error);
      return { canMint: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get program information
   */
  getProgramInfo() {
    return {
      programId: this.programId.toString(),
      rpcUrl: ANALOS_RPC_URL,
      features: [
        '🎲 Blind Mint & Reveal',
        '🎯 Fair On-chain Randomness',
        '⭐ 4 Rarity Tiers',
        '👑 Legendary (5%)',
        '💜 Epic (15%)',
        '💎 Rare (30%)',
        '🔘 Common (50%)'
      ]
    };
  }
}

// Singleton instance
export const analosLaunchpadClient = new AnalosLaunchpadClient();

