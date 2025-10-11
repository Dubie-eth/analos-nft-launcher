import { Connection, PublicKey, Keypair, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js';
import { createInitializeMintInstruction, createAssociatedTokenAccountInstruction, createMintToInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

export interface CollectionMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: { trait_type: string; value: string }[];
  properties: {
    files: { uri: string; type: string }[];
    category: string;
    creators?: { address: string; share: number }[];
  };
}

export interface PaymentToken {
  mint: string;
  symbol: string;
  decimals: number;
  pricePerNFT: number;
  minBalanceForWhitelist?: number;
  accepted: boolean;
}

export interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number; // 0 = free, 0.001 = 0.1% of base price, 1 = full price
  maxMintsPerWallet: number;
  description: string;
  requirements: {
    tokenMint?: string;
    minBalance?: number;
    tokenSymbol?: string;
  };
}

export interface WhitelistConfig {
  enabled: boolean;
  addresses: string[];
  phases: WhitelistPhase[];
}

export interface DelayedRevealConfig {
  enabled: boolean;
  type: 'manual' | 'automatic' | 'completion';
  revealTime: string;
  revealAtCompletion: boolean;
  placeholderImage: string;
}

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  collectionMint: string;
  collectionTokenAccount: string;
  creatorAddress: string;
  totalSupply: number;
  currentSupply: number;
  isActive: boolean;
  createdAt: string;
  metadata: CollectionMetadata;
  
  // Admin and whitelist features
  mintingEnabled: boolean;
  isTestMode: boolean;
  mintPrice: number;
  paymentToken: string;
  paymentTokens?: PaymentToken[];
  whitelist?: WhitelistConfig;
  maxMintsPerWallet?: number;
  delayedReveal?: DelayedRevealConfig;
  
  // Bonding curve features
  bondingCurveEnabled?: boolean;
  bondingCurveConfig?: {
    initialPrice: number;
    priceIncrement: number;
    maxPrice: number;
    curveType: 'linear' | 'exponential' | 'logarithmic';
  };
  
  // Metaplex-compatible fields for future integration
  metaplexCollection?: {
    collectionMint: string;
    collectionMetadata: string;
    collectionMasterEdition: string;
  };
}

export interface CreateCollectionResult {
  success: boolean;
  collection?: Collection;
  error?: string;
  signature?: string;
  explorerUrl?: string;
}

export class CollectionService {
  private connection: Connection;
  private collectionsFile: string;
  private collections: Collection[] = [];

  constructor() {
    this.connection = new Connection(
      process.env.ANALOS_RPC_URL || 'https://rpc.analos.io',
      'confirmed'
    );
    this.collectionsFile = path.join(process.cwd(), 'collections.json');
    this.loadCollections();
    console.log('🏗️ Collection Service initialized');
  }

  private loadCollections(): void {
    try {
      if (fs.existsSync(this.collectionsFile)) {
        const data = fs.readFileSync(this.collectionsFile, 'utf8');
        this.collections = JSON.parse(data);
        console.log(`📚 Loaded ${this.collections.length} collections from storage`);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      this.collections = [];
    }
  }

  private saveCollections(): void {
    try {
      fs.writeFileSync(this.collectionsFile, JSON.stringify(this.collections, null, 2));
      console.log(`💾 Saved ${this.collections.length} collections to storage`);
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  }

  /**
   * Create a new collection NFT (the parent collection)
   */
  async createCollection(
    payerKeypair: Keypair,
    creatorAddress: string,
    metadata: CollectionMetadata,
    options?: {
      mintPrice?: number;
      paymentToken?: string;
      paymentTokens?: PaymentToken[];
      whitelist?: WhitelistConfig;
      maxMintsPerWallet?: number;
      delayedReveal?: DelayedRevealConfig;
      bondingCurveEnabled?: boolean;
      bondingCurveConfig?: {
        initialPrice: number;
        priceIncrement: number;
        maxPrice: number;
        curveType: 'linear' | 'exponential' | 'logarithmic';
      };
      isTestMode?: boolean;
    }
  ): Promise<CreateCollectionResult> {
    try {
      console.log('🏗️ Creating collection NFT...');
      console.log('Collection name:', metadata.name);
      console.log('Creator:', creatorAddress);

      // Generate new mint keypair for the collection
      const collectionMintKeypair = Keypair.generate();
      console.log('🪙 Collection Mint Address:', collectionMintKeypair.publicKey.toBase58());

      // Get rent-exempt balance for mint
      const lamports = await getMinimumBalanceForRentExemptMint(this.connection);

      // Get associated token account address for the creator
      const associatedTokenAddress = await getAssociatedTokenAddress(
        collectionMintKeypair.publicKey,
        new PublicKey(creatorAddress)
      );
      console.log('📦 Collection Token Account:', associatedTokenAddress.toBase58());

      // Create transaction
      const transaction = new Transaction();

      // Add priority fee
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 50000,
        })
      );

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        })
      );

      // 1. Create collection mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payerKeypair.publicKey,
          newAccountPubkey: collectionMintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // 2. Initialize collection mint with 0 decimals (makes it an NFT)
      transaction.add(
        createInitializeMintInstruction(
          collectionMintKeypair.publicKey,
          0, // 0 decimals = NFT
          payerKeypair.publicKey, // mint authority
          payerKeypair.publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // 3. Create associated token account for the creator
      transaction.add(
        createAssociatedTokenAccountInstruction(
          payerKeypair.publicKey, // payer
          associatedTokenAddress, // associated token account
          new PublicKey(creatorAddress), // owner
          collectionMintKeypair.publicKey // mint
        )
      );

      // 4. Mint 1 token to the creator (the collection NFT)
      transaction.add(
        createMintToInstruction(
          collectionMintKeypair.publicKey,
          associatedTokenAddress,
          payerKeypair.publicKey,
          1, // amount (1 collection NFT)
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash
      console.log('🔗 Getting recent blockhash...');
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = payerKeypair.publicKey;

      // Send transaction
      console.log('📤 Sending collection creation transaction...');
      const signature = await this.connection.sendTransaction(
        transaction,
        [payerKeypair, collectionMintKeypair],
        {
          skipPreflight: false,
          maxRetries: 3,
        }
      );

      console.log('✅ Collection created successfully!');
      console.log('Signature:', signature);
      console.log('🔗 Explorer URL:', `https://explorer.analos.com/tx/${signature}`);

      // Create collection object with all admin features
      const collection: Collection = {
        id: collectionMintKeypair.publicKey.toBase58(),
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        externalUrl: metadata.externalUrl,
        collectionMint: collectionMintKeypair.publicKey.toBase58(),
        collectionTokenAccount: associatedTokenAddress.toBase58(),
        creatorAddress,
        totalSupply: 0, // Will be set when creating the collection
        currentSupply: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        metadata,
        
        // Admin and whitelist features
        mintingEnabled: true,
        isTestMode: options?.isTestMode || false,
        mintPrice: options?.mintPrice || 0,
        paymentToken: options?.paymentToken || 'SOL',
        paymentTokens: options?.paymentTokens || [],
        whitelist: options?.whitelist,
        maxMintsPerWallet: options?.maxMintsPerWallet,
        delayedReveal: options?.delayedReveal,
        
        // Bonding curve features
        bondingCurveEnabled: options?.bondingCurveEnabled || false,
        bondingCurveConfig: options?.bondingCurveConfig,
        
        // Prepare for Metaplex integration
        metaplexCollection: {
          collectionMint: collectionMintKeypair.publicKey.toBase58(),
          collectionMetadata: '', // Will be set when Metaplex is available
          collectionMasterEdition: '', // Will be set when Metaplex is available
        }
      };

      // Save collection to storage
      this.collections.push(collection);
      this.saveCollections();

      return {
        success: true,
        collection,
        signature,
        explorerUrl: `https://explorer.analos.com/tx/${signature}`
      };

    } catch (error: any) {
      console.error('❌ Error creating collection:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        logs: error.logs
      });
      return {
        success: false,
        error: error.message || error.toString() || 'Failed to create collection',
      };
    }
  }

  /**
   * Get all collections
   */
  getCollections(): Collection[] {
    return this.collections;
  }

  /**
   * Get collection by ID
   */
  getCollectionById(id: string): Collection | undefined {
    return this.collections.find(collection => collection.id === id);
  }

  /**
   * Update collection supply
   */
  updateCollectionSupply(collectionId: string, newCurrentSupply: number): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.currentSupply = newCurrentSupply;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Set collection total supply
   */
  setCollectionTotalSupply(collectionId: string, totalSupply: number): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.totalSupply = totalSupply;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Get collection stats
   */
  getCollectionStats(collectionId: string): { totalSupply: number; currentSupply: number; remaining: number } | null {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      return {
        totalSupply: collection.totalSupply,
        currentSupply: collection.currentSupply,
        remaining: collection.totalSupply - collection.currentSupply
      };
    }
    return null;
  }

  /**
   * Check if collection can mint more NFTs
   */
  canMint(collectionId: string, quantity: number = 1): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection || !collection.isActive) {
      return false;
    }
    return collection.currentSupply + quantity <= collection.totalSupply;
  }

  /**
   * Increment collection supply after minting
   */
  incrementCollectionSupply(collectionId: string, quantity: number = 1): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.currentSupply += quantity;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Update collection whitelist configuration
   */
  updateWhitelistConfig(collectionId: string, whitelistConfig: WhitelistConfig): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.whitelist = whitelistConfig;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Update collection payment configuration
   */
  updatePaymentConfig(collectionId: string, paymentTokens: PaymentToken[], defaultToken: string): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.paymentTokens = paymentTokens;
      collection.paymentToken = defaultToken;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Update collection minting settings
   */
  updateMintingSettings(collectionId: string, settings: {
    mintingEnabled?: boolean;
    mintPrice?: number;
    maxMintsPerWallet?: number;
    isTestMode?: boolean;
  }): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      if (settings.mintingEnabled !== undefined) collection.mintingEnabled = settings.mintingEnabled;
      if (settings.mintPrice !== undefined) collection.mintPrice = settings.mintPrice;
      if (settings.maxMintsPerWallet !== undefined) collection.maxMintsPerWallet = settings.maxMintsPerWallet;
      if (settings.isTestMode !== undefined) collection.isTestMode = settings.isTestMode;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Update delayed reveal configuration
   */
  updateDelayedRevealConfig(collectionId: string, delayedRevealConfig: DelayedRevealConfig): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.delayedReveal = delayedRevealConfig;
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Update bonding curve configuration
   */
  updateBondingCurveConfig(collectionId: string, bondingCurveConfig: {
    enabled: boolean;
    initialPrice: number;
    priceIncrement: number;
    maxPrice: number;
    curveType: 'linear' | 'exponential' | 'logarithmic';
  }): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.bondingCurveEnabled = bondingCurveConfig.enabled;
      collection.bondingCurveConfig = {
        initialPrice: bondingCurveConfig.initialPrice,
        priceIncrement: bondingCurveConfig.priceIncrement,
        maxPrice: bondingCurveConfig.maxPrice,
        curveType: bondingCurveConfig.curveType
      };
      this.saveCollections();
      return true;
    }
    return false;
  }

  /**
   * Check if wallet is whitelisted for collection
   */
  isWalletWhitelisted(collectionId: string, walletAddress: string): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection || !collection.whitelist?.enabled) {
      return true; // No whitelist = everyone allowed
    }

    // Check if wallet is in whitelist addresses
    if (collection.whitelist.addresses.includes(walletAddress)) {
      return true;
    }

    // Check if wallet meets token requirements for any active phase
    const now = new Date();
    for (const phase of collection.whitelist.phases) {
      if (phase.enabled) {
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        
        if (now >= startDate && now <= endDate) {
          // Phase is active - check token requirements
          if (phase.requirements.tokenMint && phase.requirements.minBalance) {
            // This would need to be implemented with actual token balance checking
            // For now, we'll assume token holders are whitelisted
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get active whitelist phase for collection
   */
  getActiveWhitelistPhase(collectionId: string): WhitelistPhase | null {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection || !collection.whitelist?.enabled) {
      return null;
    }

    const now = new Date();
    for (const phase of collection.whitelist.phases) {
      if (phase.enabled) {
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        
        if (now >= startDate && now <= endDate) {
          return phase;
        }
      }
    }

    return null;
  }

  /**
   * Calculate mint price based on whitelist phase and bonding curve
   */
  calculateMintPrice(collectionId: string, walletAddress: string): number {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) {
      return 0;
    }

    let basePrice = collection.mintPrice;

    // Apply whitelist phase multiplier
    const activePhase = this.getActiveWhitelistPhase(collectionId);
    if (activePhase && this.isWalletWhitelisted(collectionId, walletAddress)) {
      basePrice *= activePhase.priceMultiplier;
    }

    // Apply bonding curve pricing
    if (collection.bondingCurveEnabled && collection.bondingCurveConfig) {
      const curveConfig = collection.bondingCurveConfig;
      const currentSupply = collection.currentSupply;
      
      switch (curveConfig.curveType) {
        case 'linear':
          basePrice = Math.min(
            curveConfig.initialPrice + (currentSupply * curveConfig.priceIncrement),
            curveConfig.maxPrice
          );
          break;
        case 'exponential':
          basePrice = Math.min(
            curveConfig.initialPrice * Math.pow(1 + curveConfig.priceIncrement, currentSupply),
            curveConfig.maxPrice
          );
          break;
        case 'logarithmic':
          basePrice = Math.min(
            curveConfig.initialPrice + (curveConfig.priceIncrement * Math.log(currentSupply + 1)),
            curveConfig.maxPrice
          );
          break;
      }
    }

    return basePrice;
  }
}

export const collectionService = new CollectionService();
