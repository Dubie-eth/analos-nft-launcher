/**
 * BLOCKCHAIN PROFILE NFT SERVICE
 * Manages profile NFTs on the Analos blockchain
 */

import { Connection, PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BorshCoder } from '@coral-xyz/anchor';
import type { AnalosMonitoringSystem } from '@/idl/analos_monitoring_system';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '@/config/analos-programs';
import { generateReferralCode } from './wallet-examples';

// Profile NFT data structure for on-chain storage
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
  nftMetadata: string; // JSON string of NFT metadata
  mintPrice: number; // in lamports
  explorerUrl?: string;
  mintSignature?: string;
  createdAt: number;
  updatedAt: number;
}

// Profile NFT account structure for on-chain storage
export interface ProfileNFTAccount {
  wallet: PublicKey;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  referralCode: string;
  twitterHandle: string;
  twitterVerified: boolean;
  website: string;
  discord: string;
  telegram: string;
  github: string;
  nftMetadata: string;
  mintPrice: number;
  explorerUrl: string;
  mintSignature: string;
  createdAt: number;
  updatedAt: number;
}

export class BlockchainProfileNFTService {
  private connection: Connection;
  private program: Program<AnalosMonitoringSystem>;
  private provider: AnchorProvider;

  constructor(connection: Connection, program: Program<AnalosMonitoringSystem>, provider: AnchorProvider) {
    this.connection = connection;
    this.program = program;
    this.provider = provider;
  }

  /**
   * Create a profile NFT on-chain
   */
  async createProfileNFT(
    wallet: PublicKey,
    profileData: Partial<ProfileNFTData>,
    signer: Keypair
  ): Promise<{ signature: string; nftAccount: PublicKey }> {
    try {
      const normalized = profileData.username?.toLowerCase();
      if (!normalized) {
        throw new Error('Username is required');
      }

      // Generate referral code from username
      const referralCode = generateReferralCode(normalized);

      // Derive PDA for profile NFT
      const [nftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile_nft'), wallet.toBuffer()],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      // Prepare NFT data
      const now = Date.now();
      const nftData: ProfileNFTAccount = {
        wallet,
        username: normalized,
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        avatarUrl: profileData.avatarUrl || '',
        bannerUrl: profileData.bannerUrl || '',
        referralCode,
        twitterHandle: profileData.twitterHandle || '',
        twitterVerified: profileData.twitterVerified || false,
        website: profileData.website || '',
        discord: profileData.discord || '',
        telegram: profileData.telegram || '',
        github: profileData.github || '',
        nftMetadata: profileData.nftMetadata || '',
        mintPrice: profileData.mintPrice || 4.20 * LAMPORTS_PER_SOL, // 4.20 LOS
        explorerUrl: profileData.explorerUrl || '',
        mintSignature: profileData.mintSignature || '',
        createdAt: profileData.createdAt || now,
        updatedAt: now
      };

      // Create profile NFT account
      const tx = await this.program.methods
        .createProfileNft(
          normalized,
          nftData.displayName,
          nftData.bio,
          nftData.avatarUrl,
          nftData.bannerUrl,
          referralCode,
          nftData.twitterHandle,
          nftData.twitterVerified,
          nftData.website,
          nftData.discord,
          nftData.telegram,
          nftData.github,
          nftData.nftMetadata,
          nftData.mintPrice,
          nftData.explorerUrl,
          nftData.mintSignature
        )
        .accounts({
          profileNft: nftPda,
          user: wallet,
          systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc();

      return { signature: tx, nftAccount: nftPda };
    } catch (error) {
      console.error('Error creating profile NFT:', error);
      throw error;
    }
  }

  /**
   * Get profile NFT by wallet address
   */
  async getProfileNFTByWallet(wallet: PublicKey): Promise<ProfileNFTData | null> {
    try {
      const [nftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile_nft'), wallet.toBuffer()],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const accountInfo = await this.connection.getAccountInfo(nftPda);
      if (!accountInfo) {
        return null;
      }

      // Decode NFT data
      const coder = new BorshCoder(this.program.idl);
      const nftData = coder.accounts.decode('ProfileNFT', accountInfo.data);
      
      return {
        wallet: new PublicKey(nftData.wallet),
        username: nftData.username,
        displayName: nftData.displayName,
        bio: nftData.bio,
        avatarUrl: nftData.avatarUrl,
        bannerUrl: nftData.bannerUrl,
        referralCode: nftData.referralCode,
        twitterHandle: nftData.twitterHandle,
        twitterVerified: nftData.twitterVerified,
        website: nftData.website,
        discord: nftData.discord,
        telegram: nftData.telegram,
        github: nftData.github,
        nftMetadata: nftData.nftMetadata,
        mintPrice: nftData.mintPrice.toNumber(),
        explorerUrl: nftData.explorerUrl,
        mintSignature: nftData.mintSignature,
        createdAt: nftData.createdAt.toNumber(),
        updatedAt: nftData.updatedAt.toNumber()
      };
    } catch (error) {
      console.error('Error fetching profile NFT by wallet:', error);
      return null;
    }
  }

  /**
   * Check if user has a profile NFT
   */
  async hasProfileNFT(wallet: PublicKey): Promise<boolean> {
    try {
      const nft = await this.getProfileNFTByWallet(wallet);
      return nft !== null;
    } catch (error) {
      console.error('Error checking profile NFT:', error);
      return false;
    }
  }

  /**
   * Update profile NFT metadata
   */
  async updateProfileNFT(
    wallet: PublicKey,
    updates: Partial<ProfileNFTData>,
    signer: Keypair
  ): Promise<string> {
    try {
      const [nftPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile_nft'), wallet.toBuffer()],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const tx = await this.program.methods
        .updateProfileNft(
          updates.displayName || '',
          updates.bio || '',
          updates.avatarUrl || '',
          updates.bannerUrl || '',
          updates.twitterHandle || '',
          updates.twitterVerified || false,
          updates.website || '',
          updates.discord || '',
          updates.telegram || '',
          updates.github || '',
          updates.nftMetadata || '',
          updates.explorerUrl || '',
          updates.mintSignature || ''
        )
        .accounts({
          profileNft: nftPda,
          user: wallet,
        })
        .signers([signer])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating profile NFT:', error);
      throw error;
    }
  }

  /**
   * Get all profile NFTs (for marketplace)
   */
  async getAllProfileNFTs(limit: number = 50): Promise<ProfileNFTData[]> {
    try {
      // This would require a more complex implementation with indexing
      // For now, we'll return empty array and implement search via database
      return [];
    } catch (error) {
      console.error('Error fetching all profile NFTs:', error);
      return [];
    }
  }
}

// Export singleton instance
let profileNFTService: BlockchainProfileNFTService | null = null;

export function getBlockchainProfileNFTService(): BlockchainProfileNFTService | null {
  return profileNFTService;
}

export function initializeBlockchainProfileNFTService(
  connection: Connection,
  program: Program<AnalosMonitoringSystem>,
  provider: AnchorProvider
): BlockchainProfileNFTService {
  profileNFTService = new BlockchainProfileNFTService(connection, program, provider);
  return profileNFTService;
}
