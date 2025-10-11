/**
 * Blockchain Deployer Service
 * Integrates with our 4-program system to auto-deploy collections
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { 
  rarityCalculator, 
  NFTWithRarity, 
  RarityDistribution 
} from './enhanced-rarity-calculator';

export interface CollectionSettings {
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
  mintPrice: number;
  creator: {
    name: string;
    wallet: string;
  };
  royalties: number;
  socials?: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
}

export interface DeploymentConfig {
  collectionSettings: CollectionSettings;
  generatedNFTs: NFTWithRarity[];
  baseURI: string;
  rarityDistribution: RarityDistribution;
}

export interface DeploymentResult {
  collectionConfig: PublicKey;
  tokenLaunchConfig: PublicKey;
  rarityConfig: PublicKey;
  priceOracleConfig: PublicKey;
  transactionSignatures: string[];
  deploymentTime: number;
}

export interface DeploymentProgress {
  current: number;
  total: number;
  status: 'initializing' | 'deploying' | 'configuring' | 'completed' | 'error';
  message: string;
  currentStep?: string;
}

export class BlockchainDeployerService {
  private connection: Connection;
  private provider: AnchorProvider;
  private nftLaunchpadProgram: Program;
  private tokenLaunchProgram: Program;
  private rarityOracleProgram: Program;
  private priceOracleProgram: Program;

  // Program IDs (update with actual deployed IDs)
  private readonly PROGRAM_IDS = {
    NFT_LAUNCHPAD: new PublicKey('7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk'),
    TOKEN_LAUNCH: new PublicKey('TokenLaunchProgramID'), // Update with actual ID
    RARITY_ORACLE: new PublicKey('RarityOracleProgramID'), // Update with actual ID
    PRICE_ORACLE: new PublicKey('PriceOracleProgramID'), // Update with actual ID
  };

  constructor(
    connection: Connection,
    provider: AnchorProvider,
    onProgress?: (progress: DeploymentProgress) => void
  ) {
    this.connection = connection;
    this.provider = provider;
    
    // Initialize programs (you'll need to load the actual IDLs)
    this.nftLaunchpadProgram = new Program(
      {} as any, // Replace with actual IDL
      this.PROGRAM_IDS.NFT_LAUNCHPAD,
      provider
    );
    
    this.tokenLaunchProgram = new Program(
      {} as any, // Replace with actual IDL
      this.PROGRAM_IDS.TOKEN_LAUNCH,
      provider
    );
    
    this.rarityOracleProgram = new Program(
      {} as any, // Replace with actual IDL
      this.PROGRAM_IDS.RARITY_ORACLE,
      provider
    );
    
    this.priceOracleProgram = new Program(
      {} as any, // Replace with actual IDL
      this.PROGRAM_IDS.PRICE_ORACLE,
      provider
    );
  }

  /**
   * Complete deployment flow
   */
  async deployCollection(
    config: DeploymentConfig,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<DeploymentResult> {
    const startTime = Date.now();
    const transactionSignatures: string[] = [];

    try {
      this.updateProgress(onProgress, {
        current: 0,
        total: 5,
        status: 'initializing',
        message: 'Initializing deployment...',
        currentStep: 'Setup',
      });

      // Step 1: Initialize NFT Collection
      const collectionConfig = await this.initializeNFTCollection(
        config.collectionSettings,
        config.baseURI,
        onProgress
      );
      transactionSignatures.push('NFT_COLLECTION_INITIALIZED');

      // Step 2: Initialize Token Launch
      const tokenLaunchConfig = await this.initializeTokenLaunch(
        collectionConfig,
        config.collectionSettings,
        onProgress
      );
      transactionSignatures.push('TOKEN_LAUNCH_INITIALIZED');

      // Step 3: Initialize Rarity Oracle
      const rarityConfig = await this.initializeRarityConfig(
        collectionConfig,
        onProgress
      );
      transactionSignatures.push('RARITY_ORACLE_INITIALIZED');

      // Step 4: Configure Rarity Tiers
      await this.configureRarityTiers(
        rarityConfig,
        config.rarityDistribution,
        onProgress
      );
      transactionSignatures.push('RARITY_TIERS_CONFIGURED');

      // Step 5: Link Price Oracle
      const priceOracleConfig = await this.linkPriceOracle(
        collectionConfig,
        onProgress
      );
      transactionSignatures.push('PRICE_ORACLE_LINKED');

      const deploymentTime = Date.now() - startTime;

      this.updateProgress(onProgress, {
        current: 5,
        total: 5,
        status: 'completed',
        message: 'Deployment completed successfully!',
        currentStep: 'Complete',
      });

      return {
        collectionConfig,
        tokenLaunchConfig,
        rarityConfig,
        priceOracleConfig,
        transactionSignatures,
        deploymentTime,
      };

    } catch (error) {
      this.updateProgress(onProgress, {
        current: 0,
        total: 5,
        status: 'error',
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentStep: 'Error',
      });
      throw error;
    }
  }

  /**
   * Initialize NFT Collection
   */
  private async initializeNFTCollection(
    settings: CollectionSettings,
    baseURI: string,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<PublicKey> {
    this.updateProgress(onProgress, {
      current: 1,
      total: 5,
      status: 'deploying',
      message: 'Initializing NFT collection...',
      currentStep: 'NFT Collection',
    });

    // Derive collection config PDA
    const [collectionConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('collection'),
        this.provider.wallet.publicKey.toBuffer(),
      ],
      this.PROGRAM_IDS.NFT_LAUNCHPAD
    );

    try {
      const tx = await this.nftLaunchpadProgram.methods
        .initializeCollection(
          new BN(settings.totalSupply),
          new BN(settings.mintPrice * 1e9), // Convert to lamports
          new BN(Math.floor(settings.totalSupply * 0.5)), // 50% reveal threshold
          settings.name,
          settings.symbol,
          baseURI
        )
        .accounts({
          collectionConfig,
          authority: this.provider.wallet.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log('✅ NFT Collection initialized:', collectionConfig.toString());
      return collectionConfig;

    } catch (error) {
      console.error('❌ Failed to initialize NFT collection:', error);
      throw error;
    }
  }

  /**
   * Initialize Token Launch
   */
  private async initializeTokenLaunch(
    collectionConfig: PublicKey,
    settings: CollectionSettings,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<PublicKey> {
    this.updateProgress(onProgress, {
      current: 2,
      total: 5,
      status: 'deploying',
      message: 'Initializing token launch...',
      currentStep: 'Token Launch',
    });

    // Derive token launch config PDA
    const [tokenLaunchConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('token_launch'),
        collectionConfig.toBuffer(),
      ],
      this.PROGRAM_IDS.TOKEN_LAUNCH
    );

    try {
      const tx = await this.tokenLaunchProgram.methods
        .initializeTokenLaunch(
          new BN(10000), // 10,000 tokens per NFT
          new BN(6900), // 69% to pool
          `${settings.name} Token`,
          settings.symbol,
          new BN(settings.totalSupply * 10000) // Total token supply
        )
        .accounts({
          tokenLaunchConfig,
          nftCollectionConfig: collectionConfig,
          authority: this.provider.wallet.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log('✅ Token Launch initialized:', tokenLaunchConfig.toString());
      return tokenLaunchConfig;

    } catch (error) {
      console.error('❌ Failed to initialize token launch:', error);
      throw error;
    }
  }

  /**
   * Initialize Rarity Oracle
   */
  private async initializeRarityConfig(
    collectionConfig: PublicKey,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<PublicKey> {
    this.updateProgress(onProgress, {
      current: 3,
      total: 5,
      status: 'deploying',
      message: 'Initializing rarity oracle...',
      currentStep: 'Rarity Oracle',
    });

    // Derive rarity config PDA
    const [rarityConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('rarity_config'),
        collectionConfig.toBuffer(),
      ],
      this.PROGRAM_IDS.RARITY_ORACLE
    );

    try {
      const tx = await this.rarityOracleProgram.methods
        .initializeRarityConfig(
          collectionConfig
        )
        .accounts({
          rarityConfig,
          collectionConfig,
          authority: this.provider.wallet.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log('✅ Rarity Oracle initialized:', rarityConfig.toString());
      return rarityConfig;

    } catch (error) {
      console.error('❌ Failed to initialize rarity oracle:', error);
      throw error;
    }
  }

  /**
   * Configure Rarity Tiers
   */
  private async configureRarityTiers(
    rarityConfig: PublicKey,
    distribution: RarityDistribution,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<void> {
    this.updateProgress(onProgress, {
      current: 4,
      total: 5,
      status: 'configuring',
      message: 'Configuring rarity tiers...',
      currentStep: 'Rarity Tiers',
    });

    const tiers = [
      { id: 0, name: 'Common', multiplier: 1, probability: distribution.Common },
      { id: 1, name: 'Uncommon', multiplier: 5, probability: distribution.Uncommon },
      { id: 2, name: 'Rare', multiplier: 10, probability: distribution.Rare },
      { id: 3, name: 'Epic', multiplier: 50, probability: distribution.Epic },
      { id: 4, name: 'Legendary', multiplier: 100, probability: distribution.Legendary },
      { id: 5, name: 'Mythic', multiplier: 1000, probability: distribution.Mythic },
    ];

    try {
      for (const tier of tiers) {
        if (tier.probability > 0) {
          // Derive tier PDA
          const [tierPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('rarity_tier'),
              rarityConfig.toBuffer(),
              new BN(tier.id).toArrayLike(Buffer, 'le', 4),
            ],
            this.PROGRAM_IDS.RARITY_ORACLE
          );

          await this.rarityOracleProgram.methods
            .addRarityTier(
              tier.id,
              tier.name,
              new BN(tier.multiplier),
              new BN(Math.floor((tier.probability / 1000) * 10000)) // Convert to basis points
            )
            .accounts({
              rarityConfig,
              rarityTier: tierPDA,
              authority: this.provider.wallet.publicKey,
              systemProgram: PublicKey.default,
            })
            .rpc();

          console.log(`✅ Added rarity tier: ${tier.name} (${tier.probability} NFTs)`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to configure rarity tiers:', error);
      throw error;
    }
  }

  /**
   * Link Price Oracle
   */
  private async linkPriceOracle(
    collectionConfig: PublicKey,
    onProgress?: (progress: DeploymentProgress) => void
  ): Promise<PublicKey> {
    this.updateProgress(onProgress, {
      current: 5,
      total: 5,
      status: 'configuring',
      message: 'Linking price oracle...',
      currentStep: 'Price Oracle',
    });

    // Derive price oracle config PDA
    const [priceOracleConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('price_oracle'),
        collectionConfig.toBuffer(),
      ],
      this.PROGRAM_IDS.PRICE_ORACLE
    );

    try {
      const tx = await this.priceOracleProgram.methods
        .linkCollectionOracle(
          collectionConfig,
          new BN(100 * 1e6), // $100 target market cap (6 decimals)
          new BN(10000) // 10,000 tokens per NFT
        )
        .accounts({
          priceOracleConfig,
          collectionConfig,
          authority: this.provider.wallet.publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      console.log('✅ Price Oracle linked:', priceOracleConfig.toString());
      return priceOracleConfig;

    } catch (error) {
      console.error('❌ Failed to link price oracle:', error);
      throw error;
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    onProgress: ((progress: DeploymentProgress) => void) | undefined,
    progress: DeploymentProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * Validate deployment configuration
   */
  validateDeploymentConfig(config: DeploymentConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate collection settings
    if (!config.collectionSettings.name) {
      errors.push('Collection name is required');
    }
    if (!config.collectionSettings.symbol) {
      errors.push('Collection symbol is required');
    }
    if (config.collectionSettings.totalSupply <= 0) {
      errors.push('Total supply must be greater than 0');
    }
    if (config.collectionSettings.mintPrice <= 0) {
      errors.push('Mint price must be greater than 0');
    }

    // Validate generated NFTs
    if (config.generatedNFTs.length !== config.collectionSettings.totalSupply) {
      errors.push(`Generated NFT count (${config.generatedNFTs.length}) doesn't match total supply (${config.collectionSettings.totalSupply})`);
    }

    // Validate rarity distribution
    const totalDistribution = Object.values(config.rarityDistribution).reduce((sum, count) => sum + count, 0);
    if (Math.abs(totalDistribution - config.collectionSettings.totalSupply) > 1) {
      warnings.push(`Rarity distribution total (${totalDistribution}) doesn't match total supply (${config.collectionSettings.totalSupply})`);
    }

    // Validate base URI
    if (!config.baseURI || !config.baseURI.startsWith('ipfs://')) {
      errors.push('Base URI must be a valid IPFS URI');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get deployment cost estimate
   */
  async getDeploymentCostEstimate(): Promise<{
    totalCost: number;
    breakdown: {
      nftCollection: number;
      tokenLaunch: number;
      rarityOracle: number;
      priceOracle: number;
    };
  }> {
    // Estimate transaction costs (approximate)
    const nftCollection = 0.01; // ~0.01 SOL
    const tokenLaunch = 0.015; // ~0.015 SOL
    const rarityOracle = 0.01; // ~0.01 SOL
    const priceOracle = 0.005; // ~0.005 SOL

    const totalCost = nftCollection + tokenLaunch + rarityOracle + priceOracle;

    return {
      totalCost,
      breakdown: {
        nftCollection,
        tokenLaunch,
        rarityOracle,
        priceOracle,
      },
    };
  }

  /**
   * Check deployment readiness
   */
  async checkDeploymentReadiness(): Promise<{
    isReady: boolean;
    checks: {
      walletConnected: boolean;
      sufficientBalance: boolean;
      programsDeployed: boolean;
      networkConnected: boolean;
    };
    errors: string[];
  }> {
    const checks = {
      walletConnected: false,
      sufficientBalance: false,
      programsDeployed: false,
      networkConnected: false,
    };
    const errors: string[] = [];

    try {
      // Check wallet connection
      checks.walletConnected = !!this.provider.wallet.publicKey;
      if (!checks.walletConnected) {
        errors.push('Wallet not connected');
      }

      // Check network connection
      const latestBlockhash = await this.connection.getLatestBlockhash();
      checks.networkConnected = !!latestBlockhash;
      if (!checks.networkConnected) {
        errors.push('Network connection failed');
      }

      // Check wallet balance
      if (checks.walletConnected) {
        const balance = await this.connection.getBalance(this.provider.wallet.publicKey);
        const minBalance = 0.1 * 1e9; // 0.1 SOL in lamports
        checks.sufficientBalance = balance >= minBalance;
        if (!checks.sufficientBalance) {
          errors.push('Insufficient wallet balance (need at least 0.1 SOL)');
        }
      }

      // Check if programs are deployed
      try {
        const nftProgramAccount = await this.connection.getAccountInfo(this.PROGRAM_IDS.NFT_LAUNCHPAD);
        checks.programsDeployed = !!nftProgramAccount;
        if (!checks.programsDeployed) {
          errors.push('NFT Launchpad program not deployed');
        }
      } catch (error) {
        checks.programsDeployed = false;
        errors.push('Failed to check program deployment status');
      }

    } catch (error) {
      errors.push(`Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isReady: errors.length === 0,
      checks,
      errors,
    };
  }
}

// Export factory function
export function createBlockchainDeployer(
  connection: Connection,
  provider: AnchorProvider,
  onProgress?: (progress: DeploymentProgress) => void
): BlockchainDeployerService {
  return new BlockchainDeployerService(connection, provider, onProgress);
}
