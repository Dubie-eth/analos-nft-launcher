import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction, Keypair } from '@solana/web3.js';
import { createMint, createAccount, mintTo, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint } from '@solana/spl-token';

export interface NFTCreationData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  collection?: {
    name: string;
    family: string;
  };
}

export interface MintingResult {
  success: boolean;
  mintAddress?: string;
  tokenAccount?: string;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export class AnalosNFTMintingService {
  private connection: Connection;
  private readonly ANALOS_RPC_URL = 'https://rpc.analos.io';

  constructor() {
    this.connection = new Connection(this.ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Mint a real NFT to the Analos blockchain
   */
  async mintNFT(
    nftData: NFTCreationData,
    ownerAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Buffer | Transaction>
  ): Promise<MintingResult> {
    try {
      console.log('🎨 Minting NFT to Analos blockchain...');
      console.log('📋 NFT Data:', nftData);
      console.log('👤 Owner:', ownerAddress);

      // Create a new mint account
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // Get rent exemption amount for mint account
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Create transaction
      const transaction = new Transaction();

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ownerAddress);

      // Create mint account instruction
      const createMintInstruction = SystemProgram.createAccount({
        fromPubkey: new PublicKey(ownerAddress),
        newAccountPubkey: mintAddress,
        lamports: mintRent,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });

      // Initialize mint instruction
      const initMintInstruction = createInitializeMintInstruction(
        mintAddress,
        0, // Decimals (0 for NFTs)
        new PublicKey(ownerAddress), // Mint authority
        new PublicKey(ownerAddress)  // Freeze authority
      );

      // Create associated token account for owner
      const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        mintKeypair, // Payer (will be replaced by owner in transaction)
        mintAddress,
        new PublicKey(ownerAddress)
      );

      // Mint 1 token to owner
      const mintToInstruction = createMintToInstruction(
        mintAddress,
        ownerTokenAccount.address,
        new PublicKey(ownerAddress), // Mint authority
        1 // Amount (1 for NFT)
      );

      // Add instructions to transaction
      transaction.add(createMintInstruction);
      transaction.add(initMintInstruction);
      transaction.add(mintToInstruction);

      // Store NFT metadata in memo instruction
      const metadata = {
        action: 'create_nft',
        name: nftData.name,
        symbol: nftData.symbol,
        description: nftData.description,
        image: nftData.image,
        attributes: nftData.attributes || [],
        collection: nftData.collection,
        mint_address: mintAddress.toString(),
        owner: ownerAddress,
        created_at: new Date().toISOString(),
        network: 'Analos'
      };

      const memoInstruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(ownerAddress), isSigner: true, isWritable: false }
        ],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'),
        data: Buffer.from(JSON.stringify(metadata), 'utf8')
      });

      transaction.add(memoInstruction);

      console.log('🔐 Requesting wallet signature for NFT minting...');
      
      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Handle different return types from wallet adapters
      let serializedTransaction: Buffer;
      if (signedTransaction instanceof Buffer) {
        serializedTransaction = signedTransaction;
      } else if (signedTransaction && typeof (signedTransaction as Transaction).serialize === 'function') {
        serializedTransaction = (signedTransaction as Transaction).serialize();
      } else {
        throw new Error('Invalid signed transaction format');
      }

      console.log('📡 Sending NFT minting transaction to Analos blockchain...');
      
      // Send transaction
      const confirmation = await this.connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      console.log('✅ NFT minting transaction sent:', confirmation);

      // Wait for confirmation
      const result = await this.connection.confirmTransaction(confirmation, 'confirmed');
      
      if (result.value.err) {
        throw new Error(`NFT minting failed: ${JSON.stringify(result.value.err)}`);
      }

      console.log('🎉 NFT minted successfully to Analos blockchain!');
      console.log('🎨 Mint Address:', mintAddress.toString());
      console.log('🔗 Explorer URL:', `https://explorer.analos.io/tx/${confirmation}`);

      return {
        success: true,
        mintAddress: mintAddress.toString(),
        tokenAccount: ownerTokenAccount.address.toString(),
        transactionSignature: confirmation,
        explorerUrl: `https://explorer.analos.io/tx/${confirmation}`
      };

    } catch (error) {
      console.error('❌ NFT minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch mint multiple NFTs
   */
  async batchMintNFTs(
    nftDataArray: NFTCreationData[],
    ownerAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Buffer | Transaction>
  ): Promise<MintingResult[]> {
    console.log(`🎨 Batch minting ${nftDataArray.length} NFTs to Analos blockchain...`);
    
    const results: MintingResult[] = [];
    
    for (let i = 0; i < nftDataArray.length; i++) {
      console.log(`📋 Minting NFT ${i + 1}/${nftDataArray.length}`);
      const result = await this.mintNFT(nftDataArray[i], ownerAddress, signTransaction);
      results.push(result);
      
      // Small delay between mints to avoid rate limiting
      if (i < nftDataArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch minting complete: ${successCount}/${nftDataArray.length} NFTs minted successfully`);
    
    return results;
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    slot: number;
    blockHeight: number;
  }> {
    try {
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        connected: true,
        rpcUrl: this.ANALOS_RPC_URL,
        slot,
        blockHeight
      };
    } catch (error) {
      console.error('Connection check failed:', error);
      return {
        connected: false,
        rpcUrl: this.ANALOS_RPC_URL,
        slot: 0,
        blockHeight: 0
      };
    }
  }
}

// Export singleton instance
export const analosNFTMintingService = new AnalosNFTMintingService();
