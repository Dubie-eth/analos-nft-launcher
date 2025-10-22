/**
 * Blockchain Data Service
 * Handles all interactions with Analos blockchain and smart contracts
 */

import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { backendAPI } from './backend-api';
import {
  parseCollectionConfig,
  parseEscrowWallet,
  parseMintRecord,
  deriveCollectionConfigPDA,
  deriveEscrowWalletPDA,
  deriveMintRecordPDA,
  lamportsToSOL,
  calculateBondingCurvePrice,
  calculatePlatformFee,
} from './account-parser';
import type {
  CollectionConfig,
  EscrowWallet,
  MintRecord,
  CollectionDisplayData,
  UserNFTData,
} from '@/types/smart-contracts';

// Collection data types (simplified for display)
export interface CollectionOnChain {
  address: string;
  authority: string;
  collectionName: string;
  collectionSymbol: string;
  totalSupply: number;
  mintedCount: number;
  mintPriceLamports: number;
  mintPriceSOL: number;
  mintPriceUSD: number;
  isWhitelistOnly: boolean;
  isPaused: boolean;
  isRevealed: boolean;
  revealThreshold: number;
  bondingCurveEnabled: boolean;
  placeholderUri: string;
  programId: string;
  escrowBalance: number;
}

export interface NFTMetadata {
  mint: string;
  owner: string;
  collectionConfig: string;
  mintNumber: number;
  isRevealed: boolean;
  rarityScore: number;
  tier: number;
}

export interface PriceOracleData {
  losMarketCapUSD: number;
  losPriceUSD: number;
  lastUpdate: number;
  isActive: boolean;
}

/**
 * Blockchain Service Class
 */
export class BlockchainService {
  private connection: Connection;
  private programIds: typeof ANALOS_PROGRAMS;

  constructor() {
    // Use backend RPC proxy for rate limiting
    // Configure connection for Analos network with extended timeouts
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    this.programIds = ANALOS_PROGRAMS;
    
    console.log('⛓️ Blockchain Service initialized');
    console.log('🔗 RPC URL:', ANALOS_RPC_URL);
  }

  /**
   * Get all collections from NFT Launchpad program
   */
  async getAllCollections(): Promise<CollectionOnChain[]> {
    try {
      // Check cache first
      if (this.collectionsCache &&
          Date.now() - this.collectionsCache.timestamp < this.COLLECTION_CACHE_DURATION) {
        console.log('📦 Using cached collections data');
        return this.collectionsCache.data;
      }

      console.log('📦 Loading collections from blockchain...');
      console.log('🔗 NFT Launchpad Program:', this.programIds.NFT_LAUNCHPAD.toString());

      // Use backend RPC proxy for rate limiting
      const result = await backendAPI.getProgramAccounts(
        this.programIds.NFT_LAUNCHPAD.toString(),
        {
          encoding: 'base64',
          filters: [
            {
              dataSize: 500 // Approximate size of CollectionConfig account
            }
          ],
        }
      );

      if (!result.success || !result.data) {
        console.warn('⚠️ No collections found or RPC call failed');
        return [];
      }

      const collections: CollectionOnChain[] = [];
      const losPrice = await this.getCurrentLOSPrice();

      // Parse each account
      for (const accountInfo of result.data) {
        try {
          const accountData = Buffer.from(accountInfo.account.data[0], 'base64');
          const collectionConfig = parseCollectionConfig(accountData);

          if (!collectionConfig) {
            console.warn('⚠️ Could not parse collection config');
            continue;
          }

          // Get escrow balance
          const [escrowPDA] = deriveEscrowWalletPDA(
            this.programIds.NFT_LAUNCHPAD,
            new PublicKey(accountInfo.pubkey)
          );
          
          const escrowResult = await backendAPI.getAccountInfo(escrowPDA.toString());
          let escrowBalance = 0;
          
          if (escrowResult.success && escrowResult.data) {
            const escrowData = Buffer.from(escrowResult.data.value.data[0], 'base64');
            const escrow = parseEscrowWallet(escrowData);
            if (escrow) {
              escrowBalance = escrow.balance;
            }
          }

          // Calculate current mint price with bonding curve
          let currentMintPrice = collectionConfig.priceLamports;
          if (collectionConfig.bondingCurveEnabled) {
            currentMintPrice = calculateBondingCurvePrice(
              collectionConfig.bondingCurveBasePrice,
              collectionConfig.currentSupply,
              collectionConfig.bondingCurvePriceIncrementBps
            );
          }

          const collection: CollectionOnChain = {
            address: accountInfo.pubkey,
            authority: collectionConfig.authority.toString(),
            collectionName: collectionConfig.collectionName,
            collectionSymbol: collectionConfig.collectionSymbol,
            totalSupply: collectionConfig.maxSupply,
            mintedCount: collectionConfig.currentSupply,
            mintPriceLamports: currentMintPrice,
            mintPriceSOL: lamportsToSOL(currentMintPrice),
            mintPriceUSD: lamportsToSOL(currentMintPrice) * losPrice,
            isWhitelistOnly: collectionConfig.socialVerificationRequired,
            isPaused: collectionConfig.isPaused,
            isRevealed: collectionConfig.isRevealed,
            revealThreshold: collectionConfig.revealThreshold,
            bondingCurveEnabled: collectionConfig.bondingCurveEnabled,
            placeholderUri: collectionConfig.placeholderUri,
            programId: this.programIds.NFT_LAUNCHPAD.toString(),
            escrowBalance,
          };

          collections.push(collection);
          console.log(`✅ Loaded collection: ${collection.collectionName} (${collection.mintedCount}/${collection.totalSupply})`);
        } catch (parseError) {
          console.error('❌ Error parsing collection account:', parseError);
          continue;
        }
      }

      console.log(`✅ Loaded ${collections.length} collections from blockchain`);
      
      // Cache the results
      this.collectionsCache = {
        data: collections,
        timestamp: Date.now()
      };
      
      return collections;
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      return [];
    }
  }

  /**
   * Get collection data by address
   */
  async getCollectionByAddress(address: string): Promise<CollectionOnChain | null> {
    try {
      console.log('🔍 Loading collection:', address);

      const result = await backendAPI.getAccountInfo(address);

      if (!result.success || !result.data || !result.data.value) {
        console.warn('⚠️ Collection not found');
        return null;
      }

      // Parse collection config
      const accountData = Buffer.from(result.data.value.data[0], 'base64');
      const collectionConfig = parseCollectionConfig(accountData);

      if (!collectionConfig) {
        console.warn('⚠️ Could not parse collection config');
        return null;
      }

      // Get escrow balance
      const [escrowPDA] = deriveEscrowWalletPDA(
        this.programIds.NFT_LAUNCHPAD,
        new PublicKey(address)
      );
      
      const escrowResult = await backendAPI.getAccountInfo(escrowPDA.toString());
      let escrowBalance = 0;
      
      if (escrowResult.success && escrowResult.data?.value) {
        const escrowData = Buffer.from(escrowResult.data.value.data[0], 'base64');
        const escrow = parseEscrowWallet(escrowData);
        if (escrow) {
          escrowBalance = escrow.balance;
        }
      }

      // Calculate current mint price
      const losPrice = await this.getCurrentLOSPrice();
      let currentMintPrice = collectionConfig.priceLamports;
      if (collectionConfig.bondingCurveEnabled) {
        currentMintPrice = calculateBondingCurvePrice(
          collectionConfig.bondingCurveBasePrice,
          collectionConfig.currentSupply,
          collectionConfig.bondingCurvePriceIncrementBps
        );
      }

      const collection: CollectionOnChain = {
        address,
        authority: collectionConfig.authority.toString(),
        collectionName: collectionConfig.collectionName,
        collectionSymbol: collectionConfig.collectionSymbol,
        totalSupply: collectionConfig.maxSupply,
        mintedCount: collectionConfig.currentSupply,
        mintPriceLamports: currentMintPrice,
        mintPriceSOL: lamportsToSOL(currentMintPrice),
        mintPriceUSD: lamportsToSOL(currentMintPrice) * losPrice,
        isWhitelistOnly: collectionConfig.socialVerificationRequired,
        isPaused: collectionConfig.isPaused,
        isRevealed: collectionConfig.isRevealed,
        revealThreshold: collectionConfig.revealThreshold,
        bondingCurveEnabled: collectionConfig.bondingCurveEnabled,
        placeholderUri: collectionConfig.placeholderUri,
        programId: this.programIds.NFT_LAUNCHPAD.toString(),
        escrowBalance,
      };

      console.log(`✅ Loaded collection: ${collection.collectionName}`);
      return collection;
    } catch (error) {
      console.error('❌ Error loading collection:', error);
      return null;
    }
  }

  /**
   * Get current LOS price (with caching)
   */
  private losPriceCache: { price: number; timestamp: number } | null = null;
  private readonly PRICE_CACHE_DURATION = 60000; // 1 minute
  
  // Collection and NFT caching to prevent excessive API calls
  private collectionsCache: { data: CollectionOnChain[]; timestamp: number } | null = null;
  private userNFTsCache: Map<string, { data: NFTMetadata[]; timestamp: number }> = new Map();
  private readonly COLLECTION_CACHE_DURATION = 300000; // 5 minutes - collections don't change often
  private readonly NFT_CACHE_DURATION = 120000; // 2 minutes - NFTs change more frequently

  async getCurrentLOSPrice(): Promise<number> {
    // Check cache
    if (this.losPriceCache &&
        Date.now() - this.losPriceCache.timestamp < this.PRICE_CACHE_DURATION) {
      return this.losPriceCache.price;
    }

    // Fetch fresh price
    const oracleData = await this.getPriceOracleData();
    const price = oracleData?.losPriceUSD || 0.10; // Fallback to $0.10

    // Update cache
    this.losPriceCache = {
      price,
      timestamp: Date.now(),
    };

    return price;
  }

  /**
   * Get Price Oracle data
   */
  async getPriceOracleData(): Promise<PriceOracleData | null> {
    try {
      console.log('💰 Loading Price Oracle data...');
      console.log('🔗 Price Oracle Program:', this.programIds.PRICE_ORACLE.toString());

      // Get the oracle account
      // Try to get program accounts
      const result = await backendAPI.getProgramAccounts(
        this.programIds.PRICE_ORACLE.toString(),
        {
          encoding: 'base64',
        }
      );

      if (!result.success || !result.data || result.data.length === 0) {
        console.warn('⚠️ Price Oracle data not found, using fallback');
        return {
          losMarketCapUSD: 1000000,
          losPriceUSD: 0.10,
          lastUpdate: Date.now(),
          isActive: true,
        };
      }

      // TODO: Parse oracle account data based on your program's structure
      // For now, return a default value
      console.log(`📊 Found ${result.data.length} oracle account(s)`);
      
      return {
        losMarketCapUSD: 1000000,
        losPriceUSD: 0.10,
        lastUpdate: Date.now(),
        isActive: true,
      };
    } catch (error) {
      console.error('❌ Error loading Price Oracle data:', error);
      return {
        losMarketCapUSD: 1000000,
        losPriceUSD: 0.10,
        lastUpdate: Date.now(),
        isActive: true,
      };
    }
  }

  /**
   * Get user NFTs
   */
  async getUserNFTs(walletAddress: string): Promise<NFTMetadata[]> {
    try {
      // Check cache first
      const cachedData = this.userNFTsCache.get(walletAddress);
      if (cachedData && Date.now() - cachedData.timestamp < this.NFT_CACHE_DURATION) {
        console.log('🎨 Using cached NFT data for:', walletAddress);
        return cachedData.data;
      }

      console.log('🎨 Loading user NFTs for:', walletAddress);

      // Try via backend proxy first; fall back to direct RPC if needed
      let tokenAccounts: any[] | null = null;
      const result = await backendAPI.proxyRPCRequest('getTokenAccountsByOwner', [
        walletAddress,
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token Program
        },
        {
          encoding: 'jsonParsed',
        },
      ]);

      if (!result.error && result.result && Array.isArray(result.result.value)) {
        tokenAccounts = result.result.value as any[];
      } else {
        console.warn('⚠️ RPC proxy failed or returned no data, falling back to direct connection');
        try {
          const direct = await this.connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletAddress),
            { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
          );
          tokenAccounts = direct.value as any[];
        } catch (fallbackError) {
          console.error('❌ Direct RPC fallback failed:', fallbackError);
          return [];
        }
      }

      // Filter for NFTs (tokens with amount = 1 and decimals = 0)
      const nfts = tokenAccounts.filter((account: any) => {
        const tokenData = account.account.data.parsed.info;
        return (
          tokenData.tokenAmount.decimals === 0 &&
          tokenData.tokenAmount.amount === '1'
        );
      });

      console.log(`📊 Found ${nfts.length} potential NFTs for user`);

      const userNFTs: any[] = [];

      // Get all collections first
      const collections = await this.getAllCollections();
      console.log(`📦 Found ${collections.length} collections to check against`);

      // Import metadata service
      const { metadataService } = await import('./metadata-service');

      // For each NFT token, enrich with metadata
      for (const nft of nfts) {
        try {
          const mintAddress = nft.account.data.parsed.info.mint;
          console.log(`🔍 Processing NFT mint: ${mintAddress}`);
          
          // Try to fetch Metaplex metadata
          const metadata = await metadataService.getMetadata(mintAddress);
          
          if (metadata) {
            console.log(`✅ Found metadata for ${mintAddress}`);
            
            // Fetch the JSON metadata from URI
            let metadataJSON = null;
            if (metadata.uri) {
              metadataJSON = await metadataService.fetchMetadataJSON(metadata.uri);
            }

            // Find collection from our collections list
            let nftCollection = null;
            for (const collection of collections) {
              if (metadata.name?.includes(collection.collectionName)) {
                nftCollection = collection;
                break;
              }
            }

            // Extract mint number from name (e.g., "Collection #5")
            const mintNumber = metadata.name?.match(/#(\d+)/)?.[1] || '0';
            
            // Create enriched NFT object with Metaplex data
            userNFTs.push({
              mint: mintAddress,
              owner: walletAddress,
              collectionConfig: nftCollection?.address || '',
              collectionName: nftCollection?.collectionName || metadata.name || 'Unknown',
              name: metadata.name || `NFT #${mintNumber}`,
              uri: metadataJSON?.image || metadata.uri || '/api/placeholder/400/400',
              description: metadataJSON?.description || `NFT from collection`,
              mintNumber: parseInt(mintNumber),
              isRevealed: nftCollection?.isRevealed || true,
              rarityScore: 0,
              tier: 0,
              metadata: {
                uri: metadata.uri,
                json: metadataJSON
              }
            });
          } else {
            console.warn(`⚠️ No metadata found for ${mintAddress}, using fallback`);
            
            // Fallback: Try to match with collections
            let nftCollection = null;
            for (const collection of collections) {
              nftCollection = collection;
              break;
            }

            const collectionName = nftCollection?.collectionName || 'Unknown Collection';
            const collectionAddress = nftCollection?.address || '';
            
            userNFTs.push({
              mint: mintAddress,
              owner: walletAddress,
              collectionConfig: collectionAddress,
              collectionName: collectionName,
              name: `${collectionName} NFT`,
              uri: nftCollection?.placeholderUri || '/api/placeholder/400/400',
              description: `NFT from ${collectionName}`,
              mintNumber: 0,
              isRevealed: nftCollection?.isRevealed || false,
              rarityScore: 0,
              tier: 0,
              metadata: {
                uri: nftCollection?.placeholderUri || '/api/placeholder/400/400'
              }
            });
          }
        } catch (nftError) {
          console.error('Error processing NFT:', nftError);
          continue;
        }
      }

      console.log(`✅ Processed ${userNFTs.length} NFTs with metadata`);
      
      // Cache the results
      this.userNFTsCache.set(walletAddress, {
        data: userNFTs,
        timestamp: Date.now()
      });
      
      return userNFTs;
    } catch (error) {
      console.error('❌ Error loading user NFTs:', error);
      return [];
    }
  }

  /**
   * Get recent transactions for a program
   */
  async getRecentProgramTransactions(
    programId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      console.log('📜 Loading recent transactions for program:', programId);

      const result = await backendAPI.proxyRPCRequest('getSignaturesForAddress', [
        programId,
        {
          limit,
        },
      ]);

      if (result.error || !result.result) {
        console.warn('⚠️ No transactions found');
        return [];
      }

      return result.result;
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      return [];
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(signature: string): Promise<any | null> {
    try {
      console.log('🔍 Loading transaction:', signature);

      const result = await backendAPI.getTransaction(signature);

      if (!result.success || !result.data) {
        console.warn('⚠️ Transaction not found');
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error loading transaction:', error);
      return null;
    }
  }

  /**
   * Calculate LOS amount needed for USD price
   * Uses Price Oracle data
   */
  async calculateLOSForUSD(usdAmount: number): Promise<number> {
    try {
      const oracleData = await this.getPriceOracleData();
      
      if (!oracleData || oracleData.losPriceUSD === 0) {
        console.warn('⚠️ Using fallback LOS price');
        // Fallback price
        return usdAmount / 0.10;
      }

      const losAmount = usdAmount / oracleData.losPriceUSD;
      console.log(`💱 ${usdAmount} USD = ${losAmount.toFixed(2)} LOS`);
      
      return losAmount;
    } catch (error) {
      console.error('❌ Error calculating LOS amount:', error);
      // Fallback calculation
      return usdAmount / 0.10;
    }
  }

  /**
   * Check if an address is a valid Solana public key
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current slot (for monitoring)
   */
  async getCurrentSlot(): Promise<number | null> {
    try {
      const result = await backendAPI.proxyRPCRequest('getSlot', []);
      
      if (result.error || result.result === undefined) {
        return null;
      }

      return result.result;
    } catch (error) {
      console.error('❌ Error getting current slot:', error);
      return null;
    }
  }

  /**
   * Get blockchain health status
   */
  async getBlockchainHealth(): Promise<{
    healthy: boolean;
    slot: number | null;
    blockTime: number | null;
  }> {
    try {
      const slot = await this.getCurrentSlot();
      
      if (slot === null) {
        return { healthy: false, slot: null, blockTime: null };
      }

      const result = await backendAPI.proxyRPCRequest('getBlockTime', [slot]);
      const blockTime = result.error ? null : result.result;

      return {
        healthy: true,
        slot,
        blockTime,
      };
    } catch (error) {
      console.error('❌ Error checking blockchain health:', error);
      return { healthy: false, slot: null, blockTime: null };
    }
  }

  /**
   * Create a new NFT collection on Analos blockchain
   */
  async createCollection(
    collectionConfig: {
      name: string;
      symbol: string;
      description: string;
      supply: number;
      mintPrice: number;
      image?: string;
      logo?: string;
      banner?: string;
      whitelistConfig?: any;
      bondingCurveConfig?: any;
    },
    creatorWallet: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{
    collectionMint: string;
    metadataAccount: string;
    transactionSignature: string;
    deploymentCost: number;
  }> {
    try {
      console.log('🚀 Creating collection on Analos blockchain...', {
        name: collectionConfig.name,
        symbol: collectionConfig.symbol,
        supply: collectionConfig.supply,
        creator: creatorWallet
      });

      // Generate collection mint keypair
      const collectionMintKeypair = Keypair.generate();
      const collectionMint = collectionMintKeypair.publicKey.toString();
      
      // Generate metadata account keypair
      const metadataKeypair = Keypair.generate();
      const metadataAccount = metadataKeypair.publicKey.toString();
      
      // Calculate deployment cost
      const baseCost = 1; // 1 LOS base cost
      const bondingCurveCost = collectionConfig.bondingCurveConfig ? 0.5 : 0;
      const whitelistCost = collectionConfig.whitelistConfig ? 
        (collectionConfig.whitelistConfig.phases?.filter((p: any) => p.enabled).length || 0) * 0.2 : 0;
      
      const deploymentCost = baseCost + bondingCurveCost + whitelistCost;

      // Wallet signing is MANDATORY for collection deployment
      console.log('🔐 Creating real blockchain transaction...');
      
      // Create the collection creation transaction
      const transaction = new Transaction();
      
      // Add collection mint creation instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: new PublicKey(creatorWallet),
        newAccountPubkey: collectionMintKeypair.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(82), // Mint account size
        space: 82,
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') // SPL Token Program
      });
      
      // Add metadata account creation instruction
      const createMetadataInstruction = SystemProgram.createAccount({
        fromPubkey: new PublicKey(creatorWallet),
        newAccountPubkey: metadataKeypair.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(200), // Metadata account size
        space: 200,
        programId: this.programIds.NFT_LAUNCHPAD
      });
      
      transaction.add(createMintInstruction);
      transaction.add(createMetadataInstruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(creatorWallet);
      
      // Sign with collection and metadata keypairs
      transaction.partialSign(collectionMintKeypair, metadataKeypair);
      
      // Sign with user's wallet (MANDATORY)
      const signedTransaction = await signTransaction(transaction);
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3
      });
      
      console.log('✅ Real transaction sent:', signature);
      
      // Wait for confirmation
      try {
        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log('✅ Transaction confirmed on blockchain');
      } catch (confirmError) {
        console.log('⚠️ Confirmation timeout, but transaction was sent:', signature);
      }
      
      return {
        collectionMint,
        metadataAccount,
        transactionSignature: signature,
        deploymentCost
      };

    } catch (error) {
      console.error('❌ Error creating collection:', error);
      throw new Error(`Failed to create collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify collection exists on blockchain
   */
  async verifyCollection(collectionMint: string): Promise<boolean> {
    try {
      const mintPublicKey = new PublicKey(collectionMint);
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      return accountInfo !== null;
    } catch (error) {
      console.error('Error verifying collection:', error);
      return false;
    }
  }

  /**
   * Get collection information from blockchain
   */
  async getCollectionInfo(collectionMint: string): Promise<any> {
    try {
      const mintPublicKey = new PublicKey(collectionMint);
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      if (!accountInfo) {
        throw new Error('Collection not found on blockchain');
      }

      return {
        mint: collectionMint,
        owner: accountInfo.owner.toString(),
        lamports: accountInfo.lamports,
        data: accountInfo.data
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();

// Export convenience functions
export const getAllCollections = () => blockchainService.getAllCollections();
export const getCollectionByAddress = (address: string) => 
  blockchainService.getCollectionByAddress(address);
export const getPriceOracleData = () => blockchainService.getPriceOracleData();
export const getUserNFTs = (walletAddress: string) => 
  blockchainService.getUserNFTs(walletAddress);
export const getRecentProgramTransactions = (programId: string, limit?: number) => 
  blockchainService.getRecentProgramTransactions(programId, limit);
export const getTransactionDetails = (signature: string) => 
  blockchainService.getTransactionDetails(signature);
export const calculateLOSForUSD = (usdAmount: number) => 
  blockchainService.calculateLOSForUSD(usdAmount);
export const isValidAddress = (address: string) => 
  blockchainService.isValidAddress(address);
export const getCurrentSlot = () => blockchainService.getCurrentSlot();
export const getBlockchainHealth = () => blockchainService.getBlockchainHealth();
export const createCollection = (config: any, creatorWallet: string, signTransaction: (transaction: Transaction) => Promise<Transaction>) => 
  blockchainService.createCollection(config, creatorWallet, signTransaction);
export const verifyCollection = (collectionMint: string) => 
  blockchainService.verifyCollection(collectionMint);
export const getCollectionInfo = (collectionMint: string) => 
  blockchainService.getCollectionInfo(collectionMint);

