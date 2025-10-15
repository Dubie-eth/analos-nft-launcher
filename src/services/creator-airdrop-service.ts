/**
 * Creator Airdrop Service
 * Handles creator-defined airdrop campaigns with custom token/NFT requirements
 */

import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { 
  AirdropCampaign, 
  UserEligibility,
  EligibilityCriteria,
  TokenMetadata,
  NFTCollectionMetadata,
  CREATOR_AIRDROP_CONFIG,
  calculateAirdropAmount,
  isWalletEligible,
  formatTokenAmount,
  parseTokenAmount 
} from '@/config/airdrop-config';
import { ANALOS_RPC_URL, ANALOS_PROGRAMS } from '@/config/analos-programs';

export interface CreatorAirdropStats {
  totalCreatorCampaigns: number;
  activeCreatorCampaigns: number;
  totalCreatorAirdropAmount: number;
  totalCreatorClaimedAmount: number;
  platformFeeCollected: number;
  topCreators: {
    walletAddress: string;
    campaignCount: number;
    totalAirdropAmount: number;
  }[];
}


export class CreatorAirdropService {
  private connection: Connection;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(ANALOS_RPC_URL, 'confirmed');
  }

  /**
   * Get token metadata for a given mint address
   */
  async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      
      // Get mint account info
      const mintInfo = await this.connection.getParsedAccountInfo(mintPublicKey);
      
      if (!mintInfo.value?.data || typeof mintInfo.value.data === 'string') {
        return null;
      }

      const mintData = mintInfo.value.data as any;
      
      // Basic token info
      const metadata: TokenMetadata = {
        mintAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: mintData.parsed.info.decimals || 9,
        supply: mintData.parsed.info.supply || 0,
      };

      // Try to get metadata from Metaplex (simplified)
      // In a real implementation, you'd fetch from the Metaplex metadata program
      return metadata;
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return null;
    }
  }

  /**
   * Get NFT collection metadata
   */
  async getNFTCollectionMetadata(collectionAddress: string): Promise<NFTCollectionMetadata | null> {
    try {
      const collectionPublicKey = new PublicKey(collectionAddress);
      
      // In a real implementation, you'd fetch collection metadata from Metaplex
      // For now, return basic info
      return {
        collectionAddress,
        name: 'Unknown Collection',
        verified: false,
      };
    } catch (error) {
      console.error('Error getting collection metadata:', error);
      return null;
    }
  }

  /**
   * Get user's token holdings for specific mints
   */
  async getUserTokenHoldings(
    walletAddress: string, 
    mintAddresses: string[]
  ): Promise<{ [mintAddress: string]: number }> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const holdings: { [mintAddress: string]: number } = {};

      for (const mintAddress of mintAddresses) {
        try {
          const tokenAccount = await getAssociatedTokenAddress(
            new PublicKey(mintAddress),
            publicKey
          );

          const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
          holdings[mintAddress] = accountInfo.value.amount ? parseInt(accountInfo.value.amount) : 0;
        } catch (error) {
          // Token account doesn't exist
          holdings[mintAddress] = 0;
        }
      }

      return holdings;
    } catch (error) {
      console.error('Error getting user token holdings:', error);
      return {};
    }
  }

  /**
   * Get user's NFT holdings for specific collections
   */
  async getUserNFTHoldings(
    walletAddress: string, 
    collectionAddresses: string[]
  ): Promise<{ [collectionAddress: string]: number }> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const holdings: { [collectionAddress: string]: number } = {};

      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Initialize counts
      collectionAddresses.forEach(collection => {
        holdings[collection] = 0;
      });

      // Count NFTs from specified collections
      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        
        // Check if it's an NFT (supply = 1, decimals = 0)
        if (tokenInfo.tokenAmount.amount === '1' && tokenInfo.tokenAmount.decimals === 0) {
          const mintAddress = tokenInfo.mint;
          
          // Check if this NFT belongs to any of the specified collections
          // In a real implementation, you'd check the collection field in the metadata
          // For now, we'll do a simple check
          for (const collectionAddress of collectionAddresses) {
            // This is a simplified check - in reality you'd verify collection membership
            if (mintAddress === collectionAddress) {
              holdings[collectionAddress]++;
            }
          }
        }
      }

      return holdings;
    } catch (error) {
      console.error('Error getting user NFT holdings:', error);
      return {};
    }
  }

  /**
   * Calculate platform fee for a campaign
   */
  calculatePlatformFee(totalAmount: number): number {
    return Math.floor(totalAmount * (CREATOR_AIRDROP_CONFIG.PLATFORM_FEE_PERCENTAGE / 100));
  }

  /**
   * Create a new creator airdrop campaign
   */
  async createCreatorCampaign(
    campaignData: {
      name: string;
      description: string;
      type: 'holdings_based' | 'equal_share' | 'whitelist' | 'nft_based' | 'creator_defined';
      airdropToken: TokenMetadata;
      eligibility: EligibilityCriteria;
      startDate: Date;
      endDate: Date;
      totalAmount: number;
    },
    creatorWallet: string
  ): Promise<string> {
    try {
      // Validate campaign data
      if (campaignData.totalAmount < CREATOR_AIRDROP_CONFIG.MIN_AIRDROP_AMOUNT) {
        throw new Error(`Minimum airdrop amount is ${CREATOR_AIRDROP_CONFIG.MIN_AIRDROP_AMOUNT}`);
      }

      if (campaignData.totalAmount > CREATOR_AIRDROP_CONFIG.MAX_AIRDROP_AMOUNT) {
        throw new Error(`Maximum airdrop amount is ${CREATOR_AIRDROP_CONFIG.MAX_AIRDROP_AMOUNT}`);
      }

      const campaignDuration = campaignData.endDate.getTime() - campaignData.startDate.getTime();
      const maxDuration = CREATOR_AIRDROP_CONFIG.MAX_CAMPAIGN_DURATION * 24 * 60 * 60 * 1000;
      
      if (campaignDuration > maxDuration) {
        throw new Error(`Maximum campaign duration is ${CREATOR_AIRDROP_CONFIG.MAX_CAMPAIGN_DURATION} days`);
      }

      const campaignId = `creator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const platformFee = this.calculatePlatformFee(campaignData.totalAmount);
      
      const newCampaign: AirdropCampaign = {
        id: campaignId,
        name: campaignData.name,
        description: campaignData.description,
        type: campaignData.type,
        airdropToken: {
          mintAddress: campaignData.airdropToken.mintAddress,
          symbol: campaignData.airdropToken.symbol,
          name: campaignData.airdropToken.name,
          decimals: campaignData.airdropToken.decimals,
          totalAmount: campaignData.totalAmount,
          claimedAmount: 0,
        },
        creator: {
          walletAddress: creatorWallet,
          verified: false,
        },
        eligibility: campaignData.eligibility,
        startDate: campaignData.startDate,
        endDate: campaignData.endDate,
        isActive: false, // Will be activated after deposit and fee payment
        requiresDeposit: true,
        depositedAmount: 0,
        platformFee: platformFee,
        eligibleWallets: [],
        totalClaims: 0,
        uniqueClaimers: 0,
        createdAt: new Date(),
      };

      // Store campaign in localStorage (in production, this would be on-chain)
      const campaigns = this.getStoredCreatorCampaigns();
      campaigns.push(newCampaign);
      localStorage.setItem('creator_airdrop_campaigns', JSON.stringify(campaigns));

      console.log('Created creator airdrop campaign:', newCampaign);
      return campaignId;
    } catch (error) {
      console.error('Error creating creator campaign:', error);
      throw error;
    }
  }

  /**
   * Check user eligibility for a creator campaign
   */
  async checkCreatorEligibility(
    walletAddress: string,
    campaign: AirdropCampaign
  ): Promise<UserEligibility> {
    try {
      // Get required mint addresses and collection addresses
      const requiredMints = campaign.eligibility.tokenHoldings?.map(t => t.mintAddress) || [];
      const requiredCollections = campaign.eligibility.nftOwnership?.map(n => n.collectionAddress) || [];

      // Get user holdings
      const userTokenHoldings = await this.getUserTokenHoldings(walletAddress, requiredMints);
      const userNFTHoldings = await this.getUserNFTHoldings(walletAddress, requiredCollections);

      // Check eligibility
      const isEligible = isWalletEligible(walletAddress, campaign, userTokenHoldings, userNFTHoldings);
      
      // Calculate eligible amount
      const eligibleAmount = isEligible ? 
        calculateAirdropAmount(campaign, userTokenHoldings, userNFTHoldings) : 0;

      // Build requirements object
      const requirements = {
        tokenHoldings: campaign.eligibility.tokenHoldings?.map(requirement => ({
          mintAddress: requirement.mintAddress,
          amount: userTokenHoldings[requirement.mintAddress] || 0,
          meetsRequirement: (userTokenHoldings[requirement.mintAddress] || 0) >= requirement.minAmount,
        })) || [],
        nftOwnership: campaign.eligibility.nftOwnership?.map(requirement => ({
          collectionAddress: requirement.collectionAddress,
          count: userNFTHoldings[requirement.collectionAddress] || 0,
          meetsRequirement: (userNFTHoldings[requirement.collectionAddress] || 0) >= requirement.minCount,
        })) || [],
        isWhitelisted: campaign.eligibility.whitelist?.includes(walletAddress) || false,
        platformRequirements: {
          hasMinLOLHolding: true, // Simplified
          hasCreatedCollection: false, // Would need platform data
          hasStakedNFTs: false, // Would need platform data
        },
      };

      // Build eligibility details
      const passedChecks: string[] = [];
      const failedChecks: string[] = [];

      requirements.tokenHoldings.forEach((req, index) => {
        if (req.meetsRequirement) {
          passedChecks.push(`Token requirement ${index + 1}: ${req.amount} >= ${campaign.eligibility.tokenHoldings![index].minAmount}`);
        } else {
          failedChecks.push(`Token requirement ${index + 1}: ${req.amount} < ${campaign.eligibility.tokenHoldings![index].minAmount}`);
        }
      });

      requirements.nftOwnership.forEach((req, index) => {
        if (req.meetsRequirement) {
          passedChecks.push(`NFT requirement ${index + 1}: ${req.count} >= ${campaign.eligibility.nftOwnership![index].minCount}`);
        } else {
          failedChecks.push(`NFT requirement ${index + 1}: ${req.count} < ${campaign.eligibility.nftOwnership![index].minCount}`);
        }
      });

      if (requirements.isWhitelisted) {
        passedChecks.push('Whitelist requirement: User is whitelisted');
      } else if (campaign.eligibility.whitelist) {
        failedChecks.push('Whitelist requirement: User is not whitelisted');
      }

      return {
        walletAddress,
        campaignId: campaign.id,
        isEligible,
        eligibleAmount,
        claimedAmount: 0, // Would be fetched from blockchain
        remainingAmount: eligibleAmount,
        requirements,
        eligibilityDetails: {
          passedChecks,
          failedChecks,
          reason: isEligible ? undefined : failedChecks.join('; '),
        },
      };
    } catch (error) {
      console.error('Error checking creator eligibility:', error);
      throw error;
    }
  }

  /**
   * Get creator airdrop campaigns
   */
  getCreatorCampaigns(): AirdropCampaign[] {
    return this.getStoredCreatorCampaigns();
  }

  /**
   * Get creator campaigns by creator wallet
   */
  getCreatorCampaignsByWallet(creatorWallet: string): AirdropCampaign[] {
    const campaigns = this.getStoredCreatorCampaigns();
    return campaigns.filter(campaign => campaign.creator.walletAddress === creatorWallet);
  }

  /**
   * Get creator airdrop statistics
   */
  async getCreatorAirdropStats(): Promise<CreatorAirdropStats> {
    const campaigns = this.getStoredCreatorCampaigns();
    
    const totalCreatorCampaigns = campaigns.length;
    const activeCreatorCampaigns = campaigns.filter(c => c.isActive).length;
    const totalCreatorAirdropAmount = campaigns.reduce((sum, c) => sum + c.airdropToken.totalAmount, 0);
    const totalCreatorClaimedAmount = campaigns.reduce((sum, c) => sum + c.airdropToken.claimedAmount, 0);
    const platformFeeCollected = campaigns.reduce((sum, c) => sum + (c.platformFee || 0), 0);

    // Calculate top creators
    const creatorStats: { [wallet: string]: { campaignCount: number; totalAirdropAmount: number } } = {};
    
    campaigns.forEach(campaign => {
      const wallet = campaign.creator.walletAddress;
      if (!creatorStats[wallet]) {
        creatorStats[wallet] = { campaignCount: 0, totalAirdropAmount: 0 };
      }
      creatorStats[wallet].campaignCount++;
      creatorStats[wallet].totalAirdropAmount += campaign.airdropToken.totalAmount;
    });

    const topCreators = Object.entries(creatorStats)
      .map(([walletAddress, stats]) => ({ walletAddress, ...stats }))
      .sort((a, b) => b.totalAirdropAmount - a.totalAirdropAmount)
      .slice(0, 10);

    return {
      totalCreatorCampaigns,
      activeCreatorCampaigns,
      totalCreatorAirdropAmount,
      totalCreatorClaimedAmount,
      platformFeeCollected,
      topCreators,
    };
  }

  /**
   * Process platform fee payment and activate campaign
   */
  async activateCampaign(
    campaignId: string, 
    creatorWallet: string,
    tokenDepositAmount: number,
    feePaymentAmount: number
  ): Promise<string> {
    try {
      const campaigns = this.getStoredCreatorCampaigns();
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      
      if (campaignIndex === -1) {
        throw new Error('Campaign not found');
      }

      const campaign = campaigns[campaignIndex];
      
      // Validate creator ownership
      if (campaign.creator.walletAddress !== creatorWallet) {
        throw new Error('Only the campaign creator can activate this campaign');
      }

      // Validate deposit amount
      if (tokenDepositAmount < campaign.airdropToken.totalAmount) {
        throw new Error(`Deposit amount must be at least ${campaign.airdropToken.totalAmount} ${campaign.airdropToken.symbol}`);
      }

      // Validate fee payment
      if (feePaymentAmount < (campaign.platformFee || 0)) {
        throw new Error(`Platform fee must be at least ${campaign.platformFee || 0} tokens`);
      }

      // In production, this would involve actual blockchain transactions:
      // 1. Transfer tokens from creator to campaign vault
      // 2. Transfer platform fee to platform treasury
      // 3. Activate campaign on-chain

      console.log(`Activating campaign ${campaignId}:`);
      console.log(`- Token deposit: ${tokenDepositAmount} ${campaign.airdropToken.symbol}`);
      console.log(`- Platform fee: ${feePaymentAmount} tokens`);
      console.log(`- Campaign vault: ${campaign.airdropToken.totalAmount} ${campaign.airdropToken.symbol}`);

      // Update campaign status
      campaigns[campaignIndex].isActive = true;
      campaigns[campaignIndex].depositedAmount = tokenDepositAmount;
      campaigns[campaignIndex].updatedAt = new Date();

      // Store updated campaigns
      localStorage.setItem('creator_airdrop_campaigns', JSON.stringify(campaigns));

      // Record fee collection (in production, this would be on-chain)
      this.recordFeeCollection(campaignId, feePaymentAmount, creatorWallet);

      console.log('Campaign activated successfully:', campaignId);
      return `activation_tx_${Date.now()}`;
    } catch (error) {
      console.error('Error activating campaign:', error);
      throw error;
    }
  }

  /**
   * Record platform fee collection
   */
  private recordFeeCollection(campaignId: string, amount: number, creatorWallet: string): void {
    try {
      const feeRecords = this.getStoredFeeRecords();
      const feeRecord = {
        id: `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        amount,
        creatorWallet,
        timestamp: new Date(),
        status: 'collected',
      };
      
      feeRecords.push(feeRecord);
      localStorage.setItem('platform_fee_records', JSON.stringify(feeRecords));
      
      console.log('Platform fee recorded:', feeRecord);
    } catch (error) {
      console.error('Error recording fee collection:', error);
    }
  }

  /**
   * Get platform fee collection records
   */
  getFeeRecords(): any[] {
    return this.getStoredFeeRecords();
  }

  /**
   * Get platform fee statistics
   */
  getPlatformFeeStats(): {
    totalFeesCollected: number;
    totalCampaigns: number;
    averageFeePerCampaign: number;
    monthlyRevenue: { [month: string]: number };
  } {
    const feeRecords = this.getStoredFeeRecords();
    const campaigns = this.getStoredCreatorCampaigns();
    
    const totalFeesCollected = feeRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalCampaigns = campaigns.filter(c => c.isActive).length;
    const averageFeePerCampaign = totalCampaigns > 0 ? totalFeesCollected / totalCampaigns : 0;
    
    // Calculate monthly revenue
    const monthlyRevenue: { [month: string]: number } = {};
    feeRecords.forEach(record => {
      const month = record.timestamp.toISOString().substring(0, 7); // YYYY-MM format
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + record.amount;
    });

    return {
      totalFeesCollected,
      totalCampaigns,
      averageFeePerCampaign,
      monthlyRevenue,
    };
  }

  /**
   * Get stored creator campaigns from localStorage
   */
  private getStoredCreatorCampaigns(): AirdropCampaign[] {
    try {
      const stored = localStorage.getItem('creator_airdrop_campaigns');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading creator campaigns:', error);
      return [];
    }
  }

  /**
   * Get stored fee records from localStorage
   */
  private getStoredFeeRecords(): any[] {
    try {
      const stored = localStorage.getItem('platform_fee_records');
      return stored ? JSON.parse(stored).map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      })) : [];
    } catch (error) {
      console.error('Error loading fee records:', error);
      return [];
    }
  }
}

// Export singleton instance
export const creatorAirdropService = new CreatorAirdropService();
