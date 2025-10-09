import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction, Keypair } from '@solana/web3.js';
import { 
  createMint, 
  createInitializeMintInstruction, 
  createMintToInstruction, 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';

export interface WhitelistPhase {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  price: number; // SOL
  maxMintsPerWallet: number;
  whitelistAddresses: string[];
  isActive: boolean;
}

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  maxSupply: number;
  mintPrice: number;
  whitelistPhases: WhitelistPhase[];
  bondingCurveEnabled: boolean;
  bondingCurveConfig?: {
    initialPrice: number;
    priceIncrease: number;
    reserveRatio: number;
    milestoneReveals: number[];
  };
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
    telegram?: string;
  };
  creatorFee: number; // Percentage
  marketplaceFee: number; // Percentage
  revealDelay: number; // Hours
  escrowWallet?: string;
}

export interface EnhancedNFTCreationData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: Array<{ trait_type: string; value: string }>;
  creators: Array<{ address: string; verified: boolean; share: number }>;
  sellerFeeBasisPoints: number;
  collection: {
    name: string;
    family: string;
    mintAddress?: string;
  };
  masterEdition?: {
    editionType: 'Master' | 'Limited';
    maxSupply?: number;
  };
  whitelistPhase?: WhitelistPhase;
  bondingCurveInfo?: {
    currentPrice: number;
    totalMinted: number;
    milestoneProgress: number;
  };
}

export interface EnhancedNFTCreationResult {
  success: boolean;
  mintAddress?: string;
  tokenAccount?: string;
  metadataAddress?: string;
  masterEditionAddress?: string;
  collectionDataAddress?: string;
  whitelistDataAddress?: string;
  bondingCurveDataAddress?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  metadata?: any;
  error?: string;
}

/**
 * Enhanced NFT Minting Service with Whitelist, Bonding Curves, and On-Chain Data Storage
 */
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2';

export class EnhancedNFTMintingService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create an enhanced NFT with full collection data stored on-chain
   */
  async createEnhancedNFT(
    nftData: EnhancedNFTCreationData,
    collectionConfig: CollectionConfig,
    ownerPublicKey: PublicKey,
    currentWhitelistPhase?: WhitelistPhase
  ): Promise<EnhancedNFTCreationResult> {
    try {
      console.log('🎨 Creating Enhanced NFT with full collection data...');
      console.log('📋 NFT Data:', nftData);
      console.log('⚙️ Collection Config:', collectionConfig);

      // Step 1: Upload metadata to IPFS (simulated for now)
      const ipfsResult = await this.uploadMetadataToIPFS(nftData);
      if (!ipfsResult.success) {
        throw new Error(`Failed to upload metadata: ${ipfsResult.error}`);
      }

      // Step 2: Generate mint keypair
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;
      console.log('🔨 Creating mint account...');

      // Step 3: Get minimum balance for rent exemption
      const lamports = await this.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      // Step 4: Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        ownerPublicKey
      );

      // Step 5: Create main transaction
      const transaction = new Transaction();

      // Core NFT instructions
      transaction.add(
        // Create mint account
        SystemProgram.createAccount({
          fromPubkey: ownerPublicKey,
          newAccountPubkey: mintAddress,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        // Initialize mint
        createInitializeMintInstruction(
          mintAddress,
          0, // Decimals (NFTs are non-divisible)
          ownerPublicKey, // Mint authority
          ownerPublicKey, // Freeze authority
          TOKEN_PROGRAM_ID
        ),
        // Create associated token account
        createAssociatedTokenAccountInstruction(
          ownerPublicKey,
          associatedTokenAccount,
          ownerPublicKey,
          mintAddress,
          TOKEN_PROGRAM_ID
        ),
        // Mint NFT to account
        createMintToInstruction(
          mintAddress,
          associatedTokenAccount,
          ownerPublicKey,
          1, // Amount (1 for NFT)
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Step 6: Add Master Edition if requested
      let masterEditionAddress = PublicKey.default;
      let masterEditionKeypair: Keypair | null = null;

      if (nftData.masterEdition) {
        console.log('🏆 Adding Master Edition support...');
        const masterEditionResult = this.createMasterEditionInstructions(
          mintAddress,
          ownerPublicKey,
          nftData.masterEdition
        );
        
        if (masterEditionResult) {
          masterEditionKeypair = masterEditionResult.keypair;
          masterEditionAddress = masterEditionResult.masterEditionAddress;
          transaction.add(...masterEditionResult.instructions);
        }
      }

      // Step 7: Add on-chain metadata
      console.log('📝 Adding on-chain metadata...');
      const metadataInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(JSON.stringify({
          ...nftData,
          image: ipfsResult.url,
          network: 'analos',
          version: '2.0.0'
        }), 'utf8')
      });
      transaction.add(metadataInstruction);

      // Step 8: Add collection data on-chain
      console.log('📊 Adding collection data on-chain...');
      const collectionDataInstruction = this.createCollectionDataInstruction(
        collectionConfig,
        mintAddress,
        ownerPublicKey
      );
      transaction.add(collectionDataInstruction);

      // Step 9: Add whitelist data if applicable
      if (currentWhitelistPhase) {
        console.log('👥 Adding whitelist data on-chain...');
        const whitelistInstruction = this.createWhitelistDataInstruction(
          currentWhitelistPhase,
          mintAddress,
          ownerPublicKey
        );
        transaction.add(whitelistInstruction);
      }

      // Step 10: Add bonding curve data if enabled
      if (collectionConfig.bondingCurveEnabled && collectionConfig.bondingCurveConfig) {
        console.log('📈 Adding bonding curve data on-chain...');
        const bondingCurveInstruction = this.createBondingCurveDataInstruction(
          collectionConfig.bondingCurveConfig,
          mintAddress,
          ownerPublicKey,
          nftData.bondingCurveInfo
        );
        transaction.add(bondingCurveInstruction);
      }

      // Step 11: Sign transaction with required keypairs
      if (!transaction.signers) {
        transaction.signers = [];
      }

      // Sign with mint keypair
      transaction.sign(mintKeypair);
      console.log('🔧 Signed transaction with mint keypair');

      // Sign with master edition keypair if applicable
      if (masterEditionKeypair) {
        transaction.sign(masterEditionKeypair);
        console.log('🔧 Signed transaction with master edition keypair');
      }

      // Step 12: Set recent blockhash and fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPublicKey;

      console.log('📊 Total instructions:', transaction.instructions.length);
      console.log('🔐 Transaction ready for wallet signing...');

      return {
        success: true,
        mintAddress: mintAddress.toBase58(),
        tokenAccount: associatedTokenAccount.toBase58(),
        metadataAddress: `memo_${Date.now()}`,
        masterEditionAddress: masterEditionAddress.toBase58(),
        collectionDataAddress: `collection_${mintAddress.toBase58()}`,
        whitelistDataAddress: currentWhitelistPhase ? `whitelist_${mintAddress.toBase58()}` : undefined,
        bondingCurveDataAddress: collectionConfig.bondingCurveEnabled ? `bonding_${mintAddress.toBase58()}` : undefined,
        metadata: {
          ...nftData,
          image: ipfsResult.url,
          network: 'analos'
        }
      };

    } catch (error) {
      console.error('❌ Enhanced NFT creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Master Edition instructions
   */
  private createMasterEditionInstructions(
    mintAddress: PublicKey,
    ownerPublicKey: PublicKey,
    masterEdition: any
  ): { keypair: Keypair; masterEditionAddress: PublicKey; instructions: TransactionInstruction[] } | null {
    try {
      const masterEditionKeypair = Keypair.generate();
      const masterEditionAddress = masterEditionKeypair.publicKey;

      const lamports = 256; // Space for edition data

      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: masterEditionAddress,
        space: lamports,
        lamports: await this.connection.getMinimumBalanceForRentExemption(lamports),
        programId: SystemProgram.programId,
      });

      const editionDataInstruction = new TransactionInstruction({
        keys: [],
        programId: SystemProgram.programId,
        data: Buffer.from(JSON.stringify({
          mintAddress: mintAddress.toBase58(),
          masterEditionAddress: masterEditionAddress.toBase58(),
          maxSupply: masterEdition.maxSupply,
          editionType: masterEdition.editionType,
          network: 'analos',
          createdAt: Date.now()
        }), 'utf8')
      });

      return {
        keypair: masterEditionKeypair,
        masterEditionAddress,
        instructions: [createAccountInstruction, editionDataInstruction]
      };
    } catch (error) {
      console.error('❌ Master Edition creation failed:', error);
      return null;
    }
  }

  /**
   * Create collection data instruction
   */
  private createCollectionDataInstruction(
    collectionConfig: CollectionConfig,
    mintAddress: PublicKey,
    ownerPublicKey: PublicKey
  ): TransactionInstruction {
    const collectionData = {
      name: collectionConfig.name,
      symbol: collectionConfig.symbol,
      description: collectionConfig.description,
      maxSupply: collectionConfig.maxSupply,
      mintPrice: collectionConfig.mintPrice,
      creatorFee: collectionConfig.creatorFee,
      marketplaceFee: collectionConfig.marketplaceFee,
      revealDelay: collectionConfig.revealDelay,
      socialLinks: collectionConfig.socialLinks,
      bondingCurveEnabled: collectionConfig.bondingCurveEnabled,
      bondingCurveConfig: collectionConfig.bondingCurveConfig,
      escrowWallet: collectionConfig.escrowWallet,
      mintAddress: mintAddress.toBase58(),
      network: 'analos',
      version: '2.0.0',
      createdAt: Date.now()
    };

    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey(this.MEMO_PROGRAM_ID),
      data: Buffer.from(JSON.stringify(collectionData), 'utf8')
    });
  }

  /**
   * Create whitelist data instruction
   */
  private createWhitelistDataInstruction(
    whitelistPhase: WhitelistPhase,
    mintAddress: PublicKey,
    ownerPublicKey: PublicKey
  ): TransactionInstruction {
    const whitelistData = {
      phaseId: whitelistPhase.id,
      phaseName: whitelistPhase.name,
      startTime: whitelistPhase.startTime,
      endTime: whitelistPhase.endTime,
      price: whitelistPhase.price,
      maxMintsPerWallet: whitelistPhase.maxMintsPerWallet,
      whitelistAddresses: whitelistPhase.whitelistAddresses,
      isActive: whitelistPhase.isActive,
      mintAddress: mintAddress.toBase58(),
      network: 'analos',
      createdAt: Date.now()
    };

    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey(this.MEMO_PROGRAM_ID),
      data: Buffer.from(JSON.stringify(whitelistData), 'utf8')
    });
  }

  /**
   * Create bonding curve data instruction
   */
  private createBondingCurveDataInstruction(
    bondingCurveConfig: any,
    mintAddress: PublicKey,
    ownerPublicKey: PublicKey,
    currentInfo?: any
  ): TransactionInstruction {
    const bondingCurveData = {
      initialPrice: bondingCurveConfig.initialPrice,
      priceIncrease: bondingCurveConfig.priceIncrease,
      reserveRatio: bondingCurveConfig.reserveRatio,
      milestoneReveals: bondingCurveConfig.milestoneReveals,
      currentPrice: currentInfo?.currentPrice || bondingCurveConfig.initialPrice,
      totalMinted: currentInfo?.totalMinted || 0,
      milestoneProgress: currentInfo?.milestoneProgress || 0,
      mintAddress: mintAddress.toBase58(),
      network: 'analos',
      createdAt: Date.now()
    };

    return new TransactionInstruction({
      keys: [],
      programId: new PublicKey(this.MEMO_PROGRAM_ID),
      data: Buffer.from(JSON.stringify(bondingCurveData), 'utf8')
    });
  }

  /**
   * Upload metadata to IPFS (simulated)
   */
  private async uploadMetadataToIPFS(metadata: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('📤 Uploading metadata to IPFS...');
      
      // Simulate IPFS upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fakeHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${fakeHash}`;
      
      console.log('✅ Metadata uploaded to IPFS:', ipfsUrl);
      
      return {
        success: true,
        url: ipfsUrl
      };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current whitelist phase for minting
   */
  getCurrentWhitelistPhase(collectionConfig: CollectionConfig): WhitelistPhase | undefined {
    const now = Date.now();
    
    for (const phase of collectionConfig.whitelistPhases) {
      if (phase.startTime <= now && phase.endTime >= now && phase.isActive) {
        return phase;
      }
    }
    
    return undefined;
  }

  /**
   * Calculate current bonding curve price
   */
  calculateBondingCurvePrice(
    bondingCurveConfig: any,
    totalMinted: number
  ): number {
    return bondingCurveConfig.initialPrice + (totalMinted * bondingCurveConfig.priceIncrease);
  }

  /**
   * Check if milestone reveal should trigger
   */
  shouldTriggerMilestoneReveal(
    bondingCurveConfig: any,
    totalMinted: number
  ): boolean {
    return bondingCurveConfig.milestoneReveals.some((milestone: number) => 
      totalMinted >= milestone && totalMinted < milestone + 1
    );
  }
}
