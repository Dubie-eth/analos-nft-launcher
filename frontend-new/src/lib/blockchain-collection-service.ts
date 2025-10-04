import { Connection, PublicKey } from '@solana/web3.js';
import { AnalosBlockchainService } from './blockchain';
import { nftSupplyTracker } from './nft-supply-tracker';

export interface BlockchainCollectionData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  mintPrice: number;
  totalSupply: number;
  currentSupply: number;
  isActive: boolean;
  is404Enabled?: boolean; // NEW: MPL-Hybrid 404 trading enabled
  isDLMMBondingCurve?: boolean; // NEW: DLMM bonding curve enabled
  feePercentage: number;
  externalUrl: string;
  feeRecipient: string;
  deployedAt: string;
  mintAddress: string;
  metadataAddress: string;
  masterEditionAddress: string;
  arweaveUrl: string;
  paymentToken?: string;
}

export class BlockchainCollectionService {
  private connection: Connection;
  private blockchainService: AnalosBlockchainService;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: undefined, // Disable WebSocket
      httpHeaders: {
        'Content-Type': 'application/json'
      }
    });
    this.blockchainService = new AnalosBlockchainService(rpcUrl);
    console.log('🔗 Blockchain Collection Service initialized');
  }

  /**
   * Get collection data directly from blockchain smart contract
   * This is the single source of truth for all collection data
   */
  async getCollectionFromBlockchain(mintAddress: string): Promise<BlockchainCollectionData | null> {
    try {
      console.log('📡 Fetching collection data from blockchain:', mintAddress);
      
      // Parse the mint address
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get mint account info
      const mintInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      if (!mintInfo) {
        console.error('❌ Mint account not found:', mintAddress);
        return null;
      }

      // For now, we'll use mock data since we need to implement the actual smart contract reading
      // In a real implementation, this would read from the actual smart contract
      const collectionData: BlockchainCollectionData = {
        id: mintAddress,
        name: 'The LosBros',
        symbol: '$LBS',
        description: 'The LosBros - The ultimate NFT collection for the Analos ecosystem with 2,222 unique pieces. Reveal later collection with mystery traits! First 100 NFTs FREE for 1M+ $LOL holders (max 3 per wallet).',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        mintPrice: 4200.69, // Updated to 4,200.69 $LOS
        totalSupply: 2222,
        currentSupply: 15, // Updated with actual minted count
        isActive: true,
        is404Enabled: false, // Disabled in favor of DLMM bonding curve
        isDLMMBondingCurve: true, // NEW: This collection uses DLMM bonding curve
        isRevealLater: true, // This is a reveal later collection
        feePercentage: 2.5,
        externalUrl: 'https://launchonlos.fun/',
        feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        deployedAt: new Date().toISOString(),
        mintAddress: mintAddress,
        metadataAddress: `metadata_${mintAddress}`,
        masterEditionAddress: `master_edition_${mintAddress}`,
        arweaveUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
      };

      // Get updated supply data from NFT supply tracker
      const supplyData = await nftSupplyTracker.getSupplyFromTokenTracker(collectionName);
      collectionData.currentSupply = supplyData.currentSupply;
      
      console.log('✅ Collection data fetched from blockchain:', collectionData);
      console.log('📊 Updated supply data:', {
        currentSupply: collectionData.currentSupply,
        totalSupply: collectionData.totalSupply,
        remainingSupply: supplyData.remainingSupply,
        mintedPercentage: supplyData.mintedPercentage.toFixed(2) + '%'
      });
      
      return collectionData;

    } catch (error) {
      console.error('❌ Error fetching collection from blockchain:', error);
      return null;
    }
  }

  /**
   * Get all deployed collections from blockchain
   * This scans for all deployed collection contracts
   */
  async getAllCollectionsFromBlockchain(): Promise<BlockchainCollectionData[]> {
    try {
      console.log('📡 Scanning blockchain for deployed collections...');
      
      // For now, return mock collections
      // In a real implementation, this would scan the blockchain for all deployed collections
      const collections: BlockchainCollectionData[] = [
        {
          id: 'collection_the_losbros', // Use consistent ID format
          name: 'The LosBros',
          symbol: '$LBS',
          description: 'The LosBros - The ultimate NFT collection for the Analos ecosystem with 2,222 unique pieces. 🎯 BONDING CURVE MINT: Price increases with each mint! Reveal at bonding cap completion. First 100 NFTs FREE for 1M+ $LOL holders (max 3 per wallet).',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          mintPrice: 4200.69, // Base price - increases with bonding curve
          totalSupply: 2222,
          currentSupply: 15, // Updated with actual minted count
        isActive: true,
        isRevealLater: true, // Reveal at bonding cap completion
        isBondingCurve: true, // 🎯 THIS IS NOW A BONDING CURVE COLLECTION
        bondingCurveConfig: {
          virtualLOSReserves: 100000, // Starting virtual reserves
          virtualNFTSupply: 2222, // Total supply
          realNFTSupply: 0, // Starts at 0
          bondingCap: 50000, // Reveal when 50,000 $LOS raised
          feePercentage: 3.5, // Total fees (platform + creator)
          creatorFeePercentage: 1.0, // Creator fee
          platformFeePercentage: 2.5 // Platform fee
        },
        freeMintPhase: {
          enabled: true,
          maxFreeMints: 100, // First 100 NFTs are free
          maxPerWallet: 3, // Max 3 free mints per wallet
          requiredLOLBalance: 1000000 // Need 1,000,000+ $LOL
        },
        feePercentage: 2.5,
          externalUrl: 'https://launchonlos.fun/',
          escrowWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Escrow wallet for bonding curve fees
          feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          deployedAt: new Date().toISOString(),
          mintAddress: 'DeployedMintAddressFromBlockchain', // Will be updated after real deployment
          metadataAddress: 'DeployedMetadataAddressFromBlockchain', // Will be updated after real deployment
          masterEditionAddress: 'DeployedMasterEditionAddressFromBlockchain', // Will be updated after real deployment
          arweaveUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
        }
      ];

      // Filter out hidden collections
      const hiddenCollectionIds = this.getHiddenCollectionIds();
      const visibleCollections = collections.filter(collection => 
        !hiddenCollectionIds.includes(collection.id)
      );

      console.log('✅ Found collections on blockchain:', collections.length);
      console.log('🔒 Hidden collections:', hiddenCollectionIds.length);
      console.log('👁️ Visible collections:', visibleCollections.length);
      
      return visibleCollections;

    } catch (error) {
      console.error('❌ Error fetching collections from blockchain:', error);
      return [];
    }
  }

  /**
   * Get collection by name from blockchain
   */
  async getCollectionByNameFromBlockchain(collectionName: string): Promise<BlockchainCollectionData | null> {
    try {
      console.log('📡 Fetching collection by name from blockchain:', collectionName);
      
      const collections = await this.getAllCollectionsFromBlockchain();
      
      // Handle URL slug to collection name mapping
      let actualCollectionName = collectionName;
      if (collectionName === 'launch-on-los' || collectionName === 'the-losbros' || collectionName === 'Launch On LOS') {
        actualCollectionName = 'The LosBros';
      }
      
      const collection = collections.find(c => 
        c.name.toLowerCase() === actualCollectionName.toLowerCase() ||
        c.name.toLowerCase() === collectionName.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '-') === collectionName.toLowerCase()
      );

      if (collection) {
        console.log('✅ Collection found on blockchain:', collection.name);
        return collection;
      } else {
        console.log('❌ Collection not found on blockchain:', collectionName, '->', actualCollectionName);
        return null;
      }

    } catch (error) {
      console.error('❌ Error fetching collection by name from blockchain:', error);
      return null;
    }
  }

  /**
   * Hide a collection from the frontend display
   */
  hideCollection(collectionId: string): void {
    try {
      const hidden = this.getHiddenCollectionIds();
      if (!hidden.includes(collectionId)) {
        hidden.push(collectionId);
        localStorage.setItem('hidden_collections', JSON.stringify(hidden));
        console.log(`🔒 Hidden collection: ${collectionId}`);
      }
    } catch (error) {
      console.error('Error hiding collection:', error);
    }
  }

  /**
   * Show a previously hidden collection
   */
  showCollection(collectionId: string): void {
    try {
      const hidden = this.getHiddenCollectionIds();
      const updated = hidden.filter(id => id !== collectionId);
      localStorage.setItem('hidden_collections', JSON.stringify(updated));
      console.log(`👁️ Showed collection: ${collectionId}`);
    } catch (error) {
      console.error('Error showing collection:', error);
    }
  }

  /**
   * Get list of hidden collection IDs
   */
  private getHiddenCollectionIds(): string[] {
    try {
      const hidden = localStorage.getItem('hidden_collections');
      return hidden ? JSON.parse(hidden) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if a collection is hidden
   */
  isCollectionHidden(collectionId: string): boolean {
    const hiddenIds = this.getHiddenCollectionIds();
    return hiddenIds.includes(collectionId);
  }

  /**
   * Toggle collection visibility (hide/show)
   */
  toggleCollectionVisibility(collectionId: string): void {
    if (this.isCollectionHidden(collectionId)) {
      this.showCollection(collectionId);
    } else {
      this.hideCollection(collectionId);
    }
  }

  /**
   * Get all hidden collections with their data
   */
  async getHiddenCollections(): Promise<BlockchainCollectionData[]> {
    try {
      console.log('🔍 Fetching hidden collections...');
      
      // Get all collections first (without filtering)
      const allCollections = await this.getAllCollectionsFromBlockchainUnfiltered();
      
      // Get hidden collection IDs
      const hiddenIds = this.getHiddenCollectionIds();
      
      // Filter to only hidden collections
      const hiddenCollections = allCollections.filter(collection => 
        hiddenIds.includes(collection.id)
      );

      console.log('🔒 Found hidden collections:', hiddenCollections.length);
      return hiddenCollections;

    } catch (error) {
      console.error('❌ Error fetching hidden collections:', error);
      return [];
    }
  }

  /**
   * Get all collections without filtering hidden ones (for internal use)
   */
  private async getAllCollectionsFromBlockchainUnfiltered(): Promise<BlockchainCollectionData[]> {
    try {
      console.log('📡 Scanning blockchain for all collections (including hidden)...');
      
      // For now, return a mock collection
      // In a real implementation, this would scan the blockchain for all deployed collections
      const collections: BlockchainCollectionData[] = [
        {
          id: 'collection_the_losbros', // Use consistent ID format
          name: 'The LosBros',
          symbol: '$LBS',
          description: 'The LosBros - The ultimate NFT collection for the Analos ecosystem with 2,222 unique pieces. Reveal later collection with mystery traits! First 100 NFTs FREE for 1M+ $LOL holders (max 3 per wallet).',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          mintPrice: 4200.69, // Updated to 4,200.69 $LOS
          totalSupply: 2222,
          currentSupply: 15, // Updated with actual minted count
        isActive: true,
        isRevealLater: true, // Reveal at bonding cap completion
        isBondingCurve: true, // 🎯 THIS IS NOW A BONDING CURVE COLLECTION
        bondingCurveConfig: {
          virtualLOSReserves: 100000, // Starting virtual reserves
          virtualNFTSupply: 2222, // Total supply
          realNFTSupply: 0, // Starts at 0
          bondingCap: 50000, // Reveal when 50,000 $LOS raised
          feePercentage: 3.5, // Total fees (platform + creator)
          creatorFeePercentage: 1.0, // Creator fee
          platformFeePercentage: 2.5 // Platform fee
        },
        freeMintPhase: {
          enabled: true,
          maxFreeMints: 100, // First 100 NFTs are free
          maxPerWallet: 3, // Max 3 free mints per wallet
          requiredLOLBalance: 1000000 // Need 1,000,000+ $LOL
        },
        feePercentage: 2.5,
          externalUrl: 'https://launchonlos.fun/',
          escrowWallet: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Escrow wallet for bonding curve fees
          feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          deployedAt: new Date().toISOString(),
          mintAddress: 'DeployedMintAddressFromBlockchain', // Will be updated after real deployment
          metadataAddress: 'DeployedMetadataAddressFromBlockchain', // Will be updated after real deployment
          masterEditionAddress: 'DeployedMasterEditionAddressFromBlockchain', // Will be updated after real deployment
          arweaveUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
        }
      ];

      console.log('✅ Found all collections on blockchain:', collections.length);
      return collections;

    } catch (error) {
      console.error('❌ Error fetching all collections from blockchain:', error);
      return [];
    }
  }

  /**
   * Get current mint count from blockchain
   */
  async getCurrentSupplyFromBlockchain(mintAddress: string): Promise<number> {
    try {
      console.log('📡 Fetching current supply from blockchain:', mintAddress);
      
      // In a real implementation, this would read the current supply from the smart contract
      // For now, return 0 as mock data
      return 0;

    } catch (error) {
      console.error('❌ Error fetching current supply from blockchain:', error);
      return 0;
    }
  }
}

export default BlockchainCollectionService;
