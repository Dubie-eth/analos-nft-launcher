import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  AnalosNftLauncherProgram,
  IDL as AnalosNftLauncherProgramIDL 
} from './idl/analos_nft_launcher_program';

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  externalUrl: string;
  maxSupply: number;
  mintPrice: anchor.BN;
  feePercentage: number;
  feeRecipient: PublicKey;
  creator: PublicKey;
  deployedAt: anchor.BN;
  platform: string;
  version: string;
}

export interface WhitelistPhase {
  name: string;
  startTime: anchor.BN;
  endTime: anchor.BN;
  maxMintsPerWallet: number;
  price: anchor.BN;
  addresses: PublicKey[];
  phaseType: number; // 0 = public, 1 = whitelist, 2 = token_holder
  tokenRequirements: TokenRequirement[];
}

export interface TokenRequirement {
  tokenMint: PublicKey;
  minBalance: anchor.BN;
}

export interface PaymentToken {
  tokenMint: PublicKey;
  symbol: string;
  decimals: number;
  priceMultiplier: anchor.BN;
  minBalanceForWhitelist: anchor.BN;
  isEnabled: boolean;
}

export interface DelayedReveal {
  enabled: boolean;
  revealType: number; // 0 = instant, 1 = time_based, 2 = completion_based
  revealTime: anchor.BN;
  revealAtCompletion: boolean;
  placeholderImage: string;
}

export class AnalosNftLauncherClient {
  private program: Program<AnalosNftLauncherProgram>;
  private provider: anchor.AnchorProvider;

  constructor(provider: anchor.AnchorProvider, programId?: PublicKey) {
    this.provider = provider;
    this.program = new Program<AnalosNftLauncherProgram>(
      AnalosNftLauncherProgramIDL,
      programId || new PublicKey("J98xDbcPVV7HbjL5Lz1vdM2ySn9QT1FE2njGeuAxWjmY"),
      provider
    );
  }

  /**
   * Create a new NFT collection configuration
   */
  async createCollection(
    collectionConfig: CollectionConfig,
    whitelistPhases: WhitelistPhase[] = [],
    paymentTokens: PaymentToken[] = [],
    delayedReveal: DelayedReveal = {
      enabled: false,
      revealType: 0,
      revealTime: new anchor.BN(0),
      revealAtCompletion: false,
      placeholderImage: ""
    },
    maxMintsPerWallet: number = 10
  ): Promise<string> {
    try {
      const creator = this.provider.wallet.publicKey;
      const [collectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .createCollection(
          collectionConfig,
          whitelistPhases,
          paymentTokens,
          delayedReveal,
          maxMintsPerWallet
        )
        .accounts({
          creator,
          collectionAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Collection created successfully:", tx);
      return tx;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }

  /**
   * Deploy the collection to the blockchain
   */
  async deployCollection(): Promise<string> {
    try {
      const creator = this.provider.wallet.publicKey;
      const [collectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .deployCollection()
        .accounts({
          creator,
          collectionAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Collection deployed successfully:", tx);
      return tx;
    } catch (error) {
      console.error("Error deploying collection:", error);
      throw error;
    }
  }

  /**
   * Update collection configuration
   */
  async updateCollection(
    collectionConfig?: CollectionConfig,
    whitelistPhases?: WhitelistPhase[],
    paymentTokens?: PaymentToken[],
    delayedReveal?: DelayedReveal,
    maxMintsPerWallet?: number
  ): Promise<string> {
    try {
      const creator = this.provider.wallet.publicKey;
      const [collectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        this.program.programId
      );

      const tx = await this.program.methods
        .updateCollection(
          collectionConfig || null,
          whitelistPhases || null,
          paymentTokens || null,
          delayedReveal || null,
          maxMintsPerWallet || null
        )
        .accounts({
          creator,
          collectionAccount,
        })
        .rpc();

      console.log("Collection updated successfully:", tx);
      return tx;
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  }

  /**
   * Get collection data from the blockchain
   */
  async getCollection(): Promise<any> {
    try {
      const creator = this.provider.wallet.publicKey;
      const [collectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        this.program.programId
      );

      const collectionData = await this.program.account.collectionAccount.fetch(collectionAccount);
      return collectionData;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw error;
    }
  }

  /**
   * Check if collection exists
   */
  async collectionExists(): Promise<boolean> {
    try {
      const creator = this.provider.wallet.publicKey;
      const [collectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), creator.toBuffer()],
        this.program.programId
      );

      await this.program.account.collectionAccount.fetch(collectionAccount);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get collection account address
   */
  getCollectionAccountAddress(): PublicKey {
    const creator = this.provider.wallet.publicKey;
    const [collectionAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), creator.toBuffer()],
      this.program.programId
    );
    return collectionAccount;
  }
}

export default AnalosNftLauncherClient;
