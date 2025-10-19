/**
 * BLOCKCHAIN PROFILE SERVICE
 * Manages user profiles on the Analos blockchain with name collision detection
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, BorshCoder } from '@coral-xyz/anchor';
import type { AnalosMonitoringSystem } from '@/idl/analos_monitoring_system';
import { ANALOS_PROGRAMS } from '@/config/analos-programs';

// Profile data structure for on-chain storage
export interface BlockchainProfile {
  wallet: PublicKey;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  twitterHandle?: string;
  twitterVerified: boolean;
  website?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  createdAt: number;
  updatedAt: number;
  isAnonymous: boolean;
}

// Username validation rules (same as token names)
export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/,
  reserved: [
    'admin', 'administrator', 'root', 'system',
    'analos', 'onlyanal', 'official',
    'support', 'help', 'api',
    'www', 'mail', 'ftp', 'localhost',
    'test', 'dev', 'staging', 'production',
    'null', 'undefined', 'true', 'false'
  ]
};

export class BlockchainProfileService {
  private connection: Connection;
  private program: Program<AnalosMonitoringSystem>;
  private provider: AnchorProvider;

  constructor(connection: Connection, program: Program<AnalosMonitoringSystem>, provider: AnchorProvider) {
    this.connection = connection;
    this.program = program;
    this.provider = provider;
  }

  /**
   * Validate username format and rules
   */
  validateUsername(username: string): { valid: boolean; message?: string } {
    const normalized = username.toLowerCase();

    // Check length
    if (normalized.length < USERNAME_RULES.minLength) {
      return { valid: false, message: `Username must be at least ${USERNAME_RULES.minLength} characters long` };
    }
    if (normalized.length > USERNAME_RULES.maxLength) {
      return { valid: false, message: `Username must be ${USERNAME_RULES.maxLength} characters or less` };
    }

    // Check pattern
    if (!USERNAME_RULES.pattern.test(normalized)) {
      return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens. Cannot start or end with special characters.' };
    }

    // Check reserved names
    if (USERNAME_RULES.reserved.includes(normalized)) {
      return { valid: false, message: 'This username is reserved and cannot be used' };
    }

    return { valid: true };
  }

  /**
   * Check if username is available on-chain
   */
  async isUsernameAvailable(username: string): Promise<{ available: boolean; takenBy?: string }> {
    try {
      const normalized = username.toLowerCase();
      
      // Derive PDA for username
      const [usernamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('username'), Buffer.from(normalized)],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      // Check if account exists
      const accountInfo = await this.connection.getAccountInfo(usernamePda);
      
      if (accountInfo) {
        // Username is taken, try to get the owner
        try {
          const profileData = await this.getProfileByUsername(normalized);
          return { available: false, takenBy: profileData.wallet.toString() };
        } catch {
          return { available: false, takenBy: 'Unknown' };
        }
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking username availability:', error);
      return { available: false, takenBy: 'Error' };
    }
  }

  /**
   * Create or update user profile on-chain
   */
  async createOrUpdateProfile(
    wallet: PublicKey,
    profileData: Partial<BlockchainProfile>,
    signer: Keypair
  ): Promise<string> {
    try {
      const normalized = profileData.username?.toLowerCase();
      if (!normalized) {
        throw new Error('Username is required');
      }

      // Validate username
      const validation = this.validateUsername(normalized);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Check availability
      const availability = await this.isUsernameAvailable(normalized);
      if (!availability.available) {
        throw new Error(`Username '${normalized}' is already taken`);
      }

      // Derive PDAs
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), wallet.toBuffer()],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const [usernamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('username'), Buffer.from(normalized)],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      // Prepare profile data
      const now = Date.now();
      const profile: BlockchainProfile = {
        wallet,
        username: normalized,
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        avatarUrl: profileData.avatarUrl || '',
        bannerUrl: profileData.bannerUrl || '',
        twitterHandle: profileData.twitterHandle || '',
        twitterVerified: profileData.twitterVerified || false,
        website: profileData.website || '',
        discord: profileData.discord || '',
        telegram: profileData.telegram || '',
        github: profileData.github || '',
        createdAt: profileData.createdAt || now,
        updatedAt: now,
        isAnonymous: profileData.isAnonymous || false
      };

      // Create or update profile
      const tx = await this.program.methods
        .initializeUserProfile(
          normalized,
          profile.displayName,
          profile.bio,
          profile.avatarUrl,
          profile.bannerUrl,
          profile.twitterHandle || '',
          profile.website || '',
          profile.discord || '',
          profile.telegram || '',
          profile.github || '',
          profile.isAnonymous
        )
        .accounts({
          profile: profilePda,
          username: usernamePda,
          user: wallet,
          systemProgram: PublicKey.default,
        })
        .signers([signer])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  }

  /**
   * Get profile by wallet address
   */
  async getProfileByWallet(wallet: PublicKey): Promise<BlockchainProfile | null> {
    try {
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), wallet.toBuffer()],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const accountInfo = await this.connection.getAccountInfo(profilePda);
      if (!accountInfo) {
        return null;
      }

      // Decode profile data
      const coder = new BorshCoder(this.program.idl);
      const profileData = coder.accounts.decode('UserProfile', accountInfo.data);
      
      return {
        wallet: new PublicKey(profileData.wallet),
        username: profileData.username,
        displayName: profileData.displayName,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl,
        bannerUrl: profileData.bannerUrl,
        twitterHandle: profileData.twitterHandle,
        twitterVerified: profileData.twitterVerified,
        website: profileData.website,
        discord: profileData.discord,
        telegram: profileData.telegram,
        github: profileData.github,
        createdAt: profileData.createdAt.toNumber(),
        updatedAt: profileData.updatedAt.toNumber(),
        isAnonymous: profileData.isAnonymous
      };
    } catch (error) {
      console.error('Error fetching profile by wallet:', error);
      return null;
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<BlockchainProfile | null> {
    try {
      const normalized = username.toLowerCase();
      
      const [usernamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('username'), Buffer.from(normalized)],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const accountInfo = await this.connection.getAccountInfo(usernamePda);
      if (!accountInfo) {
        return null;
      }

      // Decode username data to get wallet
      const coder = new BorshCoder(this.program.idl);
      const usernameData = coder.accounts.decode('UsernameRecord', accountInfo.data);
      
      // Get profile by wallet
      return await this.getProfileByWallet(new PublicKey(usernameData.owner));
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  }

  /**
   * Search profiles by username pattern
   */
  async searchProfiles(query: string, limit: number = 10): Promise<BlockchainProfile[]> {
    try {
      // This would require a more complex implementation with indexing
      // For now, we'll return empty array and implement search via database
      return [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  /**
   * Verify Twitter handle (integrate with existing social verification)
   */
  async verifyTwitterHandle(wallet: PublicKey, twitterHandle: string): Promise<boolean> {
    try {
      // Check if user has completed social verification for this Twitter handle
      const response = await fetch(`/api/social-verification/check/${wallet.toString()}`);
      if (response.ok) {
        const verification = await response.json();
        return verification.verified && verification.twitterHandle === twitterHandle;
      }
      return false;
    } catch (error) {
      console.error('Error verifying Twitter handle:', error);
      return false;
    }
  }

  /**
   * Update Twitter verification status
   */
  async updateTwitterVerification(wallet: PublicKey, verified: boolean): Promise<void> {
    try {
      const profile = await this.getProfileByWallet(wallet);
      if (profile) {
        // Update profile with new verification status
        await this.createOrUpdateProfile(wallet, {
          ...profile,
          twitterVerified: verified
        }, this.provider.wallet as Keypair);
      }
    } catch (error) {
      console.error('Error updating Twitter verification:', error);
      throw error;
    }
  }
}

// Export singleton instance
let profileService: BlockchainProfileService | null = null;

export function getBlockchainProfileService(): BlockchainProfileService | null {
  return profileService;
}

export function initializeBlockchainProfileService(
  connection: Connection,
  program: Program<AnalosMonitoringSystem>,
  provider: AnchorProvider
): BlockchainProfileService {
  profileService = new BlockchainProfileService(connection, program, provider);
  return profileService;
}
