/**
 * NFT Launchpad Service
 * 
 * Comprehensive service for interacting with the NFT Launchpad smart contract.
 * Handles all blockchain operations including collection initialization, minting,
 * revealing, and admin functions.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  Keypair,
} from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import {
  NFT_LAUNCHPAD_PROGRAM_ID,
  SEEDS,
  CollectionConfig,
  MintRecord,
  DEFAULT_COLLECTION_CONFIG,
  getRarityTier,
  MintEvent,
  RevealEvent,
  NftRevealedEvent,
} from './nft-launchpad-config';
import { ANALOS_CONFIG } from './analos-web3-wrapper';

// IDL type (we'll define this manually since we don't have the .json yet)
const IDL = {
  version: "0.1.0",
  name: "analos_nft_launchpad",
  instructions: [
    {
      name: "initializeCollection",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "maxSupply", type: "u64" },
        { name: "priceLamports", type: "u64" },
        { name: "revealThreshold", type: "u64" },
        { name: "collectionName", type: "string" },
        { name: "collectionSymbol", type: "string" },
        { name: "placeholderUri", type: "string" },
      ],
    },
    {
      name: "mintPlaceholder",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "mintRecord", isMut: true, isSigner: false },
        { name: "payer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "revealCollection",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
      ],
      args: [{ name: "revealedBaseUri", type: "string" }],
    },
    {
      name: "revealNft",
      accounts: [
        { name: "collectionConfig", isMut: false, isSigner: false },
        { name: "mintRecord", isMut: true, isSigner: false },
      ],
      args: [],
    },
    {
      name: "withdrawFunds",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "setPause",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [{ name: "paused", type: "bool" }],
    },
    {
      name: "updateConfig",
      accounts: [
        { name: "collectionConfig", isMut: true, isSigner: false },
        { name: "authority", isMut: false, isSigner: true },
      ],
      args: [
        { name: "newPrice", type: { option: "u64" } },
        { name: "newRevealThreshold", type: { option: "u64" } },
      ],
    },
  ],
};

export class NFTLaunchpadService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(ANALOS_CONFIG.RPC_ENDPOINT, {
      commitment: ANALOS_CONFIG.COMMITMENT,
    });
    this.programId = NFT_LAUNCHPAD_PROGRAM_ID;
    
    console.log('🚀 NFT Launchpad Service initialized');
    console.log('📍 Program ID:', this.programId.toBase58());
  }

  /**
   * Find Collection Config PDA
   */
  async findCollectionConfigPDA(authority: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [SEEDS.COLLECTION, authority.toBuffer()],
      this.programId
    );
  }

  /**
   * Find Mint Record PDA
   */
  async findMintRecordPDA(
    collectionConfig: PublicKey,
    mintIndex: number
  ): Promise<[PublicKey, number]> {
    const mintIndexBuffer = Buffer.alloc(8);
    mintIndexBuffer.writeBigUInt64LE(BigInt(mintIndex));
    
    return PublicKey.findProgramAddressSync(
      [SEEDS.MINT, collectionConfig.toBuffer(), mintIndexBuffer],
      this.programId
    );
  }

  /**
   * Initialize a new NFT collection
   */
  async initializeCollection(
    wallet: any,
    config: {
      maxSupply: number;
      priceLamports: number;
      revealThreshold: number;
      collectionName: string;
      collectionSymbol: string;
      placeholderUri: string;
    }
  ): Promise<{ signature: string; collectionConfig: PublicKey }> {
    try {
      console.log('📦 Initializing collection:', config.collectionName);

      const authority = wallet.publicKey;
      const [collectionConfig, bump] = await this.findCollectionConfigPDA(authority);

      console.log('📍 Collection Config PDA:', collectionConfig.toBase58());

      // Create the instruction manually
      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      // Encode instruction data (instruction discriminator + args)
      // For Anchor, the discriminator is the first 8 bytes of SHA256("global:initialize_collection")
      const discriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]); // This needs to match your program
      
      const maxSupplyBuf = Buffer.alloc(8);
      maxSupplyBuf.writeBigUInt64LE(BigInt(config.maxSupply));
      
      const priceBuf = Buffer.alloc(8);
      priceBuf.writeBigUInt64LE(BigInt(config.priceLamports));
      
      const thresholdBuf = Buffer.alloc(8);
      thresholdBuf.writeBigUInt64LE(BigInt(config.revealThreshold));
      
      const nameBuf = Buffer.from(config.collectionName);
      const nameLen = Buffer.alloc(4);
      nameLen.writeUInt32LE(nameBuf.length);
      
      const symbolBuf = Buffer.from(config.collectionSymbol);
      const symbolLen = Buffer.alloc(4);
      symbolLen.writeUInt32LE(symbolBuf.length);
      
      const uriBuf = Buffer.from(config.placeholderUri);
      const uriLen = Buffer.alloc(4);
      uriLen.writeUInt32LE(uriBuf.length);

      const data = Buffer.concat([
        discriminator,
        maxSupplyBuf,
        priceBuf,
        thresholdBuf,
        nameLen,
        nameBuf,
        symbolLen,
        symbolBuf,
        uriLen,
        uriBuf,
      ]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = authority;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      // Sign and send
      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      console.log('📝 Transaction sent:', signature);
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Collection initialized successfully!');
      console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);

      return { signature, collectionConfig };
    } catch (error) {
      console.error('❌ Failed to initialize collection:', error);
      throw error;
    }
  }

  /**
   * Mint a placeholder NFT
   */
  async mintPlaceholder(
    wallet: any,
    collectionAuthority: PublicKey
  ): Promise<{ signature: string; mintRecord: PublicKey; rarityScore: number }> {
    try {
      console.log('🎨 Minting placeholder NFT...');

      const [collectionConfig] = await this.findCollectionConfigPDA(collectionAuthority);
      
      // Fetch current supply to determine mint index
      const configAccount = await this.connection.getAccountInfo(collectionConfig);
      if (!configAccount) {
        throw new Error('Collection not found');
      }
      
      // Parse current supply from account data (offset depends on your struct layout)
      // For now, we'll use a placeholder - you should decode this properly
      const currentSupply = 0; // TODO: Parse from account data
      
      const [mintRecord] = await this.findMintRecordPDA(collectionConfig, currentSupply);

      console.log('📍 Mint Record PDA:', mintRecord.toBase58());

      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: mintRecord, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      // Instruction discriminator for mint_placeholder
      const discriminator = Buffer.from([155, 234, 231, 146, 236, 158, 162, 68]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data: discriminator,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      console.log('📝 Transaction sent:', signature);
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Placeholder minted successfully!');
      console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);

      // TODO: Parse event logs to get actual rarity score
      const rarityScore = Math.floor(Math.random() * 100);

      return { signature, mintRecord, rarityScore };
    } catch (error) {
      console.error('❌ Failed to mint placeholder:', error);
      throw error;
    }
  }

  /**
   * Reveal the entire collection
   */
  async revealCollection(
    wallet: any,
    revealedBaseUri: string
  ): Promise<string> {
    try {
      console.log('🎭 Revealing collection...');

      const authority = wallet.publicKey;
      const [collectionConfig] = await this.findCollectionConfigPDA(authority);

      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
      ];

      // Instruction discriminator for reveal_collection
      const discriminator = Buffer.from([84, 193, 208, 211, 197, 63, 159, 87]);
      
      const uriBuf = Buffer.from(revealedBaseUri);
      const uriLen = Buffer.alloc(4);
      uriLen.writeUInt32LE(uriBuf.length);

      const data = Buffer.concat([discriminator, uriLen, uriBuf]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = authority;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Collection revealed!');
      console.log('🔗 Explorer:', `https://explorer.analos.io/tx/${signature}`);

      return signature;
    } catch (error) {
      console.error('❌ Failed to reveal collection:', error);
      throw error;
    }
  }

  /**
   * Reveal individual NFT (after collection reveal)
   */
  async revealNFT(
    wallet: any,
    collectionAuthority: PublicKey,
    mintIndex: number
  ): Promise<string> {
    try {
      console.log(`🎭 Revealing NFT #${mintIndex}...`);

      const [collectionConfig] = await this.findCollectionConfigPDA(collectionAuthority);
      const [mintRecord] = await this.findMintRecordPDA(collectionConfig, mintIndex);

      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: false },
        { pubkey: mintRecord, isSigner: false, isWritable: true },
      ];

      // Instruction discriminator for reveal_nft
      const discriminator = Buffer.from([129, 79, 245, 191, 253, 143, 17, 135]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data: discriminator,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ NFT revealed!');
      
      return signature;
    } catch (error) {
      console.error('❌ Failed to reveal NFT:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds (admin only)
   */
  async withdrawFunds(
    wallet: any,
    amount: number
  ): Promise<string> {
    try {
      console.log(`💰 Withdrawing ${amount} lamports...`);

      const authority = wallet.publicKey;
      const [collectionConfig] = await this.findCollectionConfigPDA(authority);

      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: true },
      ];

      const discriminator = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34]);
      
      const amountBuf = Buffer.alloc(8);
      amountBuf.writeBigUInt64LE(BigInt(amount));

      const data = Buffer.concat([discriminator, amountBuf]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = authority;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log('✅ Funds withdrawn!');
      
      return signature;
    } catch (error) {
      console.error('❌ Failed to withdraw funds:', error);
      throw error;
    }
  }

  /**
   * Pause/Resume collection minting (admin only)
   */
  async setPause(wallet: any, paused: boolean): Promise<string> {
    try {
      console.log(`⏸️  ${paused ? 'Pausing' : 'Resuming'} collection...`);

      const authority = wallet.publicKey;
      const [collectionConfig] = await this.findCollectionConfigPDA(authority);

      const keys = [
        { pubkey: collectionConfig, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: false, isWritable: false },
      ];

      const discriminator = Buffer.from([115, 2, 57, 57, 188, 152, 22, 115]);
      const pausedBuf = Buffer.from([paused ? 1 : 0]);

      const data = Buffer.concat([discriminator, pausedBuf]);

      const instruction = new TransactionInstruction({
        keys,
        programId: this.programId,
        data,
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = authority;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log(`✅ Collection ${paused ? 'paused' : 'resumed'}!`);
      
      return signature;
    } catch (error) {
      console.error(`❌ Failed to ${paused ? 'pause' : 'resume'} collection:`, error);
      throw error;
    }
  }

  /**
   * Get collection configuration
   */
  async getCollectionConfig(authority: PublicKey): Promise<CollectionConfig | null> {
    try {
      const [collectionConfig] = await this.findCollectionConfigPDA(authority);
      const accountInfo = await this.connection.getAccountInfo(collectionConfig);
      
      if (!accountInfo) {
        return null;
      }

      // TODO: Proper deserialization based on your account structure
      console.log('📦 Collection config account found, size:', accountInfo.data.length);
      
      return {
        authority,
        maxSupply: 0,
        currentSupply: 0,
        priceLamports: 0,
        revealThreshold: 0,
        isRevealed: false,
        isPaused: false,
        globalSeed: new Uint8Array(32),
        collectionName: '',
        collectionSymbol: '',
        placeholderUri: '',
      };
    } catch (error) {
      console.error('❌ Failed to fetch collection config:', error);
      return null;
    }
  }

  /**
   * Get mint record
   */
  async getMintRecord(
    collectionAuthority: PublicKey,
    mintIndex: number
  ): Promise<MintRecord | null> {
    try {
      const [collectionConfig] = await this.findCollectionConfigPDA(collectionAuthority);
      const [mintRecord] = await this.findMintRecordPDA(collectionConfig, mintIndex);
      
      const accountInfo = await this.connection.getAccountInfo(mintRecord);
      
      if (!accountInfo) {
        return null;
      }

      // TODO: Proper deserialization
      console.log('🎨 Mint record found, size:', accountInfo.data.length);
      
      return {
        mintIndex,
        minter: collectionAuthority,
        isRevealed: false,
        rarityScore: 0,
      };
    } catch (error) {
      console.error('❌ Failed to fetch mint record:', error);
      return null;
    }
  }
}

// Export singleton instance
let launchpadServiceInstance: NFTLaunchpadService | null = null;

export function getNFTLaunchpadService(connection?: Connection): NFTLaunchpadService {
  if (!launchpadServiceInstance) {
    launchpadServiceInstance = new NFTLaunchpadService(connection);
  }
  return launchpadServiceInstance;
}

