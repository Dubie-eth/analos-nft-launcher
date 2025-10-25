/**
 * ANALYTICS SERVICE
 * Real-time analytics from Analos blockchain
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_RPC_URL, ANALOS_PROGRAMS } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export interface PlatformAnalytics {
  totalMints: number;
  totalRevenueLOS: number;
  uniqueHolders: number;
  last24hMints: number;
  totalCollections: number;
  totalTransactions: number;
  activePrograms: number;
}

export interface CollectionStats {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintedPercentage: number;
  mintPriceUSD: number;
  isActive: boolean;
  mintingEnabled: boolean;
  programId: string;
  collectionConfig: string;
  address: string;
  recentMints?: number;
}

export interface ProgramStatus {
  name: string;
  programId: string;
  isActive: boolean;
  transactionCount: number;
  lastActivity: string;
}

export class AnalyticsService {
  private connection: Connection;

  constructor() {
    // Configure connection for Analos network
    this.connection = new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000,
    });
    
    // Force disable WebSocket
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
    
    console.log('📊 Analytics Service initialized');
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    console.log('📊 Fetching platform analytics from Analos blockchain...');

    try {
      let totalMints = 0;
      let totalRevenueLOS = 0;
      let uniqueHolders = new Set<string>();
      let last24hMints = 0;
      let totalCollections = 0;
      let totalTransactions = 0;

      // Get Profile NFT data from database
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: profileNFTs } = await (supabaseAdmin as any)
            .from('profile_nfts')
            .select('wallet_address, created_at, mint_price');

          if (profileNFTs) {
            totalMints = profileNFTs.length;
            
            const now = Date.now();
            const last24h = now - 24 * 60 * 60 * 1000;

            profileNFTs.forEach((nft: any) => {
              uniqueHolders.add(nft.wallet_address);
              totalRevenueLOS += nft.mint_price || 4.20;
              
              if (new Date(nft.created_at).getTime() >= last24h) {
                last24hMints++;
              }
            });
          }

          // Get collection count
          const { data: collections } = await (supabaseAdmin as any)
            .from('saved_collections')
            .select('collection_address');
          
          totalCollections = (collections?.length || 0) + 2; // +1 for Profile NFT collection, +1 for Los Bros

        } catch (dbError) {
          console.warn('⚠️ Error fetching database analytics:', dbError);
        }
      }

      // Get blockchain transaction count
      try {
        const nftProgramId = ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE;
        const signatures = await this.connection.getSignaturesForAddress(
          nftProgramId,
          { limit: 1000 }
        );
        totalTransactions = signatures.length;
      } catch (blockchainError) {
        console.warn('⚠️ Error fetching blockchain transaction count:', blockchainError);
      }

      // Count active programs
      const activePrograms = Object.keys(ANALOS_PROGRAMS).length;

      return {
        totalMints,
        totalRevenueLOS,
        uniqueHolders: uniqueHolders.size,
        last24hMints,
        totalCollections,
        totalTransactions,
        activePrograms
      };

    } catch (error) {
      console.error('❌ Error fetching platform analytics:', error);
      return {
        totalMints: 0,
        totalRevenueLOS: 0,
        uniqueHolders: 0,
        last24hMints: 0,
        totalCollections: 0,
        totalTransactions: 0,
        activePrograms: 0
      };
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<CollectionStats[]> {
    console.log('📦 Fetching collection stats from Analos blockchain...');

    try {
      const collections: CollectionStats[] = [];

      // Get Profile NFT Collection stats
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: profileNFTs } = await (supabaseAdmin as any)
            .from('profile_nfts')
            .select('*');

          const { data: mintCounter } = await (supabaseAdmin as any)
            .from('profile_nft_mint_counter')
            .select('*')
            .limit(1)
            .single();

          if (profileNFTs) {
            // Calculate recent mints (last 24h)
            const now = Date.now();
            const last24h = now - 24 * 60 * 60 * 1000;
            const recentMints = profileNFTs.filter((nft: any) =>
              new Date(nft.created_at).getTime() >= last24h
            ).length;

            collections.push({
              name: 'Analos Profile Cards',
              totalSupply: 0, // Open edition
              currentSupply: profileNFTs.length,
              mintedPercentage: 0, // Open edition
              mintPriceUSD: 4.20, // Approximate
              isActive: true,
              mintingEnabled: true,
              programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
              collectionConfig: 'ProfileNFTCollection',
              address: 'ProfileNFTCollection',
              recentMints
            });
          }

          // Get Los Bros NFT Collection stats
          try {
            const { data: losBrosNFTs } = await (supabaseAdmin as any)
              .from('profile_nfts')
              .select('*')
              .not('los_bros_token_id', 'is', null);

            if (losBrosNFTs) {
              const now = Date.now();
              const last24h = now - 24 * 60 * 60 * 1000;
              const recentLosBrosMints = losBrosNFTs.filter((nft: any) =>
                new Date(nft.created_at).getTime() >= last24h
              ).length;

              const totalSupply = 2222;
              const currentSupply = losBrosNFTs.length;
              const mintedPercentage = (currentSupply / totalSupply) * 100;

              collections.push({
                name: 'Los Bros NFT Collection',
                totalSupply: totalSupply,
                currentSupply: currentSupply,
                mintedPercentage: mintedPercentage,
                mintPriceUSD: 4200.69, // Starting price in LOS (approximate)
                isActive: true,
                mintingEnabled: true,
                programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
                collectionConfig: 'LosBrosCollection',
                address: 'LosBrosCollection',
                recentMints: recentLosBrosMints
              });
            }
          } catch (losBrosError) {
            console.warn('⚠️ Error fetching Los Bros stats:', losBrosError);
            // Add placeholder with 0 mints
            collections.push({
              name: 'Los Bros NFT Collection',
              totalSupply: 2222,
              currentSupply: 0,
              mintedPercentage: 0,
              mintPriceUSD: 4200.69,
              isActive: true,
              mintingEnabled: true,
              programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
              collectionConfig: 'LosBrosCollection',
              address: 'LosBrosCollection',
              recentMints: 0
            });
          }

          // Get other collections from database
          const { data: otherCollections } = await (supabaseAdmin as any)
            .from('saved_collections')
            .select('*')
            .order('created_at', { ascending: false });

          if (otherCollections) {
            otherCollections.forEach((collection: any) => {
              collections.push({
                name: collection.collection_name || 'Custom Collection',
                totalSupply: collection.max_supply || 0,
                currentSupply: 0, // Would need to query blockchain
                mintedPercentage: 0,
                mintPriceUSD: collection.mint_price || 0,
                isActive: true,
                mintingEnabled: true,
                programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString(),
                collectionConfig: collection.collection_address || 'Unknown',
                address: collection.collection_address || 'Unknown',
                recentMints: 0
              });
            });
          }

        } catch (dbError) {
          console.warn('⚠️ Error fetching collection stats:', dbError);
        }
      }

      return collections;

    } catch (error) {
      console.error('❌ Error fetching collection stats:', error);
      return [];
    }
  }

  /**
   * Get program status for all Analos programs
   */
  async getProgramStatus(): Promise<ProgramStatus[]> {
    console.log('🔧 Fetching program status from Analos blockchain...');

    try {
      const programs: ProgramStatus[] = [];

      // Check each program
      const programConfigs = [
        { name: 'NFT Launchpad Core', id: ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE },
        { name: 'NFT Launchpad', id: ANALOS_PROGRAMS.NFT_LAUNCHPAD },
        { name: 'Price Oracle', id: ANALOS_PROGRAMS.PRICE_ORACLE },
        { name: 'Rarity Oracle', id: ANALOS_PROGRAMS.RARITY_ORACLE },
        { name: 'Token Launch', id: ANALOS_PROGRAMS.TOKEN_LAUNCH },
        { name: 'OTC Enhanced', id: ANALOS_PROGRAMS.OTC_ENHANCED },
        { name: 'Airdrop Enhanced', id: ANALOS_PROGRAMS.AIRDROP_ENHANCED },
        { name: 'Vesting Enhanced', id: ANALOS_PROGRAMS.VESTING_ENHANCED },
        { name: 'Token Lock Enhanced', id: ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED },
        { name: 'Monitoring System', id: ANALOS_PROGRAMS.MONITORING_SYSTEM },
      ];

      for (const config of programConfigs) {
        try {
          // Get recent signatures for this program
          const signatures = await this.connection.getSignaturesForAddress(
            config.id,
            { limit: 100 }
          );

          const isActive = signatures.length > 0;
          const lastActivity = signatures.length > 0
            ? new Date(signatures[0].blockTime! * 1000).toISOString()
            : new Date().toISOString();

          programs.push({
            name: config.name,
            programId: config.id.toString(),
            isActive,
            transactionCount: signatures.length,
            lastActivity
          });

        } catch (programError) {
          // Program might not be deployed yet or have no transactions
          programs.push({
            name: config.name,
            programId: config.id.toString(),
            isActive: false,
            transactionCount: 0,
            lastActivity: new Date().toISOString()
          });
        }
      }

      return programs;

    } catch (error) {
      console.error('❌ Error fetching program status:', error);
      return [];
    }
  }

  /**
   * Get real-time price data
   */
  async getLOSPrice(): Promise<number> {
    try {
      const response = await fetch('/api/oracle/los-price');
      if (response.ok) {
        const data = await response.json();
        return data.price || 0;
      }
    } catch (error) {
      console.warn('⚠️ Error fetching LOS price:', error);
    }
    return 0;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

