/**
 * ANALOS NFT MINTING SERVICE
 * Integrates with the real Analos NFT program for minting profile NFTs
 */

import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BorshCoder } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { generateReferralCode } from './wallet-examples';

// Import the IDL for the NFT Launchpad program
// Note: We'll need to create this IDL based on the program at https://explorer.analos.io/address/5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT
interface AnalosNFTLaunchpadIDL {
  version: '0.1.0';
  name: 'analos_nft_launchpad';
  instructions: any[];
  accounts: any[];
  types: any[];
}

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
}

// NFT Collection metadata
export interface NFTCollectionData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export class AnalosNFTMintingService {
  private connection: Connection;
  private program: Program<AnalosNFTLaunchpadIDL>;

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    
    // Create a minimal IDL for the NFT program
    // This will need to be updated with the actual IDL from the deployed program
    const minimalIDL: AnalosNFTLaunchpadIDL = {
      version: '0.1.0',
      name: 'analos_nft_launchpad',
      instructions: [
        {
          name: 'createProfileNFT',
          accounts: [
            { name: 'mint', isMut: true, isSigner: false },
            { name: 'metadata', isMut: true, isSigner: false },
            { name: 'user', isMut: true, isSigner: true },
            { name: 'systemProgram', isMut: false, isSigner: false },
          ],
          args: [
            { name: 'username', type: 'string' },
            { name: 'displayName', type: 'string' },
            { name: 'bio', type: 'string' },
            { name: 'avatarUrl', type: 'string' },
            { name: 'referralCode', type: 'string' },
          ]
        }
      ],
      accounts: [],
      types: []
    };

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

    this.program = new Program(minimalIDL as any, ANALOS_PROGRAMS.NFT_LAUNCHPAD, provider);
  }

  /**
   * Create a profile NFT collection metadata
   */
  createProfileNFTCollection(profileData: ProfileNFTData): NFTCollectionData {
    const referralCode = generateReferralCode(profileData.username);
    
    return {
      name: `${profileData.displayName} Profile Card`,
      symbol: 'PROFILE',
      description: `${profileData.bio || 'Profile card NFT for ' + profileData.displayName}. Referral Code: ${referralCode}`,
      image: this.generateProfileCardImage(profileData),
      external_url: `https://onlyanal.fun/profile/${profileData.username}`,
      attributes: [
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
          trait_type: 'Profile Type',
          value: 'User Profile Card'
        },
        {
          trait_type: 'Mint Price',
          value: `${profileData.mintPrice / LAMPORTS_PER_SOL} LOS`
        }
      ]
    };
  }

  /**
   * Generate profile card image (SVG)
   */
  private generateProfileCardImage(profileData: ProfileNFTData): string {
    const referralCode = generateReferralCode(profileData.username);
    
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
        <text x="200" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
          PROFILE CARD
        </text>
        <text x="200" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
          Analos NFT Launchpad
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
          Minted on Analos • onlyanal.fun
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
    userWallet: Keypair
  ): Promise<{ mintAddress: PublicKey; signature: string; metadata: NFTCollectionData }> {
    try {
      // Generate mint keypair
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;

      // Create metadata
      const metadata = this.createProfileNFTCollection(profileData);

      // Create transaction
      const transaction = new Transaction();

      // Add the mint instruction
      // Note: This will need to be updated with the actual instruction from the deployed program
      const mintInstruction = await this.program.methods
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
      throw new Error(`Failed to mint profile NFT: ${error.message}`);
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
