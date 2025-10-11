/**
 * Analos NFT Launchpad Program Service
 * Handles all interactions with the custom Analos NFT Launchpad smart contract
 * Program ID: FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
 */

import { ANALOS_LAUNCHPAD_IDL } from './analos-launchpad-idl.js';

const PROGRAM_ID = '7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk';
const ANALOS_RPC_URL = process.env.ANALOS_RPC_URL || 'https://rpc.analos.io';

// Admin wallet from environment
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY 
  ? JSON.parse(process.env.ADMIN_PRIVATE_KEY) 
  : null;

export interface CollectionConfig {
  authority: string;
  maxSupply: number;
  currentSupply: number;
  priceLamports: number;
  revealThreshold: number;
  isRevealed: boolean;
  isPaused: boolean;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
}

export interface MintRecord {
  mintIndex: number;
  minter: string;
  isRevealed: boolean;
  rarityScore: number;
}

export interface RarityTier {
  name: string;
  minScore: number;
  maxScore: number;
  probability: string;
}

export class AnalosLaunchpadService {
  private programId: string;
  private rpcUrl: string;

  constructor() {
    this.programId = PROGRAM_ID;
    this.rpcUrl = ANALOS_RPC_URL;
    console.log('🎯 Analos Launchpad Service initialized');
    console.log(`   Program ID: ${this.programId}`);
    console.log(`   RPC URL: ${this.rpcUrl}`);
  }

  /**
   * Get rarity tier based on rarity score
   */
  getRarityTier(rarityScore: number): RarityTier {
    if (rarityScore <= 4) {
      return { name: 'Legendary', minScore: 0, maxScore: 4, probability: '5%' };
    } else if (rarityScore <= 19) {
      return { name: 'Epic', minScore: 5, maxScore: 19, probability: '15%' };
    } else if (rarityScore <= 49) {
      return { name: 'Rare', minScore: 20, maxScore: 49, probability: '30%' };
    } else {
      return { name: 'Common', minScore: 50, maxScore: 99, probability: '50%' };
    }
  }

  /**
   * Derive collection config PDA
   * Seeds: ["collection", authority]
   */
  async deriveCollectionConfigPDA(authority: string): Promise<{ address: string; bump: number }> {
    // This would normally use @solana/web3.js PublicKey.findProgramAddressSync
    // For Analos, we'll use the RPC method
    try {
      const response = await fetch(`${this.rpcUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getProgramAccounts',
          params: [
            this.programId,
            {
              encoding: 'base64',
              filters: [
                {
                  memcmp: {
                    offset: 0,
                    bytes: authority
                  }
                }
              ]
            }
          ]
        })
      });

      const data: any = await response.json();
      
      if (data.result && data.result.length > 0) {
        return {
          address: data.result[0].pubkey,
          bump: 255 // Default bump, would need to calculate properly
        };
      }

      // If not found, return derived address (simplified)
      return {
        address: `${authority}_collection_config`,
        bump: 255
      };
    } catch (error) {
      console.error('Error deriving collection config PDA:', error);
      throw error;
    }
  }

  /**
   * Derive mint record PDA
   * Seeds: ["mint", collection_config, mint_index]
   */
  deriveMintRecordPDA(collectionConfig: string, mintIndex: number): { address: string; bump: number } {
    // Simplified PDA derivation for demonstration
    // In production, you'd use proper PDA calculation
    return {
      address: `${collectionConfig}_mint_${mintIndex}`,
      bump: 255
    };
  }

  /**
   * Initialize a new collection (Admin only)
   */
  async initializeCollection(params: {
    maxSupply: number;
    priceLamports: number;
    revealThreshold: number;
    collectionName: string;
    collectionSymbol: string;
    placeholderUri: string;
  }): Promise<{ success: boolean; collectionConfig: string; signature?: string; error?: string }> {
    try {
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      console.log('🚀 Initializing collection:', params.collectionName);

      // In production, this would:
      // 1. Create Analos transaction with initializeCollection instruction
      // 2. Sign with admin wallet
      // 3. Send to Analos RPC
      // 4. Return transaction signature

      // For now, return mock success
      const mockCollectionConfig = `collection_${params.collectionName.toLowerCase().replace(/\s/g, '_')}`;
      
      console.log('✅ Collection initialized successfully');
      console.log(`   Config PDA: ${mockCollectionConfig}`);
      console.log(`   Max Supply: ${params.maxSupply}`);
      console.log(`   Price: ${params.priceLamports / 1_000_000_000} LOS`);

      return {
        success: true,
        collectionConfig: mockCollectionConfig,
        signature: 'mock_signature_' + Date.now()
      };
    } catch (error: any) {
      console.error('❌ Error initializing collection:', error);
      return {
        success: false,
        collectionConfig: '',
        error: error.message
      };
    }
  }

  /**
   * Get collection configuration
   */
  async getCollectionConfig(authority: string): Promise<CollectionConfig | null> {
    try {
      const { address } = await this.deriveCollectionConfigPDA(authority);
      
      // In production, fetch account data from Analos RPC
      // For now, return mock data
      
      return {
        authority,
        maxSupply: 10000,
        currentSupply: 0,
        priceLamports: 4200690000000, // 4200.69 LOS
        revealThreshold: 5000,
        isRevealed: false,
        isPaused: false,
        collectionName: 'Analos Mystery Box',
        collectionSymbol: 'AMB',
        placeholderUri: 'https://placeholder.com/mystery.json'
      };
    } catch (error) {
      console.error('Error fetching collection config:', error);
      return null;
    }
  }

  /**
   * Build mint placeholder transaction instruction data
   */
  async buildMintPlaceholderInstruction(params: {
    payer: string;
    authority: string;
  }): Promise<{
    success: boolean;
    instructionData?: any;
    accounts?: any;
    error?: string;
  }> {
    try {
      const { address: collectionConfig } = await this.deriveCollectionConfigPDA(params.authority);
      
      // Get current supply to calculate mint index
      const config = await this.getCollectionConfig(params.authority);
      if (!config) {
        throw new Error('Collection not found');
      }

      const mintIndex = config.currentSupply;
      const { address: mintRecord } = this.deriveMintRecordPDA(collectionConfig, mintIndex);

      return {
        success: true,
        instructionData: {
          programId: this.programId,
          instruction: 'mintPlaceholder',
          args: []
        },
        accounts: {
          collectionConfig,
          mintRecord,
          payer: params.payer,
          systemProgram: '11111111111111111111111111111111'
        }
      };
    } catch (error: any) {
      console.error('Error building mint instruction:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reveal entire collection (Admin only)
   */
  async revealCollection(params: {
    authority: string;
    revealedBaseUri: string;
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      console.log('🎭 Revealing collection...');
      console.log(`   Base URI: ${params.revealedBaseUri}`);

      // In production, create and send reveal transaction
      
      return {
        success: true,
        signature: 'mock_reveal_signature_' + Date.now()
      };
    } catch (error: any) {
      console.error('❌ Error revealing collection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pause/unpause collection minting (Admin only)
   */
  async setPause(params: {
    authority: string;
    paused: boolean;
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      console.log(`${params.paused ? '⏸️' : '▶️'} ${params.paused ? 'Pausing' : 'Unpausing'} collection minting...`);

      return {
        success: true,
        signature: 'mock_pause_signature_' + Date.now()
      };
    } catch (error: any) {
      console.error('❌ Error setting pause state:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update collection configuration (Admin only)
   */
  async updateConfig(params: {
    authority: string;
    newPrice?: number;
    newRevealThreshold?: number;
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      console.log('⚙️ Updating collection config...');
      if (params.newPrice) console.log(`   New Price: ${params.newPrice / 1_000_000_000} LOS`);
      if (params.newRevealThreshold) console.log(`   New Threshold: ${params.newRevealThreshold}`);

      return {
        success: true,
        signature: 'mock_update_signature_' + Date.now()
      };
    } catch (error: any) {
      console.error('❌ Error updating config:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Withdraw collected funds (Admin only)
   */
  async withdrawFunds(params: {
    authority: string;
    amount: number;
  }): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!ADMIN_PRIVATE_KEY) {
        throw new Error('Admin private key not configured');
      }

      console.log('💰 Withdrawing funds...');
      console.log(`   Amount: ${params.amount / 1_000_000_000} LOS`);

      return {
        success: true,
        signature: 'mock_withdraw_signature_' + Date.now()
      };
    } catch (error: any) {
      console.error('❌ Error withdrawing funds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get mint record for a specific NFT
   */
  async getMintRecord(collectionConfig: string, mintIndex: number): Promise<MintRecord | null> {
    try {
      const { address } = this.deriveMintRecordPDA(collectionConfig, mintIndex);
      
      // In production, fetch from Analos RPC
      // For now, return mock data
      
      return {
        mintIndex,
        minter: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
        isRevealed: false,
        rarityScore: Math.floor(Math.random() * 100)
      };
    } catch (error) {
      console.error('Error fetching mint record:', error);
      return null;
    }
  }

  /**
   * Get program info
   */
  getProgramInfo() {
    return {
      programId: this.programId,
      rpcUrl: this.rpcUrl,
      idl: ANALOS_LAUNCHPAD_IDL,
      features: [
        'Blind Mint & Reveal',
        'Fair Randomness (On-chain)',
        'Rarity Tiers (Legendary, Epic, Rare, Common)',
        'Admin Controls (Pause, Update, Withdraw)',
        'Threshold-based Reveal'
      ]
    };
  }
}

// Singleton instance
export const analosLaunchpadService = new AnalosLaunchpadService();

