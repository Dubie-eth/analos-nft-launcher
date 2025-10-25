/**
 * Analos Profile Registry SDK
 * JavaScript SDK for interacting with the Profile Registry program
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { serialize } from 'borsh';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

// TODO: Replace with actual program ID after deployment
export const PROFILE_REGISTRY_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileRegistryData {
  version: number;
  wallet: PublicKey;
  username: string;
  profileNftMint: PublicKey;
  losBrosMint: PublicKey | null;
  tier: number;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface UsernameRegistryData {
  version: number;
  username: string;
  owner: PublicKey;
  profileRegistry: PublicKey;
  registeredAt: number;
  lastTransferredAt: number;
  isAvailable: boolean;
}

// ============================================================================
// INSTRUCTION BUILDERS
// ============================================================================

class ProfileRegistryInstruction {
  /**
   * Register Profile instruction (0)
   */
  static registerProfile(
    username: string,
    profileNftMint: PublicKey,
    losBrosMint: PublicKey | null,
    tier: number
  ): Buffer {
    const schema = new Map([
      [
        RegisterProfileArgs,
        {
          kind: 'struct',
          fields: [
            ['instruction', 'u8'],
            ['username', 'string'],
            ['profileNftMint', [32]],
            ['losBrosMint', { kind: 'option', type: [32] }],
            ['tier', 'u8'],
          ],
        },
      ],
    ]);

    const args = new RegisterProfileArgs({
      instruction: 0,
      username,
      profileNftMint: profileNftMint.toBytes(),
      losBrosMint: losBrosMint ? losBrosMint.toBytes() : null,
      tier,
    });

    return Buffer.from(serialize(schema, args));
  }

  /**
   * Update Profile instruction (1)
   */
  static updateProfile(
    losBrosMint: PublicKey | null,
    tier: number | null
  ): Buffer {
    const schema = new Map([
      [
        UpdateProfileArgs,
        {
          kind: 'struct',
          fields: [
            ['instruction', 'u8'],
            ['losBrosMint', { kind: 'option', type: [32] }],
            ['tier', { kind: 'option', type: 'u8' }],
          ],
        },
      ],
    ]);

    const args = new UpdateProfileArgs({
      instruction: 1,
      losBrosMint: losBrosMint ? losBrosMint.toBytes() : null,
      tier,
    });

    return Buffer.from(serialize(schema, args));
  }

  /**
   * Burn Profile instruction (3)
   */
  static burnProfile(): Buffer {
    return Buffer.from([3]); // Simple instruction, no data
  }
}

class RegisterProfileArgs {
  instruction: number;
  username: string;
  profileNftMint: Uint8Array;
  losBrosMint: Uint8Array | null;
  tier: number;

  constructor(args: {
    instruction: number;
    username: string;
    profileNftMint: Uint8Array;
    losBrosMint: Uint8Array | null;
    tier: number;
  }) {
    this.instruction = args.instruction;
    this.username = args.username;
    this.profileNftMint = args.profileNftMint;
    this.losBrosMint = args.losBrosMint;
    this.tier = args.tier;
  }
}

class UpdateProfileArgs {
  instruction: number;
  losBrosMint: Uint8Array | null;
  tier: number | null;

  constructor(args: {
    instruction: number;
    losBrosMint: Uint8Array | null;
    tier: number | null;
  }) {
    this.instruction = args.instruction;
    this.losBrosMint = args.losBrosMint;
    this.tier = args.tier;
  }
}

// ============================================================================
// SDK CLASS
// ============================================================================

export class AnalosProfileRegistrySDK {
  private connection: Connection;
  private programId: PublicKey;

  constructor(programId?: PublicKey) {
    this.connection = new Connection(ANALOS_RPC_URL, 'confirmed');
    this.programId = programId || PROFILE_REGISTRY_PROGRAM_ID;
  }

  /**
   * Derive Profile Registry PDA for a wallet
   */
  async getProfilePDA(wallet: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('profile'), wallet.toBuffer()],
      this.programId
    );
  }

  /**
   * Derive Username Registry PDA for a username
   */
  async getUsernamePDA(username: string): Promise<[PublicKey, number]> {
    const usernameLower = username.toLowerCase();
    return PublicKey.findProgramAddress(
      [Buffer.from('username'), Buffer.from(usernameLower)],
      this.programId
    );
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const [usernamePDA] = await this.getUsernamePDA(username);
      const accountInfo = await this.connection.getAccountInfo(usernamePDA);

      if (!accountInfo) {
        return true; // Account doesn't exist = available
      }

      // Account exists, check if it's marked as available
      const data = deserializeUsernameRegistry(accountInfo.data);
      return data.isAvailable;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  /**
   * Get profile by wallet
   */
  async getProfileByWallet(wallet: PublicKey): Promise<ProfileRegistryData | null> {
    try {
      const [profilePDA] = await this.getProfilePDA(wallet);
      const accountInfo = await this.connection.getAccountInfo(profilePDA);

      if (!accountInfo) {
        return null;
      }

      return deserializeProfileRegistry(accountInfo.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Get wallet by username
   */
  async getWalletByUsername(username: string): Promise<PublicKey | null> {
    try {
      const [usernamePDA] = await this.getUsernamePDA(username);
      const accountInfo = await this.connection.getAccountInfo(usernamePDA);

      if (!accountInfo) {
        return null;
      }

      const data = deserializeUsernameRegistry(accountInfo.data);
      return data.owner;
    } catch (error) {
      console.error('Error fetching wallet by username:', error);
      return null;
    }
  }

  /**
   * Create register profile instruction
   */
  async createRegisterProfileInstruction(
    wallet: PublicKey,
    username: string,
    profileNftMint: PublicKey,
    losBrosMint: PublicKey | null,
    tier: number
  ): Promise<TransactionInstruction> {
    const [profilePDA] = await this.getProfilePDA(wallet);
    const [usernamePDA] = await this.getUsernamePDA(username);

    return new TransactionInstruction({
      keys: [
        { pubkey: wallet, isSigner: true, isWritable: true },
        { pubkey: profilePDA, isSigner: false, isWritable: true },
        { pubkey: usernamePDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: profileNftMint, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: ProfileRegistryInstruction.registerProfile(
        username,
        profileNftMint,
        losBrosMint,
        tier
      ),
    });
  }

  /**
   * Create burn profile instruction
   */
  async createBurnProfileInstruction(wallet: PublicKey): Promise<TransactionInstruction> {
    const [profilePDA] = await this.getProfilePDA(wallet);
    
    // Get username from profile
    const profile = await this.getProfileByWallet(wallet);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const [usernamePDA] = await this.getUsernamePDA(profile.username);

    return new TransactionInstruction({
      keys: [
        { pubkey: wallet, isSigner: true, isWritable: false },
        { pubkey: profilePDA, isSigner: false, isWritable: true },
        { pubkey: usernamePDA, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: ProfileRegistryInstruction.burnProfile(),
    });
  }
}

// Helper function for deserialization
function deserializeProfileRegistry(data: Buffer): ProfileRegistryData {
  // Simple deserialization (you'd use borsh in production)
  // TODO: Implement proper borsh deserialization
  const profile: ProfileRegistryData = {
    version: 1,
    wallet: PublicKey.default,
    username: '',
    profileNftMint: PublicKey.default,
    losBrosMint: null,
    tier: 0,
    createdAt: 0,
    updatedAt: 0,
    isActive: false,
  };
  return profile;
}

// Helper function for username registry deserialization
function deserializeUsernameRegistry(data: Buffer): UsernameRegistryData {
  // Simple deserialization (you'd use borsh in production)
  // TODO: Implement proper borsh deserialization
  const username: UsernameRegistryData = {
    version: 1,
    username: '',
    owner: PublicKey.default,
    profileRegistry: PublicKey.default,
    registeredAt: 0,
    lastTransferredAt: 0,
    isAvailable: false,
  };
  return username;
}

// Export singleton
export const profileRegistrySDK = new AnalosProfileRegistrySDK();

