/**
 * Update Fee Service - Handles fees for post-deployment collection updates
 * Provides fair pricing for updates while generating platform revenue
 */

export interface UpdateFeeStructure {
  whitelistUpdate: {
    baseFee: number; // $LOS
    perAddressFee: number; // $LOS per address
    maxFee: number; // $LOS
    description: string;
  };
  pricingUpdate: {
    baseFee: number; // $LOS
    description: string;
  };
  supplyUpdate: {
    baseFee: number; // $LOS
    perUnitFee: number; // $LOS per additional unit
    description: string;
  };
  metadataUpdate: {
    baseFee: number; // $LOS
    description: string;
  };
  whitelistPhaseUpdate: {
    baseFee: number; // $LOS
    perPhaseFee: number; // $LOS per phase
    description: string;
  };
}

export interface UpdateCalculation {
  updateType: string;
  baseFee: number;
  variableFee: number;
  totalFee: number;
  platformRevenue: number; // 70% of total fee
  gasCosts: number; // 30% of total fee
  description: string;
}

export class UpdateFeeService {
  private losToUSD = 0.00015; // Current $LOS to USD rate

  /**
   * Get update fee structure
   */
  getUpdateFeeStructure(): UpdateFeeStructure {
    return {
      whitelistUpdate: {
        baseFee: 50, // 50 $LOS base fee
        perAddressFee: 0.1, // 0.1 $LOS per address
        maxFee: 200, // Max 200 $LOS
        description: 'Update whitelist addresses'
      },
      pricingUpdate: {
        baseFee: 25, // 25 $LOS base fee
        description: 'Update mint price'
      },
      supplyUpdate: {
        baseFee: 30, // 30 $LOS base fee
        perUnitFee: 0.05, // 0.05 $LOS per additional unit
        description: 'Update max supply'
      },
      metadataUpdate: {
        baseFee: 20, // 20 $LOS base fee
        description: 'Update collection metadata'
      },
      whitelistPhaseUpdate: {
        baseFee: 40, // 40 $LOS base fee
        perPhaseFee: 5, // 5 $LOS per phase
        description: 'Update whitelist phases'
      }
    };
  }

  /**
   * Calculate update fee for whitelist
   */
  calculateWhitelistUpdateFee(currentAddresses: number, newAddresses: number): UpdateCalculation {
    const feeStructure = this.getUpdateFeeStructure().whitelistUpdate;
    
    const addressDifference = Math.abs(newAddresses - currentAddresses);
    const variableFee = Math.min(addressDifference * feeStructure.perAddressFee, feeStructure.maxFee);
    const totalFee = feeStructure.baseFee + variableFee;
    
    return {
      updateType: 'whitelist',
      baseFee: feeStructure.baseFee,
      variableFee,
      totalFee,
      platformRevenue: Math.round(totalFee * 0.7), // 70% platform revenue
      gasCosts: Math.round(totalFee * 0.3), // 30% gas costs
      description: feeStructure.description
    };
  }

  /**
   * Calculate update fee for pricing
   */
  calculatePricingUpdateFee(): UpdateCalculation {
    const feeStructure = this.getUpdateFeeStructure().pricingUpdate;
    
    return {
      updateType: 'pricing',
      baseFee: feeStructure.baseFee,
      variableFee: 0,
      totalFee: feeStructure.baseFee,
      platformRevenue: Math.round(feeStructure.baseFee * 0.7),
      gasCosts: Math.round(feeStructure.baseFee * 0.3),
      description: feeStructure.description
    };
  }

  /**
   * Calculate update fee for supply
   */
  calculateSupplyUpdateFee(currentSupply: number, newSupply: number): UpdateCalculation {
    const feeStructure = this.getUpdateFeeStructure().supplyUpdate;
    
    const supplyDifference = Math.max(0, newSupply - currentSupply);
    const variableFee = supplyDifference * feeStructure.perUnitFee;
    const totalFee = feeStructure.baseFee + variableFee;
    
    return {
      updateType: 'supply',
      baseFee: feeStructure.baseFee,
      variableFee,
      totalFee,
      platformRevenue: Math.round(totalFee * 0.7),
      gasCosts: Math.round(totalFee * 0.3),
      description: feeStructure.description
    };
  }

  /**
   * Calculate update fee for metadata
   */
  calculateMetadataUpdateFee(): UpdateCalculation {
    const feeStructure = this.getUpdateFeeStructure().metadataUpdate;
    
    return {
      updateType: 'metadata',
      baseFee: feeStructure.baseFee,
      variableFee: 0,
      totalFee: feeStructure.baseFee,
      platformRevenue: Math.round(feeStructure.baseFee * 0.7),
      gasCosts: Math.round(feeStructure.baseFee * 0.3),
      description: feeStructure.description
    };
  }

  /**
   * Calculate update fee for whitelist phases
   */
  calculateWhitelistPhaseUpdateFee(currentPhases: number, newPhases: number): UpdateCalculation {
    const feeStructure = this.getUpdateFeeStructure().whitelistPhaseUpdate;
    
    const phaseDifference = Math.abs(newPhases - currentPhases);
    const variableFee = phaseDifference * feeStructure.perPhaseFee;
    const totalFee = feeStructure.baseFee + variableFee;
    
    return {
      updateType: 'whitelistPhases',
      baseFee: feeStructure.baseFee,
      variableFee,
      totalFee,
      platformRevenue: Math.round(totalFee * 0.7),
      gasCosts: Math.round(totalFee * 0.3),
      description: feeStructure.description
    };
  }

  /**
   * Calculate total update fee for multiple changes
   */
  calculateMultipleUpdateFee(updates: {
    whitelist?: { current: number; new: number };
    pricing?: boolean;
    supply?: { current: number; new: number };
    metadata?: boolean;
    whitelistPhases?: { current: number; new: number };
  }): {
    individualFees: UpdateCalculation[];
    totalFee: number;
    platformRevenue: number;
    gasCosts: number;
    savings: number; // Savings from bundling
  } {
    const individualFees: UpdateCalculation[] = [];
    let totalFee = 0;

    // Calculate individual fees
    if (updates.whitelist) {
      const fee = this.calculateWhitelistUpdateFee(updates.whitelist.current, updates.whitelist.new);
      individualFees.push(fee);
      totalFee += fee.totalFee;
    }

    if (updates.pricing) {
      const fee = this.calculatePricingUpdateFee();
      individualFees.push(fee);
      totalFee += fee.totalFee;
    }

    if (updates.supply) {
      const fee = this.calculateSupplyUpdateFee(updates.supply.current, updates.supply.new);
      individualFees.push(fee);
      totalFee += fee.totalFee;
    }

    if (updates.metadata) {
      const fee = this.calculateMetadataUpdateFee();
      individualFees.push(fee);
      totalFee += fee.totalFee;
    }

    if (updates.whitelistPhases) {
      const fee = this.calculateWhitelistPhaseUpdateFee(updates.whitelistPhases.current, updates.whitelistPhases.new);
      individualFees.push(fee);
      totalFee += fee.totalFee;
    }

    // Apply bundling discount (10% off for multiple updates)
    const bundlingDiscount = individualFees.length > 1 ? totalFee * 0.1 : 0;
    const finalTotalFee = totalFee - bundlingDiscount;

    return {
      individualFees,
      totalFee: Math.round(finalTotalFee),
      platformRevenue: Math.round(finalTotalFee * 0.7),
      gasCosts: Math.round(finalTotalFee * 0.3),
      savings: Math.round(bundlingDiscount)
    };
  }

  /**
   * Convert $LOS fee to USD
   */
  losToUSD(amount: number): number {
    return amount * this.losToUSD;
  }

  /**
   * Update exchange rate
   */
  updateExchangeRate(newRate: number): void {
    this.losToUSD = newRate;
  }

  /**
   * Get fee breakdown for display
   */
  getFeeBreakdown(calculation: UpdateCalculation | { totalFee: number; platformRevenue: number; gasCosts: number }) {
    return {
      totalFeeLOS: calculation.totalFee,
      totalFeeUSD: this.losToUSD(calculation.totalFee),
      platformRevenueLOS: calculation.platformRevenue,
      platformRevenueUSD: this.losToUSD(calculation.platformRevenue),
      gasCostsLOS: calculation.gasCosts,
      gasCostsUSD: this.losToUSD(calculation.gasCosts)
    };
  }
}

export const updateFeeService = new UpdateFeeService();
