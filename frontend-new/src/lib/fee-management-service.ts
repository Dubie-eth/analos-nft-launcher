/**
 * Fee Management Service
 * Handles platform fees, creator fees, and fee distribution
 */

export interface FeeStructure {
  basePrice: number;
  platformFee: number;
  platformFeePercentage: number;
  creatorFee: number;
  creatorFeePercentage: number;
  totalPrice: number;
  platformWallet: string;
  creatorWallet: string;
}

export interface CollectionFeeConfig {
  name: string;
  basePrice: number;
  platformFeePercentage: number; // Our platform fee
  creatorFeePercentage: number; // Creator's fee (on top of platform fee)
  creatorWallet: string; // Collection creator's wallet
  platformWallet: string; // Our platform wallet
}

export class FeeManagementService {
  private readonly DEFAULT_PLATFORM_FEE_PERCENTAGE = 2.5; // 2.5% platform fee
  private readonly PLATFORM_WALLET = 'YOUR_PLATFORM_FEES_WALLET_ADDRESS'; // Will be set when you provide it
  
  // Minimum fees to ensure backend services and platform operations
  private readonly MINIMUM_BACKEND_SERVICE_FEE = 10.0; // 10.0 LOS minimum for backend services
  private readonly MINIMUM_NETWORK_FEE = 5.0; // 5.0 LOS for network fees
  private readonly MINIMUM_PLATFORM_FEE = 5.0; // 5.0 LOS minimum platform fee
  private readonly MINIMUM_TOTAL_FEE = 10.0; // 10.0 LOS total minimum (backend services)
  
  // Collection fee configurations
  private collectionFees: Map<string, CollectionFeeConfig> = new Map();

  constructor() {
    this.initializeDefaultFees();
    console.log('💰 Fee Management Service initialized');
  }

  /**
   * Initialize default fee configurations
   */
  private initializeDefaultFees(): void {
    // Test collection - low fees for testing
    this.collectionFees.set('Test', {
      name: 'Test',
      basePrice: 10.00,
      platformFeePercentage: 1.0, // 1% for testing
      creatorFeePercentage: 0.5, // 0.5% for testing
      creatorWallet: 'TEST_CREATOR_WALLET',
      platformWallet: this.PLATFORM_WALLET
    });

    // The LosBros - production fees
    this.collectionFees.set('The LosBros', {
      name: 'The LosBros',
      basePrice: 4200.69,
      platformFeePercentage: 2.5, // 2.5% platform fee
      creatorFeePercentage: 1.0, // 1% creator fee
      creatorWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your actual creator wallet
      platformWallet: this.PLATFORM_WALLET
    });

    // Los Bros - newly deployed collection (4200.69 LOS base price with whitelist free mint)
    this.collectionFees.set('Los Bros', {
      name: 'Los Bros',
      basePrice: 4200.69, // Base price for Los Bros collection
      platformFeePercentage: 2.5, // 2.5% platform fee
      creatorFeePercentage: 1.0, // 1% creator fee
      creatorWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your actual creator wallet
      platformWallet: this.PLATFORM_WALLET
    });

    // Default for new collections
    this.collectionFees.set('New Collection', {
      name: 'New Collection',
      basePrice: 50.00,
      platformFeePercentage: this.DEFAULT_PLATFORM_FEE_PERCENTAGE,
      creatorFeePercentage: 1.0, // 1% default creator fee
      creatorWallet: 'NEW_CREATOR_WALLET',
      platformWallet: this.PLATFORM_WALLET
    });
  }

  /**
   * Calculate fee structure for a collection with minimum fee enforcement
   * IMPORTANT: Fees are deducted FROM the set price, not added on top
   * User pays the full price, but creator receives (price - fees)
   * WHITELIST MINTING: Even "free" mints must pay minimum network + platform fees
   */
  calculateFees(collectionName: string, isWhitelistMint: boolean = false, whitelistMultiplier: number = 1.0): FeeStructure {
    const config = this.collectionFees.get(collectionName);
    if (!config) {
      console.warn(`⚠️ Fee configuration not found for collection: ${collectionName}, using default`);
      // Return default fee structure instead of throwing error
      const totalPrice = 10.00; // User pays this amount
      const totalFeePercentage = 3.5; // 2.5% + 1.0%
      const platformFee = (totalPrice * 2.5) / (100 + totalFeePercentage);
      const creatorFee = (totalPrice * 1.0) / (100 + totalFeePercentage);
      const basePrice = totalPrice - platformFee - creatorFee; // Creator receives this
      
      return {
        basePrice,
        platformFee,
        platformFeePercentage: 2.5,
        creatorFee,
        creatorFeePercentage: 1.0,
        totalPrice,
        platformWallet: this.PLATFORM_WALLET,
        creatorWallet: 'DEFAULT_CREATOR_WALLET'
      };
    }

    // Calculate the effective price (considering whitelist multiplier)
    let effectivePrice = config.basePrice;
    
    if (isWhitelistMint && whitelistMultiplier < 1.0) {
      effectivePrice = config.basePrice * whitelistMultiplier;
      console.log(`🎯 Whitelist pricing applied: ${config.basePrice} * ${whitelistMultiplier} = ${effectivePrice}`);
    }
    
      // ENFORCE MINIMUM FEES: Even "free" whitelist mints must pay minimum backend service fees
      const totalPrice = Math.max(effectivePrice, this.MINIMUM_TOTAL_FEE);
    
    if (totalPrice > effectivePrice) {
      console.log(`💰 Minimum fee enforcement: ${effectivePrice} -> ${totalPrice} (minimum backend service fees required)`);
    }
    
    const totalFeePercentage = config.platformFeePercentage + config.creatorFeePercentage;
    
    // Calculate fees as a portion of the total price
    let platformFee = (totalPrice * config.platformFeePercentage) / (100 + totalFeePercentage);
    let creatorFee = (totalPrice * config.creatorFeePercentage) / (100 + totalFeePercentage);
    
    // Ensure minimum platform fee for backend services and blockchain operations
    platformFee = Math.max(platformFee, this.MINIMUM_PLATFORM_FEE);
    
    // Creator receives: total price minus all fees (but never negative)
    const basePrice = Math.max(0, totalPrice - platformFee - creatorFee);

    return {
      basePrice, // Amount creator receives (after fees deducted)
      platformFee, // Amount platform receives
      platformFeePercentage: config.platformFeePercentage,
      creatorFee, // Amount sent to creator's fee wallet
      creatorFeePercentage: config.creatorFeePercentage,
      totalPrice, // Amount user pays (this is the set price, never exceeds)
      platformWallet: config.platformWallet,
      creatorWallet: config.creatorWallet
    };
  }

  /**
   * Get total mint price (base + all fees)
   */
  getTotalMintPrice(collectionName: string): number {
    const fees = this.calculateFees(collectionName);
    return fees.totalPrice;
  }

  /**
   * Get base price (without fees)
   */
  getBasePrice(collectionName: string): number {
    const config = this.collectionFees.get(collectionName);
    return config?.basePrice || 0;
  }

  /**
   * Get platform fee amount
   */
  getPlatformFee(collectionName: string): number {
    const fees = this.calculateFees(collectionName);
    return fees.platformFee;
  }

  /**
   * Get creator fee amount
   */
  getCreatorFee(collectionName: string): number {
    const fees = this.calculateFees(collectionName);
    return fees.creatorFee;
  }

  /**
   * Get fee breakdown for display (supports whitelist pricing)
   */
  getFeeBreakdown(
    collectionName: string, 
    isWhitelistMint: boolean = false, 
    whitelistMultiplier: number = 1.0
  ): {
    basePrice: number;
    platformFee: number;
    creatorFee: number;
    totalPrice: number;
    platformFeePercentage: number;
    creatorFeePercentage: number;
    paymentToken: string;
    isMinimumFeeEnforced: boolean;
    originalPrice?: number;
  } {
    const fees = this.calculateFees(collectionName, isWhitelistMint, whitelistMultiplier);
    const config = this.collectionFees.get(collectionName);
    
    // Check if minimum fees were enforced
    const originalPrice = isWhitelistMint ? config?.basePrice * whitelistMultiplier : config?.basePrice;
    const isMinimumFeeEnforced = fees.totalPrice > (originalPrice || 0);
    
    return {
      basePrice: fees.basePrice,
      platformFee: fees.platformFee,
      creatorFee: fees.creatorFee,
      totalPrice: fees.totalPrice,
      platformFeePercentage: fees.platformFeePercentage,
      creatorFeePercentage: fees.creatorFeePercentage,
      paymentToken: 'LOS', // All collections use LOS as payment token
      isMinimumFeeEnforced,
      originalPrice: isWhitelistMint ? originalPrice : undefined
    };
  }

  /**
   * Update collection fee configuration
   */
  updateCollectionFees(
    collectionName: string,
    updates: Partial<CollectionFeeConfig>
  ): boolean {
    try {
      const existing = this.collectionFees.get(collectionName);
      if (!existing) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      const updated = { ...existing, ...updates };
      this.collectionFees.set(collectionName, updated);
      
      console.log(`✅ Fee configuration updated for: ${collectionName}`);
      console.log('📝 Changes:', Object.keys(updates));
      return true;

    } catch (error) {
      console.error(`❌ Error updating fees for ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Set platform wallet address
   */
  setPlatformWallet(walletAddress: string): void {
    // Update all collections to use new platform wallet
    for (const [name, config] of this.collectionFees) {
      this.collectionFees.set(name, {
        ...config,
        platformWallet: walletAddress
      });
    }
    
    console.log(`✅ Platform wallet updated to: ${walletAddress}`);
  }

  /**
   * Set creator wallet for a collection
   */
  setCreatorWallet(collectionName: string, walletAddress: string): boolean {
    try {
      const config = this.collectionFees.get(collectionName);
      if (!config) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      this.collectionFees.set(collectionName, {
        ...config,
        creatorWallet: walletAddress
      });

      console.log(`✅ Creator wallet updated for ${collectionName}: ${walletAddress}`);
      return true;

    } catch (error) {
      console.error(`❌ Error setting creator wallet:`, error);
      return false;
    }
  }

  /**
   * Add new collection fee configuration
   */
  addCollectionFees(config: CollectionFeeConfig): boolean {
    try {
      this.collectionFees.set(config.name, config);
      console.log(`✅ Fee configuration added for: ${config.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding collection fees:`, error);
      return false;
    }
  }

  /**
   * Get all collection fee configurations
   */
  getAllCollectionFees(): CollectionFeeConfig[] {
    return Array.from(this.collectionFees.values());
  }

  /**
   * Get fee summary for admin dashboard
   */
  getFeeSummary(): {
    totalCollections: number;
    totalPlatformFees: number;
    averagePlatformFeePercentage: number;
    platformWallet: string;
  } {
    const collections = Array.from(this.collectionFees.values());
    const totalPlatformFees = collections.reduce((sum, config) => {
      return sum + ((config.basePrice * config.platformFeePercentage) / 100);
    }, 0);

    const averagePlatformFeePercentage = collections.reduce((sum, config) => {
      return sum + config.platformFeePercentage;
    }, 0) / collections.length;

    return {
      totalCollections: collections.length,
      totalPlatformFees,
      averagePlatformFeePercentage,
      platformWallet: this.PLATFORM_WALLET
    };
  }

  /**
   * Validate fee configuration
   */
  validateFeeConfig(config: CollectionFeeConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.basePrice <= 0) {
      errors.push('Base price must be greater than 0');
    }

    if (config.platformFeePercentage < 0 || config.platformFeePercentage > 10) {
      errors.push('Platform fee percentage must be between 0% and 10%');
    }

    if (config.creatorFeePercentage < 0 || config.creatorFeePercentage > 10) {
      errors.push('Creator fee percentage must be between 0% and 10%');
    }

    if (!config.creatorWallet || config.creatorWallet.length < 32) {
      errors.push('Creator wallet address is invalid');
    }

    if (!config.platformWallet || config.platformWallet.length < 32) {
      errors.push('Platform wallet address is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const feeManagementService = new FeeManagementService();
