import { PublicKey } from '@solana/web3.js';

export interface SmartContractData {
  collectionId: string;
  collectionName: string;
  mintPrice: number;
  paymentToken: string;
  paymentTokenMint: string;
  feeRecipient: string;
  maxSupply: number;
  currentSupply: number;
  isActive: boolean;
  deployedAt: string;
  contractAddress: string;
  adminWallet: string;
  whitelistPhases?: WhitelistPhase[];
  paymentTokens?: PaymentTokenConfig[];
}

export interface WhitelistPhase {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  price: number;
  maxMintsPerWallet: number;
  whitelistAddresses: string[];
  tokenRequirements?: TokenRequirement[];
}

export interface TokenRequirement {
  tokenMint: string;
  minBalance: number;
  maxBalance?: number;
}

export interface PaymentTokenConfig {
  mint: string;
  symbol: string;
  accepted: boolean;
  priceMultiplier: number;
  minBalance: number;
}

export class SmartContractReferenceService {
  private static instance: SmartContractReferenceService;
  private contractData: Map<string, SmartContractData> = new Map();
  
  // Analos blockchain constants
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly LOL_TOKEN_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
  private readonly FEE_RECIPIENT = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';
  private readonly ADMIN_WALLET = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  private constructor() {
    this.initializeDefaultContracts();
  }

  public static getInstance(): SmartContractReferenceService {
    if (!SmartContractReferenceService.instance) {
      SmartContractReferenceService.instance = new SmartContractReferenceService();
    }
    return SmartContractReferenceService.instance;
  }

  /**
   * Initialize default smart contract data
   */
  private initializeDefaultContracts(): void {
    console.log('🏗️ Initializing smart contract reference data...');
    
    // Launch On LOS collection
    const launchOnLosContract: SmartContractData = {
      collectionId: 'collection_launch_on_los',
      collectionName: 'Launch On LOS',
      mintPrice: 4200.69,
      paymentToken: 'LOL',
      paymentTokenMint: this.LOL_TOKEN_MINT,
      feeRecipient: this.FEE_RECIPIENT,
      maxSupply: 4200,
      currentSupply: 0,
      isActive: true,
      deployedAt: new Date().toISOString(),
      contractAddress: 'contract_launch_on_los_20241201',
      adminWallet: this.ADMIN_WALLET,
      whitelistPhases: [
        {
          id: 'phase_1',
          name: 'Early Access',
          startTime: Date.now(),
          endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          price: 0, // Free for whitelist
          maxMintsPerWallet: 2,
          whitelistAddresses: [],
          tokenRequirements: [
            {
              tokenMint: this.LOL_TOKEN_MINT,
              minBalance: 1000000, // 1M LOL minimum
              maxBalance: undefined
            }
          ]
        },
        {
          id: 'phase_2',
          name: 'Public Sale',
          startTime: Date.now() + (7 * 24 * 60 * 60 * 1000),
          endTime: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days total
          price: 4200.69,
          maxMintsPerWallet: 10,
          whitelistAddresses: [],
          tokenRequirements: []
        }
      ],
      paymentTokens: [
        {
          mint: this.LOL_TOKEN_MINT,
          symbol: 'LOL',
          accepted: true,
          priceMultiplier: 1.0,
          minBalance: 1000
        },
        {
          mint: 'So11111111111111111111111111111111111111112', // SOL
          symbol: 'SOL',
          accepted: true,
          priceMultiplier: 1.0,
          minBalance: 0.1
        }
      ]
    };

    this.contractData.set('Launch On LOS', launchOnLosContract);
    console.log('✅ Smart contract reference data initialized');
  }

  /**
   * Get smart contract data for a collection
   */
  public getContractData(collectionName: string): SmartContractData | null {
    const contract = this.contractData.get(collectionName);
    if (contract) {
      console.log('📋 Retrieved smart contract data for:', collectionName);
    }
    return contract || null;
  }

  /**
   * Update smart contract data
   */
  public updateContractData(collectionName: string, updates: Partial<SmartContractData>): void {
    const existing = this.contractData.get(collectionName);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.contractData.set(collectionName, updated);
      console.log('📝 Updated smart contract data for:', collectionName);
    } else {
      console.log('⚠️ No existing contract data found for:', collectionName);
    }
  }

  /**
   * Verify collection configuration against smart contract
   */
  public verifyCollectionConfig(collectionName: string, config: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const contractData = this.getContractData(collectionName);
    if (!contractData) {
      return {
        valid: false,
        errors: ['No smart contract data found for collection'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Verify mint price
    if (config.mintPrice && config.mintPrice !== contractData.mintPrice) {
      warnings.push(`Mint price mismatch: config (${config.mintPrice}) vs contract (${contractData.mintPrice})`);
    }

    // Verify max supply
    if (config.maxSupply && config.maxSupply !== contractData.maxSupply) {
      warnings.push(`Max supply mismatch: config (${config.maxSupply}) vs contract (${contractData.maxSupply})`);
    }

    // Verify payment token
    if (config.paymentToken && config.paymentToken !== contractData.paymentToken) {
      errors.push(`Payment token mismatch: config (${config.paymentToken}) vs contract (${contractData.paymentToken})`);
    }

    // Verify fee recipient
    if (config.feeRecipient && config.feeRecipient !== contractData.feeRecipient) {
      errors.push(`Fee recipient mismatch: config (${config.feeRecipient}) vs contract (${contractData.feeRecipient})`);
    }

    // Verify admin wallet
    if (config.adminWallet && config.adminWallet !== contractData.adminWallet) {
      errors.push(`Admin wallet mismatch: config (${config.adminWallet}) vs contract (${contractData.adminWallet})`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get whitelist phase for current time
   */
  public getCurrentWhitelistPhase(collectionName: string): WhitelistPhase | null {
    const contractData = this.getContractData(collectionName);
    if (!contractData || !contractData.whitelistPhases) {
      return null;
    }

    const now = Date.now();
    const currentPhase = contractData.whitelistPhases.find(phase => 
      now >= phase.startTime && now <= phase.endTime
    );

    return currentPhase || null;
  }

  /**
   * Check if wallet is whitelisted for current phase
   */
  public isWalletWhitelisted(collectionName: string, walletAddress: string): boolean {
    const currentPhase = this.getCurrentWhitelistPhase(collectionName);
    if (!currentPhase) {
      return false;
    }

    return currentPhase.whitelistAddresses.includes(walletAddress);
  }

  /**
   * Get payment token configuration
   */
  public getPaymentTokenConfig(collectionName: string, tokenMint: string): PaymentTokenConfig | null {
    const contractData = this.getContractData(collectionName);
    if (!contractData || !contractData.paymentTokens) {
      return null;
    }

    return contractData.paymentTokens.find(token => token.mint === tokenMint) || null;
  }

  /**
   * Calculate mint price with token multiplier
   */
  public calculateMintPrice(collectionName: string, paymentToken: string): number {
    const contractData = this.getContractData(collectionName);
    if (!contractData) {
      return 0;
    }

    const tokenConfig = this.getPaymentTokenConfig(collectionName, paymentToken);
    if (!tokenConfig) {
      return contractData.mintPrice;
    }

    return contractData.mintPrice * tokenConfig.priceMultiplier;
  }

  /**
   * Validate minting eligibility
   */
  public validateMintingEligibility(
    collectionName: string,
    walletAddress: string,
    quantity: number,
    paymentToken: string
  ): {
    eligible: boolean;
    reason?: string;
    currentPhase?: WhitelistPhase;
    maxMints?: number;
    price?: number;
  } {
    const contractData = this.getContractData(collectionName);
    if (!contractData) {
      return { eligible: false, reason: 'Collection not found in smart contract' };
    }

    if (!contractData.isActive) {
      return { eligible: false, reason: 'Collection is not active' };
    }

    const currentPhase = this.getCurrentWhitelistPhase(collectionName);
    if (!currentPhase) {
      return { eligible: false, reason: 'No active whitelist phase' };
    }

    // Check quantity limits
    if (quantity > currentPhase.maxMintsPerWallet) {
      return {
        eligible: false,
        reason: `Quantity exceeds max mints per wallet (${currentPhase.maxMintsPerWallet})`,
        currentPhase,
        maxMints: currentPhase.maxMintsPerWallet
      };
    }

    // Check whitelist status
    if (currentPhase.whitelistAddresses.length > 0 && !this.isWalletWhitelisted(collectionName, walletAddress)) {
      return {
        eligible: false,
        reason: 'Wallet not whitelisted for current phase',
        currentPhase
      };
    }

    // Check token requirements
    if (currentPhase.tokenRequirements && currentPhase.tokenRequirements.length > 0) {
      // This would need to be implemented with actual token balance checking
      // For now, we'll assume it passes if the user has the required payment token
    }

    const price = currentPhase.price || this.calculateMintPrice(collectionName, paymentToken);

    return {
      eligible: true,
      currentPhase,
      maxMints: currentPhase.maxMintsPerWallet,
      price
    };
  }

  /**
   * Get all contract data (for admin purposes)
   */
  public getAllContractData(): Map<string, SmartContractData> {
    return new Map(this.contractData);
  }

  /**
   * Export contract data for backup/verification
   */
  public exportContractData(): string {
    const data = Object.fromEntries(this.contractData);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import contract data from backup
   */
  public importContractData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      this.contractData.clear();
      
      Object.entries(data).forEach(([key, value]) => {
        this.contractData.set(key, value as SmartContractData);
      });
      
      console.log('✅ Smart contract data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing contract data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const smartContractReference = SmartContractReferenceService.getInstance();
export default smartContractReference;
