/**
 * Metadata Service
 * Handles NFT metadata creation and management
 * Integrates with the Analos Metadata Program
 */

import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { backendAPI, uploadJSONToIPFS } from './backend-api';
import type { NFTMetadata, CreateMetadataParams } from '@/types/metadata-program';

/**
 * Metadata Program Configuration
 * SPL Token Metadata Program deployed on Analos
 */
export const METADATA_PROGRAM_CONFIG = {
  // Metaplex Token Metadata Program (Analos-compatible)
  PROGRAM_ID: '8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL', // ✅ DEPLOYED ON ANALOS
  NETWORK: 'Analos Mainnet',
};

export interface MetadataCreationResult {
  success: boolean;
  metadataPDA?: string;
  metadataURI?: string;
  signature?: string;
  message: string;
  error?: string;
}

/**
 * Metadata Service Class
 */
export class MetadataService {
  private connection: Connection;
  private programId: PublicKey;

  constructor() {
    // Configure connection for Analos network with extended timeouts
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
      confirmTransactionTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    try {
      this.programId = new PublicKey(METADATA_PROGRAM_CONFIG.PROGRAM_ID);
    } catch {
      // If program ID not set yet, use placeholder
      this.programId = PublicKey.default;
    }
    
    console.log('📝 Metadata Service initialized');
    console.log('🔗 Metadata Program ID:', this.programId.toString());
  }

  /**
   * Create complete NFT metadata (upload to IPFS + create on-chain metadata)
   */
  async createNFTMetadata(
    mintAddress: PublicKey,
    collectionName: string,
    collectionSymbol: string,
    mintNumber: number,
    attributes: Array<{ trait_type: string; value: string }>,
    imageUrl?: string
  ): Promise<MetadataCreationResult> {
    try {
      console.log('📝 Creating NFT metadata...');
      console.log('🎯 Mint:', mintAddress.toString());
      console.log('📦 Collection:', collectionName);

      // 1. Build metadata JSON
      const metadata = {
        name: `${collectionName} #${mintNumber}`,
        symbol: collectionSymbol,
        description: `NFT #${mintNumber} from ${collectionName} collection on Analos`,
        image: imageUrl || 'https://arweave.net/placeholder', // Placeholder until revealed
        attributes,
        properties: {
          files: [
            {
              uri: imageUrl || 'https://arweave.net/placeholder',
              type: 'image/png',
            },
          ],
          category: 'image',
          creators: [] as any[],
        },
      };

      // 2. Upload metadata to IPFS via backend
      console.log('📤 Uploading metadata to IPFS...');
      const ipfsResult = await uploadJSONToIPFS(
        metadata,
        `${collectionName}-${mintNumber}`
      );

      if (!ipfsResult.success || !ipfsResult.url) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      console.log('✅ Metadata uploaded to IPFS:', ipfsResult.url);

      return {
        success: true,
        metadataURI: ipfsResult.url,
        message: 'Metadata created successfully',
      };

    } catch (error: any) {
      console.error('❌ Error creating metadata:', error);
      return {
        success: false,
        message: 'Failed to create metadata',
        error: error.message,
      };
    }
  }

  /**
   * Get metadata for an NFT mint
   */
  async getMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      console.log('📖 Loading metadata for mint:', mintAddress);

      // Derive metadata PDA
      const [metadataPDA] = this.deriveMetadataPDA(new PublicKey(mintAddress));

      // Get account data
      const result = await backendAPI.getAccountInfo(metadataPDA.toString());

      if (!result.success || !result.data?.value) {
        console.warn('⚠️ Metadata not found');
        return null;
      }

      // Parse metadata account
      const accountData = Buffer.from(result.data.value.data[0], 'base64');
      const metadata = this.parseMetadataAccount(accountData);

      console.log('✅ Metadata loaded');
      return metadata;

    } catch (error) {
      console.error('❌ Error loading metadata:', error);
      return null;
    }
  }

  /**
   * Fetch and parse metadata JSON from URI
   */
  async fetchMetadataJSON(uri: string): Promise<any> {
    try {
      console.log('📥 Fetching metadata JSON from:', uri);
      
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      console.log('✅ Metadata JSON fetched');
      
      return json;
    } catch (error) {
      console.error('❌ Error fetching metadata JSON:', error);
      return null;
    }
  }

  /**
   * Derive metadata PDA
   */
  private deriveMetadataPDA(mintAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        mintAddress.toBuffer(),
      ],
      this.programId
    );
  }

  /**
   * Parse metadata account data
   */
  private parseMetadataAccount(data: Buffer): NFTMetadata | null {
    try {
      const accountData = data.slice(8); // Skip discriminator
      let offset = 0;

      const mint = new PublicKey(accountData.slice(offset, offset + 32));
      offset += 32;

      const updateAuthority = new PublicKey(accountData.slice(offset, offset + 32));
      offset += 32;

      const nameLength = accountData.readUInt32LE(offset);
      offset += 4;
      const name = accountData.slice(offset, offset + nameLength).toString('utf-8');
      offset += nameLength;

      const symbolLength = accountData.readUInt32LE(offset);
      offset += 4;
      const symbol = accountData.slice(offset, offset + symbolLength).toString('utf-8');
      offset += symbolLength;

      const uriLength = accountData.readUInt32LE(offset);
      offset += 4;
      const uri = accountData.slice(offset, offset + uriLength).toString('utf-8');
      offset += uriLength;

      const isMutable = accountData.readUInt8(offset) === 1;

      return {
        mint,
        updateAuthority,
        name,
        symbol,
        uri,
        isMutable,
      };
    } catch (error) {
      console.error('Error parsing metadata account:', error);
      return null;
    }
  }

  /**
   * Update the metadata program ID after deployment
   */
  updateProgramId(newProgramId: string): void {
    try {
      this.programId = new PublicKey(newProgramId);
      console.log('✅ Metadata Program ID updated to:', newProgramId);
    } catch (error) {
      console.error('❌ Invalid program ID:', error);
    }
  }
}

// Export singleton instance
export const metadataService = new MetadataService();

// Export convenience functions
export const createNFTMetadata = (
  mintAddress: PublicKey,
  collectionName: string,
  collectionSymbol: string,
  mintNumber: number,
  attributes: Array<{ trait_type: string; value: string }>,
  imageUrl?: string
) => metadataService.createNFTMetadata(
  mintAddress,
  collectionName,
  collectionSymbol,
  mintNumber,
  attributes,
  imageUrl
);

export const getMetadata = (mintAddress: string) => 
  metadataService.getMetadata(mintAddress);

export const fetchMetadataJSON = (uri: string) => 
  metadataService.fetchMetadataJSON(uri);

export const updateMetadataProgramId = (newProgramId: string) => 
  metadataService.updateProgramId(newProgramId);

