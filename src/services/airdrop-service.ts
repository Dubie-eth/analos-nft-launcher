/**
 * Airdrop Service
 * Handles LOL token airdrops with whitelist support and multiple distribution methods
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
  LOL_TOKEN, 
  AirdropCampaign, 
  UserEligibility,
  calculateAirdropAmount,
  isWalletEligible,
  formatTokenAmount,
  parseTokenAmount 
} from '@/config/airdrop-config';
import { ANALOS_RPC_URL, ANALOS_PROGRAMS } from '@/config/analos-programs';

export interface AirdropClaim {
  campaignId: string;
  walletAddress: string;
  amount: number;
  merkleProof?: string[];
  signature?: string;
  timestamp: Date;
}

export interface AirdropStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalAirdropAmount: number;
  totalClaimedAmount: number;
  totalEligibleWallets: number;
  totalClaimedWallets: number;
}

export class AirdropService {
  private connection: Connection;
  private adminWallet: Keypair | null = null;

  constructor(connection?: Connection) {
    // Configure connection for Analos network with extended timeouts
    this.connection = connection || new Connection(ANALOS_RPC_URL, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
      confirmTransactionTimeout: 120000, // 2 minutes for Analos network
    });
    
    // Force disable WebSocket to prevent connection issues
    (this.connection as any)._rpcWebSocket = null;
    (this.connection as any)._rpcWebSocketConnected = false;
  }

  /**
   * Set admin wallet for airdrop management
   */
  setAdminWallet(wallet: Keypair) {
    this.adminWallet = wallet;
  }

  /**
   * Get LOL token balance for a wallet
   */
  async getLOLBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        LOL_TOKEN.MINT_ADDRESS,
        publicKey
      );

      const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
      return accountInfo.value.amount ? parseInt(accountInfo.value.amount) : 0;
    } catch (error) {
      console.error('Error getting LOL balance:', error);
      return 0;
    }
  }

  /**
   * Check if wallet has required NFTs
   */
  async getWalletNFTs(walletAddress: string): Promise<string[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get all token accounts for the wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const nftCollections: string[] = [];
      
      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        
        // Check if it's an NFT (supply = 1, decimals = 0)
        if (tokenInfo.tokenAmount.amount === '1' && tokenInfo.tokenAmount.decimals === 0) {
          nftCollections.push(tokenInfo.mint);
        }
      }

      return nftCollections;
    } catch (error) {
      console.error('Error getting wallet NFTs:', error);
      return [];
    }
  }

  /**
   * Check user eligibility for a specific campaign
   */
  async checkEligibility(
    walletAddress: string,
    campaign: AirdropCampaign
  ): Promise<UserEligibility> {
    // Get required mint addresses and collection addresses
    const requiredMints = campaign.eligibility.tokenHoldings?.map(t => t.mintAddress) || [];
    const requiredCollections = campaign.eligibility.nftOwnership?.map(n => n.collectionAddress) || [];

    // Get user holdings
    const userTokenHoldings: { [mintAddress: string]: number } = {};
    const userNFTHoldings: { [collectionAddress: string]: number } = {};

    // Get LOL balance for platform campaigns
    if (campaign.type !== 'creator_defined') {
      const lolBalance = await this.getLOLBalance(walletAddress);
      userTokenHoldings[LOL_TOKEN.MINT_ADDRESS.toString()] = lolBalance;
    }

    // Get token holdings for required mints
    for (const mintAddress of requiredMints) {
      try {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccount = await getAssociatedTokenAddress(
          new PublicKey(mintAddress),
          publicKey
        );
        const accountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
        userTokenHoldings[mintAddress] = accountInfo.value.amount ? parseInt(accountInfo.value.amount) : 0;
      } catch (error) {
        userTokenHoldings[mintAddress] = 0;
      }
    }

    // Get NFT holdings for required collections
    for (const collectionAddress of requiredCollections) {
      userNFTHoldings[collectionAddress] = 1; // Simplified - would need proper NFT collection verification
    }

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
  }

  /**
   * Create a new airdrop campaign (admin only)
   */
  async createCampaign(campaign: Omit<AirdropCampaign, 'id' | 'createdAt' | 'creator'>): Promise<string> {
    if (!this.adminWallet) {
      throw new Error('Admin wallet not set');
    }

    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCampaign: AirdropCampaign = {
      ...campaign,
      id: campaignId,
      createdAt: new Date(),
      creator: {
        walletAddress: this.adminWallet.publicKey.toString(),
        name: 'Analos Platform',
        verified: true,
      },
    };

    // Store campaign in localStorage (in production, this would be on-chain)
    const campaigns = this.getStoredCampaigns();
    campaigns.push(newCampaign);
    localStorage.setItem('airdrop_campaigns', JSON.stringify(campaigns));

    console.log('Created airdrop campaign:', newCampaign);
    return campaignId;
  }

  /**
   * Update campaign whitelist (admin only)
   */
  async updateWhitelist(campaignId: string, whitelist: string[]): Promise<void> {
    if (!this.adminWallet) {
      throw new Error('Admin wallet not set');
    }

    const campaigns = this.getStoredCampaigns();
    const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
    
    if (campaignIndex === -1) {
      throw new Error('Campaign not found');
    }

    campaigns[campaignIndex].eligibility.whitelist = whitelist;
    localStorage.setItem('airdrop_campaigns', JSON.stringify(campaigns));

    console.log('Updated whitelist for campaign:', campaignId, whitelist);
  }

  /**
   * Claim airdrop tokens
   */
  async claimAirdrop(
    walletAddress: string,
    campaignId: string,
    amount: number
  ): Promise<string> {
    try {
      const campaign = this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check eligibility
      const eligibility = await this.checkEligibility(walletAddress, campaign);
      if (!eligibility.isEligible || eligibility.eligibleAmount < amount) {
        throw new Error('Not eligible for this airdrop');
      }

      // Check if already claimed
      const claims = this.getStoredClaims();
      const existingClaim = claims.find(
        c => c.campaignId === campaignId && c.walletAddress === walletAddress
      );
      
      if (existingClaim) {
        throw new Error('Already claimed');
      }

      // Simulate claim (in production, this would be an actual blockchain transaction)
      const claim: AirdropClaim = {
        campaignId,
        walletAddress,
        amount,
        timestamp: new Date(),
      };

      claims.push(claim);
      localStorage.setItem('airdrop_claims', JSON.stringify(claims));

      // Update campaign claimed amount
      const campaigns = this.getStoredCampaigns();
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex !== -1) {
        campaigns[campaignIndex].airdropToken.claimedAmount += amount;
        campaigns[campaignIndex].totalClaims += 1;
        localStorage.setItem('airdrop_campaigns', JSON.stringify(campaigns));
      }

      console.log('Airdrop claimed:', claim);
      return 'simulated_tx_signature_' + Date.now();
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      throw error;
    }
  }

  /**
   * Get all airdrop campaigns
   */
  getCampaigns(): AirdropCampaign[] {
    return this.getStoredCampaigns();
  }

  /**
   * Get specific campaign
   */
  getCampaign(campaignId: string): AirdropCampaign | null {
    const campaigns = this.getStoredCampaigns();
    return campaigns.find(c => c.id === campaignId) || null;
  }

  /**
   * Get user's claims
   */
  getUserClaims(walletAddress: string): AirdropClaim[] {
    const claims = this.getStoredClaims();
    return claims.filter(c => c.walletAddress === walletAddress);
  }

  /**
   * Get airdrop statistics
   */
  async getAirdropStats(): Promise<AirdropStats> {
    const campaigns = this.getStoredCampaigns();
    const claims = this.getStoredClaims();

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.isActive).length;
    const totalAirdropAmount = campaigns.reduce((sum, c) => sum + c.airdropToken.totalAmount, 0);
    const totalClaimedAmount = campaigns.reduce((sum, c) => sum + c.airdropToken.claimedAmount, 0);
    
    const uniqueWallets = new Set(claims.map(c => c.walletAddress));
    const totalClaimedWallets = uniqueWallets.size;

    return {
      totalCampaigns,
      activeCampaigns,
      totalAirdropAmount,
      totalClaimedAmount,
      totalEligibleWallets: 0, // Would be calculated based on eligibility
      totalClaimedWallets,
    };
  }

  /**
   * Get stored campaigns from localStorage
   */
  private getStoredCampaigns(): AirdropCampaign[] {
    try {
      const stored = localStorage.getItem('airdrop_campaigns');
      if (!stored) {
        // Initialize with default campaigns
        const defaultCampaigns = require('@/config/airdrop-config').DEFAULT_CAMPAIGNS;
        localStorage.setItem('airdrop_campaigns', JSON.stringify(defaultCampaigns));
        return defaultCampaigns;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return [];
    }
  }

  /**
   * Get stored claims from localStorage
   */
  private getStoredClaims(): AirdropClaim[] {
    try {
      const stored = localStorage.getItem('airdrop_claims');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading claims:', error);
      return [];
    }
  }

  /**
   * Initialize default campaigns if none exist
   */
  initializeDefaultCampaigns(): void {
    const campaigns = this.getStoredCampaigns();
    if (campaigns.length === 0) {
      const defaultCampaigns = require('@/config/airdrop-config').DEFAULT_CAMPAIGNS;
      localStorage.setItem('airdrop_campaigns', JSON.stringify(defaultCampaigns));
    }
  }
}

// Export singleton instance
export const airdropService = new AirdropService();
