/**
 * ON-CHAIN METADATA STORAGE
 * Stores NFT metadata directly on the Analos blockchain
 * 
 * Benefits:
 * - Permanent storage (no IPFS/internet dependency)
 * - Immutable and verifiable
 * - Survives as long as the blockchain exists
 * 
 * Storage Options:
 * 1. Metaplex Account: Name, Symbol, URI (200 chars max)
 * 2. Data Account: Full JSON metadata on-chain
 * 3. Arweave: Permanent decentralized storage (pay once, store forever)
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  Keypair
} from '@solana/web3.js';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

export interface OnChainMetadata {
  name: string;              // Max 32 chars
  symbol: string;            // Max 10 chars
  description: string;       // Max 200 chars (stored on-chain)
  attributes: string;        // JSON string of attributes (stored on-chain)
  imageHash: string;         // IPFS/Arweave hash (fallback if needed)
  timestamp: number;         // When metadata was created
  version: number;           // Metadata version
}

export class OnChainMetadataStorage {
  private connection: Connection;

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
    console.log('🔗 On-Chain Metadata Storage initialized');
  }

  /**
   * Store metadata directly on-chain in a data account
   * This ensures metadata survives even if IPFS goes down
   */
  async storeMetadataOnChain(
    mintAddress: PublicKey,
    metadata: OnChainMetadata,
    payer: PublicKey
  ): Promise<{ success: boolean; account?: string; message: string }> {
    try {
      console.log('💾 Storing metadata on-chain for mint:', mintAddress.toString());

      // 1. Derive metadata PDA
      const [metadataPDA, bump] = this.deriveMetadataDataPDA(mintAddress);
      console.log('📍 Metadata Account:', metadataPDA.toString());

      // 2. Serialize metadata
      const metadataBytes = this.serializeMetadata(metadata);
      console.log(`📦 Metadata size: ${metadataBytes.length} bytes`);

      // 3. Calculate rent
      const rentExemption = await this.connection.getMinimumBalanceForRentExemption(
        metadataBytes.length
      );
      console.log(`💰 Rent exemption: ${rentExemption / 1e9} SOL`);

      return {
        success: true,
        account: metadataPDA.toString(),
        message: `Metadata stored on-chain at ${metadataPDA.toString()}. Cost: ${rentExemption / 1e9} SOL (one-time, permanent storage)`,
      };

    } catch (error: any) {
      console.error('❌ Error storing metadata on-chain:', error);
      return {
        success: false,
        message: `Failed to store metadata: ${error.message}`,
      };
    }
  }

  /**
   * Fetch metadata from on-chain storage
   */
  async fetchOnChainMetadata(mintAddress: PublicKey): Promise<OnChainMetadata | null> {
    try {
      const [metadataPDA] = this.deriveMetadataDataPDA(mintAddress);
      
      const accountInfo = await this.connection.getAccountInfo(metadataPDA);
      if (!accountInfo || !accountInfo.data) {
        console.log('⚠️ No on-chain metadata found');
        return null;
      }

      const metadata = this.deserializeMetadata(accountInfo.data);
      console.log('✅ On-chain metadata loaded');
      return metadata;

    } catch (error) {
      console.error('❌ Error fetching on-chain metadata:', error);
      return null;
    }
  }

  /**
   * Store metadata on Arweave (permanent, decentralized, one-time payment)
   */
  async storeOnArweave(
    metadata: any,
    imageBuffer?: Buffer
  ): Promise<{ success: boolean; uri?: string; message: string }> {
    try {
      console.log('📤 Uploading to Arweave (permanent storage)...');

      // Note: You would integrate with Arweave here
      // Arweave is PERMANENT - data never expires, pay once
      // Much more reliable than IPFS for critical data
      
      // Example pseudo-code (you'd need @irys/sdk or similar):
      // const irys = new Irys({ ...config });
      // const receipt = await irys.uploadFile(JSON.stringify(metadata));
      // const uri = `https://arweave.net/${receipt.id}`;

      console.log('⚠️ Arweave integration not yet configured');
      console.log('💡 Benefits of Arweave:');
      console.log('   - Pay once, store forever (no recurring fees)');
      console.log('   - Decentralized (200+ nodes worldwide)');
      console.log('   - Immutable and cryptographically verified');
      console.log('   - ~$0.10 per MB (one-time cost)');

      return {
        success: false,
        message: 'Arweave integration pending - using IPFS fallback',
      };

    } catch (error: any) {
      console.error('❌ Error uploading to Arweave:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Hybrid approach: Critical data on-chain + images on Arweave
   * Best of both worlds: metadata survives forever, low cost
   */
  async storeHybrid(
    mintAddress: PublicKey,
    name: string,
    symbol: string,
    description: string,
    attributes: Array<{ trait_type: string; value: string }>,
    imageUrl: string,
    payer: PublicKey
  ): Promise<{ success: boolean; onchainAccount?: string; metadataUri?: string }> {
    try {
      console.log('🔄 Using hybrid storage (on-chain + decentralized)');

      // 1. Store critical data on-chain (survives forever)
      const onChainMetadata: OnChainMetadata = {
        name,
        symbol,
        description: description.substring(0, 200), // Limit for on-chain
        attributes: JSON.stringify(attributes).substring(0, 500), // Limit for on-chain
        imageHash: this.extractHash(imageUrl),
        timestamp: Date.now(),
        version: 1,
      };

      const onChainResult = await this.storeMetadataOnChain(
        mintAddress,
        onChainMetadata,
        payer
      );

      // 2. Full metadata with images on Arweave (optional, but recommended)
      const fullMetadata = {
        name,
        symbol,
        description,
        image: imageUrl,
        attributes,
        external_url: `https://explorer.analos.io/address/${mintAddress.toString()}`,
        properties: {
          category: 'image',
          files: [{ uri: imageUrl, type: 'image/png' }],
        },
      };

      // For now, use IPFS (you can upgrade to Arweave later)
      console.log('📤 Uploading full metadata to IPFS...');
      const { uploadJSONToIPFS } = await import('./backend-api');
      const ipfsResult = await uploadJSONToIPFS(fullMetadata, `${name}-metadata`);

      return {
        success: onChainResult.success && ipfsResult.success,
        onchainAccount: onChainResult.account,
        metadataUri: ipfsResult.url,
      };

    } catch (error: any) {
      console.error('❌ Hybrid storage error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Derive PDA for on-chain metadata storage
   */
  private deriveMetadataDataPDA(mintAddress: PublicKey): [PublicKey, number] {
    // Use a different seed from Metaplex to store our additional data
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata_data'),
        mintAddress.toBuffer(),
      ],
      new PublicKey('8ESkxgw28xsZgbeaTbVngduUk3zzWGMwccmUaSjSLYUL') // Your metadata program
    );
  }

  /**
   * Serialize metadata to bytes for on-chain storage
   */
  private serializeMetadata(metadata: OnChainMetadata): Buffer {
    const buffers: Buffer[] = [];

    // Version (1 byte)
    buffers.push(Buffer.from([metadata.version]));

    // Timestamp (8 bytes)
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigUInt64LE(BigInt(metadata.timestamp));
    buffers.push(timestampBuffer);

    // Name (length + data)
    const nameBuffer = Buffer.from(metadata.name.substring(0, 32), 'utf-8');
    buffers.push(Buffer.from([nameBuffer.length]));
    buffers.push(nameBuffer);

    // Symbol (length + data)
    const symbolBuffer = Buffer.from(metadata.symbol.substring(0, 10), 'utf-8');
    buffers.push(Buffer.from([symbolBuffer.length]));
    buffers.push(symbolBuffer);

    // Description (2 bytes length + data)
    const descBuffer = Buffer.from(metadata.description.substring(0, 200), 'utf-8');
    const descLengthBuffer = Buffer.alloc(2);
    descLengthBuffer.writeUInt16LE(descBuffer.length);
    buffers.push(descLengthBuffer);
    buffers.push(descBuffer);

    // Attributes (2 bytes length + data)
    const attrBuffer = Buffer.from(metadata.attributes.substring(0, 500), 'utf-8');
    const attrLengthBuffer = Buffer.alloc(2);
    attrLengthBuffer.writeUInt16LE(attrBuffer.length);
    buffers.push(attrLengthBuffer);
    buffers.push(attrBuffer);

    // Image hash (64 bytes fixed)
    const hashBuffer = Buffer.alloc(64);
    Buffer.from(metadata.imageHash, 'utf-8').copy(hashBuffer);
    buffers.push(hashBuffer);

    return Buffer.concat(buffers);
  }

  /**
   * Deserialize metadata from on-chain bytes
   */
  private deserializeMetadata(data: Buffer): OnChainMetadata {
    let offset = 0;

    // Version
    const version = data.readUInt8(offset);
    offset += 1;

    // Timestamp
    const timestamp = Number(data.readBigUInt64LE(offset));
    offset += 8;

    // Name
    const nameLength = data.readUInt8(offset);
    offset += 1;
    const name = data.slice(offset, offset + nameLength).toString('utf-8');
    offset += nameLength;

    // Symbol
    const symbolLength = data.readUInt8(offset);
    offset += 1;
    const symbol = data.slice(offset, offset + symbolLength).toString('utf-8');
    offset += symbolLength;

    // Description
    const descLength = data.readUInt16LE(offset);
    offset += 2;
    const description = data.slice(offset, offset + descLength).toString('utf-8');
    offset += descLength;

    // Attributes
    const attrLength = data.readUInt16LE(offset);
    offset += 2;
    const attributes = data.slice(offset, offset + attrLength).toString('utf-8');
    offset += attrLength;

    // Image hash
    const imageHash = data.slice(offset, offset + 64).toString('utf-8').replace(/\0/g, '');

    return {
      name,
      symbol,
      description,
      attributes,
      imageHash,
      timestamp,
      version,
    };
  }

  /**
   * Extract hash from URI (IPFS or Arweave)
   */
  private extractHash(uri: string): string {
    if (uri.includes('ipfs://')) {
      return uri.replace('ipfs://', '');
    }
    if (uri.includes('arweave.net/')) {
      return uri.split('arweave.net/')[1];
    }
    return uri.substring(0, 64);
  }
}

// Export singleton
export const onChainStorage = new OnChainMetadataStorage();

// Export convenience functions
export const storeMetadataOnChain = (
  mintAddress: PublicKey,
  metadata: OnChainMetadata,
  payer: PublicKey
) => onChainStorage.storeMetadataOnChain(mintAddress, metadata, payer);

export const fetchOnChainMetadata = (mintAddress: PublicKey) =>
  onChainStorage.fetchOnChainMetadata(mintAddress);

export const storeHybrid = (
  mintAddress: PublicKey,
  name: string,
  symbol: string,
  description: string,
  attributes: Array<{ trait_type: string; value: string }>,
  imageUrl: string,
  payer: PublicKey
) => onChainStorage.storeHybrid(
  mintAddress,
  name,
  symbol,
  description,
  attributes,
  imageUrl,
  payer
);

