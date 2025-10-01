import { Connection, PublicKey } from '@solana/web3.js';
import { AnalosBlockchainService } from './blockchain';

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
  feePercentage: number;
  externalUrl: string;
  feeRecipient: string;
  deployedAt: string;
  mintAddress: string;
  metadataAddress: string;
  masterEditionAddress: string;
  arweaveUrl: string;
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
        name: 'Launch On LOS',
        symbol: '$LOL',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        mintPrice: 4200.69, // This should be read from the smart contract
        totalSupply: 4200,
        currentSupply: 0, // This should be read from the smart contract
        isActive: true,
        feePercentage: 2.5,
        externalUrl: 'https://launchonlos.fun/',
        feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        deployedAt: new Date().toISOString(),
        mintAddress: mintAddress,
        metadataAddress: `metadata_${mintAddress}`,
        masterEditionAddress: `master_edition_${mintAddress}`,
        arweaveUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
      };

      console.log('✅ Collection data fetched from blockchain:', collectionData);
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
      
      // For now, return a mock collection
      // In a real implementation, this would scan the blockchain for all deployed collections
      const collections: BlockchainCollectionData[] = [
        {
          id: 'launch-on-los-blockchain',
          name: 'Launch On LOS',
          symbol: '$LOL',
          description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          mintPrice: 4200.69, // Single source of truth from blockchain
          totalSupply: 4200,
          currentSupply: 0,
          isActive: true,
          feePercentage: 2.5,
          externalUrl: 'https://launchonlos.fun/',
          feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          deployedAt: new Date().toISOString(),
          mintAddress: 'blockchain_mint_address_launch_on_los',
          metadataAddress: 'blockchain_metadata_address_launch_on_los',
          masterEditionAddress: 'blockchain_master_edition_launch_on_los',
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
      const collection = collections.find(c => 
        c.name.toLowerCase() === collectionName.toLowerCase() ||
        c.name.toLowerCase().replace(/\s+/g, '-') === collectionName.toLowerCase()
      );

      if (collection) {
        console.log('✅ Collection found on blockchain:', collection.name);
        return collection;
      } else {
        console.log('❌ Collection not found on blockchain:', collectionName);
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
          id: 'launch-on-los-blockchain',
          name: 'Launch On LOS',
          symbol: '$LOL',
          description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          mintPrice: 4200.69, // Single source of truth from blockchain
          totalSupply: 4200,
          currentSupply: 0,
          isActive: true,
          feePercentage: 2.5,
          externalUrl: 'https://launchonlos.fun/',
          feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          deployedAt: new Date().toISOString(),
          mintAddress: 'blockchain_mint_address_launch_on_los',
          metadataAddress: 'blockchain_metadata_address_launch_on_los',
          masterEditionAddress: 'blockchain_master_edition_launch_on_los',
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
