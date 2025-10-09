/**
 * Bonding Curve Service - NFT bonding curve system similar to pump.fun
 * Uses $LOS pairing with DLMM-like structure for NFT trading
 * Integrated with comprehensive security measures and escrow wallet system
 */

import { bondingCurveSecurity } from './bonding-curve-security';
import { escrowWalletService } from './escrow-wallet-service';
import { bondingCurveWhitelistService } from './bonding-curve-whitelist-service';
import { bondingCurveCollectionManager } from './bonding-curve-collection-manager';

export interface BondingCurveConfig {
  virtualLOSReserves: number; // Virtual $LOS reserves
  virtualNFTSupply: number; // Virtual NFT supply
  realNFTSupply: number; // Real NFT supply (starts at 0)
  bondingCap: number; // Maximum bonding cap for reveal
  feePercentage: number; // Trading fee percentage
  creatorFeePercentage: number; // Creator fee percentage
  platformFeePercentage: number; // Platform fee percentage
}

export interface BondingCurveState {
  currentPrice: number; // Current price per NFT in $LOS
  totalLOSRaised: number; // Total $LOS raised
  totalNFTsMinted: number; // Total NFTs minted
  progressToReveal: number; // Progress to bonding cap (0-1)
  isRevealed: boolean; // Whether NFTs have been revealed
  virtualLOSReserves: number;
  virtualNFTSupply: number;
  realNFTSupply: number;
}

export interface TradingQuote {
  inputAmount: number; // Amount of $LOS to spend
  outputAmount: number; // Amount of NFTs to receive
  priceImpact: number; // Price impact percentage
  fee: number; // Trading fee
  creatorFee: number; // Creator fee
  platformFee: number; // Platform fee
  netAmount: number; // Net amount after fees
}

export interface SellQuote {
  inputAmount: number; // Amount of NFTs to sell
  outputAmount: number; // Amount of $LOS to receive
  priceImpact: number; // Price impact percentage
  fee: number; // Trading fee
  creatorFee: number; // Creator fee
  platformFee: number; // Platform fee
  netAmount: number; // Net amount after fees
}

export interface BondingCurveCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  creator: string;
  config: BondingCurveConfig;
  state: BondingCurveState;
  createdAt: string;
  totalVolume: number; // Total trading volume in $LOS
  totalTrades: number; // Total number of trades
}

export class BondingCurveService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';
  }

  /**
   * Create default bonding curve configuration
   */
  createDefaultConfig(): BondingCurveConfig {
    return {
      virtualLOSReserves: 30000000, // 30M $LOS virtual reserves
      virtualNFTSupply: 1000000000, // 1B virtual NFT supply
      realNFTSupply: 0, // Start with 0 real NFTs
      bondingCap: 10000000, // 10M $LOS bonding cap
      feePercentage: 1.0, // 1% trading fee
      creatorFeePercentage: 0.5, // 0.5% creator fee
      platformFeePercentage: 0.5, // 0.5% platform fee
    };
  }

  /**
   * Calculate current NFT price using constant product formula
   * Price = VirtualLOSReserves / VirtualNFTSupply
   */
  calculateCurrentPrice(config: BondingCurveConfig, realNFTSupply: number): number {
    const k = config.virtualLOSReserves * config.virtualNFTSupply;
    const currentVirtualNFTSupply = config.virtualNFTSupply - realNFTSupply;
    const currentVirtualLOSReserves = k / currentVirtualNFTSupply;
    
    return currentVirtualLOSReserves / currentVirtualNFTSupply;
  }

  /**
   * Calculate bonding curve state
   */
  calculateBondingCurveState(config: BondingCurveConfig, totalLOSRaised: number, totalNFTsMinted: number): BondingCurveState {
    const currentPrice = this.calculateCurrentPrice(config, totalNFTsMinted);
    const progressToReveal = Math.min(totalLOSRaised / config.bondingCap, 1);
    const isRevealed = progressToReveal >= 1;

    // Update virtual reserves based on real trading
    const k = config.virtualLOSReserves * config.virtualNFTSupply;
    const currentVirtualNFTSupply = config.virtualNFTSupply - totalNFTsMinted;
    const currentVirtualLOSReserves = k / currentVirtualNFTSupply;

    return {
      currentPrice,
      totalLOSRaised,
      totalNFTsMinted,
      progressToReveal,
      isRevealed,
      virtualLOSReserves: currentVirtualLOSReserves,
      virtualNFTSupply: currentVirtualNFTSupply,
      realNFTSupply: totalNFTsMinted
    };
  }

  /**
   * Calculate buy quote (LOS to NFTs)
   */
  calculateBuyQuote(
    config: BondingCurveConfig,
    state: BondingCurveState,
    losAmount: number
  ): TradingQuote {
    // Calculate output using constant product formula
    const k = state.virtualLOSReserves * state.virtualNFTSupply;
    const newVirtualLOSReserves = state.virtualLOSReserves + losAmount;
    const newVirtualNFTSupply = k / newVirtualLOSReserves;
    const outputAmount = state.virtualNFTSupply - newVirtualNFTSupply;

    // Calculate price impact
    const priceBefore = state.currentPrice;
    const priceAfter = newVirtualLOSReserves / newVirtualNFTSupply;
    const priceImpact = ((priceAfter - priceBefore) / priceBefore) * 100;

    // Calculate fees
    const fee = (losAmount * config.feePercentage) / 100;
    const creatorFee = (losAmount * config.creatorFeePercentage) / 100;
    const platformFee = (losAmount * config.platformFeePercentage) / 100;
    const netAmount = losAmount - fee - creatorFee - platformFee;

    return {
      inputAmount: losAmount,
      outputAmount,
      priceImpact,
      fee,
      creatorFee,
      platformFee,
      netAmount
    };
  }

  /**
   * Calculate sell quote (NFTs to LOS)
   */
  calculateSellQuote(
    config: BondingCurveConfig,
    state: BondingCurveState,
    nftAmount: number
  ): SellQuote {
    // Calculate output using constant product formula
    const k = state.virtualLOSReserves * state.virtualNFTSupply;
    const newVirtualNFTSupply = state.virtualNFTSupply + nftAmount;
    const newVirtualLOSReserves = k / newVirtualNFTSupply;
    const outputAmount = state.virtualLOSReserves - newVirtualLOSReserves;

    // Calculate price impact
    const priceBefore = state.currentPrice;
    const priceAfter = newVirtualLOSReserves / newVirtualNFTSupply;
    const priceImpact = ((priceBefore - priceAfter) / priceBefore) * 100;

    // Calculate fees
    const fee = (outputAmount * config.feePercentage) / 100;
    const creatorFee = (outputAmount * config.creatorFeePercentage) / 100;
    const platformFee = (outputAmount * config.platformFeePercentage) / 100;
    const netAmount = outputAmount - fee - creatorFee - platformFee;

    return {
      inputAmount: nftAmount,
      outputAmount,
      priceImpact,
      fee,
      creatorFee,
      platformFee,
      netAmount
    };
  }

  /**
   * Calculate price at specific supply level
   */
  calculatePriceAtSupply(config: BondingCurveConfig, supply: number): number {
    const k = config.virtualLOSReserves * config.virtualNFTSupply;
    const virtualNFTSupply = config.virtualNFTSupply - supply;
    const virtualLOSReserves = k / virtualNFTSupply;
    
    return virtualLOSReserves / virtualNFTSupply;
  }

  /**
   * Get price chart data for bonding curve
   */
  getPriceChartData(config: BondingCurveConfig, maxSupply: number = 1000): Array<{supply: number; price: number}> {
    const data = [];
    const step = maxSupply / 100; // 100 data points

    for (let i = 0; i <= 100; i++) {
      const supply = i * step;
      const price = this.calculatePriceAtSupply(config, supply);
      data.push({ supply, price });
    }

    return data;
  }

  /**
   * Create bonding curve collection
   */
  async createBondingCurveCollection(collectionData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    creator: string;
    config?: Partial<BondingCurveConfig>;
  }): Promise<BondingCurveCollection> {
    const config = { ...this.createDefaultConfig(), ...collectionData.config };
    const initialState = this.calculateBondingCurveState(config, 0, 0);

    const collection: BondingCurveCollection = {
      id: `bonding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      imageUrl: collectionData.imageUrl,
      creator: collectionData.creator,
      config,
      state: initialState,
      createdAt: new Date().toISOString(),
      totalVolume: 0,
      totalTrades: 0
    };

    // TODO: Save to backend
    console.log('Creating bonding curve collection:', collection);
    
    return collection;
  }

  /**
   * Execute buy trade with comprehensive security validation
   */
  async executeBuyTrade(
    collectionId: string,
    losAmount: number,
    userWallet: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    nftsReceived: number;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Get collection data
      const collection = await this.getBondingCurveCollection(collectionId);
      if (!collection) {
        return {
          success: false,
          nftsReceived: 0,
          error: 'Collection not found'
        };
      }

      // Check whitelist eligibility and get pricing
      const whitelistPricing = bondingCurveWhitelistService.getBondingCurvePrice(
        collectionId,
        collection.state.currentPrice,
        userWallet
      );

      // Use whitelist price if available, otherwise use base price
      const effectivePrice = whitelistPricing.isWhitelistActive ? whitelistPricing.price : collection.state.currentPrice;
      const adjustedLosAmount = (losAmount / collection.state.currentPrice) * effectivePrice;

      // Calculate quote with adjusted amount
      const quote = this.calculateBuyQuote(collection.config, collection.state, adjustedLosAmount);
      
      // Comprehensive security validation using new security service
      const securityCheck = bondingCurveSecurity.checkTradeAllowed(
        userWallet,
        quote.outputAmount,
        collection.config.virtualNFTSupply,
        quote.priceImpact,
        adjustedLosAmount
      );

      if (!securityCheck.allowed) {
        return {
          success: false,
          nftsReceived: 0,
          error: securityCheck.reason || 'Security check failed'
        };
      }

      try {
        // Execute bonding curve mint using collection manager
        const mintResult = await bondingCurveCollectionManager.executeBondingCurveMint(
          collectionId,
          userWallet,
          adjustedLosAmount,
          Math.floor(quote.outputAmount)
        );

        if (mintResult.success) {
          // Deposit fees to escrow wallet
          if (quote.fee > 0) {
            await escrowWalletService.depositToEscrow(
              'bonding_curve',
              quote.fee,
              collectionId
            );
            console.log(`💰 Deposited ${quote.fee} $LOS to bonding curve escrow`);
          }
          
          // Record trade for security tracking
          bondingCurveSecurity.recordTrade(userWallet, quote.outputAmount, adjustedLosAmount);
          
          console.log('Executing secure buy trade:', { 
            collectionId, 
            losAmount: adjustedLosAmount, 
            userWallet, 
            priceImpact: quote.priceImpact,
            nftsReceived: quote.outputAmount,
            revealTriggered: mintResult.revealTriggered
          });
          
          return {
            success: true,
            nftsReceived: quote.outputAmount,
            transactionHash: mintResult.transactionHash,
            revealTriggered: mintResult.revealTriggered
          };
        } else {
          return {
            success: false,
            nftsReceived: 0,
            error: mintResult.error || 'Minting failed'
          };
        }
      } catch (tradeError) {
        console.error('Trade execution failed:', tradeError);
        throw tradeError;
      }
    } catch (error) {
      return {
        success: false,
        nftsReceived: 0,
        error: error instanceof Error ? error.message : 'Trade failed'
      };
    }
  }

  /**
   * Execute sell trade with comprehensive security validation
   */
  async executeSellTrade(
    collectionId: string,
    nftAmount: number,
    userWallet: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    losReceived: number;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Get collection data
      const collection = await this.getBondingCurveCollection(collectionId);
      if (!collection) {
        return {
          success: false,
          losReceived: 0,
          error: 'Collection not found'
        };
      }

      // Convert NFT amount to $LOS equivalent for validation
      const losEquivalent = nftAmount * collection.state.currentPrice;

      // Comprehensive security validation
      const validation = await bondingCurveSecurity.validateTrade({
        wallet: userWallet,
        tradeAmount: losEquivalent,
        isBuy: false,
        totalLiquidity: collection.state.virtualLOSReserves,
        currentPrice: collection.state.currentPrice,
        virtualLOSReserves: collection.state.virtualLOSReserves,
        virtualNFTSupply: collection.state.virtualNFTSupply,
        ipAddress,
        userAgent
      });

      if (!validation.isValid) {
        return {
          success: false,
          losReceived: 0,
          error: validation.errors.join(', ')
        };
      }

      // Start trade tracking
      bondingCurveSecurity.startTrade(userWallet);

      try {
        // Calculate quote with security-validated parameters
        const quote = this.calculateSellQuote(collection.config, collection.state, nftAmount);
        
        // Additional security checks
        if (quote.priceImpact > 0.05) { // 5% max price impact
          throw new Error('Price impact too high. Trade rejected for security.');
        }

        // TODO: Implement actual blockchain transaction
        // This would involve:
        // 1. Validate user has sufficient NFTs
        // 2. Execute trade on bonding curve
        // 3. Burn NFTs from user
        // 4. Transfer $LOS to user
        // 5. Update bonding curve state

        console.log('Executing secure sell trade:', { 
          collectionId, 
          nftAmount, 
          userWallet, 
          priceImpact: quote.priceImpact,
          losReceived: quote.netAmount
        });
        
        // Simulate trade execution
        const transactionHash = `secure_sell_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          success: true,
          losReceived: quote.netAmount,
          transactionHash
        };
      } finally {
        // Always end trade tracking
        bondingCurveSecurity.endTrade(userWallet);
      }
    } catch (error) {
      return {
        success: false,
        losReceived: 0,
        error: error instanceof Error ? error.message : 'Trade failed'
      };
    }
  }

  /**
   * Get bonding curve collection
   */
  async getBondingCurveCollection(collectionId: string): Promise<BondingCurveCollection | null> {
    try {
      // TODO: Fetch from backend
      console.log('Fetching bonding curve collection:', collectionId);
      return null;
    } catch (error) {
      console.error('Error fetching bonding curve collection:', error);
      return null;
    }
  }

  /**
   * Get all bonding curve collections
   */
  async getAllBondingCurveCollections(): Promise<BondingCurveCollection[]> {
    try {
      // TODO: Fetch from backend
      console.log('Fetching all bonding curve collections');
      return [];
    } catch (error) {
      console.error('Error fetching bonding curve collections:', error);
      return [];
    }
  }

  /**
   * Calculate bonding curve metrics
   */
  calculateMetrics(state: BondingCurveState): {
    marketCap: number;
    fullyDilutedValuation: number;
    liquidity: number;
    priceChange24h: number;
    volume24h: number;
  } {
    const marketCap = state.totalLOSRaised;
    const fullyDilutedValuation = state.virtualLOSReserves;
    const liquidity = state.virtualLOSReserves;
    
    return {
      marketCap,
      fullyDilutedValuation,
      liquidity,
      priceChange24h: 0, // TODO: Calculate from historical data
      volume24h: 0 // TODO: Calculate from trading history
    };
  }
}

export const bondingCurveService = new BondingCurveService();
