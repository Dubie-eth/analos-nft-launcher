import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { adminControlService } from '../lib/admin-control-service';
import { feeManagementService } from '../lib/fee-management-service';
import { tokenIdTracker } from '../lib/token-id-tracker';

describe('Service Layer Tests', () => {
  beforeEach(() => {
    // Clear any existing state
    tokenIdTracker.clearAllCollections();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Admin Control Service', () => {
    it('should initialize with default collections', async () => {
      const testCollection = await adminControlService.getCollection('Test');
      const losBrosCollection = await adminControlService.getCollection('The LosBros');
      
      expect(testCollection).toBeDefined();
      expect(losBrosCollection).toBeDefined();
      
      expect(testCollection?.name).toBe('Test');
      expect(losBrosCollection?.name).toBe('The LosBros');
    });

    it('should enforce minting permissions correctly', async () => {
      const testPermission = await adminControlService.isMintingAllowed('Test');
      const losBrosPermission = await adminControlService.isMintingAllowed('The LosBros');
      const unknownPermission = await adminControlService.isMintingAllowed('Unknown');
      
      expect(testPermission.allowed).toBe(true);
      expect(losBrosPermission.allowed).toBe(false);
      expect(unknownPermission.allowed).toBe(false);
      expect(unknownPermission.reason).toContain('not found');
    });

    it('should return undefined for non-existent collections', async () => {
      const collection = await adminControlService.getCollection('NonExistent');
      
      expect(collection).toBeUndefined();
    });
  });

  describe('Fee Management Service', () => {
    it('should calculate fees for Test collection', () => {
      const fees = feeManagementService.getFeeBreakdown('Test');
      
      expect(fees.basePrice).toBe(10.00);
      expect(fees.platformFee).toBe(0.10);
      expect(fees.creatorFee).toBe(0.05);
      expect(fees.totalPrice).toBe(10.15);
      expect(fees.platformFeePercentage).toBe(1.0);
      expect(fees.creatorFeePercentage).toBe(0.5);
    });

    it('should calculate fees for The LosBros collection', () => {
      const fees = feeManagementService.getFeeBreakdown('The LosBros');
      
      expect(fees.basePrice).toBe(4200.69);
      expect(fees.platformFee).toBeCloseTo(105.02, 2);
      expect(fees.creatorFee).toBeCloseTo(42.01, 2);
      expect(fees.totalPrice).toBeCloseTo(4307.21, 2);
      expect(fees.platformFeePercentage).toBe(2.5);
      expect(fees.creatorFeePercentage).toBe(1.0);
    });

    it('should handle unknown collections with default fees', () => {
      const fees = feeManagementService.getFeeBreakdown('Unknown Collection');
      
      expect(fees.basePrice).toBe(10.00);
      expect(fees.platformFee).toBe(0.25);
      expect(fees.creatorFee).toBe(0.10);
      expect(fees.totalPrice).toBe(10.35);
      expect(fees.platformFeePercentage).toBe(2.5);
      expect(fees.creatorFeePercentage).toBe(1.0);
    });

    it('should return total mint price correctly', () => {
      const testPrice = feeManagementService.getTotalMintPrice('Test');
      const losBrosPrice = feeManagementService.getTotalMintPrice('The LosBros');
      const unknownPrice = feeManagementService.getTotalMintPrice('Unknown');
      
      expect(testPrice).toBe(10.15);
      expect(losBrosPrice).toBeCloseTo(4307.21, 2);
      expect(unknownPrice).toBe(10.35);
    });

    it('should return base price correctly', () => {
      const testBase = feeManagementService.getBasePrice('Test');
      const losBrosBase = feeManagementService.getBasePrice('The LosBros');
      
      expect(testBase).toBe(10.00);
      expect(losBrosBase).toBe(4200.69);
    });
  });

  describe('Token ID Tracker', () => {
    it('should create and manage collections', () => {
      const collectionId = 'test_collection';
      const collectionName = 'Test Collection';
      const totalSupply = 100;
      const mintPrice = 10.00;
      
      tokenIdTracker.createCollection(collectionId, collectionName, totalSupply, mintPrice);
      
      const collection = tokenIdTracker.getCollectionInfo(collectionId);
      expect(collection).toBeDefined();
      expect(collection?.name).toBe(collectionName);
      expect(collection?.totalSupply).toBe(totalSupply);
      expect(collection?.mintPrice).toBe(mintPrice);
    });

    it('should add NFTs to collections', () => {
      const collectionId = 'test_collection';
      const collectionName = 'Test Collection';
      
      tokenIdTracker.createCollection(collectionId, collectionName, 100, 10.00);
      
      const mintAddress = 'test_mint_address';
      const walletAddress = 'test_wallet_address';
      
      const tokenId = tokenIdTracker.addNFT(mintAddress, collectionName, collectionId, walletAddress);
      
      expect(tokenId).toBe(1);
      
      const collection = tokenIdTracker.getCollectionInfo(collectionId);
      expect(collection?.mintedCount).toBe(1);
      
      const tokenInfo = tokenIdTracker.getTokenInfo(mintAddress);
      expect(tokenInfo).toBeDefined();
      expect(tokenInfo?.tokenId).toBe(1);
      expect(tokenInfo?.collectionName).toBe(collectionName);
    });

    it('should track multiple NFTs correctly', () => {
      const collectionId = 'test_collection';
      const collectionName = 'Test Collection';
      
      tokenIdTracker.createCollection(collectionId, collectionName, 100, 10.00);
      
      // Add multiple NFTs
      for (let i = 0; i < 5; i++) {
        const mintAddress = `test_mint_${i}`;
        const walletAddress = `test_wallet_${i}`;
        
        const tokenId = tokenIdTracker.addNFT(mintAddress, collectionName, collectionId, walletAddress);
        expect(tokenId).toBe(i + 1);
      }
      
      const collection = tokenIdTracker.getCollectionInfo(collectionId);
      expect(collection?.mintedCount).toBe(5);
    });

    it('should clear collections correctly', () => {
      const collectionId = 'test_collection';
      const collectionName = 'Test Collection';
      
      tokenIdTracker.createCollection(collectionId, collectionName, 100, 10.00);
      tokenIdTracker.addNFT('test_mint', collectionName, collectionId, 'test_wallet');
      
      expect(tokenIdTracker.getCollectionInfo(collectionId)).toBeDefined();
      
      tokenIdTracker.clearCollection(collectionId);
      
      expect(tokenIdTracker.getCollectionInfo(collectionId)).toBeUndefined();
    });

    it('should clear all collections', () => {
      // Create multiple collections
      tokenIdTracker.createCollection('collection1', 'Collection 1', 100, 10.00);
      tokenIdTracker.createCollection('collection2', 'Collection 2', 200, 20.00);
      
      expect(Object.keys(tokenIdTracker.collections).length).toBe(2);
      
      tokenIdTracker.clearAllCollections();
      
      expect(Object.keys(tokenIdTracker.collections).length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid collection names gracefully', () => {
      expect(() => feeManagementService.getFeeBreakdown('')).not.toThrow();
      expect(() => feeManagementService.getFeeBreakdown(null as any)).not.toThrow();
      expect(() => feeManagementService.getFeeBreakdown(undefined as any)).not.toThrow();
    });

    it('should handle invalid mint addresses gracefully', () => {
      expect(() => tokenIdTracker.getTokenInfo('')).not.toThrow();
      expect(() => tokenIdTracker.getTokenInfo('invalid_address')).not.toThrow();
    });

    it('should handle invalid collection IDs gracefully', () => {
      expect(() => tokenIdTracker.getCollectionInfo('')).not.toThrow();
      expect(() => tokenIdTracker.getCollectionInfo('invalid_id')).not.toThrow();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data across services', async () => {
      const collection = await adminControlService.getCollection('Test');
      const fees = feeManagementService.getFeeBreakdown('Test');
      
      expect(collection?.mintPrice).toBe(fees.basePrice);
      expect(collection?.paymentToken).toBeDefined();
      expect(fees.totalPrice).toBeGreaterThan(fees.basePrice);
    });

    it('should handle concurrent operations safely', async () => {
      const promises = [];
      
      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(adminControlService.getCollection('Test'));
        promises.push(feeManagementService.getFeeBreakdown('Test'));
      }
      
      const results = await Promise.all(promises);
      
      // All results should be consistent
      const collections = results.filter((_, index) => index % 2 === 0);
      const fees = results.filter((_, index) => index % 2 === 1);
      
      expect(collections.every(c => c?.name === 'Test')).toBe(true);
      expect(fees.every(f => f.basePrice === 10.00)).toBe(true);
    });
  });
});
