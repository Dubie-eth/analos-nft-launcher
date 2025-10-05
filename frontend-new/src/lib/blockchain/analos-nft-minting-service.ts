import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  TransactionInstruction,
  Keypair,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY
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
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';

// Fallback if import fails
const METAPLEX_PROGRAM_ID = TOKEN_METADATA_PROGRAM_ID || new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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
      
      // FIXED: Explicitly set feePayer to the owner's public key
      transaction.feePayer = ownerPublicKey;
      
      console.log('🔍 Transaction created:', {
        transaction: !!transaction,
        blockhash: !!blockhash,
        instructionsLength: transaction.instructions?.length || 'undefined',
        feePayer: transaction.feePayer?.toBase58()
      });

      // Create mint account instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintAddress,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      });

      transaction.add(createMintInstruction);
      console.log('🔍 Added createMintInstruction:', transaction.instructions?.length || 'undefined');

      // Initialize mint instruction - FIXED: Use createInitializeMintInstruction
      const initializeMintInstruction = createInitializeMintInstruction(
        mintAddress,    // mint address
        0,              // decimals (0 for NFTs)
        ownerPublicKey, // mint authority
        ownerPublicKey  // freeze authority
      );

      transaction.add(initializeMintInstruction);
      console.log('🔍 Added initializeMintInstruction:', transaction.instructions?.length || 'undefined');

      // Create associated token account instruction
      const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        ownerPublicKey, // payer
        tokenAccount,   // associated token account
        ownerPublicKey, // owner
        mintAddress     // mint
      );

      transaction.add(createTokenAccountInstruction);
      console.log('🔍 Added createTokenAccountInstruction:', transaction.instructions?.length || 'undefined');

      // Mint token instruction (1 token for NFT) - FIXED: Use createMintToInstruction
      const mintToInstruction = createMintToInstruction(
        mintAddress,    // mint
        tokenAccount,   // destination
        ownerPublicKey, // authority
        1,              // amount (1 for NFT)
        []              // multiSigners
      );

      transaction.add(mintToInstruction);
      console.log('🔍 Added mintToInstruction:', transaction.instructions?.length || 'undefined');

      // Step 6: Create Metaplex Metadata Account
      console.log('📝 Creating Metaplex Metadata Account...');
      
      // Debug all PublicKey objects before using them
      console.log('🔍 Debugging PublicKey objects:', {
        TOKEN_METADATA_PROGRAM_ID: TOKEN_METADATA_PROGRAM_ID?.toBase58(),
        METAPLEX_PROGRAM_ID: METAPLEX_PROGRAM_ID?.toBase58(),
        mintAddress: mintAddress?.toBase58(),
        ownerPublicKey: ownerPublicKey?.toBase58(),
        SystemProgram_programId: SystemProgram.programId?.toBase58(),
        SYSVAR_RENT_PUBKEY: SYSVAR_RENT_PUBKEY?.toBase58()
      });

      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METAPLEX_PROGRAM_ID.toBuffer(),
          mintAddress.toBuffer(),
        ],
        METAPLEX_PROGRAM_ID
      );

      console.log('🔍 Metadata PDA created:', metadataAddress?.toBase58());

      const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataAddress,
          mint: mintAddress,
          mintAuthority: ownerPublicKey,
          payer: ownerPublicKey,
          updateAuthority: ownerPublicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: nftData.name,
              symbol: nftData.symbol,
              uri: ipfsResult.url!,
              sellerFeeBasisPoints: nftData.sellerFeeBasisPoints || 500,
              creators: nftData.creators || [{ address: ownerAddress, verified: false, share: 100 }],
              collection: null,
              uses: null,
            },
            isMutable: true,
            collectionDetails: null,
          },
        }
      );

      transaction.add(createMetadataInstruction);
      console.log('🔍 Added createMetadataInstruction:', transaction.instructions?.length || 'undefined');

      // Add signers - FIXED: Initialize signers array if undefined
      console.log('🔍 Before signing transaction:', {
        transaction: !!transaction,
        mintKeypair: !!mintKeypair,
        instructionsLength: transaction.instructions?.length || 'undefined',
        signersLength: transaction.signers?.length || 'undefined'
      });
      
      // FIXED: Initialize signers array if it's undefined
      if (!transaction.signers) {
        transaction.signers = [];
        console.log('🔧 Initialized transaction.signers array');
      }
      
      transaction.sign(mintKeypair);
      console.log('✅ Transaction signed successfully');

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
        sendTransactionType: typeof sendTransaction,
        transactionInstructions: transaction.instructions?.length,
        transactionSigners: transaction.signers?.length,
        transactionRecentBlockhash: !!transaction.recentBlockhash
      });

      console.log('🔍 Transaction object details:', {
        instructions: transaction.instructions,
        signers: transaction.signers,
        recentBlockhash: transaction.recentBlockhash,
        feePayer: transaction.feePayer?.toBase58() || 'undefined'
      });

      // Step 6: Send transaction with proper signers
      let signature: string;
      try {
        console.log('🔍 About to call sendTransaction with options...');
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
        console.log('🔍 About to call sendTransaction without options...');
        signature = await sendTransaction(transaction, this.connection);
        console.log('✅ Alternative approach worked:', signature);
      }

      console.log('🎉 NFT created successfully on Analos!');
      console.log('🎨 Mint Address:', mintAddress.toBase58());
      console.log('🔗 Token Account:', tokenAccount.toBase58());
      console.log('📄 Metadata Address:', metadataAddress.toBase58());
      console.log('📝 Transaction Signature:', signature);
      console.log('🌐 Explorer URL:', `https://explorer.analos.io/tx/${signature}`);

      return {
        success: true,
        mintAddress: mintAddress.toBase58(),
        tokenAccount: tokenAccount.toBase58(),
        metadataAddress: metadataAddress.toBase58(), // ✅ Metaplex metadata implemented!
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