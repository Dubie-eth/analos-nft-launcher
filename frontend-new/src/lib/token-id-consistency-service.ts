/**
 * Token ID Consistency Service
 * Ensures token IDs are locked from mint start and consistent across blockchain
 */

export interface LockedTokenMetadata {
  tokenId: number;
  collectionName: string;
  mintAddress: string;
  metadataUri: string;
  attributes: {
    token_id: number;
    collection: string;
    mint_timestamp: number;
    blockchain_reference: string;
  };
  lockedAt: number;
  lockedBy: string; // Wallet that locked the metadata
}

export interface TokenIDSequence {
  collectionName: string;
  nextTokenId: number;
  lockedTokens: Map<number, LockedTokenMetadata>;
  totalSupply: number;
  isLocked: boolean;
  lockTimestamp: number;
}

export class TokenIDConsistencyService {
  private tokenSequences: Map<string, TokenIDSequence> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  constructor() {
    this.initializeDefaultSequences();
    console.log('🔒 Token ID Consistency Service initialized');
  }

  /**
   * Initialize default token sequences
   */
  private initializeDefaultSequences(): void {
    // Test collection - starts at 1, locked for testing
    this.tokenSequences.set('Test', {
      collectionName: 'Test',
      nextTokenId: 1,
      lockedTokens: new Map(),
      totalSupply: 100,
      isLocked: false, // Can be unlocked for testing
      lockTimestamp: 0
    });

    // The LosBros - production collection
    this.tokenSequences.set('The LosBros', {
      collectionName: 'The LosBros',
      nextTokenId: 1,
      lockedTokens: new Map(),
      totalSupply: 2222,
      isLocked: false, // Will be locked when live
      lockTimestamp: 0
    });

    // Los Bros - newly deployed collection
    this.tokenSequences.set('Los Bros', {
      collectionName: 'Los Bros',
      nextTokenId: 1,
      lockedTokens: new Map(),
      totalSupply: 2222,
      isLocked: false, // Ready for minting
      lockTimestamp: 0
    });

    // New Collection - ready for setup
    this.tokenSequences.set('New Collection', {
      collectionName: 'New Collection',
      nextTokenId: 1,
      lockedTokens: new Map(),
      totalSupply: 1000,
      isLocked: false,
      lockTimestamp: 0
    });
  }

  /**
   * Lock token sequence for a collection (prevents ID changes)
   */
  lockTokenSequence(collectionName: string, lockedBy: string): boolean {
    try {
      const sequence = this.tokenSequences.get(collectionName);
      if (!sequence) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      if (sequence.isLocked) {
        console.warn(`⚠️ Token sequence already locked for: ${collectionName}`);
        return true;
      }

      sequence.isLocked = true;
      sequence.lockTimestamp = Date.now();
      
      console.log(`🔒 Token sequence locked for ${collectionName} by ${lockedBy}`);
      return true;

    } catch (error) {
      console.error(`❌ Error locking token sequence:`, error);
      return false;
    }
  }

  /**
   * Get next token ID for minting
   */
  getNextTokenId(collectionName: string): number {
    const sequence = this.tokenSequences.get(collectionName);
    if (!sequence) {
      console.error(`❌ Collection not found: ${collectionName}`);
      return 1;
    }

    if (sequence.nextTokenId > sequence.totalSupply) {
      console.error(`❌ Token ID exceeds total supply for ${collectionName}`);
      return sequence.totalSupply;
    }

    return sequence.nextTokenId;
  }

  /**
   * Reserve token ID and lock metadata
   */
  reserveTokenId(
    collectionName: string,
    mintAddress: string,
    mintedBy: string
  ): LockedTokenMetadata | null {
    try {
      const sequence = this.tokenSequences.get(collectionName);
      if (!sequence) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return null;
      }

      const tokenId = sequence.nextTokenId;
      
      // Check if token ID is available
      if (sequence.lockedTokens.has(tokenId)) {
        console.error(`❌ Token ID ${tokenId} already reserved for ${collectionName}`);
        return null;
      }

      // Check if sequence is locked and this is a new mint
      if (sequence.isLocked && tokenId > 1) {
        console.error(`❌ Cannot mint new tokens on locked sequence: ${collectionName}`);
        return null;
      }

      // Create locked metadata
      const lockedMetadata: LockedTokenMetadata = {
        tokenId,
        collectionName,
        mintAddress,
        metadataUri: this.generateMetadataUri(collectionName, tokenId),
        attributes: {
          token_id: tokenId,
          collection: collectionName,
          mint_timestamp: Date.now(),
          blockchain_reference: `mint_${mintAddress}_token_${tokenId}`
        },
        lockedAt: Date.now(),
        lockedBy: mintedBy
      };

      // Reserve the token ID
      sequence.lockedTokens.set(tokenId, lockedMetadata);
      sequence.nextTokenId = tokenId + 1;

      console.log(`✅ Token ID ${tokenId} reserved for ${collectionName}`);
      console.log(`📝 Metadata URI: ${lockedMetadata.metadataUri}`);
      
      return lockedMetadata;

    } catch (error) {
      console.error(`❌ Error reserving token ID:`, error);
      return null;
    }
  }

  /**
   * Generate consistent metadata URI
   */
  private generateMetadataUri(collectionName: string, tokenId: number): string {
    const collectionSlug = collectionName.toLowerCase().replace(/\s+/g, '_');
    return `https://metadata.launchonlos.fun/${collectionSlug}/${tokenId}.json`;
  }

  /**
   * Get locked metadata for a token ID
   */
  getLockedMetadata(collectionName: string, tokenId: number): LockedTokenMetadata | null {
    const sequence = this.tokenSequences.get(collectionName);
    if (!sequence) {
      return null;
    }

    return sequence.lockedTokens.get(tokenId) || null;
  }

  /**
   * Get all locked tokens for a collection
   */
  getAllLockedTokens(collectionName: string): LockedTokenMetadata[] {
    const sequence = this.tokenSequences.get(collectionName);
    if (!sequence) {
      return [];
    }

    return Array.from(sequence.lockedTokens.values()).sort((a, b) => a.tokenId - b.tokenId);
  }

  /**
   * Validate token ID consistency
   */
  validateTokenConsistency(collectionName: string): {
    isValid: boolean;
    issues: string[];
    lockedCount: number;
    nextTokenId: number;
    totalSupply: number;
  } {
    const sequence = this.tokenSequences.get(collectionName);
    if (!sequence) {
      return {
        isValid: false,
        issues: [`Collection not found: ${collectionName}`],
        lockedCount: 0,
        nextTokenId: 0,
        totalSupply: 0
      };
    }

    const issues: string[] = [];
    
    // Check for gaps in token IDs
    const lockedIds = Array.from(sequence.lockedTokens.keys()).sort((a, b) => a - b);
    for (let i = 0; i < lockedIds.length; i++) {
      const expectedId = i + 1;
      if (lockedIds[i] !== expectedId) {
        issues.push(`Token ID gap detected: expected ${expectedId}, found ${lockedIds[i]}`);
      }
    }

    // Check if next token ID is correct
    const expectedNextId = lockedIds.length + 1;
    if (sequence.nextTokenId !== expectedNextId) {
      issues.push(`Next token ID mismatch: expected ${expectedNextId}, found ${sequence.nextTokenId}`);
    }

    // Check if locked count exceeds total supply
    if (sequence.lockedTokens.size > sequence.totalSupply) {
      issues.push(`Locked tokens (${sequence.lockedTokens.size}) exceed total supply (${sequence.totalSupply})`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      lockedCount: sequence.lockedTokens.size,
      nextTokenId: sequence.nextTokenId,
      totalSupply: sequence.totalSupply
    };
  }

  /**
   * Update total supply for a collection
   */
  updateTotalSupply(collectionName: string, newTotalSupply: number): boolean {
    try {
      const sequence = this.tokenSequences.get(collectionName);
      if (!sequence) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      if (sequence.isLocked) {
        console.error(`❌ Cannot update total supply for locked collection: ${collectionName}`);
        return false;
      }

      if (newTotalSupply < sequence.lockedTokens.size) {
        console.error(`❌ New total supply (${newTotalSupply}) cannot be less than locked tokens (${sequence.lockedTokens.size})`);
        return false;
      }

      sequence.totalSupply = newTotalSupply;
      console.log(`✅ Total supply updated for ${collectionName}: ${newTotalSupply}`);
      return true;

    } catch (error) {
      console.error(`❌ Error updating total supply:`, error);
      return false;
    }
  }

  /**
   * Get collection sequence status
   */
  getSequenceStatus(collectionName: string): {
    collectionName: string;
    nextTokenId: number;
    lockedCount: number;
    totalSupply: number;
    isLocked: boolean;
    lockTimestamp: number;
    lockedTokens: LockedTokenMetadata[];
  } | null {
    const sequence = this.tokenSequences.get(collectionName);
    if (!sequence) {
      return null;
    }

    return {
      collectionName: sequence.collectionName,
      nextTokenId: sequence.nextTokenId,
      lockedCount: sequence.lockedTokens.size,
      totalSupply: sequence.totalSupply,
      isLocked: sequence.isLocked,
      lockTimestamp: sequence.lockTimestamp,
      lockedTokens: Array.from(sequence.lockedTokens.values()).sort((a, b) => a.tokenId - b.tokenId)
    };
  }

  /**
   * Force unlock sequence (admin only)
   */
  forceUnlockSequence(collectionName: string, adminWallet: string): boolean {
    try {
      const sequence = this.tokenSequences.get(collectionName);
      if (!sequence) {
        console.error(`❌ Collection not found: ${collectionName}`);
        return false;
      }

      sequence.isLocked = false;
      sequence.lockTimestamp = 0;
      
      console.log(`🔓 Token sequence force unlocked for ${collectionName} by admin ${adminWallet}`);
      return true;

    } catch (error) {
      console.error(`❌ Error force unlocking sequence:`, error);
      return false;
    }
  }
}

export const tokenIDConsistencyService = new TokenIDConsistencyService();
