/**
 * ANALOS NFT MINTING SERVICE
 * Integrates with the real Analos NFT program for minting profile NFTs
 */

import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BorshCoder } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { generateReferralCode } from './wallet-examples';
import IDL from '@/idl/analos_nft_launchpad.json';
import { 
  checkMatrixVariantEligibility, 
  generateMatrixVariantSVG, 
  MATRIX_VARIANT_RARITY,
  MatrixVariantType 
} from './matrix-rare-variant';

// Profile NFT data structure
export interface ProfileNFTData {
  wallet: PublicKey;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  referralCode: string;
  twitterHandle?: string;
  twitterVerified: boolean;
  website?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  createdAt: number;
  mintPrice: number;
  matrixVariant?: MatrixVariantType;
}

// NFT Collection metadata for master open edition
export interface NFTCollectionData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  collection?: {
    name: string;
    family: string;
  };
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  mintNumber?: number; // Track which # in the collection this NFT is
}

// Master Open Edition Collection Configuration
export const MASTER_OPEN_EDITION_CONFIG = {
  collectionName: 'Analos Profile Cards',
  collectionSymbol: 'APC',
  collectionDescription: 'Official profile card NFTs for the Analos NFT Launchpad community. Each card represents a unique user and includes their referral code for the platform.',
  collectionFamily: 'Analos NFT Launchpad',
  totalSupply: 'Open Edition', // Unlimited minting
  mintPrice: 4.20, // 4.20 LOS
  royalty: 2.5, // 2.5% royalty to platform
};

export class AnalosNFTMintingService {
  private connection: Connection;
  private program: Program<any>;

  constructor() {
    // Configure connection for Analos network with extended timeouts
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    
    // Create a dummy provider for now
    const dummyKeypair = Keypair.generate();
    const provider = new AnchorProvider(
      this.connection,
      {
        publicKey: dummyKeypair.publicKey,
        signTransaction: async () => dummyKeypair,
        signAllTransactions: async () => [dummyKeypair]
      } as any,
      {}
    );

    this.program = new Program(IDL as any, provider);
  }

  /**
   * Create a profile NFT collection metadata for the master open edition
   */
  createProfileNFTCollection(profileData: ProfileNFTData, mintNumber?: number): NFTCollectionData {
    const referralCode = generateReferralCode(profileData.username);
    
    const attributes = [
      {
        trait_type: 'Collection',
        value: MASTER_OPEN_EDITION_CONFIG.collectionName
      },
      {
        trait_type: 'Username',
        value: profileData.username
      },
      {
        trait_type: 'Display Name',
        value: profileData.displayName
      },
      {
        trait_type: 'Referral Code',
        value: referralCode
      },
      {
        trait_type: 'Twitter Verified',
        value: profileData.twitterVerified ? 'Yes' : 'No'
      },
      {
        trait_type: 'Edition Type',
        value: 'Open Edition'
      },
      {
        trait_type: 'Mint Price',
        value: `${MASTER_OPEN_EDITION_CONFIG.mintPrice} LOS`
      },
      {
        trait_type: 'Platform',
        value: 'Analos NFT Launchpad'
      },
      {
        trait_type: 'Card Type',
        value: 'Profile Card'
      },
      {
        trait_type: 'Matrix Variant',
        value: profileData.matrixVariant || 'normal'
      }
    ];

    // Add mint number if provided
    if (mintNumber !== undefined) {
      attributes.push({
        trait_type: 'Mint Number',
        value: mintNumber.toString()
      });
    }
    
    return {
      name: `${profileData.displayName} Profile Card${mintNumber ? ` #${mintNumber}` : ''}`,
      symbol: MASTER_OPEN_EDITION_CONFIG.collectionSymbol,
      description: `${MASTER_OPEN_EDITION_CONFIG.collectionDescription} This card belongs to ${profileData.displayName} (@${profileData.username}). Referral Code: ${referralCode}${mintNumber ? `. Edition #${mintNumber}` : ''}`,
      image: this.generateProfileCardImage(profileData),
      external_url: `https://onlyanal.fun/profile/${profileData.username}`,
      collection: {
        name: MASTER_OPEN_EDITION_CONFIG.collectionName,
        family: MASTER_OPEN_EDITION_CONFIG.collectionFamily
      },
      attributes,
      mintNumber
    };
  }

  /**
   * Generate profile card image (SVG) with Matrix variant support
   */
  private generateProfileCardImage(profileData: ProfileNFTData): string {
    const referralCode = generateReferralCode(profileData.username);
    
    // Use Matrix variant system if variant is specified
    if (profileData.matrixVariant) {
      return generateMatrixVariantSVG(profileData, profileData.matrixVariant, referralCode);
    }
    
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="400" height="600" fill="url(#bg)" rx="20"/>
        
        <!-- Card Border -->
        <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" stroke-width="4" rx="15"/>
        
        <!-- Header -->
        <rect x="20" y="20" width="360" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
        <text x="200" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ANALOS PROFILE CARDS
        </text>
        <text x="200" y="55" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">
          Master Open Edition Collection
        </text>
        <text x="200" y="70" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">
          onlyanal.fun
        </text>
        
        <!-- Avatar Circle -->
        <circle cx="200" cy="180" r="60" fill="white" stroke="#6366f1" stroke-width="4"/>
        <text x="200" y="190" text-anchor="middle" fill="#6366f1" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          ${profileData.displayName.charAt(0).toUpperCase()}
        </text>
        
        <!-- User Info -->
        <text x="200" y="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
          ${profileData.displayName}
        </text>
        <text x="200" y="305" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="14">
          @${profileData.username}
        </text>
        
        <!-- Bio -->
        <rect x="30" y="330" width="340" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
        <text x="200" y="350" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
          ${profileData.bio || 'Profile card holder on Analos'}
        </text>
        
        <!-- Referral Code -->
        <rect x="30" y="430" width="340" height="60" fill="rgba(255,255,255,0.2)" rx="10"/>
        <text x="200" y="450" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          REFERRAL CODE
        </text>
        <text x="200" y="470" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
          ${referralCode}
        </text>
        
        <!-- Footer -->
        <text x="200" y="550" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">
          Open Edition • Minted on Analos • onlyanal.fun
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Mint a profile NFT using the real Analos NFT program
   */
  async mintProfileNFT(
    profileData: ProfileNFTData,
    userWallet: Keypair,
    mintNumber?: number
  ): Promise<{ mintAddress: PublicKey; signature: string; metadata: NFTCollectionData }> {
    try {
      // Check for Matrix variant eligibility using rarity oracle
      const matrixVariant = await checkMatrixVariantEligibility(
        profileData.wallet.toString(),
        profileData.username
      );
      
      // Update profile data with Matrix variant if applicable
      if (matrixVariant !== MATRIX_VARIANT_RARITY.NORMAL) {
        profileData.matrixVariant = matrixVariant;
        console.log(`🎆 MATRIX VARIANT DETECTED: ${matrixVariant} for ${profileData.username}`);
      }

      // Generate mint keypair
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // Create metadata with mint number
      const metadata = this.createProfileNFTCollection(profileData, mintNumber);

      // Create transaction
      const transaction = new Transaction();

      // Add the mint instruction
      // Note: This will need to be updated with the actual instruction from the deployed program
      const mintInstruction = await (this.program.methods as any)
        .createProfileNFT(
          profileData.username,
          profileData.displayName,
          profileData.bio,
          profileData.avatarUrl,
          generateReferralCode(profileData.username)
        )
        .accounts({
          mint: mintAddress,
          metadata: mintAddress, // This should be the metadata account
          user: userWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      transaction.add(mintInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet.publicKey;

      // Sign and send transaction
      transaction.sign(userWallet, mintKeypair);
      
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        mintAddress,
        signature,
        metadata
      };

    } catch (error) {
      console.error('Error minting profile NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to mint profile NFT: ${errorMessage}`);
    }
  }

  /**
   * Get NFT metadata from mint address
   */
  async getNFTMetadata(mintAddress: PublicKey): Promise<NFTCollectionData | null> {
    try {
      // This would need to be implemented based on the actual program structure
      // For now, return null as we'd need the real program IDL
      return null;
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Check if user has a profile NFT
   */
  async hasProfileNFT(userWallet: PublicKey): Promise<boolean> {
    try {
      // This would need to check the user's token accounts
      // For now, return false as we'd need the real program integration
      return false;
    } catch (error) {
      console.error('Error checking profile NFT:', error);
      return false;
    }
  }
}

// Export singleton instance
let nftMintingService: AnalosNFTMintingService | null = null;

export function getAnalosNFTMintingService(): AnalosNFTMintingService {
  if (!nftMintingService) {
    nftMintingService = new AnalosNFTMintingService();
  }
  return nftMintingService;
}
