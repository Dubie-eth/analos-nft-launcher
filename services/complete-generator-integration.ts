/**
 * Complete Generator Integration Service
 * Integrates LosLauncher generator with our 4-program system
 */

import { Connection, PublicKey, AnchorProvider } from '@solana/web3.js';
import { rarityCalculator, EnhancedTrait, NFTWithRarity, RarityDistribution } from './enhanced-rarity-calculator';
import { ipfsService, CollectionUploadResult } from './ipfs-integration';
import { createBlockchainDeployer, DeploymentConfig, DeploymentResult } from './blockchain-deployer';
import { createPaymentService, PaymentResult } from './payment-service';

export interface GeneratorConfig {
  // From LosLauncher
  layers: any[];
  collectionSettings: {
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
  };
  revealType: 'instant' | 'delayed';
  revealDelay?: number;
}

export interface GenerationResult {
  success: boolean;
  generatedNFTs: NFTWithRarity[];
  rarityDistribution: RarityDistribution;
  ipfsResult?: CollectionUploadResult;
  deploymentResult?: DeploymentResult;
  paymentResult?: PaymentResult;
  totalTime: number;
  error?: string;
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: 'preparing' | 'generating' | 'uploading' | 'deploying' | 'completed' | 'error';
  message: string;
  currentStep?: string;
  details?: any;
}

export class CompleteGeneratorIntegration {
  private connection: Connection;
  private provider: AnchorProvider;
  private blockchainDeployer: any;
  private paymentService: any;

  constructor(connection: Connection, provider: AnchorProvider) {
    this.connection = connection;
    this.provider = provider;
    this.blockchainDeployer = createBlockchainDeployer(connection, provider);
    this.paymentService = createPaymentService(connection, provider);
  }

  /**
   * Complete generation and deployment flow
   */
  async generateAndDeployCollection(
    config: GeneratorConfig,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let generatedNFTs: NFTWithRarity[] = [];
    let rarityDistribution: RarityDistribution;
    let ipfsResult: CollectionUploadResult | undefined;
    let deploymentResult: DeploymentResult | undefined;
    let paymentResult: PaymentResult | undefined;

    try {
      // Step 1: Prepare and validate
      this.updateProgress(onProgress, {
        current: 0,
        total: 6,
        status: 'preparing',
        message: 'Preparing generation...',
        currentStep: 'Validation',
      });

      const validation = this.validateGeneratorConfig(config);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 2: Process payment
      this.updateProgress(onProgress, {
        current: 1,
        total: 6,
        status: 'preparing',
        message: 'Processing payment...',
        currentStep: 'Payment',
      });

      paymentResult = await this.paymentService.processGeneratorFee(
        config.collectionSettings.totalSupply,
        (paymentProgress) => {
          this.updateProgress(onProgress, {
            current: 1,
            total: 6,
            status: 'preparing',
            message: paymentProgress.message,
            currentStep: 'Payment',
            details: paymentProgress,
          });
        }
      );

      if (!paymentResult.success) {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }

      // Step 3: Generate NFTs
      this.updateProgress(onProgress, {
        current: 2,
        total: 6,
        status: 'generating',
        message: 'Generating NFT collection...',
        currentStep: 'Generation',
      });

      const generationResult = await this.generateNFTCollection(config, onProgress);
      generatedNFTs = generationResult.nfts;
      rarityDistribution = generationResult.rarityDistribution;

      // Step 4: Upload to IPFS
      this.updateProgress(onProgress, {
        current: 4,
        total: 6,
        status: 'uploading',
        message: 'Uploading to IPFS...',
        currentStep: 'IPFS Upload',
      });

      ipfsResult = await this.uploadCollectionToIPFS(generatedNFTs, config, onProgress);

      // Step 5: Deploy to blockchain
      this.updateProgress(onProgress, {
        current: 5,
        total: 6,
        status: 'deploying',
        message: 'Deploying to blockchain...',
        currentStep: 'Blockchain Deployment',
      });

      const deploymentConfig: DeploymentConfig = {
        collectionSettings: config.collectionSettings,
        generatedNFTs,
        baseURI: ipfsResult.baseURI,
        rarityDistribution,
      };

      deploymentResult = await this.blockchainDeployer.deployCollection(
        deploymentConfig,
        (deploymentProgress) => {
          this.updateProgress(onProgress, {
            current: 5,
            total: 6,
            status: 'deploying',
            message: deploymentProgress.message,
            currentStep: 'Blockchain Deployment',
            details: deploymentProgress,
          });
        }
      );

      // Step 6: Complete
      this.updateProgress(onProgress, {
        current: 6,
        total: 6,
        status: 'completed',
        message: 'Collection deployed successfully!',
        currentStep: 'Complete',
      });

      const totalTime = Date.now() - startTime;

      return {
        success: true,
        generatedNFTs,
        rarityDistribution,
        ipfsResult,
        deploymentResult,
        paymentResult,
        totalTime,
      };

    } catch (error) {
      this.updateProgress(onProgress, {
        current: 0,
        total: 6,
        status: 'error',
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentStep: 'Error',
      });

      return {
        success: false,
        generatedNFTs,
        rarityDistribution: rarityDistribution!,
        ipfsResult,
        deploymentResult,
        paymentResult,
        totalTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate NFT collection with enhanced rarity
   */
  private async generateNFTCollection(
    config: GeneratorConfig,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<{
    nfts: NFTWithRarity[];
    rarityDistribution: RarityDistribution;
  }> {
    const nfts: NFTWithRarity[] = [];
    const totalSupply = config.collectionSettings.totalSupply;

    // Enhance traits with rarity tiers
    const enhancedLayers = config.layers.map(layer => ({
      ...layer,
      traits: rarityCalculator.enhanceTraitsWithTiers(layer.traits || []),
    }));

    // Generate NFTs
    for (let i = 0; i < totalSupply; i++) {
      if (i % 10 === 0) {
        this.updateProgress(onProgress, {
          current: 2 + (i / totalSupply) * 2, // Steps 2-4
          total: 6,
          status: 'generating',
          message: `Generating NFT ${i + 1}/${totalSupply}...`,
          currentStep: 'Generation',
          details: { current: i + 1, total: totalSupply },
        });
      }

      // Select traits for this NFT
      const selectedTraits = this.selectTraitsForNFT(enhancedLayers);
      
      // Calculate rarity
      const rarity = rarityCalculator.calculateNFTRarity(selectedTraits);
      
      // Generate composite image (placeholder for now)
      const image = await this.generateCompositeImage(selectedTraits, i);
      
      // Generate metadata
      const metadata = rarityCalculator.generateRarityMetadata(
        {
          tokenId: i,
          traits: selectedTraits,
          rarity,
          image,
          metadata: {},
        },
        config.collectionSettings
      );

      nfts.push({
        tokenId: i,
        traits: selectedTraits,
        rarity,
        image,
        metadata,
      });
    }

    // Calculate rarity distribution
    const rarityDistribution = this.calculateActualRarityDistribution(nfts);

    return { nfts, rarityDistribution };
  }

  /**
   * Select traits for a single NFT
   */
  private selectTraitsForNFT(layers: any[]): EnhancedTrait[] {
    const selectedTraits: EnhancedTrait[] = [];

    for (const layer of layers) {
      if (!layer.visible || !layer.traits || layer.traits.length === 0) continue;

      // Weighted random selection
      const totalWeight = layer.traits.reduce((sum: number, t: any) => sum + (t.rarity || 1), 0);
      let random = Math.random() * totalWeight;

      for (const trait of layer.traits) {
        random -= trait.rarity || 1;
        if (random <= 0) {
          selectedTraits.push(trait);
          break;
        }
      }
    }

    return selectedTraits;
  }

  /**
   * Generate composite image (placeholder)
   */
  private async generateCompositeImage(traits: EnhancedTrait[], tokenId: number): Promise<string> {
    // This would use canvas or similar to composite the image
    // For now, return a placeholder
    return `https://placeholder.com/512x512/000000/FFFFFF?text=NFT+${tokenId}`;
  }

  /**
   * Calculate actual rarity distribution
   */
  private calculateActualRarityDistribution(nfts: NFTWithRarity[]): RarityDistribution {
    const distribution: RarityDistribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Mythic: 0,
    };

    for (const nft of nfts) {
      distribution[nft.rarity.tier as keyof RarityDistribution]++;
    }

    return distribution;
  }

  /**
   * Upload collection to IPFS
   */
  private async uploadCollectionToIPFS(
    nfts: NFTWithRarity[],
    config: GeneratorConfig,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<CollectionUploadResult> {
    // Convert NFTs to upload format
    const images: Buffer[] = [];
    const metadata: any[] = [];

    for (const nft of nfts) {
      // Convert image URL to buffer (placeholder)
      const imageBuffer = Buffer.from(`placeholder_image_${nft.tokenId}`, 'utf8');
      images.push(imageBuffer);
      metadata.push(nft.metadata);
    }

    // Create collection metadata
    const collectionMetadata = {
      name: config.collectionSettings.name,
      symbol: config.collectionSettings.symbol,
      description: config.collectionSettings.description,
      totalSupply: config.collectionSettings.totalSupply,
      creator: config.collectionSettings.creator,
      royalties: config.collectionSettings.royalties,
      socials: config.collectionSettings.socials,
      revealType: config.revealType,
      revealDelay: config.revealDelay,
    };

    return await ipfsService.uploadCollection({
      images,
      metadata,
      collectionMetadata,
      collectionName: config.collectionSettings.name,
    });
  }

  /**
   * Validate generator configuration
   */
  private validateGeneratorConfig(config: GeneratorConfig): {
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
    if (config.collectionSettings.totalSupply > 10000) {
      warnings.push('Large collections (>10,000) may take longer to process');
    }

    // Validate layers
    if (!config.layers || config.layers.length === 0) {
      errors.push('At least one layer is required');
    }

    const totalTraits = config.layers.reduce((sum, layer) => sum + (layer.traits?.length || 0), 0);
    if (totalTraits === 0) {
      errors.push('At least one trait is required');
    }

    // Validate creator
    if (!config.collectionSettings.creator.wallet) {
      errors.push('Creator wallet is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    onProgress: ((progress: GenerationProgress) => void) | undefined,
    progress: GenerationProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * Get generation cost estimate
   */
  async getGenerationCostEstimate(collectionSize: number): Promise<{
    generatorFee: number;
    deploymentCost: number;
    totalCost: number;
    breakdown: {
      generation: number;
      ipfsHosting: number;
      blockchainDeployment: number;
    };
  }> {
    const feeBreakdown = this.paymentService.getFeeBreakdown(collectionSize);
    const deploymentCost = await this.blockchainDeployer.getDeploymentCostEstimate();

    return {
      generatorFee: feeBreakdown.totalFeeUSD,
      deploymentCost: deploymentCost.totalCost,
      totalCost: feeBreakdown.totalFeeUSD + deploymentCost.totalCost,
      breakdown: {
        generation: feeBreakdown.totalFeeUSD,
        ipfsHosting: feeBreakdown.breakdown.ipfsHosting.amount,
        blockchainDeployment: deploymentCost.totalCost,
      },
    };
  }

  /**
   * Check generation readiness
   */
  async checkGenerationReadiness(): Promise<{
    isReady: boolean;
    checks: {
      walletConnected: boolean;
      sufficientBalance: boolean;
      programsDeployed: boolean;
      networkConnected: boolean;
      ipfsConfigured: boolean;
    };
    errors: string[];
  }> {
    const checks = {
      walletConnected: false,
      sufficientBalance: false,
      programsDeployed: false,
      networkConnected: false,
      ipfsConfigured: false,
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

      // Check IPFS configuration
      const ipfsTest = await ipfsService.testConnectivity();
      checks.ipfsConfigured = ipfsTest.nftStorage || ipfsTest.pinata;
      if (!checks.ipfsConfigured) {
        errors.push('IPFS service not configured');
      }

      // Check blockchain readiness
      const blockchainReadiness = await this.blockchainDeployer.checkDeploymentReadiness();
      checks.walletConnected = blockchainReadiness.checks.walletConnected;
      checks.sufficientBalance = blockchainReadiness.checks.sufficientBalance;
      checks.programsDeployed = blockchainReadiness.checks.programsDeployed;
      errors.push(...blockchainReadiness.errors);

    } catch (error) {
      errors.push(`Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isReady: errors.length === 0,
      checks,
      errors,
    };
  }

  /**
   * Preview generation without payment
   */
  async previewGeneration(config: GeneratorConfig): Promise<{
    expectedDistribution: RarityDistribution;
    estimatedCost: number;
    estimatedTime: number;
    warnings: string[];
  }> {
    const validation = this.validateGeneratorConfig(config);
    
    // Calculate expected distribution
    const expectedDistribution = rarityCalculator.calculateExpectedDistribution(
      config.layers,
      config.collectionSettings.totalSupply
    );

    // Estimate cost
    const costEstimate = await this.getGenerationCostEstimate(config.collectionSettings.totalSupply);

    // Estimate time (rough calculation)
    const estimatedTime = Math.max(
      60, // Minimum 1 minute
      config.collectionSettings.totalSupply * 0.1 + // 0.1 seconds per NFT
      config.collectionSettings.totalSupply * 0.05 + // 0.05 seconds per upload
      300 // 5 minutes for deployment
    );

    return {
      expectedDistribution,
      estimatedCost: costEstimate.totalCost,
      estimatedTime,
      warnings: validation.warnings,
    };
  }
}

// Export factory function
export function createCompleteGeneratorIntegration(
  connection: Connection,
  provider: AnchorProvider
): CompleteGeneratorIntegration {
  return new CompleteGeneratorIntegration(connection, provider);
}
