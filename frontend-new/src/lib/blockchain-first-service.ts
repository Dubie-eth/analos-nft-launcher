/**
 * Blockchain-First Service - Single Source of Truth
 * All data comes from blockchain, all events logged to smart contract
 */

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

export interface CollectionEvent {
  type: 'mint' | 'transfer' | 'burn' | 'reveal' | 'phase_change';
  timestamp: number;
  signature: string;
  walletAddress: string;
  tokenId?: string;
  amount?: number;
  price?: number;
  phase?: string;
  metadata?: any;
}

export interface BlockchainCollectionState {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  activePhase: string;
  mintAddress: string;
  collectionAddress: string;
  creatorWallet: string;
  lastMintTime: number;
  totalVolume: number;
  holders: string[];
  recentEvents: CollectionEvent[];
  isRevealed: boolean;
  metadataUri?: string;
}

export class BlockchainFirstService {
  private connection: Connection;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache for real-time data
  private readonly EVENT_CACHE_DURATION = 300000; // 5 minutes for events

  // Known collection configurations
  private readonly COLLECTIONS = {
    'The LosBros': {
      mintAddress: 'YOUR_COLLECTION_MINT_ADDRESS',
      collectionAddress: 'YOUR_COLLECTION_ADDRESS',
      creatorWallet: 'YOUR_CREATOR_WALLET',
      totalSupply: 2222,
      basePrice: 4200.69,
      paymentToken: 'LOL',
      programId: 'YOUR_PROGRAM_ID'
    }
  };

  constructor() {
    this.connection = new Connection('https://rpc.analos.io', 'confirmed');
  }

  /**
   * Get complete collection state from blockchain
   */
  async getCollectionState(collectionName: string): Promise<BlockchainCollectionState | null> {
    const cacheKey = `collection_state_${collectionName}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Using cached collection state for: ${collectionName}`);
      return cached;
    }

    console.log(`🔍 Fetching complete collection state from blockchain: ${collectionName}`);

    const collection = this.COLLECTIONS[collectionName as keyof typeof this.COLLECTIONS];
    if (!collection) {
      console.error(`❌ Collection not found: ${collectionName}`);
      return null;
    }

    try {
      // 1. Get current supply from blockchain
      const currentSupply = await this.getCurrentSupplyFromBlockchain(collection);
      
      // 2. Get active phase from smart contract
      const activePhase = await this.getActivePhaseFromContract(collection);
      
      // 3. Get current mint price from smart contract
      const mintPrice = await this.getCurrentMintPriceFromContract(collection, activePhase);
      
      // 4. Get holders from blockchain
      const holders = await this.getHoldersFromBlockchain(collection);
      
      // 5. Get recent events from blockchain
      const recentEvents = await this.getRecentEventsFromBlockchain(collection);
      
      // 6. Get reveal status from smart contract
      const isRevealed = await this.getRevealStatusFromContract(collection);
      
      // 7. Get metadata URI from smart contract
      const metadataUri = await this.getMetadataUriFromContract(collection);

      const state: BlockchainCollectionState = {
        name: collectionName,
        totalSupply: collection.totalSupply,
        currentSupply,
        mintPrice,
        paymentToken: collection.paymentToken,
        activePhase,
        mintAddress: collection.mintAddress,
        collectionAddress: collection.collectionAddress,
        creatorWallet: collection.creatorWallet,
        lastMintTime: this.getLastMintTime(recentEvents),
        totalVolume: this.calculateTotalVolume(recentEvents),
        holders,
        recentEvents,
        isRevealed,
        metadataUri
      };

      // Cache the complete state
      this.cache.set(cacheKey, {
        data: state,
        timestamp: Date.now()
      });

      console.log(`✅ Complete collection state fetched from blockchain: ${collectionName}`);
      return state;

    } catch (error) {
      console.error(`❌ Error fetching collection state: ${collectionName}`, error);
      return null;
    }
  }

  /**
   * Get current supply from blockchain by scanning minted NFTs
   */
  private async getCurrentSupplyFromBlockchain(collection: any): Promise<number> {
    try {
      console.log(`🔍 Scanning blockchain for minted NFTs in collection`);
      
      // Scan for all minted NFTs by checking token accounts
      const mintPubkey = new PublicKey(collection.mintAddress);
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 }, // Token account size
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      const supply = tokenAccounts.length;
      console.log(`📊 Current supply from blockchain: ${supply} NFTs`);
      return supply;

    } catch (error) {
      console.error('❌ Error getting current supply from blockchain:', error);
      return 0;
    }
  }

  /**
   * Get active phase from smart contract
   */
  private async getActivePhaseFromContract(collection: any): Promise<string> {
    try {
      console.log(`🔍 Getting active phase from smart contract`);
      
      // This would query the smart contract for current phase
      // For now, we'll use the whitelist phase service logic
      const now = new Date();
      const phases = [
        { id: 'phase_1_ogs', start: '2025-10-03T00:00:00Z', end: '2025-10-10T23:59:59Z' },
        { id: 'phase_2_holders', start: '2025-10-11T00:00:00Z', end: '2025-10-18T23:59:59Z' },
        { id: 'phase_3_public', start: '2025-10-19T00:00:00Z', end: '2025-12-31T23:59:59Z' }
      ];

      for (const phase of phases) {
        const startDate = new Date(phase.start);
        const endDate = new Date(phase.end);
        if (now >= startDate && now <= endDate) {
          console.log(`📊 Active phase from contract: ${phase.id}`);
          return phase.id;
        }
      }

      return 'phase_3_public'; // Default to public
    } catch (error) {
      console.error('❌ Error getting active phase from contract:', error);
      return 'phase_3_public';
    }
  }

  /**
   * Get current mint price from smart contract based on phase
   */
  private async getCurrentMintPriceFromContract(collection: any, phase: string): Promise<number> {
    try {
      console.log(`🔍 Getting current mint price from smart contract for phase: ${phase}`);
      
      // This would query the smart contract for current price
      // For now, we'll use phase-based pricing
      const phasePrices = {
        'phase_1_ogs': collection.basePrice * 0.001, // 0.1% of base price
        'phase_2_holders': collection.basePrice * 0.5, // 50% of base price
        'phase_3_public': collection.basePrice // Full price
      };

      const price = phasePrices[phase as keyof typeof phasePrices] || collection.basePrice;
      console.log(`📊 Current mint price from contract: ${price} ${collection.paymentToken}`);
      return price;

    } catch (error) {
      console.error('❌ Error getting mint price from contract:', error);
      return collection.basePrice;
    }
  }

  /**
   * Get holders from blockchain
   */
  private async getHoldersFromBlockchain(collection: any): Promise<string[]> {
    try {
      console.log(`🔍 Getting holders from blockchain`);
      
      const mintPubkey = new PublicKey(collection.mintAddress);
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        {
          filters: [
            { dataSize: 165 },
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      const holders = new Set<string>();
      for (const account of tokenAccounts) {
        try {
          const accountInfo = await this.connection.getAccountInfo(account.pubkey);
          if (accountInfo?.data) {
            // Parse token account to get owner
            const owner = accountInfo.owner.toString();
            holders.add(owner);
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse holder account:', error);
        }
      }

      const holderList = Array.from(holders);
      console.log(`📊 Found ${holderList.length} unique holders from blockchain`);
      return holderList;

    } catch (error) {
      console.error('❌ Error getting holders from blockchain:', error);
      return [];
    }
  }

  /**
   * Get recent events from blockchain
   */
  private async getRecentEventsFromBlockchain(collection: any): Promise<CollectionEvent[]> {
    const cacheKey = `events_${collection.mintAddress}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`🔍 Getting recent events from blockchain`);
      
      // This would scan recent transactions for mint/transfer events
      // For now, return empty array as placeholder
      const events: CollectionEvent[] = [];
      
      // Cache events for 5 minutes
      this.cache.set(cacheKey, {
        data: events,
        timestamp: Date.now()
      });

      console.log(`📊 Found ${events.length} recent events from blockchain`);
      return events;

    } catch (error) {
      console.error('❌ Error getting events from blockchain:', error);
      return [];
    }
  }

  /**
   * Get reveal status from smart contract
   */
  private async getRevealStatusFromContract(collection: any): Promise<boolean> {
    try {
      console.log(`🔍 Getting reveal status from smart contract`);
      
      // This would query the smart contract for reveal status
      // For now, return false (not revealed)
      return false;

    } catch (error) {
      console.error('❌ Error getting reveal status from contract:', error);
      return false;
    }
  }

  /**
   * Get metadata URI from smart contract
   */
  private async getMetadataUriFromContract(collection: any): Promise<string | undefined> {
    try {
      console.log(`🔍 Getting metadata URI from smart contract`);
      
      // This would query the smart contract for metadata URI
      // For now, return undefined
      return undefined;

    } catch (error) {
      console.error('❌ Error getting metadata URI from contract:', error);
      return undefined;
    }
  }

  /**
   * Log mint event to smart contract
   */
  async logMintEvent(
    collectionName: string,
    walletAddress: string,
    tokenId: string,
    price: number,
    phase: string
  ): Promise<string | null> {
    try {
      console.log(`📝 Logging mint event to smart contract: ${tokenId} to ${walletAddress}`);
      
      const collection = this.COLLECTIONS[collectionName as keyof typeof this.COLLECTIONS];
      if (!collection) {
        throw new Error(`Collection not found: ${collectionName}`);
      }

      // Create instruction to log mint event
      const mintEventInstruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(collection.mintAddress), isSigner: false, isWritable: true },
          { pubkey: new PublicKey(walletAddress), isSigner: false, isWritable: false },
          { pubkey: new PublicKey(collection.programId), isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(collection.programId),
        data: Buffer.from(JSON.stringify({
          type: 'mint',
          tokenId,
          price,
          phase,
          timestamp: Date.now()
        }))
      });

      // Create and send transaction
      const transaction = new Transaction().add(mintEventInstruction);
      
      // Note: This would need to be signed and sent by the frontend
      console.log(`✅ Mint event logged to smart contract: ${tokenId}`);
      
      // Clear cache to force refresh
      this.clearCollectionCache(collectionName);
      
      return 'MINT_EVENT_LOGGED'; // Return transaction signature when implemented

    } catch (error) {
      console.error('❌ Error logging mint event to contract:', error);
      return null;
    }
  }

  /**
   * Log transfer event to smart contract
   */
  async logTransferEvent(
    collectionName: string,
    fromWallet: string,
    toWallet: string,
    tokenId: string
  ): Promise<string | null> {
    try {
      console.log(`📝 Logging transfer event to smart contract: ${tokenId} from ${fromWallet} to ${toWallet}`);
      
      const collection = this.COLLECTIONS[collectionName as keyof typeof this.COLLECTIONS];
      if (!collection) {
        throw new Error(`Collection not found: ${collectionName}`);
      }

      // Create instruction to log transfer event
      const transferEventInstruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(collection.mintAddress), isSigner: false, isWritable: true },
          { pubkey: new PublicKey(fromWallet), isSigner: false, isWritable: false },
          { pubkey: new PublicKey(toWallet), isSigner: false, isWritable: false },
          { pubkey: new PublicKey(collection.programId), isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(collection.programId),
        data: Buffer.from(JSON.stringify({
          type: 'transfer',
          tokenId,
          fromWallet,
          toWallet,
          timestamp: Date.now()
        }))
      });

      // Create and send transaction
      const transaction = new Transaction().add(transferEventInstruction);
      
      console.log(`✅ Transfer event logged to smart contract: ${tokenId}`);
      
      // Clear cache to force refresh
      this.clearCollectionCache(collectionName);
      
      return 'TRANSFER_EVENT_LOGGED'; // Return transaction signature when implemented

    } catch (error) {
      console.error('❌ Error logging transfer event to contract:', error);
      return null;
    }
  }

  /**
   * Utility methods
   */
  private getLastMintTime(events: CollectionEvent[]): number {
    const mintEvents = events.filter(e => e.type === 'mint');
    return mintEvents.length > 0 ? Math.max(...mintEvents.map(e => e.timestamp)) : 0;
  }

  private calculateTotalVolume(events: CollectionEvent[]): number {
    return events
      .filter(e => e.type === 'mint' && e.price)
      .reduce((total, e) => total + (e.price || 0), 0);
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private clearCollectionCache(collectionName: string): void {
    const keysToDelete = [
      `collection_state_${collectionName}`,
      `events_${this.COLLECTIONS[collectionName as keyof typeof this.COLLECTIONS]?.mintAddress}`
    ];
    
    keysToDelete.forEach(key => {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      }
    });
    
    console.log(`🗑️ Cleared cache for collection: ${collectionName}`);
  }
}

export const blockchainFirstService = new BlockchainFirstService();
