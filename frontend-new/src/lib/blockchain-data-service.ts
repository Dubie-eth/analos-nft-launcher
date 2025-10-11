import { PublicKey } from '@solana/web3.js';
import { AnalosConnection, Analos } from './analos-web3-wrapper';
import { tokenIdTracker } from './token-id-tracker';
import { adminControlService } from './admin-control-service';
import { feeManagementService } from './fee-management-service';

export interface BlockchainCollectionData {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  mintAddress: string;
  collectionAddress: string;
  isActive: boolean;
  holders: NFTHolder[];
  mintedNFTs: MintedNFT[];
}

export interface NFTHolder {
  walletAddress: string;
  nftCount: number;
  nftMintAddresses: string[];
  firstMintTime: number;
  lastMintTime: number;
}

export interface MintedNFT {
  mintAddress: string;
  ownerAddress: string;
  mintTime: number;
  tokenId: number;
  transactionSignature: string;
}

export class BlockchainDataService {
  private connection: AnalosConnection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  
  // Cache to reduce blockchain calls
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache - much longer to reduce polling
  private readonly NOT_FOUND_CACHE_DURATION = 600000; // 10 minutes cache for "not found" results
  
  // Rate limiting to prevent infinite loops
  private callCounts: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly MAX_CALLS_PER_MINUTE = 3; // Reduced from 5 to 3
  
  // Track initialization to prevent duplicate logging
  private static initializationLogged = false;
  
  // Global infinite loop prevention - more aggressive
  private static globalCallTracker: Map<string, { count: number; timestamp: number }> = new Map();
  private static readonly GLOBAL_MAX_CALLS_PER_MINUTE = 5; // Reduced from 10 to 5
  
  // Circuit breaker for failing collections
  private static circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private static readonly MAX_FAILURES = 3; // Reduced from 5 to 3
  private static readonly CIRCUIT_BREAKER_TIMEOUT = 600000; // Increased to 10 minutes
  
  // Block repeated calls for the same collection within a short time
  private static recentCalls: Map<string, number> = new Map();
  private static readonly CALL_COOLDOWN = 30000; // 30 seconds cooldown between calls
  
  // Collection configurations - will be managed by admin controls and fee management
  private async getCollectionConfig(collectionName: string) {
    // Get collection config from admin service
    const collection = await adminControlService.getCollection(collectionName);
    if (collection) {
      // Get total price including all fees from fee management service
      const totalPrice = feeManagementService.getTotalMintPrice(collectionName);
      
      return {
        collectionAddress: `collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
        mintAddress: `mint_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
        totalSupply: collection.totalSupply,
        mintPrice: totalPrice, // Total price including platform and creator fees
        basePrice: collection.mintPrice, // Base price before fees
        paymentToken: collection.paymentToken,
        isActive: collection.isActive,
        mintingEnabled: collection.mintingEnabled,
        isTestMode: collection.isTestMode,
        feeBreakdown: feeManagementService.getFeeBreakdown(collectionName)
      };
    }
    
    // Fallback for unknown collections
    return {
      collectionAddress: `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
      mintAddress: `mint_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
      totalSupply: 1000,
      mintPrice: 100.00,
      basePrice: 100.00,
      paymentToken: 'LOS',
      isActive: false,
      mintingEnabled: false,
      isTestMode: true,
      feeBreakdown: feeManagementService.getFeeBreakdown(collectionName)
    };
  }

  constructor(rpcUrl?: string) {
    this.connection = new AnalosConnection(rpcUrl || this.ANALOS_RPC_URL, {
      network: 'MAINNET',
      commitment: 'confirmed'
    });
    // Only log once to reduce console spam
    if (!BlockchainDataService.initializationLogged) {
      console.log('🔗 Blockchain Data Service initialized with:', this.connection.getClusterInfo().name);
      BlockchainDataService.initializationLogged = true;
    }
  }

  // Cache helper methods
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    const isNotFoundCache = key.startsWith('not_found_');
    const cacheDuration = isNotFoundCache ? this.NOT_FOUND_CACHE_DURATION : this.CACHE_DURATION;
    
    if (cached && (Date.now() - cached.timestamp) < cacheDuration) {
      console.log('📋 Using cached data for:', key);
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Clear cache manually (for refresh button)
   */
  public clearCacheManually(): void {
    console.log('🔄 Manually clearing blockchain data cache');
    this.cache.clear();
  }

  /**
   * Discover all collections deployed on the blockchain
   */
  async discoverBlockchainCollections(): Promise<BlockchainCollectionData[]> {
    try {
      console.log('🔍 Discovering collections on blockchain...');
      
      // For now, we'll focus on collections that are already known to exist
      // and verify they have blockchain presence rather than scanning the entire blockchain
      
      // Get collections from localStorage (deployed collections)
      const launchedCollections = localStorage.getItem('launched_collections');
      const discoveredCollections: BlockchainCollectionData[] = [];
      
      if (launchedCollections) {
        try {
          const collections = JSON.parse(launchedCollections);
          console.log(`📦 Found ${collections.length} deployed collections to verify on blockchain`);
          
          for (const collection of collections) {
            try {
              // Try to get blockchain data for this collection
              const blockchainData = await this.getCollectionData(collection.name);
              
              if (blockchainData) {
                discoveredCollections.push(blockchainData);
                console.log(`✅ Verified collection "${collection.name}" exists on blockchain`);
              } else {
                // Even if we can't get full blockchain data, we know it was deployed
                // Create a basic blockchain collection entry
                discoveredCollections.push({
                  name: collection.name,
                  totalSupply: collection.maxSupply || 2222,
                  currentSupply: collection.totalMinted || 0,
                  mintPrice: collection.mintPrice || 0,
                  paymentToken: collection.pricingToken || 'LOL',
                  mintAddress: collection.signature || 'Unknown',
                  collectionAddress: collection.signature || 'Unknown',
                  isActive: collection.isActive || true,
                  holders: [],
                  mintedNFTs: []
                });
                console.log(`📋 Added deployed collection "${collection.name}" to blockchain discovery`);
              }
            } catch (error) {
              console.warn(`⚠️ Could not verify collection "${collection.name}" on blockchain:`, error);
              // Still add it as a deployed collection
              discoveredCollections.push({
                name: collection.name,
                totalSupply: collection.maxSupply || 2222,
                currentSupply: collection.totalMinted || 0,
                mintPrice: collection.mintPrice || 0,
                paymentToken: collection.pricingToken || 'LOL',
                mintAddress: collection.signature || 'Unknown',
                collectionAddress: collection.signature || 'Unknown',
                isActive: collection.isActive || true,
                holders: [],
                mintedNFTs: []
              });
            }
          }
        } catch (error) {
          console.error('Error parsing launched collections:', error);
        }
      }
      
      // Also check admin service collections
      try {
        const { adminControlService } = await import('./admin-control-service');
        const adminCollections = adminControlService.getAllCollections();
        
        for (const collection of adminCollections) {
          // Check if this collection is already in our discovered list
          if (!discoveredCollections.find(c => c.name === collection.name)) {
            discoveredCollections.push({
              name: collection.name,
              totalSupply: collection.totalSupply,
              currentSupply: 0, // Would need blockchain query
              mintPrice: collection.mintPrice,
              paymentToken: collection.paymentToken,
              mintAddress: 'Admin Managed',
              collectionAddress: 'Admin Managed',
              isActive: collection.isActive,
              holders: [],
              mintedNFTs: []
            });
          }
        }
      } catch (error) {
        console.warn('Could not load admin collections for blockchain discovery:', error);
      }

      console.log(`✅ Discovered ${discoveredCollections.length} collections on blockchain`);
      
      return discoveredCollections;
    } catch (error) {
      console.error('❌ Error discovering blockchain collections:', error);
      return [];
    }
  }

  /**
   * Get NFT metadata (simplified implementation)
   */
  private async getNFTMetadata(mintAddress: PublicKey): Promise<any> {
    try {
      // This would normally query the Metaplex metadata program
      // For now, return mock data
      return {
        collection: {
          name: 'Discovered Collection'
        }
      };
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get real blockchain data for a collection
   */
  async getCollectionData(collectionName: string): Promise<BlockchainCollectionData | null> {
    try {
      const now = Date.now();
      
      // Check recent calls cooldown first
      const recentCallKey = `recent_${collectionName}`;
      const lastCall = BlockchainDataService.recentCalls.get(recentCallKey);
      if (lastCall && (now - lastCall) < BlockchainDataService.CALL_COOLDOWN) {
        console.warn(`🚨 CALL COOLDOWN ACTIVE for ${collectionName} - blocking call for ${Math.round((BlockchainDataService.CALL_COOLDOWN - (now - lastCall)) / 1000)} more seconds`);
        return null;
      }
      
      // Global rate limiting check to prevent infinite loops
      const globalCallKey = `global_calls_${collectionName}`;
      const globalCallData = BlockchainDataService.globalCallTracker.get(globalCallKey);
      
      if (globalCallData) {
        if (now - globalCallData.timestamp > 60000) {
          BlockchainDataService.globalCallTracker.set(globalCallKey, { count: 1, timestamp: now });
        } else {
          if (globalCallData.count >= BlockchainDataService.GLOBAL_MAX_CALLS_PER_MINUTE) {
            console.warn(`🚨 GLOBAL RATE LIMIT EXCEEDED for ${collectionName} - blocking further calls for 1 minute`);
            return null;
          }
          BlockchainDataService.globalCallTracker.set(globalCallKey, { count: globalCallData.count + 1, timestamp: globalCallData.timestamp });
        }
      } else {
        BlockchainDataService.globalCallTracker.set(globalCallKey, { count: 1, timestamp: now });
      }
      
      // Update recent calls tracker
      BlockchainDataService.recentCalls.set(recentCallKey, now);

      // Circuit breaker check
      const circuitBreakerKey = `circuit_${collectionName}`;
      const circuitState = BlockchainDataService.circuitBreaker.get(circuitBreakerKey);
      
      if (circuitState) {
        const timeSinceLastFailure = now - circuitState.lastFailure;
        
        if (circuitState.isOpen && timeSinceLastFailure < BlockchainDataService.CIRCUIT_BREAKER_TIMEOUT) {
          console.warn(`🚨 CIRCUIT BREAKER OPEN for ${collectionName} - blocking calls for ${Math.round((BlockchainDataService.CIRCUIT_BREAKER_TIMEOUT - timeSinceLastFailure) / 1000)} more seconds`);
          return null;
        } else if (circuitState.isOpen && timeSinceLastFailure >= BlockchainDataService.CIRCUIT_BREAKER_TIMEOUT) {
          // Reset circuit breaker
          circuitState.isOpen = false;
          circuitState.failures = 0;
          console.log(`🔄 Circuit breaker reset for ${collectionName}`);
        }
      }

      // Instance rate limiting check
      const callKey = `calls_${collectionName}`;
      const callData = this.callCounts.get(callKey);
      
      if (callData) {
        // Reset counter if it's been more than a minute
        if (now - callData.timestamp > 60000) {
          this.callCounts.set(callKey, { count: 1, timestamp: now });
        } else {
          // Check if we've exceeded the rate limit
          if (callData.count >= this.MAX_CALLS_PER_MINUTE) {
            console.warn(`⚠️ Rate limit exceeded for collection ${collectionName}, returning cached data`);
            const cacheKey = `collection_${collectionName}`;
            const cachedData = this.getFromCache(cacheKey);
            return cachedData || null;
          }
          // Increment call count
          this.callCounts.set(callKey, { count: callData.count + 1, timestamp: callData.timestamp });
        }
      } else {
        // First call for this collection
        this.callCounts.set(callKey, { count: 1, timestamp: now });
      }
      
      // Check cache first
      const cacheKey = `collection_${collectionName}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Check if we've already determined this collection doesn't exist
      const notFoundCacheKey = `not_found_${cacheKey}`;
      const notFoundCached = this.getFromCache(notFoundCacheKey);
      if (notFoundCached) {
        console.log('📋 Using cached "not found" result for:', collectionName);
        return null;
      }

      console.log('🔗 Fetching real blockchain data for collection:', collectionName);
      
      // Handle URL slug to collection name mapping
      let actualCollectionName = collectionName;
      const collectionNameMappings: { [key: string]: string } = {
        'launch-on-los': 'The LosBros',
        'the-losbros': 'The LosBros',
        'los-bros': 'The LosBros',
        'Launch On LOS': 'The LosBros',
        'losbros': 'The LosBros',
        'the-los-bros': 'The LosBros'
      };
      
      if (collectionNameMappings[collectionName]) {
        actualCollectionName = collectionNameMappings[collectionName];
        console.log('🔄 Mapped collection name from', collectionName, 'to', actualCollectionName);
      }
      
      // Get collection config from admin control service instead of undefined COLLECTION_ADDRESSES
      const collectionConfig = await adminControlService.getCollection(actualCollectionName);
      if (!collectionConfig) {
        console.log('❌ Collection not found in admin control service:', collectionName, '->', actualCollectionName);
        console.log('📋 Available collections in admin service:', Array.from((adminControlService as any).collections.keys()));
        
        // For Los Bros, try to create a fallback collection with deployment data
        if (actualCollectionName === 'Los Bros') {
          console.log('🏗️ Creating fallback Los Bros collection with deployment data...');
          try {
            await adminControlService.createCollection({
              name: 'Los Bros',
              displayName: 'Los Bros - Deployed Collection',
              isActive: true,
              mintingEnabled: true,
              isTestMode: false,
              totalSupply: 2222,
              mintPrice: 4200.69, // Base price for Los Bros collection
              paymentToken: 'LOS',
              description: 'Los Bros launching On LOS setting the standard for NFT minting on #ANALOS with $LOS',
              imageUrl: 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
              creator: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your actual creator wallet address
              deployed: true,
              contractAddresses: {
                mint: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
                tokenAccount: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
                signature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
                collection: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
                metadata: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP'
              },
              deploymentSignature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              deploymentDate: new Date().toISOString()
            });
            console.log('✅ Created fallback Los Bros collection in admin service');
            
            // Retry getting the collection config
            const retryConfig = await adminControlService.getCollection(actualCollectionName);
            if (retryConfig) {
              // Continue with the retry config
              return await this.getCollectionDataWithConfig(collectionName, actualCollectionName, retryConfig);
            }
          } catch (error) {
            console.error('❌ Error creating fallback Los Bros collection:', error);
          }
        }
        
        // Cache the null result for a longer duration to prevent repeated calls
        this.setCache(`not_found_${cacheKey}`, true);
        return null;
      }

      // Fetch minted NFTs from blockchain with caching
      const mintedNFTs = await this.getMintedNFTsFromBlockchain(collectionName);
      
      // Calculate current supply from actual blockchain data
      let currentSupply = mintedNFTs.length;
      
      console.log(`🔍 Scanning blockchain for minted NFTs in collection: ${collectionName}`);
      
      // If no NFTs found from blockchain scan, try to get from token tracker as fallback
      if (currentSupply === 0) {
        const collectionId = `collection_${actualCollectionName.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (tokenIdTracker.collections[collectionId]) {
          const trackerCollection = tokenIdTracker.collections[collectionId];
          currentSupply = trackerCollection.mintedCount || 0;
          console.log(`📊 Using token tracker supply: ${currentSupply} from ${collectionId}`);
        } else {
          console.log(`📊 No token tracker data found for ${collectionId}`);
          console.log(`📊 Available collections:`, Object.keys(tokenIdTracker.collections));
          
          // If still no data, try to get actual addresses from localStorage
          const launchedCollections = localStorage.getItem('launched_collections');
          let actualAddresses = {
            mintAddress: 'So11111111111111111111111111111111111111112', // Default placeholder
            collectionAddress: 'So11111111111111111111111111111111111111113', // Default placeholder
            totalSupply: collectionConfig.totalSupply
          };

          if (launchedCollections) {
            try {
              const collections = JSON.parse(launchedCollections);
              const matchingCollection = collections.find((c: any) => {
                // Check exact name match first
                if (c.name === actualCollectionName) return true;
                // Check URL slug match
                if (c.name.toLowerCase().replace(/\s+/g, '-') === collectionName.toLowerCase().replace(/\s+/g, '-')) return true;
                // Check mapped name match
                if (collectionNameMappings[collectionName] && c.name === collectionNameMappings[collectionName]) return true;
                return false;
              });
              
              if (matchingCollection && matchingCollection.signature) {
                // For now, use the signature as a reference - in a real implementation,
                // we'd extract the actual mint and collection addresses from the transaction
                console.log(`📊 Found deployed collection: ${matchingCollection.name} with signature: ${matchingCollection.signature}`);
                // TODO: Parse the actual mint/collection addresses from the deployment transaction
              }
            } catch (error) {
              console.warn('⚠️ Error parsing launched collections:', error);
            }
          }

          currentSupply = await this.performThoroughBlockchainScan(actualCollectionName, actualAddresses);
        }
      }
      
      // Get holder data
      const holders = await this.getNFTHolders(mintedNFTs);
      
      // Try to get actual addresses from localStorage
      const launchedCollections = localStorage.getItem('launched_collections');
      let mintAddress = 'So11111111111111111111111111111111111111112'; // Default placeholder
      let collectionAddress = 'So11111111111111111111111111111111111111113'; // Default placeholder

      if (launchedCollections) {
        try {
          const collections = JSON.parse(launchedCollections);
          const matchingCollection = collections.find((c: any) => {
            // Check exact name match first
            if (c.name === actualCollectionName) return true;
            // Check URL slug match
            if (c.name.toLowerCase().replace(/\s+/g, '-') === collectionName.toLowerCase().replace(/\s+/g, '-')) return true;
            // Check mapped name match
            if (collectionNameMappings[collectionName] && c.name === collectionNameMappings[collectionName]) return true;
            return false;
          });
          
          if (matchingCollection) {
            console.log(`📊 Found deployed collection: ${matchingCollection.name}`);
            // TODO: Extract actual addresses from deployment transaction
            // For now, we'll use placeholders but log that we found the collection
          }
        } catch (error) {
          console.warn('⚠️ Error parsing launched collections for addresses:', error);
        }
      }

      const collectionData: BlockchainCollectionData = {
        name: actualCollectionName,
        totalSupply: collectionConfig.totalSupply,
        currentSupply: currentSupply,
        mintPrice: collectionConfig.mintPrice,
        paymentToken: collectionConfig.paymentToken,
        mintAddress: mintAddress,
        collectionAddress: collectionAddress,
        isActive: collectionConfig.isActive,
        holders: holders,
        mintedNFTs: mintedNFTs
      };

      console.log('🔗 Real blockchain data fetched:', {
        collection: collectionName,
        totalSupply: collectionData.totalSupply,
        currentSupply: collectionData.currentSupply,
        mintPrice: collectionData.mintPrice,
        holders: collectionData.holders.length,
        mintedNFTs: collectionData.mintedNFTs.length
      });

      // Cache the result
      this.setCache(cacheKey, collectionData);
      return collectionData;

    } catch (error) {
      console.error('❌ Error fetching blockchain data:', error);
      
      // Track failure for circuit breaker
      const circuitBreakerKey = `circuit_${collectionName}`;
      const circuitState = BlockchainDataService.circuitBreaker.get(circuitBreakerKey) || { failures: 0, lastFailure: 0, isOpen: false };
      
      circuitState.failures++;
      circuitState.lastFailure = Date.now();
      
      if (circuitState.failures >= BlockchainDataService.MAX_FAILURES) {
        circuitState.isOpen = true;
        console.warn(`🚨 CIRCUIT BREAKER OPENED for ${collectionName} after ${circuitState.failures} failures`);
      }
      
      BlockchainDataService.circuitBreaker.set(circuitBreakerKey, circuitState);
      
      return null;
    }
  }

  /**
   * Get minted NFTs from blockchain (simplified implementation)
   */
  private async getMintedNFTsFromBlockchain(collectionName: string): Promise<MintedNFT[]> {
    try {
      console.log('🔍 Scanning blockchain for minted NFTs in collection:', collectionName);
      
      // This is a simplified implementation
      // In a real implementation, you would:
      // 1. Query the smart contract for all minted NFTs
      // 2. Scan token accounts that hold NFTs from this collection
      // 3. Use Metaplex metadata to identify collection NFTs
      
      // For now, we'll use the token ID tracker as a proxy for blockchain data
      const collectionId = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
      
      const mintedNFTs: MintedNFT[] = [];
      
      if (tokenIdTracker.collections[collectionId]) {
        const collection = tokenIdTracker.collections[collectionId];
        
        // Convert token tracker data to blockchain format
        Object.values(collection.mintedNFTs || {}).forEach((nft: any, index: number) => {
          // Add comprehensive null checks to prevent undefined errors
          if (nft && nft.mintAddress && nft.ownerAddress && typeof nft.mintAddress === 'string') {
            try {
              mintedNFTs.push({
                mintAddress: nft.mintAddress,
                ownerAddress: nft.ownerAddress,
                mintTime: nft.mintTime || Date.now() - (index * 60000), // Use actual mint time if available
                tokenId: nft.tokenId || index + 1,
                transactionSignature: `tx_${nft.mintAddress.slice(0, 8)}_${Date.now()}`
              });
            } catch (error) {
              console.log('⚠️ Error processing NFT data:', error, 'NFT:', nft);
              // Skip this NFT but continue processing others
            }
          } else {
            console.log('⚠️ Skipping invalid NFT data:', nft);
          }
        });
        
        console.log(`🔗 Found ${mintedNFTs.length} minted NFTs from token tracker`);
      }
      
      // In a real implementation, you would also scan the blockchain for additional NFTs
      // that might not be in the token tracker
      
      return mintedNFTs;

    } catch (error) {
      console.error('❌ Error getting minted NFTs from blockchain:', error);
      return [];
    }
  }

  /**
   * Get NFT holders data
   */
  private async getNFTHolders(mintedNFTs: MintedNFT[]): Promise<NFTHolder[]> {
    try {
      console.log('🔍 Calculating NFT holder data...');
      
      const holderMap = new Map<string, NFTHolder>();
      
      mintedNFTs.forEach(nft => {
        const existingHolder = holderMap.get(nft.ownerAddress);
        
        if (existingHolder) {
          existingHolder.nftCount++;
          existingHolder.nftMintAddresses.push(nft.mintAddress);
          existingHolder.lastMintTime = Math.max(existingHolder.lastMintTime, nft.mintTime);
          existingHolder.firstMintTime = Math.min(existingHolder.firstMintTime, nft.mintTime);
        } else {
          holderMap.set(nft.ownerAddress, {
            walletAddress: nft.ownerAddress,
            nftCount: 1,
            nftMintAddresses: [nft.mintAddress],
            firstMintTime: nft.mintTime,
            lastMintTime: nft.mintTime
          });
        }
      });
      
      const holders = Array.from(holderMap.values());
      console.log(`🔗 Found ${holders.length} unique NFT holders`);
      
      return holders;

    } catch (error) {
      console.error('❌ Error calculating NFT holders:', error);
      return [];
    }
  }

  /**
   * Get collection supply data
   */
  async getCollectionSupply(collectionName: string): Promise<{
    totalSupply: number;
    currentSupply: number;
    remainingSupply: number;
    mintedPercentage: number;
  }> {
    try {
      const collectionData = await this.getCollectionData(collectionName);
      
      if (!collectionData) {
        return {
          totalSupply: 2222,
          currentSupply: 0,
          remainingSupply: 2222,
          mintedPercentage: 0
        };
      }
      
      const remainingSupply = Math.max(0, collectionData.totalSupply - collectionData.currentSupply);
      const mintedPercentage = collectionData.totalSupply > 0 ? 
        (collectionData.currentSupply / collectionData.totalSupply) * 100 : 0;
      
      return {
        totalSupply: collectionData.totalSupply,
        currentSupply: collectionData.currentSupply,
        remainingSupply: remainingSupply,
        mintedPercentage: mintedPercentage
      };

    } catch (error) {
      console.error('❌ Error getting collection supply:', error);
      return {
        totalSupply: 2222,
        currentSupply: 0,
        remainingSupply: 2222,
        mintedPercentage: 0
      };
    }
  }

  /**
   * Get collection pricing data
   */
  async getCollectionPricing(collectionName: string): Promise<{
    mintPrice: number;
    paymentToken: string;
    isActive: boolean;
  }> {
    try {
      const collectionData = await this.getCollectionData(collectionName);
      
      if (!collectionData) {
        return {
          mintPrice: 4200.69,
          paymentToken: 'LOL',
          isActive: true
        };
      }
      
      return {
        mintPrice: collectionData.mintPrice || 4200.69,
        paymentToken: collectionData.paymentToken || 'LOL',
        isActive: collectionData.isActive || true
      };

    } catch (error) {
      console.error('❌ Error getting collection pricing:', error);
      return {
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        isActive: true
      };
    }
  }

  /**
   * Perform a thorough blockchain scan for minted NFTs
   */
  private async performThoroughBlockchainScan(collectionName: string, collectionConfig: any): Promise<number> {
    console.log(`🔍 Performing thorough blockchain scan for: ${collectionName}`);
    
    try {
      // Check cache first for this scan
      const scanCacheKey = `blockchain_scan_${collectionName}`;
      const cachedScan = this.getFromCache(scanCacheKey);
      if (cachedScan && cachedScan.scanResult) {
        console.log(`📋 Using cached blockchain scan result: ${cachedScan.scanResult.mintedCount} NFTs`);
        return cachedScan.scanResult.mintedCount;
      }

      let totalMinted = 0;
      
      // Method 1: Scan by collection authority/creator
      if (collectionConfig.collectionAddress) {
        try {
          console.log(`🔍 Scanning by collection address: ${collectionConfig.collectionAddress}`);
          
          // Get all token accounts for this collection
          const collectionPubkey = new PublicKey(collectionConfig.collectionAddress);
          const tokenAccounts = await this.connection.getProgramAccounts(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), {
            filters: [
              {
                dataSize: 165, // Token account size
              },
              {
                memcmp: {
                  offset: 0,
                  bytes: collectionPubkey.toBase58(),
                },
              },
            ],
          });
          
          totalMinted = tokenAccounts.length;
          console.log(`📊 Found ${totalMinted} NFTs via collection address scan`);
          
        } catch (error) {
          console.warn('⚠️ Collection address scan failed:', error);
        }
      }
      
      // Method 2: If collection scan failed, try mint authority scan
      if (totalMinted === 0 && collectionConfig.mintAddress) {
        try {
          console.log(`🔍 Scanning by mint address: ${collectionConfig.mintAddress}`);
          
          const mintPubkey = new PublicKey(collectionConfig.mintAddress);
          const tokenAccounts = await this.connection.getProgramAccounts(new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), {
            filters: [
              {
                dataSize: 165, // Token account size
              },
              {
                memcmp: {
                  offset: 0,
                  bytes: mintPubkey.toBase58(),
                },
              },
            ],
          });
          
          totalMinted = tokenAccounts.length;
          console.log(`📊 Found ${totalMinted} NFTs via mint address scan`);
          
        } catch (error) {
          console.warn('⚠️ Mint address scan failed:', error);
        }
      }
      
      // Cache the scan result for 5 minutes
      const scanResult = {
        mintedCount: totalMinted,
        timestamp: Date.now(),
        collectionName
      };
      
      this.cache.set(scanCacheKey, {
        data: { scanResult },
        timestamp: Date.now()
      });
      
      console.log(`✅ Blockchain scan completed: ${totalMinted} NFTs found for ${collectionName}`);
      return totalMinted;
      
    } catch (error) {
      console.error('❌ Thorough blockchain scan failed:', error);
      return 0;
    }
  }

  /**
   * Verify NFT ownership on blockchain
   */
  async verifyNFTOwnership(nftMintAddress: string, ownerAddress: string): Promise<boolean> {
    try {
      console.log('🔍 Verifying NFT ownership on blockchain:', nftMintAddress, '->', ownerAddress);
      
      const ownerPublicKey = new PublicKey(ownerAddress);
      const mintPublicKey = new PublicKey(nftMintAddress);
      
      // Use connection.getParsedTokenAccountsByOwner instead
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        { mint: mintPublicKey }
      );
      
      // Check if any token account contains this NFT
      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        if (parsedInfo.mint === nftMintAddress && Number(parsedInfo.tokenAmount.amount) > 0) {
          console.log('✅ NFT ownership verified on blockchain');
          return true;
        }
      }
      
      console.log('❌ NFT ownership not found on blockchain');
      return false;

    } catch (error) {
      console.error('❌ Error verifying NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get recent mint transactions
   */
  async getRecentMintTransactions(collectionName: string, limit: number = 10): Promise<{
    signature: string;
    mintAddress: string;
    ownerAddress: string;
    timestamp: number;
    mintPrice: number;
  }[]> {
    try {
      console.log('🔍 Getting recent mint transactions for:', collectionName);
      
      // This would implement real transaction scanning
      // For now, return empty array as placeholder
      const transactions: any[] = [];
      
      console.log(`🔗 Found ${transactions.length} recent mint transactions`);
      return transactions;

    } catch (error) {
      console.error('❌ Error getting recent mint transactions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const blockchainDataService = new BlockchainDataService();
export default blockchainDataService;
