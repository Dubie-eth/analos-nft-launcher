/**
 * Payment Service
 * Handles generator fee processing in $LOS (USD-pegged)
 */

import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';

export interface GeneratorFeeConfig {
  collectionSize: number;
  feeUSD: number;
  losPriceUSD: number;
  feeLOS: number;
  feeLamports: number;
}

export interface PaymentResult {
  success: boolean;
  transactionSignature?: string;
  feePaid: GeneratorFeeConfig;
  timestamp: number;
  error?: string;
}

export interface PaymentProgress {
  status: 'calculating' | 'confirming' | 'processing' | 'completed' | 'error';
  message: string;
  feeConfig?: GeneratorFeeConfig;
}

export class PaymentService {
  private connection: Connection;
  private provider: AnchorProvider;
  private nftLaunchpadProgram: Program;
  private priceOracleProgram: Program;

  // Generator fee wallets
  private readonly FEE_WALLETS = {
    PLATFORM: new PublicKey('myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q'),
    DEVELOPMENT: new PublicKey('Em26WavfAndcLGMWZHakvJHF5iAseHuvsbPXgCDcf63D'),
    IPFS_HOSTING: new PublicKey('myHsakbfHT7x378AvYJkBCtmF3TiSBpxA6DADRExa7Q'),
    LOL_BUYBACK: new PublicKey('7V2YgSfqu5E7nx2SXzHzaMPDnxzfh2dNXgBswknvj721'),
  };

  // Fee percentages (basis points)
  private readonly FEE_DISTRIBUTION = {
    PLATFORM_BPS: 5000,      // 50%
    DEVELOPMENT_BPS: 1500,   // 15%
    IPFS_HOSTING_BPS: 2500,  // 25%
    LOL_BUYBACK_BPS: 1000,   // 10%
  };

  constructor(connection: Connection, provider: AnchorProvider) {
    this.connection = connection;
    this.provider = provider;
    
    // Initialize programs
    this.nftLaunchpadProgram = new Program(
      {} as any, // Replace with actual IDL
      new PublicKey('7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk'),
      provider
    );
    
    this.priceOracleProgram = new Program(
      {} as any, // Replace with actual IDL
      new PublicKey('PriceOracleProgramID'), // Update with actual ID
      provider
    );
  }

  /**
   * Calculate generator fee based on collection size
   */
  calculateGeneratorFee(collectionSize: number): GeneratorFeeConfig {
    let feeUSD: number;
    
    if (collectionSize <= 500) {
      feeUSD = 70;
    } else if (collectionSize <= 2000) {
      feeUSD = 150;
    } else {
      feeUSD = 350;
    }

    return {
      collectionSize,
      feeUSD,
      losPriceUSD: 0, // Will be fetched from oracle
      feeLOS: 0, // Will be calculated
      feeLamports: 0, // Will be calculated
    };
  }

  /**
   * Process generator fee payment
   */
  async processGeneratorFee(
    collectionSize: number,
    onProgress?: (progress: PaymentProgress) => void
  ): Promise<PaymentResult> {
    try {
      // Step 1: Calculate fee
      this.updateProgress(onProgress, {
        status: 'calculating',
        message: 'Calculating generator fee...',
      });

      const feeConfig = this.calculateGeneratorFee(collectionSize);
      
      // Step 2: Get current $LOS price from oracle
      this.updateProgress(onProgress, {
        status: 'calculating',
        message: 'Fetching current $LOS price...',
        feeConfig,
      });

      const losPriceUSD = await this.getLOSPriceFromOracle();
      feeConfig.losPriceUSD = losPriceUSD;
      
      // Step 3: Calculate LOS amount
      feeConfig.feeLOS = feeConfig.feeUSD / losPriceUSD;
      feeConfig.feeLamports = Math.floor(feeConfig.feeLOS * 1e9);

      this.updateProgress(onProgress, {
        status: 'confirming',
        message: `Fee: $${feeConfig.feeUSD} USD (${feeConfig.feeLOS.toFixed(4)} LOS)`,
        feeConfig,
      });

      // Step 4: Check wallet balance
      const balance = await this.connection.getBalance(this.provider.wallet.publicKey);
      if (balance < feeConfig.feeLamports) {
        throw new Error(`Insufficient balance. Need ${feeConfig.feeLOS.toFixed(4)} LOS, have ${(balance / 1e9).toFixed(4)} LOS`);
      }

      // Step 5: Process payment
      this.updateProgress(onProgress, {
        status: 'processing',
        message: 'Processing payment...',
        feeConfig,
      });

      const transactionSignature = await this.executeFeePayment(feeConfig);

      this.updateProgress(onProgress, {
        status: 'completed',
        message: 'Payment completed successfully!',
        feeConfig,
      });

      return {
        success: true,
        transactionSignature,
        feePaid: feeConfig,
        timestamp: Date.now(),
      };

    } catch (error) {
      this.updateProgress(onProgress, {
        status: 'error',
        message: `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      return {
        success: false,
        feePaid: this.calculateGeneratorFee(collectionSize),
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute fee payment with distribution
   */
  private async executeFeePayment(feeConfig: GeneratorFeeConfig): Promise<string> {
    const transaction = new Transaction();

    // Calculate individual fee amounts
    const platformFee = Math.floor((feeConfig.feeLamports * this.FEE_DISTRIBUTION.PLATFORM_BPS) / 10000);
    const devFee = Math.floor((feeConfig.feeLamports * this.FEE_DISTRIBUTION.DEVELOPMENT_BPS) / 10000);
    const ipfsFee = Math.floor((feeConfig.feeLamports * this.FEE_DISTRIBUTION.IPFS_HOSTING_BPS) / 10000);
    const buybackFee = Math.floor((feeConfig.feeLamports * this.FEE_DISTRIBUTION.LOL_BUYBACK_BPS) / 10000);

    // Add transfer instructions
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.provider.wallet.publicKey,
        toPubkey: this.FEE_WALLETS.PLATFORM,
        lamports: platformFee,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.provider.wallet.publicKey,
        toPubkey: this.FEE_WALLETS.DEVELOPMENT,
        lamports: devFee,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.provider.wallet.publicKey,
        toPubkey: this.FEE_WALLETS.IPFS_HOSTING,
        lamports: ipfsFee,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.provider.wallet.publicKey,
        toPubkey: this.FEE_WALLETS.LOL_BUYBACK,
        lamports: buybackFee,
      })
    );

    // Send transaction
    const signature = await this.provider.sendAndConfirm(transaction);
    
    console.log('✅ Generator fee paid:', {
      total: feeConfig.feeUSD,
      platform: platformFee / 1e9,
      development: devFee / 1e9,
      ipfs: ipfsFee / 1e9,
      buyback: buybackFee / 1e9,
      signature,
    });

    return signature;
  }

  /**
   * Get current $LOS price from price oracle
   */
  private async getLOSPriceFromOracle(): Promise<number> {
    try {
      // Derive price oracle PDA
      const [priceOraclePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_oracle')],
        this.priceOracleProgram.programId
      );

      const oracleAccount = await this.priceOracleProgram.account.priceOracle.fetch(priceOraclePDA);
      return oracleAccount.losPriceUsd.toNumber() / 1e6; // Convert from 6 decimals

    } catch (error) {
      console.warn('Failed to fetch LOS price from oracle, using fallback:', error);
      
      // Fallback to external API or default price
      return await this.getLOSPriceFromAPI();
    }
  }

  /**
   * Fallback: Get $LOS price from external API
   */
  private async getLOSPriceFromAPI(): Promise<number> {
    try {
      // Try multiple sources
      const sources = [
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        'https://api.birdeye.so/public/price?address=So11111111111111111111111111111111111111112',
      ];

      for (const url of sources) {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          // Extract price based on API format
          if (data.solana?.usd) {
            return data.solana.usd;
          } else if (data.data?.value) {
            return data.data.value;
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${url}:`, error);
        }
      }

      // Ultimate fallback
      console.warn('All price sources failed, using default price of $0.002');
      return 0.002;

    } catch (error) {
      console.error('Failed to get LOS price from API:', error);
      return 0.002; // Default fallback price
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(
    onProgress: ((progress: PaymentProgress) => void) | undefined,
    progress: PaymentProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * Validate payment configuration
   */
  validatePaymentConfig(collectionSize: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate collection size
    if (collectionSize <= 0) {
      errors.push('Collection size must be greater than 0');
    }
    if (collectionSize > 10000) {
      warnings.push('Large collections (>10,000) may take longer to process');
    }

    // Validate fee calculation
    const feeConfig = this.calculateGeneratorFee(collectionSize);
    if (feeConfig.feeUSD <= 0) {
      errors.push('Invalid fee calculation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userWallet: PublicKey): Promise<PaymentResult[]> {
    // This would typically query a database or indexer
    // For now, return empty array
    return [];
  }

  /**
   * Get fee breakdown for collection size
   */
  getFeeBreakdown(collectionSize: number): {
    totalFeeUSD: number;
    breakdown: {
      platform: { amount: number; percentage: number };
      development: { amount: number; percentage: number };
      ipfsHosting: { amount: number; percentage: number };
      lolBuyback: { amount: number; percentage: number };
    };
    collectionSize: number;
    tier: 'Small' | 'Medium' | 'Large';
  } {
    const feeConfig = this.calculateGeneratorFee(collectionSize);
    
    const breakdown = {
      platform: {
        amount: (feeConfig.feeUSD * this.FEE_DISTRIBUTION.PLATFORM_BPS) / 10000,
        percentage: this.FEE_DISTRIBUTION.PLATFORM_BPS / 100,
      },
      development: {
        amount: (feeConfig.feeUSD * this.FEE_DISTRIBUTION.DEVELOPMENT_BPS) / 10000,
        percentage: this.FEE_DISTRIBUTION.DEVELOPMENT_BPS / 100,
      },
      ipfsHosting: {
        amount: (feeConfig.feeUSD * this.FEE_DISTRIBUTION.IPFS_HOSTING_BPS) / 10000,
        percentage: this.FEE_DISTRIBUTION.IPFS_HOSTING_BPS / 100,
      },
      lolBuyback: {
        amount: (feeConfig.feeUSD * this.FEE_DISTRIBUTION.LOL_BUYBACK_BPS) / 10000,
        percentage: this.FEE_DISTRIBUTION.LOL_BUYBACK_BPS / 100,
      },
    };

    const tier = collectionSize <= 500 ? 'Small' : 
                 collectionSize <= 2000 ? 'Medium' : 'Large';

    return {
      totalFeeUSD: feeConfig.feeUSD,
      breakdown,
      collectionSize,
      tier,
    };
  }

  /**
   * Estimate payment cost in different currencies
   */
  async estimatePaymentCost(collectionSize: number): Promise<{
    usd: number;
    los: number;
    sol: number; // Approximate SOL equivalent
  }> {
    const feeConfig = this.calculateGeneratorFee(collectionSize);
    const losPriceUSD = await this.getLOSPriceFromOracle();
    
    return {
      usd: feeConfig.feeUSD,
      los: feeConfig.feeUSD / losPriceUSD,
      sol: feeConfig.feeUSD / 200, // Assuming SOL ~$200
    };
  }

  /**
   * Check if payment is required for collection size
   */
  isPaymentRequired(collectionSize: number): boolean {
    return collectionSize > 0;
  }

  /**
   * Get payment tiers and pricing
   */
  getPaymentTiers(): Array<{
    name: string;
    sizeRange: string;
    feeUSD: number;
    features: string[];
  }> {
    return [
      {
        name: 'Small Collection',
        sizeRange: '100-500 NFTs',
        feeUSD: 70,
        features: [
          'NFT generation',
          'IPFS hosting (1 year)',
          'Basic rarity tiers',
          'Standard metadata',
        ],
      },
      {
        name: 'Medium Collection',
        sizeRange: '501-2,000 NFTs',
        feeUSD: 150,
        features: [
          'Everything in Small',
          'Advanced rarity tiers',
          'Extended IPFS hosting (2 years)',
          'Priority support',
          'Custom metadata templates',
        ],
      },
      {
        name: 'Large Collection',
        sizeRange: '2,001-10,000 NFTs',
        feeUSD: 350,
        features: [
          'Everything in Medium',
          'Premium IPFS hosting (3 years)',
          'Dedicated support',
          'Custom trait rules',
          'Analytics dashboard',
          'Marketing assistance',
        ],
      },
    ];
  }
}

// Export singleton instance
export function createPaymentService(
  connection: Connection,
  provider: AnchorProvider
): PaymentService {
  return new PaymentService(connection, provider);
}
