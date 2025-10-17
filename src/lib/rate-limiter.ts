// Rate limiting system for API endpoints and functions
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  SAVE_COLLECTION: { windowMs: 5 * 60 * 1000, maxRequests: 1 }, // 1 save per 5 minutes
  LOAD_COLLECTIONS: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 loads per minute
  DELETE_COLLECTION: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 deletes per minute
  UPLOAD_IMAGES: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 uploads per minute
  VERIFY_SOCIAL: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 verifications per minute
  
  // User actions
  PROFILE_UPDATE: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 updates per 5 minutes
  WALLET_CONNECT: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 connections per minute
  
  // General API
  GENERAL_API: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
} as const;

export class RateLimiter {
  private static instance: RateLimiter;
  private store = rateLimitStore;

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(
    identifier: string, 
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
    const now = Date.now();
    const key = `${identifier}:${config.windowMs}`;
    
    let entry = this.store.get(key);
    
    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      this.store.delete(key);
      entry = undefined;
    }
    
    // Create new entry if none exists
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
      this.store.set(key, entry);
    }
    
    // Check if blocked
    if (entry.blocked && now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message: config.message || 'Rate limit exceeded. Please try again later.'
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      entry.blocked = true;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        message: config.message || 'Rate limit exceeded. Please try again later.'
      };
    }
    
    // Increment counter
    entry.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  resetLimit(identifier: string, windowMs?: number): void {
    if (windowMs) {
      this.store.delete(`${identifier}:${windowMs}`);
    } else {
      // Reset all windows for this identifier
      for (const key of this.store.keys()) {
        if (key.startsWith(`${identifier}:`)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string, config: RateLimitConfig): {
    count: number;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } {
    const key = `${identifier}:${config.windowMs}`;
    const entry = this.store.get(key);
    const now = Date.now();
    
    if (!entry || now > entry.resetTime) {
      return {
        count: 0,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        blocked: false
      };
    }
    
    return {
      count: entry.count,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      blocked: entry.blocked
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // Add user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = btoa(userAgent).slice(0, 8);
  
  return `${ip}:${userAgentHash}`;
}

// Helper function to get wallet-based identifier
export function getWalletIdentifier(walletAddress: string): string {
  return `wallet:${walletAddress}`;
}

// Rate limiting middleware for API routes
export function withRateLimit(
  config: RateLimitConfig,
  getIdentifier: (request: Request) => string = getClientIdentifier
) {
  return function(handler: Function) {
    return async function(request: Request, ...args: any[]) {
      const identifier = getIdentifier(request);
      const rateLimiter = RateLimiter.getInstance();
      
      const result = rateLimiter.checkLimit(identifier, config);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({ 
            error: result.message,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString()
            }
          }
        );
      }
      
      // Add rate limit headers to response
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      }
      
      return response;
    };
  };
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  RateLimiter.getInstance().cleanup();
}, 5 * 60 * 1000);