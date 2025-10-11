/**
 * Blockchain Integration Tests
 * 
 * Comprehensive test suite for secure blockchain integration
 * on Analos platform.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { walletValidator, WalletValidator } from '../src/lib/security/wallet-validator';
import { metaplexIntegration, MetaplexIntegration } from '../src/lib/blockchain/metaplex-integration';
import { securityMonitor, SecurityMonitor } from '../src/lib/security/security-monitor';
import { SECURITY_CONFIG } from '../src/lib/security/security-config';

// Mock Solana Web3.js
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');

describe('Blockchain Integration Security Tests', () => {
  let mockConnection: jest.Mocked<Connection>;
  let testWalletAddress: string;
  let testKeypair: Keypair;

  beforeEach(() => {
    // Setup mock connection
    mockConnection = {
      getAccountInfo: jest.fn(),
      getBalance: jest.fn(),
      getSignaturesForAddress: jest.fn(),
      getSlot: jest.fn(),
      getBlockTime: jest.fn(),
    } as any;

    // Setup test wallet
    testKeypair = Keypair.generate();
    testWalletAddress = testKeypair.publicKey.toBase58();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Wallet Validator', () => {
    it('should validate correct wallet address', async () => {
      // Mock successful account info
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 1000000000,
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(1000000000); // 1 SOL
      mockConnection.getSignaturesForAddress.mockResolvedValue([
        { signature: 'test', blockTime: Date.now() / 1000 },
      ]);

      const result = await walletValidator.validateWalletAddress(testWalletAddress);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.securityScore).toBeGreaterThan(70);
    });

    it('should reject invalid wallet address', async () => {
      const invalidAddress = 'invalid-address';

      const result = await walletValidator.validateWalletAddress(invalidAddress);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.securityScore).toBe(0);
    });

    it('should warn about low balance', async () => {
      // Mock account with low balance
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 100000, // Low balance
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(100000);
      mockConnection.getSignaturesForAddress.mockResolvedValue([]);

      const result = await walletValidator.validateWalletAddress(testWalletAddress);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Low balance'))).toBe(true);
    });

    it('should validate transaction before signing', async () => {
      const transaction = new Transaction();
      const recipient = Keypair.generate().publicKey;

      // Mock successful validation
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 1000000000,
        data: Buffer.from(''),
      });

      const result = await walletValidator.validateTransaction(
        transaction,
        testWalletAddress,
        [recipient.toBase58()]
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized transactions', async () => {
      // Create a transaction that exceeds size limit
      const transaction = new Transaction();
      
      // Add many instructions to make it large
      for (let i = 0; i < 100; i++) {
        transaction.add({
          keys: [],
          programId: new PublicKey('11111111111111111111111111111111'),
          data: Buffer.alloc(1000), // Large data
        });
      }

      const result = await walletValidator.validateTransaction(
        transaction,
        testWalletAddress
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });
  });

  describe('Metaplex Integration', () => {
    const testCollectionConfig = {
      name: 'Test Collection',
      symbol: 'TEST',
      description: 'A test NFT collection',
      image: 'https://example.com/image.png',
      maxSupply: 1000,
      mintPrice: 1000000000, // 1 SOL in lamports
      feePercentage: 2.5,
      feeRecipient: testWalletAddress,
      externalUrl: 'https://example.com',
      attributes: [
        { trait_type: 'Color', value: 'Blue' },
        { trait_type: 'Rarity', value: 'Common' }
      ]
    };

    it('should create collection deployment instructions', async () => {
      // Mock successful wallet validation
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 10000000000, // High balance
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(10000000000);
      mockConnection.getSignaturesForAddress.mockResolvedValue([
        { signature: 'test1', blockTime: Date.now() / 1000 },
        { signature: 'test2', blockTime: Date.now() / 1000 },
      ]);

      const result = await metaplexIntegration.createCollectionDeploymentInstructions(
        testCollectionConfig,
        testWalletAddress
      );

      expect(result.success).toBe(true);
      expect(result.instructions).toBeDefined();
      expect(result.instructions!.length).toBeGreaterThan(0);
    });

    it('should reject deployment for low security score wallet', async () => {
      // Mock wallet with low security score
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 1000, // Very low balance
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(1000);
      mockConnection.getSignaturesForAddress.mockResolvedValue([]); // No history

      const result = await metaplexIntegration.createCollectionDeploymentInstructions(
        testCollectionConfig,
        testWalletAddress
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Low security score');
    });

    it('should create NFT mint instructions', async () => {
      const collectionAddress = 'So11111111111111111111111111111111111111112';

      // Mock successful wallet validation
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 10000000000,
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(10000000000);
      mockConnection.getSignaturesForAddress.mockResolvedValue([
        { signature: 'test', blockTime: Date.now() / 1000 },
      ]);

      const result = await metaplexIntegration.createNFTMintInstructions(
        collectionAddress,
        1,
        testWalletAddress
      );

      expect(result.success).toBe(true);
      expect(result.instructions).toBeDefined();
      expect(result.instructions!.instructions.length).toBeGreaterThan(0);
      expect(result.instructions!.mintKeypairs.length).toBe(1);
    });

    it('should reject mint with invalid quantity', async () => {
      const collectionAddress = 'So11111111111111111111111111111111111111112';

      const result = await metaplexIntegration.createNFTMintInstructions(
        collectionAddress,
        15, // Too many
        testWalletAddress
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be between 1 and 10');
    });
  });

  describe('Security Monitor', () => {
    it('should log security events', () => {
      const eventId = securityMonitor.logEvent(
        'wallet_connected',
        'low',
        { walletAddress: testWalletAddress },
        testWalletAddress
      );

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^event_/);
    });

    it('should create alerts for critical events', () => {
      const eventId = securityMonitor.logEvent(
        'security_breach',
        'critical',
        { message: 'Test critical event' }
      );

      const alerts = securityMonitor.getActiveAlerts();
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');

      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it('should track security metrics', () => {
      // Log some test events
      securityMonitor.logEvent('wallet_connected', 'low', {});
      securityMonitor.logEvent('transaction_initiated', 'medium', {});
      securityMonitor.logEvent('security_breach', 'high', {});

      const metrics = securityMonitor.getSecurityMetrics();

      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.eventsByType).toHaveProperty('wallet_connected');
      expect(metrics.eventsBySeverity).toHaveProperty('low');
      expect(metrics.securityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.securityScore).toBeLessThanOrEqual(100);
    });

    it('should acknowledge alerts', () => {
      // Create an alert
      const eventId = securityMonitor.logEvent(
        'suspicious_activity',
        'high',
        { activity: 'test' }
      );

      const alerts = securityMonitor.getActiveAlerts();
      const alert = alerts[0];

      if (alert) {
        const acknowledged = securityMonitor.acknowledgeAlert(alert.id, 'test-admin');
        expect(acknowledged).toBe(true);

        const updatedAlerts = securityMonitor.getActiveAlerts();
        expect(updatedAlerts).not.toContain(alert);
      }
    });
  });

  describe('Security Configuration', () => {
    it('should have proper rate limits configured', () => {
      expect(SECURITY_CONFIG.RATE_LIMITS.API_CALLS.max).toBe(100);
      expect(SECURITY_CONFIG.RATE_LIMITS.WALLET_OPERATIONS.max).toBe(10);
      expect(SECURITY_CONFIG.RATE_LIMITS.DEPLOYMENT.max).toBe(3);
    });

    it('should have transaction limits configured', () => {
      expect(SECURITY_CONFIG.TRANSACTION_LIMITS.MAX_TRANSACTION_VALUE).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.TRANSACTION_LIMITS.MAX_DAILY_VOLUME).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.TRANSACTION_LIMITS.MIN_CONFIRMATION_TIME).toBeGreaterThan(0);
    });

    it('should have wallet security requirements', () => {
      expect(SECURITY_CONFIG.WALLET_SECURITY.MIN_BALANCE_REQUIRED).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.WALLET_SECURITY.REQUIRED_CONFIRMATIONS).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.WALLET_SECURITY.VALIDATION_TIMEOUT).toBeGreaterThan(0);
    });

    it('should have monitoring thresholds', () => {
      expect(SECURITY_CONFIG.MONITORING.ALERT_THRESHOLDS.FAILED_TRANSACTIONS).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.MONITORING.ALERT_THRESHOLDS.SUSPICIOUS_ACTIVITY).toBeGreaterThan(0);
      expect(SECURITY_CONFIG.MONITORING.ALERT_THRESHOLDS.HIGH_VOLUME).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete deployment flow securely', async () => {
      // Mock successful responses
      mockConnection.getAccountInfo.mockResolvedValue({
        executable: false,
        owner: new PublicKey('11111111111111111111111111111111'),
        lamports: 10000000000,
        data: Buffer.from(''),
      });

      mockConnection.getBalance.mockResolvedValue(10000000000);
      mockConnection.getSignaturesForAddress.mockResolvedValue([
        { signature: 'test1', blockTime: Date.now() / 1000 },
        { signature: 'test2', blockTime: Date.now() / 1000 },
      ]);

      const collectionConfig = {
        name: 'Integration Test Collection',
        symbol: 'INTEG',
        description: 'Integration test collection',
        image: 'https://example.com/image.png',
        maxSupply: 100,
        mintPrice: 1000000000,
        feePercentage: 2.5,
        feeRecipient: testWalletAddress,
      };

      // Step 1: Validate wallet
      const walletValidation = await walletValidator.validateWalletAddress(testWalletAddress);
      expect(walletValidation.isValid).toBe(true);

      // Step 2: Create deployment instructions
      const deploymentResult = await metaplexIntegration.createCollectionDeploymentInstructions(
        collectionConfig,
        testWalletAddress
      );
      expect(deploymentResult.success).toBe(true);

      // Step 3: Validate transaction
      const transaction = new Transaction();
      transaction.add(...deploymentResult.instructions!);
      
      const transactionValidation = await walletValidator.validateTransaction(
        transaction,
        testWalletAddress
      );
      expect(transactionValidation.isValid).toBe(true);

      // Step 4: Log security event
      const eventId = securityMonitor.logEvent(
        'transaction_initiated',
        'low',
        { 
          walletAddress: testWalletAddress,
          collectionName: collectionConfig.name
        },
        testWalletAddress
      );
      expect(eventId).toBeDefined();
    });

    it('should detect and respond to security threats', async () => {
      // Simulate suspicious activity
      securityMonitor.logEvent('suspicious_activity', 'high', {
        walletAddress: testWalletAddress,
        activity: 'multiple_failed_transactions'
      });

      securityMonitor.logEvent('suspicious_activity', 'high', {
        walletAddress: testWalletAddress,
        activity: 'unusual_pattern'
      });

      // Check that alerts were created
      const alerts = securityMonitor.getActiveAlerts();
      const suspiciousAlerts = alerts.filter(a => 
        a.description.includes('suspicious') || 
        a.description.includes('Suspicious')
      );

      expect(suspiciousAlerts.length).toBeGreaterThan(0);
    });
  });
});
