/**
 * ADMIN UTILITIES
 * Secure admin access and URL generation
 */

import crypto from 'crypto';

// Admin wallet addresses - only these wallets can access admin
const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet
];

// Secret key for URL encryption (in production, use env var)
const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'analos-admin-2024-secret';

/**
 * Generate secure admin URL with encrypted token
 */
export function generateSecureAdminURL(): string {
  const timestamp = Date.now().toString();
  const data = `${timestamp}-${ADMIN_WALLETS[0]}`;
  
  // Use Node.js crypto for encryption
  const cipher = crypto.createCipher('aes-256-cbc', ADMIN_SECRET_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `/admin-secure/${encodeURIComponent(encrypted)}`;
}

/**
 * Validate admin token
 */
export function validateAdminToken(token: string): boolean {
  try {
    // Use Node.js crypto for decryption
    const decipher = crypto.createDecipher('aes-256-cbc', ADMIN_SECRET_KEY);
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const [timestamp, walletAddress] = decrypted.split('-');
    
    // Check if token is not older than 24 hours
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxAge) {
      console.log('❌ Admin token expired');
      return false;
    }

    // Check if wallet address is in admin list
    const isValidWallet = ADMIN_WALLETS.includes(walletAddress);
    console.log(`🔐 Token validation: ${isValidWallet ? 'VALID' : 'INVALID'}`);
    return isValidWallet;
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return false;
  }
}

/**
 * Check if wallet is admin
 */
export function isAdminWallet(walletAddress: string): boolean {
  return ADMIN_WALLETS.includes(walletAddress);
}

/**
 * Get admin wallets list
 */
export function getAdminWallets(): string[] {
  return [...ADMIN_WALLETS];
}

export { ADMIN_WALLETS, ADMIN_SECRET_KEY };
