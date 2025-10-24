/**
 * Profile NFT Fetcher Service
 * Blockchain-first approach: Fetch from chain, enrich from database
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ANALOS_RPC_URL } from '@/config/analos-programs';

interface ProfileNFT {
  mint: string;
  owner: string;
  name: string;
  image: string;
  description: string;
  attributes: Array<{ trait_type: string; value: string }>;
  metadata?: any;
  fromBlockchain: boolean;
  fromDatabase: boolean;
}

class ProfileNFTFetcher {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: undefined,
    });
  }

  /**
   * Get user's Profile NFT (blockchain-first)
   */
  async getUserProfileNFT(walletAddress: string): Promise<ProfileNFT | null> {
    console.log('🔍 Fetching Profile NFT (blockchain-first)...');
    console.log('  Wallet:', walletAddress);

    try {
      // STEP 1: Fetch from blockchain
      const blockchainNFT = await this.fetchFromBlockchain(walletAddress);
      
      if (blockchainNFT) {
        console.log('✅ Found Profile NFT on blockchain:', blockchainNFT.mint);
        
        // STEP 2: Try to enrich with database data
        try {
          const dbData = await this.fetchFromDatabase(walletAddress);
          if (dbData) {
            console.log('✅ Enriched with database data');
            return { ...blockchainNFT, ...dbData, fromDatabase: true };
          }
        } catch (dbError) {
          console.warn('⚠️  Database enrichment failed (non-fatal):', dbError);
        }
        
        return blockchainNFT;
      }

      // STEP 3: Fallback to database only if blockchain fails
      console.log('⚠️  No Profile NFT found on blockchain, checking database...');
      const dbNFT = await this.fetchFromDatabase(walletAddress);
      
      if (dbNFT) {
        console.log('✅ Found Profile NFT in database (fallback)');
        return dbNFT;
      }

      console.log('❌ No Profile NFT found');
      return null;

    } catch (error) {
      console.error('❌ Error fetching Profile NFT:', error);
      return null;
    }
  }

  /**
   * Fetch Profile NFT from blockchain by checking metadata
   */
  private async fetchFromBlockchain(walletAddress: string): Promise<ProfileNFT | null> {
    try {
      const ownerPublicKey = new PublicKey(walletAddress);

      // Get all Token-2022 accounts owned by this wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPublicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      console.log(`📊 Found ${tokenAccounts.value.length} Token-2022 accounts`);

      // Find NFTs (amount = 1, decimals = 0)
      const nftAccounts = tokenAccounts.value.filter(account => {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        return tokenAmount.decimals === 0 && tokenAmount.uiAmount === 1;
      });

      console.log(`🎨 Found ${nftAccounts.length} NFTs (amount=1, decimals=0)`);

      // Check each NFT for Profile NFT metadata
      for (const account of nftAccounts) {
        const mintAddress = account.account.data.parsed.info.mint;
        
        try {
          // Fetch metadata from IPFS or on-chain
          const metadata = await this.fetchNFTMetadata(mintAddress);
          
          // Check if it's a Profile NFT
          if (this.isProfileNFT(metadata)) {
            console.log('✅ Identified as Profile NFT:', mintAddress);
            
            // Extract username from metadata
            const username = this.extractUsername(metadata);
            
            return {
              mint: mintAddress,
              owner: walletAddress,
              name: metadata.name || `@${username}`,
              image: this.generateProfileImage(metadata, username),
              description: metadata.description || 'Profile NFT',
              attributes: metadata.attributes || [],
              metadata,
              fromBlockchain: true,
              fromDatabase: false,
            };
          }
        } catch (metadataError) {
          console.warn(`⚠️  Could not fetch metadata for ${mintAddress}:`, metadataError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Blockchain fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch NFT metadata from IPFS or on-chain
   */
  private async fetchNFTMetadata(mintAddress: string): Promise<any> {
    try {
      // Try to get metadata URI from the mint account
      const mintPublicKey = new PublicKey(mintAddress);
      const accountInfo = await this.connection.getAccountInfo(mintPublicKey);
      
      if (!accountInfo) {
        throw new Error('Mint account not found');
      }

      // For now, construct the expected metadata URI
      // In production, you'd parse the account data to get the actual URI
      const metadataUri = `https://gateway.pinata.cloud/ipfs/${mintAddress}`;
      
      // Try to fetch from our API first (which might have it cached/stored)
      try {
        const apiResponse = await fetch(`/api/nft-metadata/${mintAddress}`);
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data.metadata) {
            return data.metadata;
          }
        }
      } catch (apiError) {
        console.warn('⚠️  API metadata fetch failed, will try IPFS');
      }

      // If we have a metadata URI in the account, fetch it
      // This is a simplified version - you'd need to parse the account data properly
      return {
        name: `Profile NFT`,
        symbol: 'PROFILE',
        description: 'Analos Profile NFT',
        attributes: [
          { trait_type: 'Type', value: 'Profile NFT' }
        ]
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if metadata indicates this is a Profile NFT
   */
  private isProfileNFT(metadata: any): boolean {
    // Check symbol
    if (metadata.symbol === 'PROFILE') {
      return true;
    }

    // Check attributes
    if (metadata.attributes?.some((attr: any) => 
      attr.trait_type === 'Type' && attr.value === 'Profile NFT'
    )) {
      return true;
    }

    // Check name pattern (@username)
    if (metadata.name?.startsWith('@')) {
      return true;
    }

    // Check description
    if (metadata.description?.includes('Profile NFT') || 
        metadata.description?.includes('Analos Profile')) {
      return true;
    }

    return false;
  }

  /**
   * Extract username from metadata
   */
  private extractUsername(metadata: any): string {
    // Try attributes first
    const usernameAttr = metadata.attributes?.find((attr: any) => 
      attr.trait_type === 'Username'
    );
    if (usernameAttr) {
      return usernameAttr.value;
    }

    // Try name (remove @ symbol)
    if (metadata.name?.startsWith('@')) {
      return metadata.name.slice(1);
    }

    return 'Unknown';
  }

  /**
   * Generate profile image URL
   */
  private generateProfileImage(metadata: any, username: string): string {
    const tier = metadata.attributes?.find((attr: any) => attr.trait_type === 'Tier')?.value || 'basic';
    const displayName = metadata.attributes?.find((attr: any) => attr.trait_type === 'Display Name')?.value || username;
    const losBros = metadata.attributes?.find((attr: any) => attr.trait_type === 'Los Bros Mint')?.value || '';
    const discord = metadata.attributes?.find((attr: any) => attr.trait_type === 'Discord')?.value || '';
    const telegram = metadata.attributes?.find((attr: any) => attr.trait_type === 'Telegram')?.value || '';

    return `/api/profile-nft/generate-image?username=${encodeURIComponent(username)}&tier=${tier}&displayName=${encodeURIComponent(displayName)}&referralCode=${username.toUpperCase().slice(0, 8)}&losBrosTokenId=${losBros}&discordHandle=${encodeURIComponent(discord)}&telegramHandle=${encodeURIComponent(telegram)}`;
  }

  /**
   * Fetch Profile NFT from database
   */
  private async fetchFromDatabase(walletAddress: string): Promise<ProfileNFT | null> {
    try {
      const response = await fetch(`/api/user-profile/check?walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.profile) {
        const profile = data.profile;
        
        return {
          mint: profile.mint_address,
          owner: profile.wallet_address,
          name: `@${profile.username}`,
          image: profile.image_url,
          description: `Profile NFT for @${profile.username}`,
          attributes: [
            { trait_type: 'Username', value: profile.username },
            { trait_type: 'Display Name', value: profile.display_name },
            { trait_type: 'Tier', value: profile.tier },
            { trait_type: 'Discord', value: profile.discord_handle || '' },
            { trait_type: 'Telegram', value: profile.telegram_handle || '' },
            { trait_type: 'Los Bros', value: profile.los_bros_token_id ? 'Yes' : 'No' },
            { trait_type: 'Los Bros Rarity', value: profile.los_bros_rarity || '' },
            { trait_type: 'Los Bros Mint', value: profile.los_bros_token_id || '' },
          ],
          metadata: profile,
          fromBlockchain: false,
          fromDatabase: true,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Database fetch error:', error);
      return null;
    }
  }
}

// Export singleton
export const profileNFTFetcher = new ProfileNFTFetcher();

