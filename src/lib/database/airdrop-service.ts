/**
 * DATABASE-BACKED AIRDROP SERVICE
 * Secure airdrop campaign management with database persistence
 */

import { supabase, supabaseAdmin, isSupabaseConfigured } from '../supabase/client';

export interface AirdropCampaign {
  id: string;
  name: string;
  description: string;
  tokenMint: string;
  tokenSymbol: string;
  totalAmount: number;
  claimedAmount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  eligibility: {
    tokenHoldings: { mintAddress: string; minimumAmount: number }[];
    nftOwnership: { collectionAddress: string; minimumCount: number }[];
    whitelist: string[];
    platformRequirements: {
      minimumLOLHoldings: number;
      socialVerificationRequired: boolean;
    };
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirdropClaim {
  id: string;
  campaignId: string;
  walletAddress: string;
  amount: number;
  claimedAt: Date;
  transactionHash?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface UserEligibility {
  isEligible: boolean;
  tokenHoldings: { mintAddress: string; amount: number; meetsRequirement: boolean }[];
  nftOwnership: { collectionAddress: string; count: number; meetsRequirement: boolean }[];
  isWhitelisted: boolean;
  platformRequirements: {
    lolHoldings: number;
    meetsLOLRequirement: boolean;
    hasSocialVerification: boolean;
    meetsSocialRequirement: boolean;
  };
  totalEligibleAmount: number;
}

export class DatabaseAirdropService {
  
  /**
   * Create a new airdrop campaign
   */
  async createCampaign(campaign: Omit<AirdropCampaign, 'id' | 'createdAt' | 'updatedAt' | 'claimedAmount'>): Promise<AirdropCampaign> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const campaignData = {
      name: campaign.name,
      description: campaign.description,
      token_mint: campaign.tokenMint,
      token_symbol: campaign.tokenSymbol,
      total_amount: campaign.totalAmount,
      claimed_amount: 0,
      is_active: campaign.isActive,
      start_date: campaign.startDate.toISOString(),
      end_date: campaign.endDate.toISOString(),
      eligibility: campaign.eligibility,
      created_by: campaign.createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('airdrop_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) throw error;

    return this.mapCampaignRow(data);
  }

  /**
   * Get all airdrop campaigns
   */
  async getCampaigns(): Promise<AirdropCampaign[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('airdrop_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(row => this.mapCampaignRow(row));
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<AirdropCampaign | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('airdrop_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapCampaignRow(data);
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<AirdropCampaign>): Promise<AirdropCampaign> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.eligibility) updateData.eligibility = updates.eligibility;
    if (updates.startDate) updateData.start_date = updates.startDate.toISOString();
    if (updates.endDate) updateData.end_date = updates.endDate.toISOString();

    const { data, error } = await supabaseAdmin
      .from('airdrop_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;

    return this.mapCampaignRow(data);
  }

  /**
   * Check user eligibility for a campaign
   */
  async checkUserEligibility(campaignId: string, walletAddress: string): Promise<UserEligibility> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check token holdings
    const tokenHoldings = await Promise.all(
      campaign.eligibility.tokenHoldings.map(async (requirement) => {
        // This would integrate with your token balance checking logic
        const balance = await this.getTokenBalance(walletAddress, requirement.mintAddress);
        return {
          mintAddress: requirement.mintAddress,
          amount: balance,
          meetsRequirement: balance >= requirement.minimumAmount
        };
      })
    );

    // Check NFT ownership
    const nftOwnership = await Promise.all(
      campaign.eligibility.nftOwnership.map(async (requirement) => {
        // This would integrate with your NFT ownership checking logic
        const count = await this.getNFTOwnershipCount(walletAddress, requirement.collectionAddress);
        return {
          collectionAddress: requirement.collectionAddress,
          count: count,
          meetsRequirement: count >= requirement.minimumCount
        };
      })
    );

    // Check whitelist
    const isWhitelisted = campaign.eligibility.whitelist.includes(walletAddress);

    // Check platform requirements
    const lolBalance = await this.getTokenBalance(walletAddress, 'LOL_TOKEN_MINT'); // Replace with actual LOL token mint
    const hasSocialVerification = await this.hasSocialVerification(walletAddress);

    const platformRequirements = {
      lolHoldings: lolBalance,
      meetsLOLRequirement: lolBalance >= campaign.eligibility.platformRequirements.minimumLOLHoldings,
      hasSocialVerification: hasSocialVerification,
      meetsSocialRequirement: campaign.eligibility.platformRequirements.socialVerificationRequired ? hasSocialVerification : true
    };

    // Calculate total eligible amount based on NFT rarity (if applicable)
    const totalEligibleAmount = await this.calculateEligibleAmount(walletAddress, campaign);

    const isEligible = (
      tokenHoldings.every(h => h.meetsRequirement) &&
      nftOwnership.every(o => o.meetsRequirement) &&
      (campaign.eligibility.whitelist.length === 0 || isWhitelisted) &&
      platformRequirements.meetsLOLRequirement &&
      platformRequirements.meetsSocialRequirement
    );

    return {
      isEligible,
      tokenHoldings,
      nftOwnership,
      isWhitelisted,
      platformRequirements,
      totalEligibleAmount
    };
  }

  /**
   * Claim airdrop tokens
   */
  async claimAirdrop(campaignId: string, walletAddress: string, amount: number): Promise<AirdropClaim> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    // Check eligibility
    const eligibility = await this.checkUserEligibility(campaignId, walletAddress);
    if (!eligibility.isEligible) {
      throw new Error('User is not eligible for this airdrop');
    }

    // Check if already claimed
    const existingClaim = await this.getUserClaim(campaignId, walletAddress);
    if (existingClaim) {
      throw new Error('Airdrop already claimed');
    }

    // Create claim record
    const claimData = {
      campaign_id: campaignId,
      wallet_address: walletAddress,
      amount: amount,
      claimed_at: new Date().toISOString(),
      status: 'pending'
    };

    const { data: claim, error: claimError } = await supabaseAdmin
      .from('airdrop_claims')
      .insert(claimData)
      .select()
      .single();

    if (claimError) throw claimError;

    // Update campaign claimed amount
    await supabaseAdmin
      .from('airdrop_campaigns')
      .update({
        claimed_amount: supabase.raw('claimed_amount + ?', [amount]),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Award activity points for claiming
    await supabaseAdmin.rpc('increment_activity_points', {
      user_wallet: walletAddress,
      points: Math.floor(amount / 100) // 1 point per 100 tokens claimed
    });

    return this.mapClaimRow(claim);
  }

  /**
   * Get user's claim for a campaign
   */
  async getUserClaim(campaignId: string, walletAddress: string): Promise<AirdropClaim | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('airdrop_claims')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapClaimRow(data);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<{
    totalClaims: number;
    uniqueClaimers: number;
    totalClaimedAmount: number;
    remainingAmount: number;
  }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('airdrop_claims')
      .select('amount, wallet_address')
      .eq('campaign_id', campaignId)
      .eq('status', 'completed');

    if (error) throw error;

    const totalClaims = data.length;
    const uniqueClaimers = new Set(data.map(c => c.wallet_address)).size;
    const totalClaimedAmount = data.reduce((sum, c) => sum + c.amount, 0);

    const campaign = await this.getCampaign(campaignId);
    const remainingAmount = campaign ? campaign.totalAmount - totalClaimedAmount : 0;

    return {
      totalClaims,
      uniqueClaimers,
      totalClaimedAmount,
      remainingAmount
    };
  }

  private mapCampaignRow(row: any): AirdropCampaign {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tokenMint: row.token_mint,
      tokenSymbol: row.token_symbol,
      totalAmount: row.total_amount,
      claimedAmount: row.claimed_amount,
      isActive: row.is_active,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      eligibility: row.eligibility,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapClaimRow(row: any): AirdropClaim {
    return {
      id: row.id,
      campaignId: row.campaign_id,
      walletAddress: row.wallet_address,
      amount: row.amount,
      claimedAt: new Date(row.claimed_at),
      transactionHash: row.transaction_hash,
      status: row.status
    };
  }

  private async getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
    // This would integrate with your token balance checking logic
    // For now, return a mock value
    return 1000;
  }

  private async getNFTOwnershipCount(walletAddress: string, collectionAddress: string): Promise<number> {
    // This would integrate with your NFT ownership checking logic
    // For now, return a mock value
    return 1;
  }

  private async hasSocialVerification(walletAddress: string): Promise<boolean> {
    // This would integrate with your social verification logic
    // For now, return a mock value
    return true;
  }

  private async calculateEligibleAmount(walletAddress: string, campaign: AirdropCampaign): Promise<number> {
    // This would calculate based on NFT rarity and other factors
    // For now, return a mock value
    return 1000;
  }
}

// Export singleton instance
export const databaseAirdropService = new DatabaseAirdropService();
