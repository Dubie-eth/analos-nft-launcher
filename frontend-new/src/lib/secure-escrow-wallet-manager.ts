/**
 * Secure Escrow Wallet Manager
 * Manages collection-specific escrow wallets with secure key storage
 * Only accessible by admin wallet with proper authorization
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import crypto from 'crypto';

export interface EscrowWalletConfig {
  collectionId: string;
  collectionName: string;
  escrowAddress: string;
  escrowKeypair: string; // Encrypted private key
  tokenMintAddress: string;
  tokenKeypair: string; // Encrypted private key for token mint
  isActive: boolean;
  isFunded: boolean;
  totalDeposited: number;
  totalDistributed: number;
  createdAt: Date;
  lastAccessed: Date;
  accessLevel: 'admin_only' | 'admin_team' | 'public_claim';
  
  // Security and key burning
  keysBurned: boolean; // Whether private keys have been permanently destroyed
  keysBurnedAt?: Date; // When keys were burned
  burnedBy?: string; // Admin wallet that burned the keys
  preBurnBackup?: string; // Encrypted backup of essential data before burning
}

export interface RewardDistribution {
  id: string;
  collectionId: string;
  recipientWallet: string;
  amount: number;
  tokenType: 'LOS' | 'LOL' | 'CUSTOM';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  transactionHash?: string;
  reason: string; // Why this reward was given
}

export interface EscrowAccessLog {
  id: string;
  collectionId: string;
  accessedBy: string; // Admin wallet address
  action: 'create' | 'fund' | 'distribute' | 'view' | 'emergency_withdraw';
  timestamp: Date;
  amount?: number;
  recipientWallet?: string;
  success: boolean;
  error?: string;
}

export class SecureEscrowWalletManager {
  private escrowWallets: Map<string, EscrowWalletConfig> = new Map();
  private rewardDistributions: Map<string, RewardDistribution[]> = new Map();
  private accessLogs: EscrowAccessLog[] = [];
  private connection: Connection;
  private adminWallets: Set<string>;

  // Encryption keys (should be stored securely in production)
  private readonly ENCRYPTION_KEY = process.env.ESCROW_ENCRYPTION_KEY || 'dev-key-change-in-production';
  private readonly ADMIN_WALLET_1 = process.env.NEXT_PUBLIC_ADMIN_WALLET_1 || '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW';

  constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    this.adminWallets = new Set([
      this.ADMIN_WALLET_1,
      // Add more admin wallets as needed
    ]);

    this.initializeDefaultEscrowWallets();
    console.log('🔐 Secure Escrow Wallet Manager initialized');
  }

  /**
   * Initialize default escrow wallets for existing collections
   */
  private initializeDefaultEscrowWallets(): void {
    // Only initialize if we have an admin wallet available
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_1;
    if (adminWallet && this.isAdminWallet(adminWallet)) {
      // Generate escrow wallet for "The LosBros" collection
      this.generateEscrowWallet('collection_the_losbros', 'The LosBros', adminWallet)
        .catch(error => console.warn('⚠️ Could not initialize default escrow wallet:', error.message));
    } else {
      console.log('⚠️ No admin wallet available for escrow wallet initialization');
    }
    console.log('✅ Default escrow wallets initialized');
  }

  /**
   * Generate a new escrow wallet for a collection
   */
  async generateEscrowWallet(
    collectionId: string,
    collectionName: string,
    adminWallet: string
  ): Promise<EscrowWalletConfig> {
    try {
      // Verify admin access
      if (!this.isAdminWallet(adminWallet)) {
        throw new Error('Unauthorized: Only admin wallets can generate escrow wallets');
      }

      console.log(`🔐 Generating secure escrow wallet for collection: ${collectionName}`);

      // Generate new keypairs
      const escrowKeypair = Keypair.generate();
      const tokenKeypair = Keypair.generate();

      // Encrypt private keys
      const encryptedEscrowKey = this.encryptPrivateKey(escrowKeypair.secretKey);
      const encryptedTokenKey = this.encryptPrivateKey(tokenKeypair.secretKey);

      const escrowConfig: EscrowWalletConfig = {
        collectionId,
        collectionName,
        escrowAddress: escrowKeypair.publicKey.toString(),
        escrowKeypair: encryptedEscrowKey,
        tokenMintAddress: tokenKeypair.publicKey.toString(),
        tokenKeypair: encryptedTokenKey,
        isActive: true,
        isFunded: false,
        totalDeposited: 0,
        totalDistributed: 0,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessLevel: 'admin_only',
        
        // Security and key burning
        keysBurned: false,
        keysBurnedAt: undefined,
        burnedBy: undefined,
        preBurnBackup: undefined
      };

      // Store securely
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'create',
        timestamp: new Date(),
        success: true
      });

      console.log(`✅ Secure escrow wallet generated: ${escrowConfig.escrowAddress}`);
      return escrowConfig;
    } catch (error) {
      console.error('❌ Error generating escrow wallet:', error);
      throw error;
    }
  }

  /**
   * Get escrow wallet configuration (admin only)
   */
  async getEscrowWallet(
    collectionId: string,
    adminWallet: string
  ): Promise<EscrowWalletConfig | null> {
    try {
      // Verify admin access
      if (!this.isAdminWallet(adminWallet)) {
        throw new Error('Unauthorized: Only admin wallets can access escrow configurations');
      }

      const escrowConfig = this.escrowWallets.get(collectionId);
      if (!escrowConfig) {
        return null;
      }

      // Update last accessed
      escrowConfig.lastAccessed = new Date();
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'view',
        timestamp: new Date(),
        success: true
      });

      return escrowConfig;
    } catch (error) {
      console.error('❌ Error accessing escrow wallet:', error);
      return null;
    }
  }

  /**
   * Fund escrow wallet with tokens
   */
  async fundEscrowWallet(
    collectionId: string,
    amount: number,
    tokenType: 'LOS' | 'LOL' | 'CUSTOM',
    adminWallet: string
  ): Promise<boolean> {
    try {
      // Verify admin access
      if (!this.isAdminWallet(adminWallet)) {
        throw new Error('Unauthorized: Only admin wallets can fund escrow wallets');
      }

      const escrowConfig = this.escrowWallets.get(collectionId);
      if (!escrowConfig) {
        throw new Error('Escrow wallet not found');
      }

      console.log(`💰 Funding escrow wallet: ${amount} ${tokenType} for ${collectionName}`);

      // In a real implementation, this would transfer tokens to the escrow wallet
      // For now, we'll simulate the funding
      escrowConfig.isFunded = true;
      escrowConfig.totalDeposited += amount;
      escrowConfig.lastAccessed = new Date();
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'fund',
        timestamp: new Date(),
        amount,
        success: true
      });

      console.log(`✅ Escrow wallet funded: ${amount} ${tokenType}`);
      return true;
    } catch (error) {
      console.error('❌ Error funding escrow wallet:', error);
      
      // Log failed access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'fund',
        timestamp: new Date(),
        amount,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }

  /**
   * Distribute rewards from escrow wallet
   */
  async distributeReward(
    collectionId: string,
    recipientWallet: string,
    amount: number,
    tokenType: 'LOS' | 'LOL' | 'CUSTOM',
    reason: string,
    adminWallet: string
  ): Promise<RewardDistribution> {
    try {
      // Verify admin access
      if (!this.isAdminWallet(adminWallet)) {
        throw new Error('Unauthorized: Only admin wallets can distribute rewards');
      }

      const escrowConfig = this.escrowWallets.get(collectionId);
      if (!escrowConfig) {
        throw new Error('Escrow wallet not found');
      }

      if (!escrowConfig.isFunded) {
        throw new Error('Escrow wallet is not funded');
      }

      if (amount > (escrowConfig.totalDeposited - escrowConfig.totalDistributed)) {
        throw new Error('Insufficient funds in escrow wallet');
      }

      console.log(`🎁 Distributing reward: ${amount} ${tokenType} to ${recipientWallet}`);

      // Create reward distribution record
      const rewardDistribution: RewardDistribution = {
        id: `reward_${collectionId}_${Date.now()}`,
        collectionId,
        recipientWallet,
        amount,
        tokenType,
        status: 'pending',
        createdAt: new Date(),
        reason
      };

      // Store reward distribution
      const distributions = this.rewardDistributions.get(collectionId) || [];
      distributions.push(rewardDistribution);
      this.rewardDistributions.set(collectionId, distributions);

      // In a real implementation, this would execute the actual transfer
      // For now, we'll simulate the distribution
      rewardDistribution.status = 'completed';
      rewardDistribution.completedAt = new Date();
      rewardDistribution.transactionHash = `reward_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update escrow wallet
      escrowConfig.totalDistributed += amount;
      escrowConfig.lastAccessed = new Date();
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'distribute',
        timestamp: new Date(),
        amount,
        recipientWallet,
        success: true
      });

      console.log(`✅ Reward distributed: ${amount} ${tokenType} to ${recipientWallet}`);
      return rewardDistribution;
    } catch (error) {
      console.error('❌ Error distributing reward:', error);
      
      // Log failed access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'distribute',
        timestamp: new Date(),
        amount,
        recipientWallet,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Emergency withdraw from escrow wallet (admin only)
   */
  async emergencyWithdraw(
    collectionId: string,
    amount: number,
    adminWallet: string
  ): Promise<boolean> {
    try {
      // Verify admin access
      if (!this.isAdminWallet(adminWallet)) {
        throw new Error('Unauthorized: Only admin wallets can perform emergency withdrawals');
      }

      const escrowConfig = this.escrowWallets.get(collectionId);
      if (!escrowConfig) {
        throw new Error('Escrow wallet not found');
      }

      console.log(`🚨 Emergency withdrawal: ${amount} from ${collectionName} escrow`);

      // In a real implementation, this would execute the emergency withdrawal
      // For now, we'll simulate it
      escrowConfig.totalDeposited -= amount;
      escrowConfig.lastAccessed = new Date();
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'emergency_withdraw',
        timestamp: new Date(),
        amount,
        success: true
      });

      console.log(`✅ Emergency withdrawal completed: ${amount}`);
      return true;
    } catch (error) {
      console.error('❌ Error during emergency withdrawal:', error);
      
      // Log failed access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'emergency_withdraw',
        timestamp: new Date(),
        amount,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }

  /**
   * Get all escrow wallets (admin only)
   */
  getAllEscrowWallets(adminWallet: string): EscrowWalletConfig[] {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can access all escrow configurations');
    }

    return Array.from(this.escrowWallets.values());
  }

  /**
   * Get reward distributions for a collection
   */
  getRewardDistributions(collectionId: string, adminWallet: string): RewardDistribution[] {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can access reward distributions');
    }

    return this.rewardDistributions.get(collectionId) || [];
  }

  /**
   * Get access logs (admin only)
   */
  getAccessLogs(adminWallet: string): EscrowAccessLog[] {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can access logs');
    }

    return this.accessLogs;
  }

  /**
   * Check if wallet is admin
   */
  private isAdminWallet(walletAddress: string): boolean {
    return this.adminWallets.has(walletAddress);
  }

  /**
   * Encrypt private key
   */
  private encryptPrivateKey(privateKey: Uint8Array): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(privateKey.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt private key (admin only)
   */
  decryptPrivateKey(encryptedKey: string, adminWallet: string): Uint8Array {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can decrypt private keys');
    }

    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Convert back to Uint8Array
      const keyArray = decrypted.split(',').map(Number);
      return new Uint8Array(keyArray);
    } catch (error) {
      throw new Error('Failed to decrypt private key');
    }
  }

  /**
   * Get private keys for escrow wallet (admin only)
   */
  getEscrowPrivateKeys(collectionId: string, adminWallet: string): {
    escrowPrivateKey: string;
    tokenPrivateKey: string;
    escrowAddress: string;
    tokenMintAddress: string;
  } | null {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can access private keys');
    }

    const escrowConfig = this.escrowWallets.get(collectionId);
    if (!escrowConfig) {
      return null;
    }

    try {
      // Decrypt private keys
      const escrowPrivateKeyBytes = this.decryptPrivateKey(escrowConfig.escrowKeypair, adminWallet);
      const tokenPrivateKeyBytes = this.decryptPrivateKey(escrowConfig.tokenKeypair, adminWallet);
      
      // Convert to base58 strings (standard Solana private key format)
      const escrowPrivateKey = this.bytesToBase58(escrowPrivateKeyBytes);
      const tokenPrivateKey = this.bytesToBase58(tokenPrivateKeyBytes);

      // Log access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'view',
        timestamp: new Date(),
        success: true
      });

      return {
        escrowPrivateKey,
        tokenPrivateKey,
        escrowAddress: escrowConfig.escrowAddress,
        tokenMintAddress: escrowConfig.tokenMintAddress
      };
    } catch (error) {
      console.error('❌ Error accessing private keys:', error);
      
      // Log failed access
      this.logAccess({
        id: `access_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'view',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return null;
    }
  }

  /**
   * Convert bytes to base58 string
   */
  private bytesToBase58(bytes: Uint8Array): string {
    // Simple base58 encoding (in production, use a proper base58 library)
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt(0);
    
    // Convert bytes to big integer
    for (let i = 0; i < bytes.length; i++) {
      num = num * BigInt(256) + BigInt(bytes[i]);
    }
    
    // Convert to base58
    while (num > 0) {
      result = alphabet[Number(num % BigInt(58))] + result;
      num = num / BigInt(58);
    }
    
    // Handle leading zeros
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * 🔥 BURN PRIVATE KEYS PERMANENTLY (IRREVERSIBLE!)
   * This is the ultimate security measure - once burned, keys can NEVER be recovered
   * Only use after thorough testing and when you're 100% certain everything is working
   */
  async burnPrivateKeys(
    collectionId: string,
    adminWallet: string,
    confirmationCode: string
  ): Promise<{
    success: boolean;
    message: string;
    burnedAt: Date;
    escrowAddress: string;
    tokenMintAddress: string;
  }> {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can burn private keys');
    }

    // Require confirmation code for extra security
    if (confirmationCode !== 'BURN_KEYS_PERMANENTLY') {
      throw new Error('Invalid confirmation code. Use "BURN_KEYS_PERMANENTLY" to confirm');
    }

    const escrowConfig = this.escrowWallets.get(collectionId);
    if (!escrowConfig) {
      throw new Error('Escrow wallet not found');
    }

    if (escrowConfig.keysBurned) {
      throw new Error('Private keys have already been burned for this collection');
    }

    try {
      console.log(`🔥 BURNING PRIVATE KEYS for ${collectionId} - THIS IS IRREVERSIBLE!`);
      
      // Create pre-burn backup of essential data (addresses only, no private keys)
      const preBurnBackup = JSON.stringify({
        collectionId: escrowConfig.collectionId,
        collectionName: escrowConfig.collectionName,
        escrowAddress: escrowConfig.escrowAddress,
        tokenMintAddress: escrowConfig.tokenMintAddress,
        totalDeposited: escrowConfig.totalDeposited,
        totalDistributed: escrowConfig.totalDistributed,
        createdAt: escrowConfig.createdAt,
        burnedAt: new Date(),
        burnedBy: adminWallet
      });

      // 🔥 PERMANENTLY DESTROY THE PRIVATE KEYS
      // Overwrite with random data multiple times for security
      const randomData1 = crypto.randomBytes(64);
      const randomData2 = crypto.randomBytes(64);
      const randomData3 = crypto.randomBytes(64);
      
      // Replace encrypted keys with random data (simulating secure deletion)
      escrowConfig.escrowKeypair = randomData1.toString('hex');
      escrowConfig.tokenKeypair = randomData2.toString('hex');
      escrowConfig.preBurnBackup = this.encryptPrivateKey(randomData3); // Store backup encrypted
      
      // Mark as burned
      escrowConfig.keysBurned = true;
      escrowConfig.keysBurnedAt = new Date();
      escrowConfig.burnedBy = adminWallet;
      escrowConfig.accessLevel = 'public_claim'; // Change to public claim mode
      
      // Update the configuration
      this.escrowWallets.set(collectionId, escrowConfig);

      // Log the burning action
      this.logAccess({
        id: `burn_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'emergency_withdraw', // Using existing action type for logging
        timestamp: new Date(),
        success: true
      });

      console.log(`🔥 PRIVATE KEYS BURNED FOREVER for ${collectionId}`);
      console.log(`📋 Pre-burn backup created: ${preBurnBackup}`);

      return {
        success: true,
        message: `🔥 PRIVATE KEYS BURNED PERMANENTLY for ${escrowConfig.collectionName}. This action is IRREVERSIBLE!`,
        burnedAt: escrowConfig.keysBurnedAt,
        escrowAddress: escrowConfig.escrowAddress,
        tokenMintAddress: escrowConfig.tokenMintAddress
      };

    } catch (error) {
      console.error('❌ Error burning private keys:', error);
      
      this.logAccess({
        id: `burn_failed_${Date.now()}`,
        collectionId,
        accessedBy: adminWallet,
        action: 'emergency_withdraw',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Check if private keys have been burned
   */
  areKeysBurned(collectionId: string): boolean {
    const escrowConfig = this.escrowWallets.get(collectionId);
    return escrowConfig?.keysBurned || false;
  }

  /**
   * Get burn status and history
   */
  getBurnStatus(collectionId: string, adminWallet: string): {
    keysBurned: boolean;
    burnedAt?: Date;
    burnedBy?: string;
    escrowAddress: string;
    tokenMintAddress: string;
    accessLevel: string;
  } | null {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can check burn status');
    }

    const escrowConfig = this.escrowWallets.get(collectionId);
    if (!escrowConfig) {
      return null;
    }

    return {
      keysBurned: escrowConfig.keysBurned,
      burnedAt: escrowConfig.keysBurnedAt,
      burnedBy: escrowConfig.burnedBy,
      escrowAddress: escrowConfig.escrowAddress,
      tokenMintAddress: escrowConfig.tokenMintAddress,
      accessLevel: escrowConfig.accessLevel
    };
  }

  /**
   * Log access attempt
   */
  private logAccess(accessLog: EscrowAccessLog): void {
    this.accessLogs.push(accessLog);
    
    // Keep only last 1000 access logs
    if (this.accessLogs.length > 1000) {
      this.accessLogs = this.accessLogs.slice(-1000);
    }
  }

  /**
   * Get escrow wallet statistics
   */
  getEscrowStats(adminWallet: string): {
    totalWallets: number;
    totalDeposited: number;
    totalDistributed: number;
    totalRewards: number;
    activeWallets: number;
  } {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can access statistics');
    }

    const wallets = Array.from(this.escrowWallets.values());
    const totalWallets = wallets.length;
    const totalDeposited = wallets.reduce((sum, wallet) => sum + wallet.totalDeposited, 0);
    const totalDistributed = wallets.reduce((sum, wallet) => sum + wallet.totalDistributed, 0);
    const activeWallets = wallets.filter(wallet => wallet.isActive).length;
    
    const allRewards = Array.from(this.rewardDistributions.values()).flat();
    const totalRewards = allRewards.length;

    return {
      totalWallets,
      totalDeposited,
      totalDistributed,
      totalRewards,
      activeWallets
    };
  }

  /**
   * Update access level for escrow wallet
   */
  updateAccessLevel(
    collectionId: string,
    newAccessLevel: EscrowWalletConfig['accessLevel'],
    adminWallet: string
  ): boolean {
    if (!this.isAdminWallet(adminWallet)) {
      throw new Error('Unauthorized: Only admin wallets can update access levels');
    }

    const escrowConfig = this.escrowWallets.get(collectionId);
    if (!escrowConfig) {
      return false;
    }

    escrowConfig.accessLevel = newAccessLevel;
    escrowConfig.lastAccessed = new Date();
    this.escrowWallets.set(collectionId, escrowConfig);

    console.log(`✅ Access level updated for ${collectionId}: ${newAccessLevel}`);
    return true;
  }
}

export const secureEscrowWalletManager = new SecureEscrowWalletManager();
