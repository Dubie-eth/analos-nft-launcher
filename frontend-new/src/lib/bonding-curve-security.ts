/**
 * Bonding Curve Security Service
 * Protects against gaming, MEV attacks, and manipulation
 */

export interface SecurityConfig {
  maxTradeSizePercentage: number; // Max % of total supply per trade
  maxTradeSizeAbsolute: number; // Max absolute number of NFTs per trade
  slippageProtectionPercentage: number; // Max price impact allowed
  cooldownPeriodMs: number; // Time between large trades
  maxDailyVolumePerWallet: number; // Max volume per wallet per day
  frontRunProtectionMs: number; // Time window for front-run protection
  minimumTradeSize: number; // Minimum trade size to prevent dust attacks
  maximumPriceImpact: number; // Maximum price impact percentage
}

export interface TradeLimits {
  wallet: string;
  lastTradeTime: number;
  dailyVolume: number;
  dailyTradeCount: number;
  isCooldownActive: boolean;
}

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  cooldownRemaining?: number;
  maxAllowedSize?: number;
}

export class BondingCurveSecurity {
  private tradeLimits: Map<string, TradeLimits> = new Map();
  private readonly DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    maxTradeSizePercentage: 5, // Max 5% of supply per trade
    maxTradeSizeAbsolute: 100, // Max 100 NFTs per trade
    slippageProtectionPercentage: 10, // Max 10% price impact
    cooldownPeriodMs: 300000, // 5 minutes between large trades
    maxDailyVolumePerWallet: 100000, // Max $100k volume per wallet per day
    frontRunProtectionMs: 10000, // 10 seconds front-run protection
    minimumTradeSize: 1, // Minimum 1 NFT
    maximumPriceImpact: 50 // Max 50% price impact
  };

  constructor() {
    console.log('🛡️ Bonding Curve Security initialized');
  }

  /**
   * Check if a trade is allowed based on security rules
   */
  checkTradeAllowed(
    walletAddress: string,
    tradeSize: number,
    totalSupply: number,
    priceImpact: number,
    tradeValue: number,
    config: SecurityConfig = this.DEFAULT_SECURITY_CONFIG
  ): SecurityCheckResult {
    const now = Date.now();
    const walletLimits = this.getOrCreateWalletLimits(walletAddress);

    // 1. Check minimum trade size
    if (tradeSize < config.minimumTradeSize) {
      return {
        allowed: false,
        reason: `Trade size too small. Minimum: ${config.minimumTradeSize} NFTs`
      };
    }

    // 2. Check maximum trade size (percentage)
    const maxSizeByPercentage = Math.floor((totalSupply * config.maxTradeSizePercentage) / 100);
    const maxSize = Math.min(config.maxTradeSizeAbsolute, maxSizeByPercentage);
    
    if (tradeSize > maxSize) {
      return {
        allowed: false,
        reason: `Trade size too large. Maximum: ${maxSize} NFTs (${config.maxTradeSizePercentage}% of supply)`,
        maxAllowedSize: maxSize
      };
    }

    // 3. Check price impact
    if (priceImpact > config.maximumPriceImpact) {
      return {
        allowed: false,
        reason: `Price impact too high: ${priceImpact.toFixed(2)}%. Maximum: ${config.maximumPriceImpact}%`
      };
    }

    // 4. Check cooldown period for large trades
    if (tradeSize > (maxSize * 0.5)) { // Large trade = more than 50% of max allowed
      if (walletLimits.isCooldownActive && (now - walletLimits.lastTradeTime) < config.cooldownPeriodMs) {
        const cooldownRemaining = config.cooldownPeriodMs - (now - walletLimits.lastTradeTime);
        return {
          allowed: false,
          reason: `Large trade cooldown active. Wait ${Math.ceil(cooldownRemaining / 1000)} seconds`,
          cooldownRemaining
        };
      }
    }

    // 5. Check daily volume limits
    if (walletLimits.dailyVolume + tradeValue > config.maxDailyVolumePerWallet) {
      return {
        allowed: false,
        reason: `Daily volume limit exceeded. Current: $${walletLimits.dailyVolume.toFixed(2)}, Limit: $${config.maxDailyVolumePerWallet}`
      };
    }

    // 6. Check daily trade count (prevent spam)
    if (walletLimits.dailyTradeCount >= 100) {
      return {
        allowed: false,
        reason: `Daily trade limit exceeded. Maximum: 100 trades per day`
      };
    }

    return { allowed: true };
  }

  /**
   * Record a successful trade for security tracking
   */
  recordTrade(
    walletAddress: string,
    tradeSize: number,
    tradeValue: number,
    config: SecurityConfig = this.DEFAULT_SECURITY_CONFIG
  ): void {
    const walletLimits = this.getOrCreateWalletLimits(walletAddress);
    const now = Date.now();

    // Reset daily limits if new day
    if (this.isNewDay(walletLimits.lastTradeTime, now)) {
      walletLimits.dailyVolume = 0;
      walletLimits.dailyTradeCount = 0;
      walletLimits.isCooldownActive = false;
    }

    // Update trade data
    walletLimits.lastTradeTime = now;
    walletLimits.dailyVolume += tradeValue;
    walletLimits.dailyTradeCount += 1;

    // Set cooldown for large trades
    const maxSize = Math.min(config.maxTradeSizeAbsolute, Math.floor((1000 * config.maxTradeSizePercentage) / 100));
    if (tradeSize > (maxSize * 0.5)) {
      walletLimits.isCooldownActive = true;
    }

    this.tradeLimits.set(walletAddress, walletLimits);
    
    console.log(`📊 Trade recorded for ${walletAddress}: ${tradeSize} NFTs, $${tradeValue.toFixed(2)}`);
  }

  /**
   * Get or create wallet limits
   */
  private getOrCreateWalletLimits(walletAddress: string): TradeLimits {
    if (!this.tradeLimits.has(walletAddress)) {
      this.tradeLimits.set(walletAddress, {
        wallet: walletAddress,
        lastTradeTime: 0,
        dailyVolume: 0,
        dailyTradeCount: 0,
        isCooldownActive: false
      });
    }
    return this.tradeLimits.get(walletAddress)!;
  }

  /**
   * Check if it's a new day
   */
  private isNewDay(lastTradeTime: number, currentTime: number): boolean {
    const lastDay = new Date(lastTradeTime).getDate();
    const currentDay = new Date(currentTime).getDate();
    const lastMonth = new Date(lastTradeTime).getMonth();
    const currentMonth = new Date(currentTime).getMonth();
    const lastYear = new Date(lastTradeTime).getFullYear();
    const currentYear = new Date(currentTime).getFullYear();

    return lastDay !== currentDay || lastMonth !== currentMonth || lastYear !== currentYear;
  }

  /**
   * Get wallet trade statistics
   */
  getWalletStats(walletAddress: string): TradeLimits | null {
    return this.tradeLimits.get(walletAddress) || null;
  }

  /**
   * Reset wallet limits (admin function)
   */
  resetWalletLimits(walletAddress: string): void {
    this.tradeLimits.delete(walletAddress);
    console.log(`🔄 Reset trade limits for wallet: ${walletAddress}`);
  }

  /**
   * Get all suspicious wallets (high volume, frequent trades)
   */
  getSuspiciousWallets(): Array<{wallet: string; stats: TradeLimits; riskScore: number}> {
    const suspicious: Array<{wallet: string; stats: TradeLimits; riskScore: number}> = [];

    for (const [wallet, stats] of this.tradeLimits) {
      let riskScore = 0;

      // High daily volume
      if (stats.dailyVolume > 50000) riskScore += 3;
      else if (stats.dailyVolume > 25000) riskScore += 2;
      else if (stats.dailyVolume > 10000) riskScore += 1;

      // High trade frequency
      if (stats.dailyTradeCount > 50) riskScore += 2;
      else if (stats.dailyTradeCount > 20) riskScore += 1;

      // Recent cooldown
      if (stats.isCooldownActive) riskScore += 1;

      if (riskScore >= 3) {
        suspicious.push({ wallet, stats, riskScore });
      }
    }

    return suspicious.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Emergency pause all trading for a wallet
   */
  emergencyPauseWallet(walletAddress: string): void {
    const limits = this.getOrCreateWalletLimits(walletAddress);
    limits.isCooldownActive = true;
    limits.lastTradeTime = Date.now();
    this.tradeLimits.set(walletAddress, limits);
    console.log(`🚨 EMERGENCY PAUSE: Trading suspended for wallet ${walletAddress}`);
  }
}

export const bondingCurveSecurity = new BondingCurveSecurity();