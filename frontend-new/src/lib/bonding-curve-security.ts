/**
 * Bonding Curve Security Service - Comprehensive security for bonding curve operations
 * Implements critical security measures to prevent manipulation and attacks
 */

export interface SecurityConfig {
  maxPriceImpact: number; // Maximum price impact allowed (default: 5%)
  maxTradeSize: number; // Maximum trade size as percentage of liquidity
  rateLimitPerMinute: number; // Maximum trades per wallet per minute
  rateLimitPerHour: number; // Maximum trades per wallet per hour
  minTradeSize: number; // Minimum trade size to prevent dust attacks
  maxConcurrentTrades: number; // Maximum concurrent trades per wallet
  emergencyPauseThreshold: number; // Threshold for emergency pause
  auditLogging: boolean; // Enable comprehensive audit logging
}

export interface TradeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  priceImpact: number;
  slippage: number;
  estimatedOutput: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'trade' | 'mint' | 'reveal' | 'admin' | 'error' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  wallet: string;
  action: string;
  amount?: number;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export class BondingCurveSecurityService {
  private securityConfig: SecurityConfig;
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private hourlyRateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private activeTrades: Map<string, number> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private emergencyPaused: boolean = false;

  constructor(config?: Partial<SecurityConfig>) {
    this.securityConfig = {
      maxPriceImpact: 0.05, // 5%
      maxTradeSize: 0.1, // 10% of liquidity
      rateLimitPerMinute: 10,
      rateLimitPerHour: 100,
      minTradeSize: 0.001, // 0.1% of liquidity
      maxConcurrentTrades: 3,
      emergencyPauseThreshold: 0.2, // 20% price impact
      auditLogging: true,
      ...config
    };
  }

  /**
   * Validate wallet address format and checksum
   */
  validateWalletAddress(address: string): { isValid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Invalid wallet address format' };
    }

    // Basic Solana address validation (base58, 32-44 characters)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(address)) {
      return { isValid: false, error: 'Invalid Solana wallet address format' };
    }

    // Additional checksum validation could be added here
    return { isValid: true };
  }

  /**
   * Check rate limiting for wallet
   */
  checkRateLimit(wallet: string): { allowed: boolean; error?: string } {
    const now = Date.now();
    const minuteKey = `minute_${wallet}`;
    const hourKey = `hour_${wallet}`;

    // Check minute rate limit
    const minuteLimit = this.rateLimitMap.get(minuteKey);
    if (!minuteLimit || now > minuteLimit.resetTime) {
      this.rateLimitMap.set(minuteKey, { count: 1, resetTime: now + 60000 });
    } else {
      if (minuteLimit.count >= this.securityConfig.rateLimitPerMinute) {
        return { 
          allowed: false, 
          error: `Rate limit exceeded. Maximum ${this.securityConfig.rateLimitPerMinute} trades per minute.` 
        };
      }
      minuteLimit.count++;
    }

    // Check hour rate limit
    const hourLimit = this.hourlyRateLimitMap.get(hourKey);
    if (!hourLimit || now > hourLimit.resetTime) {
      this.hourlyRateLimitMap.set(hourKey, { count: 1, resetTime: now + 3600000 });
    } else {
      if (hourLimit.count >= this.securityConfig.rateLimitPerHour) {
        return { 
          allowed: false, 
          error: `Hourly rate limit exceeded. Maximum ${this.securityConfig.rateLimitPerHour} trades per hour.` 
        };
      }
      hourLimit.count++;
    }

    return { allowed: true };
  }

  /**
   * Check concurrent trades limit
   */
  checkConcurrentTrades(wallet: string): { allowed: boolean; error?: string } {
    const currentTrades = this.activeTrades.get(wallet) || 0;
    
    if (currentTrades >= this.securityConfig.maxConcurrentTrades) {
      return { 
        allowed: false, 
        error: `Too many concurrent trades. Maximum ${this.securityConfig.maxConcurrentTrades} concurrent trades allowed.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Validate trade size against liquidity and limits
   */
  validateTradeSize(
    tradeAmount: number,
    totalLiquidity: number,
    isBuy: boolean
  ): { isValid: boolean; error?: string } {
    // Check minimum trade size
    const minSize = totalLiquidity * this.securityConfig.minTradeSize;
    if (tradeAmount < minSize) {
      return { 
        isValid: false, 
        error: `Trade amount too small. Minimum ${minSize.toFixed(6)} $LOS required.` 
      };
    }

    // Check maximum trade size
    const maxSize = totalLiquidity * this.securityConfig.maxTradeSize;
    if (tradeAmount > maxSize) {
      return { 
        isValid: false, 
        error: `Trade amount too large. Maximum ${maxSize.toFixed(2)} $LOS allowed.` 
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate and validate price impact
   */
  calculatePriceImpact(
    tradeAmount: number,
    currentPrice: number,
    virtualLOSReserves: number,
    virtualNFTSupply: number,
    isBuy: boolean
  ): { priceImpact: number; isValid: boolean; error?: string } {
    // Calculate new reserves after trade
    let newVirtualLOSReserves: number;
    let newVirtualNFTSupply: number;

    if (isBuy) {
      newVirtualLOSReserves = virtualLOSReserves + tradeAmount;
      const k = virtualLOSReserves * virtualNFTSupply;
      newVirtualNFTSupply = k / newVirtualLOSReserves;
    } else {
      newVirtualNFTSupply = virtualNFTSupply + tradeAmount;
      const k = virtualLOSReserves * virtualNFTSupply;
      newVirtualLOSReserves = k / newVirtualNFTSupply;
    }

    // Calculate new price
    const newPrice = newVirtualLOSReserves / newVirtualNFTSupply;
    
    // Calculate price impact
    const priceImpact = Math.abs((newPrice - currentPrice) / currentPrice);

    // Check if price impact is within limits
    if (priceImpact > this.securityConfig.maxPriceImpact) {
      return {
        priceImpact,
        isValid: false,
        error: `Price impact too high: ${(priceImpact * 100).toFixed(2)}%. Maximum ${(this.securityConfig.maxPriceImpact * 100).toFixed(2)}% allowed.`
      };
    }

    // Check for emergency pause threshold
    if (priceImpact > this.securityConfig.emergencyPauseThreshold) {
      this.triggerEmergencyPause(`Extreme price impact detected: ${(priceImpact * 100).toFixed(2)}%`);
      return {
        priceImpact,
        isValid: false,
        error: 'Emergency pause triggered due to extreme price impact.'
      };
    }

    return { priceImpact, isValid: true };
  }

  /**
   * Comprehensive trade validation
   */
  async validateTrade(params: {
    wallet: string;
    tradeAmount: number;
    isBuy: boolean;
    totalLiquidity: number;
    currentPrice: number;
    virtualLOSReserves: number;
    virtualNFTSupply: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<TradeValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let priceImpact = 0;

    try {
      // Check emergency pause
      if (this.emergencyPaused) {
        errors.push('System is currently paused for maintenance.');
        return { isValid: false, errors, warnings, priceImpact: 0, slippage: 0, estimatedOutput: 0 };
      }

      // Validate wallet address
      const walletValidation = this.validateWalletAddress(params.wallet);
      if (!walletValidation.isValid) {
        errors.push(walletValidation.error || 'Invalid wallet address');
      }

      // Check rate limits
      const rateLimitCheck = this.checkRateLimit(params.wallet);
      if (!rateLimitCheck.allowed) {
        errors.push(rateLimitCheck.error || 'Rate limit exceeded');
      }

      // Check concurrent trades
      const concurrentCheck = this.checkConcurrentTrades(params.wallet);
      if (!concurrentCheck.allowed) {
        errors.push(concurrentCheck.error || 'Too many concurrent trades');
      }

      // Validate trade size
      const sizeValidation = this.validateTradeSize(params.tradeAmount, params.totalLiquidity, params.isBuy);
      if (!sizeValidation.isValid) {
        errors.push(sizeValidation.error || 'Invalid trade size');
      }

      // Calculate and validate price impact
      const priceImpactResult = this.calculatePriceImpact(
        params.tradeAmount,
        params.currentPrice,
        params.virtualLOSReserves,
        params.virtualNFTSupply,
        params.isBuy
      );
      
      priceImpact = priceImpactResult.priceImpact;
      
      if (!priceImpactResult.isValid) {
        errors.push(priceImpactResult.error || 'Price impact validation failed');
      }

      // Log security event
      this.logSecurityEvent({
        type: 'trade',
        severity: errors.length > 0 ? 'high' : 'medium',
        wallet: params.wallet,
        action: params.isBuy ? 'buy_attempt' : 'sell_attempt',
        amount: params.tradeAmount,
        details: `Trade validation: ${errors.length} errors, ${warnings.length} warnings`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });

      // Calculate estimated output (simplified)
      const estimatedOutput = params.isBuy 
        ? params.tradeAmount / params.currentPrice
        : params.tradeAmount * params.currentPrice;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        priceImpact,
        slippage: priceImpact,
        estimatedOutput
      };

    } catch (error) {
      this.logSecurityEvent({
        type: 'error',
        severity: 'critical',
        wallet: params.wallet,
        action: 'trade_validation_error',
        details: `Trade validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });

      return {
        isValid: false,
        errors: ['Trade validation failed due to system error'],
        warnings: [],
        priceImpact: 0,
        slippage: 0,
        estimatedOutput: 0
      };
    }
  }

  /**
   * Start trade execution (track concurrent trades)
   */
  startTrade(wallet: string): void {
    const currentTrades = this.activeTrades.get(wallet) || 0;
    this.activeTrades.set(wallet, currentTrades + 1);
  }

  /**
   * End trade execution (release concurrent trade slot)
   */
  endTrade(wallet: string): void {
    const currentTrades = this.activeTrades.get(wallet) || 0;
    if (currentTrades > 0) {
      this.activeTrades.set(wallet, currentTrades - 1);
    }
  }

  /**
   * Trigger emergency pause
   */
  triggerEmergencyPause(reason: string): void {
    this.emergencyPaused = true;
    
    this.logSecurityEvent({
      type: 'security',
      severity: 'critical',
      wallet: 'system',
      action: 'emergency_pause',
      details: `Emergency pause triggered: ${reason}`
    });

    // In a real implementation, this would:
    // 1. Notify administrators immediately
    // 2. Pause all trading operations
    // 3. Log the incident
    // 4. Prepare for investigation
  }

  /**
   * Release emergency pause
   */
  releaseEmergencyPause(reason: string): void {
    this.emergencyPaused = false;
    
    this.logSecurityEvent({
      type: 'admin',
      severity: 'high',
      wallet: 'system',
      action: 'emergency_pause_release',
      details: `Emergency pause released: ${reason}`
    });
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    if (!this.securityConfig.auditLogging) return;

    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 10000 events to prevent memory issues
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    // In a real implementation, this would:
    // 1. Send to external logging service
    // 2. Alert on critical events
    // 3. Store in secure database
    console.log('🔒 Security Event:', securityEvent);
  }

  /**
   * Get security events (for monitoring)
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    emergencyPaused: boolean;
    activeTrades: number;
    rateLimitViolations: number;
  } {
    const criticalEvents = this.securityEvents.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = this.securityEvents.filter(e => e.severity === 'high').length;
    const activeTrades = Array.from(this.activeTrades.values()).reduce((sum, count) => sum + count, 0);
    const rateLimitViolations = this.securityEvents.filter(e => e.action.includes('rate_limit')).length;

    return {
      totalEvents: this.securityEvents.length,
      criticalEvents,
      highSeverityEvents,
      emergencyPaused: this.emergencyPaused,
      activeTrades,
      rateLimitViolations
    };
  }

  /**
   * Clear old rate limit data (cleanup)
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    
    // Clean minute rate limits
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }

    // Clean hourly rate limits
    for (const [key, value] of this.hourlyRateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.hourlyRateLimitMap.delete(key);
      }
    }
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potentially dangerous characters
    const sanitized = input
      .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
      .replace(/[^\w\s\-_.,!?]/g, '') // Keep only safe characters
      .trim()
      .substring(0, maxLength);
    
    return sanitized;
  }

  /**
   * Validate numeric input
   */
  validateNumericInput(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): { isValid: boolean; error?: string } {
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
      return { isValid: false, error: 'Invalid numeric value' };
    }
    
    if (num < min) {
      return { isValid: false, error: `Value must be at least ${min}` };
    }
    
    if (num > max) {
      return { isValid: false, error: `Value must be at most ${max}` };
    }
    
    return { isValid: true };
  }
}

export const bondingCurveSecurity = new BondingCurveSecurityService();
