/**
 * RATE LIMITING MIDDLEWARE
 * Prevents DoS attacks and abuse
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is rate limited
   * @param identifier - Unique identifier (IP, wallet, etc.)
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${this.config.windowMs}-${this.config.maxRequests}-${identifier}`;

    if (!store[key] || store[key].resetTime < now) {
      // First request or window expired
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: store[key].resetTime
      };
    }

    // Increment count
    store[key].count++;

    if (store[key].count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - store[key].count,
      resetTime: store[key].resetTime
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict rate limit for sensitive operations
  strict: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10 // 10 requests per 15 minutes
  }),

  // Standard rate limit for API calls
  standard: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  }),

  // Relaxed rate limit for read operations
  relaxed: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 120 // 120 requests per minute
  }),

  // Admin operations
  admin: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  })
};

/**
 * Get identifier from request (IP or wallet)
 */
export function getRequestIdentifier(request: Request): string {
  // Try to get wallet from cookie
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const walletMatch = cookies.match(/user-wallet=([^;]+)/);
    if (walletMatch) {
      return `wallet:${walletMatch[1]}`;
    }
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: RateLimiter = rateLimiters.standard
) {
  return async (request: Request) => {
    const identifier = getRequestIdentifier(request);
    const { allowed, remaining, resetTime } = limiter.check(identifier);

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetTime: new Date(resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(resetTime).toISOString()
          }
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request);
    response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return response;
  };
}

