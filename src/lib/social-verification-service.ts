/**
 * SOCIAL VERIFICATION SERVICE
 * Integrates with Supabase database for social media verification
 */

import { supabase, isSupabaseConfigured } from './supabase/client';
import { 
  SocialAccount, 
  SocialVerificationRequest, 
  SocialVerificationConfig, 
  VerificationEligibility,
  UserProfile 
} from './database/types';

export class SocialVerificationService {
  
  /**
   * Start verification process for a wallet
   */
  async startVerification(
    walletAddress: string, 
    socialAccounts: Omit<SocialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<SocialVerificationRequest> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    try {
      // Create verification request
      const { data: request, error: requestError } = await supabase
        .from('social_verification_requests')
        .insert({
          wallet_address: walletAddress,
          status: 'pending',
          total_score: 0,
          required_score: 10,
          verification_count: 0
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Add social accounts
      const accountsWithRequestId = socialAccounts.map(account => ({
        ...account,
        request_id: request.id,
        verification_score: this.calculatePlatformScore(
          account.platform, 
          account.followerCount, 
          account.isVerifiedPlatform
        )
      }));

      const { data: accounts, error: accountsError } = await supabase
        .from('user_social_accounts')
        .insert(accountsWithRequestId.map(({ request_id, verification_score, ...account }) => account))
        .select();

      if (accountsError) throw accountsError;

      // Link accounts to request
      const linkData = accounts.map((account, index) => ({
        request_id: request.id,
        social_account_id: account.id,
        verification_score: accountsWithRequestId[index].verification_score
      }));

      const { error: linkError } = await supabase
        .from('verification_request_accounts')
        .insert(linkData);

      if (linkError) throw linkError;

      // Calculate total score
      const totalScore = accountsWithRequestId.reduce((sum, acc) => sum + acc.verification_score, 0);
      
      // Update request with calculated score
      const { data: updatedRequest, error: updateError } = await supabase
        .from('social_verification_requests')
        .update({
          total_score: totalScore,
          verification_count: accounts.length,
          status: totalScore >= 10 ? 'completed' : 'pending'
        })
        .eq('id', request.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        id: updatedRequest.id,
        walletAddress: updatedRequest.wallet_address,
        status: updatedRequest.status,
        totalScore: updatedRequest.total_score,
        requiredScore: updatedRequest.required_score,
        verificationCount: updatedRequest.verification_count,
        createdAt: new Date(updatedRequest.created_at),
        updatedAt: new Date(updatedRequest.updated_at),
        completedAt: updatedRequest.completed_at ? new Date(updatedRequest.completed_at) : undefined,
        socialAccounts: accounts.map(account => ({
          id: account.id,
          userId: account.user_id,
          walletAddress: account.wallet_address,
          platform: account.platform,
          username: account.username,
          userIdPlatform: account.user_id_platform,
          displayName: account.display_name,
          followerCount: account.follower_count,
          isVerifiedPlatform: account.is_verified_platform,
          profilePictureUrl: account.profile_picture_url,
          verificationStatus: account.verification_status,
          verificationMethod: account.verification_method,
          verificationCode: account.verification_code,
          verificationHash: account.verification_hash,
          verificationSignature: account.verification_signature,
          verifiedAt: account.verified_at ? new Date(account.verified_at) : undefined,
          expiresAt: account.expires_at ? new Date(account.expires_at) : undefined,
          createdAt: new Date(account.created_at),
          updatedAt: new Date(account.updated_at)
        }))
      };

    } catch (error) {
      console.error('❌ Error starting verification:', error);
      throw error;
    }
  }

  /**
   * Verify a social account manually
   */
  async verifySocialAccount(
    accountId: string, 
    verificationCode: string, 
    adminId?: string
  ): Promise<SocialAccount> {
    try {
      const { data: account, error } = await supabase
        .from('user_social_accounts')
        .update({
          verification_status: 'verified',
          verification_code: verificationCode,
          verified_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      // Log verification action
      await supabase
        .from('social_verification_audit')
        .insert({
          social_account_id: accountId,
          wallet_address: account.wallet_address,
          action: 'verify',
          previous_status: 'pending',
          new_status: 'verified',
          admin_id: adminId
        });

      return this.mapAccountFromDb(account);

    } catch (error) {
      console.error('❌ Error verifying account:', error);
      throw error;
    }
  }

  /**
   * Revoke social verification
   */
  async revokeVerification(
    accountId: string, 
    reason: string, 
    adminId: string
  ): Promise<void> {
    try {
      const { data: account, error: fetchError } = await supabase
        .from('user_social_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('user_social_accounts')
        .update({
          verification_status: 'revoked'
        })
        .eq('id', accountId);

      if (updateError) throw updateError;

      // Log revocation
      await supabase
        .from('social_verification_audit')
        .insert({
          social_account_id: accountId,
          wallet_address: account.wallet_address,
          action: 'revoke',
          previous_status: account.verification_status,
          new_status: 'revoked',
          admin_id: adminId,
          reason: reason
        });

    } catch (error) {
      console.error('❌ Error revoking verification:', error);
      throw error;
    }
  }

  /**
   * Check verification eligibility for a wallet
   */
  async checkVerificationEligibility(walletAddress: string): Promise<VerificationEligibility> {
    try {
      const { data, error } = await supabase
        .rpc('check_verification_eligibility', { wallet_addr: walletAddress });

      if (error) throw error;

      const result = data[0];
      
      // Get missing requirements
      const missingRequirements: string[] = [];
      if (result.current_score < result.required_score) {
        missingRequirements.push(`Need ${result.required_score - result.current_score} more verification points`);
      }
      if (result.verified_accounts === 0) {
        missingRequirements.push('No verified social accounts');
      }

      return {
        eligible: result.eligible,
        currentScore: result.current_score,
        requiredScore: result.required_score,
        verifiedAccounts: result.verified_accounts,
        totalAccounts: result.total_accounts,
        missingRequirements
      };

    } catch (error) {
      console.error('❌ Error checking eligibility:', error);
      throw error;
    }
  }

  /**
   * Get all social accounts for a wallet
   */
  async getWalletSocialAccounts(walletAddress: string): Promise<SocialAccount[]> {
    try {
      const { data, error } = await supabase
        .from('user_social_accounts')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(account => this.mapAccountFromDb(account));

    } catch (error) {
      console.error('❌ Error getting social accounts:', error);
      throw error;
    }
  }

  /**
   * Get verification configurations for a collection
   */
  async getVerificationConfigs(collectionId: string): Promise<SocialVerificationConfig[]> {
    try {
      const { data, error } = await supabase
        .from('social_verification_configs')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('is_active', true);

      if (error) throw error;

      return data.map(config => ({
        id: config.id,
        collectionId: config.collection_id,
        platform: config.platform,
        officialHandle: config.official_handle,
        verificationMethod: config.verification_method,
        oracleAuthority: config.oracle_authority,
        verificationCodePrefix: config.verification_code_prefix,
        expirationDays: config.expiration_days,
        isActive: config.is_active,
        minimumFollowers: config.minimum_followers,
        requiredScore: config.required_score,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at)
      }));

    } catch (error) {
      console.error('❌ Error getting verification configs:', error);
      throw error;
    }
  }

  /**
   * Update user profile with verification score
   */
  async updateUserVerificationScore(walletAddress: string): Promise<UserProfile | null> {
    try {
      const eligibility = await this.checkVerificationEligibility(walletAddress);
      
      // Update user's verification level
      const { data: user, error } = await supabase
        .from('users')
        .update({
          verification_level: eligibility.eligible ? 'verified' : 'basic',
          is_verified: eligibility.eligible
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) throw error;

      // Get social accounts for the user
      const socialAccounts = await this.getWalletSocialAccounts(walletAddress);

      return {
        id: user.id,
        walletAddress: user.wallet_address,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profile_picture_url,
        bannerImage: user.banner_image_url,
        socials: user.socials,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
        lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
        isVerified: eligibility.eligible,
        verificationLevel: eligibility.eligible ? 'verified' : 'basic',
        verificationScore: eligibility.currentScore,
        verifiedSocialAccounts: socialAccounts.filter(acc => acc.verificationStatus === 'verified')
      };

    } catch (error) {
      console.error('❌ Error updating verification score:', error);
      throw error;
    }
  }

  /**
   * Calculate platform-specific verification score
   */
  private calculatePlatformScore(
    platform: SocialAccount['platform'], 
    followerCount: number, 
    isVerified: boolean
  ): number {
    const scores = {
      twitter: { verified: 50, base: 25, followerDivisor: isVerified ? 1000 : 2000 },
      telegram: { verified: 30, base: 20, followerDivisor: isVerified ? 2000 : 3000 },
      discord: { verified: 25, base: 15, followerDivisor: isVerified ? 3000 : 4000 },
      instagram: { verified: 40, base: 20, followerDivisor: isVerified ? 1500 : 2500 },
      youtube: { verified: 60, base: 30, followerDivisor: isVerified ? 500 : 1000 },
      tiktok: { verified: 35, base: 20, followerDivisor: isVerified ? 1000 : 2000 },
      github: { verified: 45, base: 15, followerDivisor: isVerified ? 100 : 200 }
    };

    const config = scores[platform] || { verified: 10, base: 10, followerDivisor: 1000 };
    const baseScore = isVerified ? config.verified : config.base;
    const followerBonus = Math.min(followerCount / config.followerDivisor, config.verified - config.base);
    
    return Math.round(baseScore + followerBonus);
  }

  /**
   * Map database account to interface
   */
  private mapAccountFromDb(dbAccount: any): SocialAccount {
    return {
      id: dbAccount.id,
      userId: dbAccount.user_id,
      walletAddress: dbAccount.wallet_address,
      platform: dbAccount.platform,
      username: dbAccount.username,
      userIdPlatform: dbAccount.user_id_platform,
      displayName: dbAccount.display_name,
      followerCount: dbAccount.follower_count,
      isVerifiedPlatform: dbAccount.is_verified_platform,
      profilePictureUrl: dbAccount.profile_picture_url,
      verificationStatus: dbAccount.verification_status,
      verificationMethod: dbAccount.verification_method,
      verificationCode: dbAccount.verification_code,
      verificationHash: dbAccount.verification_hash,
      verificationSignature: dbAccount.verification_signature,
      verifiedAt: dbAccount.verified_at ? new Date(dbAccount.verified_at) : undefined,
      expiresAt: dbAccount.expires_at ? new Date(dbAccount.expires_at) : undefined,
      createdAt: new Date(dbAccount.created_at),
      updatedAt: new Date(dbAccount.updated_at)
    };
  }

  /**
   * Generate verification code
   */
  generateVerificationCode(platform: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `ANALOS_${platform.toUpperCase()}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get all verification requests (admin only)
   */
  async getAllVerificationRequests(): Promise<SocialVerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('social_verification_requests')
        .select(`
          *,
          user_social_accounts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(request => ({
        id: request.id,
        walletAddress: request.wallet_address,
        status: request.status,
        totalScore: request.total_score,
        requiredScore: request.required_score,
        verificationCount: request.verification_count,
        createdAt: new Date(request.created_at),
        updatedAt: new Date(request.updated_at),
        completedAt: request.completed_at ? new Date(request.completed_at) : undefined,
        socialAccounts: request.user_social_accounts.map((account: any) => this.mapAccountFromDb(account))
      }));

    } catch (error) {
      console.error('❌ Error getting all verification requests:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const socialVerificationService = new SocialVerificationService();
