/**
 * LOS BROS PFP MINTING SERVICE
 * Generates random traits and mints Los Bros NFTs
 * Integrated with Profile NFT creation
 */

import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';
import { 
  LOS_BROS_COLLECTION, 
  calculateRarityScore, 
  getRarityTier,
  type LosBrosTrait 
} from '@/config/los-bros-collection';

interface LosBrosMintOptions {
  wallet: string;
  signTransaction: any;
  sendTransaction: any;
}

interface LosBrosMintResult {
  success: boolean;
  mintAddress?: string;
  signature?: string;
  traits?: LosBrosTrait[];
  rarityScore?: number;
  rarityTier?: 'LEGENDARY' | 'EPIC' | 'RARE' | 'COMMON';
  metadataUri?: string;
  error?: string;
}

export class LosBrosMintingService {
  private connection: Connection;

  constructor() {
    // Use HTTP-only connection (no WebSockets) for Analos RPC
    this.connection = new Connection(ANALOS_RPC_URL.replace('wss://', 'https://'), {
      commitment: 'confirmed',
      wsEndpoint: undefined, // Explicitly disable WebSocket
    });
    
    console.log('🎨 Los Bros Minting Service initialized');
  }

  /**
   * Generate random traits for a Los Bros NFT
   */
  private generateRandomTraits(): LosBrosTrait[] {
    const traits: LosBrosTrait[] = [];
    const categories = LOS_BROS_COLLECTION.traitCategories;
    const weights = LOS_BROS_COLLECTION.traitRarityWeights;

    // Helper function to pick weighted random trait
    const pickWeightedTrait = (category: string): string => {
      const options = categories[category as keyof typeof categories];
      const categoryWeights = weights[category as keyof typeof weights] as Record<string, number>;
      
      // Calculate total weight
      const totalWeight = Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
      
      // Pick random value based on weights
      let random = Math.random() * totalWeight;
      
      for (const [trait, weight] of Object.entries(categoryWeights)) {
        random -= weight;
        if (random <= 0) {
          return trait;
        }
      }
      
      // Fallback to first option
      return options[0];
    };

    // Generate trait for each category
    for (const category of Object.keys(categories)) {
      const value = pickWeightedTrait(category);
      traits.push({
        trait_type: category.charAt(0).toUpperCase() + category.slice(1),
        value,
      });
    }

    return traits;
  }

  /**
   * Upload Los Bros metadata to IPFS
   */
  private async uploadMetadataToIPFS(
    name: string,
    traits: LosBrosTrait[],
    rarityScore: number,
    rarityTier: string,
    tokenId: number
  ): Promise<string> {
    try {
      console.log('📤 Uploading Los Bros metadata to IPFS...');

      // TODO: Generate actual Los Bros image based on traits
      // For now, use placeholder
      const imageUrl = `/api/los-bros/generate-image?tokenId=${tokenId}`;

      const metadata = {
        name,
        symbol: LOS_BROS_COLLECTION.symbol,
        description: `${LOS_BROS_COLLECTION.name} #${tokenId} - ${rarityTier} rarity PFP on Analos blockchain`,
        image: imageUrl,
        external_url: `https://analos.io/los-bros/${tokenId}`,
        attributes: traits.map(trait => ({
          trait_type: trait.trait_type,
          value: trait.value,
        })),
        properties: {
          files: [
            {
              uri: imageUrl,
              type: 'image/png',
            },
          ],
          category: 'image',
          creators: [
            {
              address: process.env.NEXT_PUBLIC_PLATFORM_WALLET || '',
              share: 100,
            },
          ],
          rarity: {
            tier: rarityTier,
            score: rarityScore,
          },
        },
        collection: {
          name: LOS_BROS_COLLECTION.name,
          family: 'Analos Collections',
        },
      };

      console.log('📄 Metadata to upload:', metadata);

      // Upload to IPFS via Pinata API
      const response = await fetch('/api/ipfs/upload-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `los-bros-${tokenId}`,
          content: metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ IPFS upload failed:', errorText);
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'IPFS upload failed');
      }
      
      const metadataUri = data.url || `https://gateway.pinata.cloud/ipfs/${data.cid}`;
      
      console.log('✅ Metadata uploaded to IPFS:', metadataUri);
      return metadataUri;
    } catch (error) {
      console.error('❌ Error uploading metadata:', error);
      throw error;
    }
  }

  /**
   * Mint a Los Bros NFT
   */
  async mintLosBros(options: LosBrosMintOptions): Promise<LosBrosMintResult> {
    try {
      console.log('🎨 Starting Los Bros NFT mint...');
      console.log('👤 User:', options.wallet);

      const userPublicKey = new PublicKey(options.wallet);

      // Generate random traits
      const traits = this.generateRandomTraits();
      console.log('🎲 Generated traits:', traits);

      // Calculate rarity
      const rarityScore = calculateRarityScore(traits);
      const rarityTier = getRarityTier(rarityScore);
      console.log('✨ Rarity:', rarityTier, 'Score:', rarityScore);

      // Generate token ID (get current count from database)
      const tokenId = Math.floor(Math.random() * 10000) + 1; // TODO: Get from database counter
      const name = `${LOS_BROS_COLLECTION.name} #${tokenId}`;

      // Upload metadata to IPFS
      const metadataUri = await this.uploadMetadataToIPFS(
        name,
        traits,
        rarityScore,
        rarityTier,
        tokenId
      );

      // Create mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🔑 Mint address:', mintKeypair.publicKey.toString());

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log('🏦 Associated token account:', associatedTokenAccount.toString());

      // Get rent for mint account
      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);
      
      console.log('💵 Rent for mint:', lamports / 1e9, 'SOL');

      // Build transaction
      const transaction = new Transaction();

      // 1. Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: userPublicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );

      // 2. Initialize metadata pointer (optional extension)
      transaction.add(
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          userPublicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 3. Initialize mint
      transaction.add(
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          0, // decimals
          userPublicKey, // mint authority
          userPublicKey, // freeze authority
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 4. Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          associatedTokenAccount,
          userPublicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // 5. Mint 1 token
      transaction.add(
        createMintToInstruction(
          mintKeypair.publicKey,
          associatedTokenAccount,
          userPublicKey,
          1, // amount
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Set recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      console.log('📋 Transaction built with', transaction.instructions.length, 'instructions');

      // Sign with mint keypair first
      transaction.partialSign(mintKeypair);
      console.log('✅ Mint keypair signed');

      // Sign with user wallet and send
      console.log('✍️ Requesting wallet signature and sending...');
      const signature = await options.sendTransaction(transaction, this.connection, {
        signers: [mintKeypair],
      });

      console.log('📝 Transaction signature:', signature);
      console.log('⏳ Confirming transaction...');

      // Confirm transaction using HTTP polling (no WebSockets)
      const confirmation = await this.confirmTransactionViaHTTP(signature, lastValidBlockHeight);

      if (confirmation) {
        console.log('✅ Los Bros NFT minted successfully!');
        console.log('🎨 Mint Address:', mintKeypair.publicKey.toString());
        console.log('🏆 Rarity:', rarityTier);
        console.log('📊 Score:', rarityScore);

        return {
          success: true,
          mintAddress: mintKeypair.publicKey.toString(),
          signature,
          traits,
          rarityScore,
          rarityTier,
          metadataUri,
        };
      } else {
        throw new Error('Transaction confirmation failed');
      }
    } catch (error: any) {
      console.error('❌ Error minting Los Bros NFT:', error);
      return {
        success: false,
        error: error.message || 'Failed to mint Los Bros NFT',
      };
    }
  }

  /**
   * Confirm transaction using HTTP polling (no WebSockets)
   */
  private async confirmTransactionViaHTTP(
    signature: string,
    lastValidBlockHeight: number,
    maxRetries: number = 40,
    retryDelay: number = 1500
  ): Promise<boolean> {
    console.log('🔄 Confirming via HTTP polling (no WebSockets)...');

    for (let i = 0; i < maxRetries; i++) {
      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (status && status.value) {
          if (status.value.err) {
            console.error('❌ Transaction failed:', status.value.err);
            return false;
          }

          if (status.value.confirmationStatus === 'confirmed' || 
              status.value.confirmationStatus === 'finalized') {
            console.log('✅ Transaction confirmed!');
            return true;
          }
        }

        // Check if block height exceeded
        const currentBlockHeight = await this.connection.getBlockHeight();
        if (currentBlockHeight > lastValidBlockHeight) {
          console.log('⚠️ Block height exceeded');
          return false;
        }

        console.log(`⏳ Attempt ${i + 1}/${maxRetries} - Status: ${status?.value?.confirmationStatus || 'pending'}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.error(`⚠️ Error checking status (attempt ${i + 1}):`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    console.log('⏰ Confirmation timeout reached');
    return false;
  }
}

// Export singleton instance
export const losBrosMintingService = new LosBrosMintingService();

