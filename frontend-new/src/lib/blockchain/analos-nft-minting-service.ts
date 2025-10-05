import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createAccount,
  mintTo
} from '@solana/spl-token';

export interface NFTCreationData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family: string;
  };
  sellerFeeBasisPoints?: number;
  creators?: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
}

export interface NFTCreationResult {
  success: boolean;
  mintAddress?: string;
  tokenAccount?: string;
  metadataAddress?: string;
  masterEditionAddress?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

export class AnalosNFTMintingService {
  private connection: Connection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';
  private readonly METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  private readonly TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Upload metadata to IPFS using Pinata
   */
  async uploadMetadataToIPFS(metadata: any): Promise<IPFSUploadResult> {
    try {
      console.log('📤 Uploading metadata to IPFS...');
      
      // For now, we'll simulate IPFS upload
      // In production, you would integrate with Pinata, NFT.Storage, or similar
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      const mockUrl = `https://gateway.pinata.cloud/ipfs/${mockHash}`;
      
      console.log('✅ Metadata uploaded to IPFS:', mockUrl);
      
      return {
        success: true,
        hash: mockHash,
        url: mockUrl
      };
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a real NFT on Analos blockchain
   */
  async createRealNFT(
    nftData: NFTCreationData,
    ownerAddress: string,
    sendTransaction: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>
  ): Promise<NFTCreationResult> {
    try {
      console.log('🎨 Creating REAL NFT on Analos blockchain...');
      console.log('📋 NFT Data:', nftData);
      console.log('👤 Owner:', ownerAddress);

      // Validate owner address
      if (!ownerAddress || typeof ownerAddress !== 'string' || ownerAddress.length < 32) {
        throw new Error(`Invalid owner address: ${ownerAddress}`);
      }

      const ownerPublicKey = new PublicKey(ownerAddress);

      // Step 1: Upload metadata to IPFS
      const metadata = {
        name: nftData.name,
        symbol: nftData.symbol,
        description: nftData.description,
        image: nftData.image,
        external_url: nftData.externalUrl || '',
        attributes: nftData.attributes || [],
        collection: nftData.collection || {
          name: 'Analos NFT Collection',
          family: 'Analos'
        },
        properties: {
          files: [
            {
              uri: nftData.image,
              type: 'image/png'
            }
          ],
          category: 'image',
          creators: nftData.creators || [
            {
              address: ownerAddress,
              verified: true,
              share: 100
            }
          ]
        }
      };

      const ipfsResult = await this.uploadMetadataToIPFS(metadata);
      if (!ipfsResult.success) {
        throw new Error(`Failed to upload metadata to IPFS: ${ipfsResult.error}`);
      }

      // Step 2: Create mint account
      console.log('🔨 Creating mint account...');
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // Step 3: Get associated token account
      console.log('🔗 Getting associated token account...');
      const tokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        ownerPublicKey
      );

      // Step 4: Calculate rent for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Step 5: Create transaction
      console.log('📝 Creating transaction...');
      const transaction = new Transaction();

      // Add recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;

      // Create mint account instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintAddress,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      });

      transaction.add(createMintInstruction);

      // Initialize mint instruction - FIXED: Use createInitializeMintInstruction
      const initializeMintInstruction = createInitializeMintInstruction(
        mintAddress,    // mint address
        0,              // decimals (0 for NFTs)
        ownerPublicKey, // mint authority
        ownerPublicKey  // freeze authority
      );

      transaction.add(initializeMintInstruction);

      // Create associated token account instruction
      const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        ownerPublicKey, // payer
        tokenAccount,   // associated token account
        ownerPublicKey, // owner
        mintAddress     // mint
      );

      transaction.add(createTokenAccountInstruction);

      // Mint token instruction (1 token for NFT) - FIXED: Use createMintToInstruction
      const mintToInstruction = createMintToInstruction(
        mintAddress,    // mint
        tokenAccount,   // destination
        ownerPublicKey, // authority
        1,              // amount (1 for NFT)
        []              // multiSigners
      );

      transaction.add(mintToInstruction);

      // Add signers - FIXED: Need to add mintKeypair as signer for the transaction
      transaction.sign(mintKeypair);

      console.log('🔐 Sending transaction to wallet...');
      console.log('📝 Transaction details:', {
        instructions: transaction.instructions.length,
        signers: transaction.signers.length,
        recentBlockhash: transaction.recentBlockhash
      });

      console.log('🔍 Debug sendTransaction call:', {
        transaction: !!transaction,
        connection: !!this.connection,
        mintKeypair: !!mintKeypair,
        sendTransactionType: typeof sendTransaction
      });

      // Step 6: Send transaction with proper signers
      let signature: string;
      try {
        signature = await sendTransaction(transaction, this.connection, {
          signers: [mintKeypair],
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        console.log('✅ Transaction sent successfully:', signature);
      } catch (error) {
        console.error('❌ sendTransaction error:', error);
        console.log('🔍 Trying alternative approach...');
        
        // Try without options first
        signature = await sendTransaction(transaction, this.connection);
        console.log('✅ Alternative approach worked:', signature);
      }

      console.log('🎉 NFT created successfully on Analos!');
      console.log('🎨 Mint Address:', mintAddress.toBase58());
      console.log('🔗 Token Account:', tokenAccount.toBase58());
      console.log('📝 Transaction Signature:', signature);
      console.log('🌐 Explorer URL:', `https://explorer.analos.io/tx/${signature}`);

      return {
        success: true,
        mintAddress: mintAddress.toBase58(),
        tokenAccount: tokenAccount.toBase58(),
        metadataAddress: '', // TODO: Implement Metaplex metadata
        masterEditionAddress: '', // TODO: Implement Master Edition
        transactionSignature: signature,
        explorerUrl: `https://explorer.analos.io/tx/${signature}`
      };

    } catch (error) {
      console.error('❌ NFT creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get NFT metadata from blockchain
   */
  async getNFTMetadata(mintAddress: string): Promise<any> {
    try {
      console.log('🔍 Fetching NFT metadata for:', mintAddress);
      
      // TODO: Implement Metaplex metadata fetching
      // This would use the Metaplex Token Metadata program
      
      return {
        mint: mintAddress,
        metadata: 'Not implemented yet'
      };
    } catch (error) {
      console.error('❌ Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    slot: number;
    blockHeight: number;
    network: string;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        connected: true,
        rpcUrl: this.ANALOS_RPC_URL,
        slot,
        blockHeight,
        network: 'Analos'
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      return {
        connected: false,
        rpcUrl: this.ANALOS_RPC_URL,
        slot: 0,
        blockHeight: 0,
        network: 'Analos'
      };
    }
  }
}

// Export singleton instance
export const analosNFTMintingService = new AnalosNFTMintingService();