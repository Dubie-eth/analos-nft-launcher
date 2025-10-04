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
    // Generate escrow wallet for "The LosBros" collection
    this.generateEscrowWallet('collection_the_losbros', 'The LosBros');
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
        accessLevel: 'admin_only'
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
