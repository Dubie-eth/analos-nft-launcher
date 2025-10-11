/**
 * Security Configuration for Analos Blockchain Integration
 * 
 * This file contains all security-related configurations and constants
 * that ensure the platform operates with maximum security.
 */

export const SECURITY_CONFIG = {
  // Rate Limiting
  RATE_LIMITS: {
    API_CALLS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    },
    WALLET_OPERATIONS: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // limit each IP to 10 wallet operations per 5 minutes
      message: 'Too many wallet operations, please try again later.'
    },
    DEPLOYMENT: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit each IP to 3 deployments per hour
      message: 'Too many deployment attempts, please try again later.'
    }
  },

  // Transaction Limits
  TRANSACTION_LIMITS: {
    MAX_TRANSACTION_VALUE: 1000000, // Maximum transaction value in lamports
    MAX_DAILY_VOLUME: 10000000, // Maximum daily volume per wallet
    MIN_CONFIRMATION_TIME: 30, // Minimum seconds to wait for confirmation
    MAX_RETRY_ATTEMPTS: 3 // Maximum retry attempts for failed transactions
  },

  // Wallet Security
  WALLET_SECURITY: {
    MIN_BALANCE_REQUIRED: 1000000, // Minimum balance required (1 SOL)
    MAX_WALLET_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    REQUIRED_CONFIRMATIONS: 2, // Required confirmations for transactions
    VALIDATION_TIMEOUT: 30000 // 30 seconds timeout for wallet validation
  },

  // Smart Contract Security
  SMART_CONTRACT: {
    MAX_GAS_LIMIT: 10000000, // Maximum gas limit
    GAS_PRICE_MULTIPLIER: 1.1, // 10% buffer for gas price
    CONTRACT_VERIFICATION_REQUIRED: true,
    EMERGENCY_PAUSE_ENABLED: true
  },

  // API Security
  API_SECURITY: {
    CORS_ORIGINS: [
      'https://analos-nft-launcher.vercel.app',
      'https://launchonlos.fun',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    MAX_REQUEST_SIZE: '50mb',
    TIMEOUT: 30000 // 30 seconds
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
    ITERATIONS: 100000
  },

  // Monitoring
  MONITORING: {
    LOG_LEVEL: 'info',
    LOG_RETENTION_DAYS: 30,
    ALERT_THRESHOLDS: {
      FAILED_TRANSACTIONS: 5,
      SUSPICIOUS_ACTIVITY: 3,
      HIGH_VOLUME: 1000000
    }
  },

  // Backup
  BACKUP: {
    FREQUENCY: 'daily',
    RETENTION_DAYS: 90,
    ENCRYPTION_REQUIRED: true,
    MULTIPLE_LOCATIONS: true
  }
} as const;

/**
 * Admin wallet addresses that have elevated privileges
 * These should be carefully managed and regularly rotated
 */
export const AUTHORIZED_ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Primary admin wallet
  // Add additional admin wallets here
] as const;

/**
 * Emergency contacts for security incidents
 */
export const SECURITY_CONTACTS = {
  PRIMARY: 'security@analos.io',
  EMERGENCY: '+1-XXX-XXX-XXXX',
  TECHNICAL: 'tech@analos.io'
} as const;

/**
 * Security event types for monitoring
 */
export const SECURITY_EVENTS = {
  WALLET_CONNECTED: 'wallet_connected',
  TRANSACTION_INITIATED: 'transaction_initiated',
  TRANSACTION_COMPLETED: 'transaction_completed',
  TRANSACTION_FAILED: 'transaction_failed',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ADMIN_ACTION: 'admin_action',
  SECURITY_BREACH: 'security_breach'
} as const;

/**
 * Validate if a wallet address is authorized for admin operations
 */
export function isAuthorizedAdminWallet(walletAddress: string): boolean {
  return AUTHORIZED_ADMIN_WALLETS.includes(walletAddress as any);
}

/**
 * Get security configuration for a specific operation type
 */
export function getSecurityConfig(operationType: keyof typeof SECURITY_CONFIG) {
  return SECURITY_CONFIG[operationType];
}

/**
 * Check if an operation is within security limits
 */
export function isWithinSecurityLimits(
  operationType: keyof typeof SECURITY_CONFIG,
  value: number,
  currentUsage?: number
): boolean {
  const config = SECURITY_CONFIG[operationType];
  
  if ('max' in config && currentUsage !== undefined) {
    return currentUsage < config.max;
  }
  
  if ('MAX_TRANSACTION_VALUE' in config) {
    return value <= config.MAX_TRANSACTION_VALUE;
  }
  
  return true;
}
