/**
 * Two-Factor Authentication Service
 * 
 * Implements Google Authenticator (TOTP) for admin operations
 */

import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

interface TwoFactorConfig {
  issuer: string;
  accountName: string;
}

interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export class TwoFactorAuthService {
  private config: TwoFactorConfig;
  private secrets: Map<string, string> = new Map(); // walletAddress -> secret

  constructor(config: TwoFactorConfig) {
    this.config = config;
    console.log('🔐 2FA Service initialized');
    console.log('   Issuer:', config.issuer);
  }

  /**
   * Generate 2FA secret for a user
   */
  async generateSecret(walletAddress: string): Promise<TwoFactorSecret> {
    console.log('🔑 Generating 2FA secret for:', walletAddress);
    
    const secret = speakeasy.generateSecret({
      name: `${this.config.issuer} (${walletAddress.slice(0, 8)}...)`,
      issuer: this.config.issuer,
      length: 32,
    });
    
    // Store secret
    this.secrets.set(walletAddress, secret.base32);
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    console.log('✅ 2FA secret generated');
    
    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
    };
  }

  /**
   * Verify TOTP token
   */
  verifyToken(walletAddress: string, token: string): boolean {
    const secret = this.secrets.get(walletAddress);
    
    if (!secret) {
      console.log('❌ No 2FA secret found for:', walletAddress);
      return false;
    }
    
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps in either direction
    });
    
    console.log('🔍 2FA verification for', walletAddress + ':', verified ? '✅' : '❌');
    
    return verified;
  }

  /**
   * Enable 2FA for a wallet
   */
  enable2FA(walletAddress: string, secret: string): void {
    this.secrets.set(walletAddress, secret);
    console.log('✅ 2FA enabled for:', walletAddress);
  }

  /**
   * Disable 2FA for a wallet
   */
  disable2FA(walletAddress: string): void {
    this.secrets.delete(walletAddress);
    console.log('🔓 2FA disabled for:', walletAddress);
  }

  /**
   * Check if 2FA is enabled for a wallet
   */
  is2FAEnabled(walletAddress: string): boolean {
    return this.secrets.has(walletAddress);
  }

  /**
   * Get secret for a wallet (for backup purposes)
   */
  getSecret(walletAddress: string): string | undefined {
    return this.secrets.get(walletAddress);
  }
}

// Export singleton
let twoFactorService: TwoFactorAuthService | null = null;

export function initializeTwoFactorAuth(config: TwoFactorConfig): TwoFactorAuthService {
  if (!twoFactorService) {
    twoFactorService = new TwoFactorAuthService(config);
  }
  return twoFactorService;
}

export function getTwoFactorAuthService(): TwoFactorAuthService | null {
  return twoFactorService;
}

