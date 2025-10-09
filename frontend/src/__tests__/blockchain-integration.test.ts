import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Connection, PublicKey } from '@solana/web3.js';
import { adminControlService } from '../lib/admin-control-service';
import { feeManagementService } from '../lib/fee-management-service';
import { blockchainDataService } from '../lib/blockchain-data-service';

describe('Blockchain Integration Tests', () => {
  let connection: Connection;
  
  beforeAll(async () => {
    connection = new Connection('https://rpc.analos.io', 'confirmed');
  });
  
  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Admin Control Service', () => {
    it('should fetch Test collection configuration', async () => {
      const collection = await adminControlService.getCollection('Test');
      
      expect(collection).toBeDefined();
      expect(collection?.name).toBe('Test');
      expect(collection?.totalSupply).toBe(100);
      expect(collection?.mintPrice).toBe(10.00);
      expect(collection?.paymentToken).toBe('LOS');
      expect(collection?.isActive).toBe(true);
      expect(collection?.mintingEnabled).toBe(true);
    });

    it('should fetch The LosBros collection configuration', async () => {
      const collection = await adminControlService.getCollection('The LosBros');
      
      expect(collection).toBeDefined();
      expect(collection?.name).toBe('The LosBros');
      expect(collection?.totalSupply).toBe(2222);
      expect(collection?.mintPrice).toBe(4200.69);
      expect(collection?.paymentToken).toBe('LOL');
    });

    it('should check minting permissions correctly', async () => {
      const testPermission = await adminControlService.isMintingAllowed('Test');
      const losBrosPermission = await adminControlService.isMintingAllowed('The LosBros');
      
      expect(testPermission.allowed).toBe(true);
      expect(losBrosPermission.allowed).toBe(false); // Should be false for development
    });
  });

  describe('Fee Management Service', () => {
    it('should calculate Test collection fees correctly', () => {
      const fees = feeManagementService.getFeeBreakdown('Test');
      
      expect(fees.basePrice).toBe(10.00);
      expect(fees.platformFeePercentage).toBe(1.0);
      expect(fees.creatorFeePercentage).toBe(0.5);
      expect(fees.totalPrice).toBe(10.15); // 10.00 + 0.10 + 0.05
    });

    it('should calculate The LosBros collection fees correctly', () => {
      const fees = feeManagementService.getFeeBreakdown('The LosBros');
      
      expect(fees.basePrice).toBe(4200.69);
      expect(fees.platformFeePercentage).toBe(2.5);
      expect(fees.creatorFeePercentage).toBe(1.0);
      expect(fees.totalPrice).toBe(4307.21); // 4200.69 + 105.02 + 42.01
    });

    it('should handle unknown collections gracefully', () => {
      const fees = feeManagementService.getFeeBreakdown('Unknown Collection');
      
      expect(fees.basePrice).toBe(10.00);
      expect(fees.totalPrice).toBe(10.35);
    });
  });

  describe('Blockchain Data Service', () => {
    it('should fetch Test collection data', async () => {
      const data = await blockchainDataService.getCollectionData('Test');
      
      expect(data).toBeDefined();
      expect(data?.name).toBe('Test');
      expect(data?.totalSupply).toBe(100);
      expect(data?.mintPrice).toBe(10.15);
      expect(data?.paymentToken).toBe('LOS');
    });

    it('should handle blockchain connection errors gracefully', async () => {
      // Test with invalid RPC URL
      const invalidService = new (await import('../lib/blockchain-data-service')).BlockchainDataService('invalid-url');
      const data = await invalidService.getCollectionData('Test');
      
      // Should return null or fallback data
      expect(data).toBeNull();
    });

    it('should cache collection data correctly', async () => {
      // First call
      const data1 = await blockchainDataService.getCollectionData('Test');
      
      // Second call should use cache
      const data2 = await blockchainDataService.getCollectionData('Test');
      
      expect(data1).toEqual(data2);
    });
  });

  describe('RPC Connection', () => {
    it('should connect to Analos RPC successfully', async () => {
      const version = await connection.getVersion();
      
      expect(version).toBeDefined();
      expect(version['solana-core']).toBeDefined();
    });

    it('should get recent blockhash', async () => {
      const { blockhash } = await connection.getRecentBlockhash();
      
      expect(blockhash).toBeDefined();
      expect(typeof blockhash).toBe('string');
    });
  });

  describe('Token Metadata', () => {
    it('should validate LOL token mint address', () => {
      const lolMintAddress = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6';
      
      expect(() => new PublicKey(lolMintAddress)).not.toThrow();
    });

    it('should validate LOS token mint address', () => {
      const losMintAddress = '6d2Wze1KMUxQ28sFLrH9DKfgBXpUJSJYZaRbufucvBLV';
      
      expect(() => new PublicKey(losMintAddress)).not.toThrow();
    });
  });
});
