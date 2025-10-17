/**
 * PAGE ACCESS DATABASE SERVICE
 * Secure database operations for page locking and access control
 */

import { supabase, supabaseAdmin, isSupabaseConfigured } from '../supabase/client';

export interface PageAccessConfig {
  id: string;
  pagePath: string;
  pageName: string;
  description?: string;
  requiredLevel: string;
  adminOnly: boolean;
  publicAccess: boolean;
  isLocked: boolean;
  customMessage?: string;
  allowPublicAccess: boolean;
  requireVerification: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  walletAddressHash: string;
  username: string;
  bio?: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  socials: Record<string, any>;
  favoriteCollections: string[];
  description?: string;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  referralPoints: number;
  activityPoints: number;
  totalPoints: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isVerified: boolean;
  verificationLevel: string;
  isActive: boolean;
  privacyLevel: string;
  allowDataExport: boolean;
  allowAnalytics: boolean;
}

export interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  username: string;
  totalPoints: number;
  referralPoints: number;
  activityPoints: number;
  rank: number;
  lastUpdated: Date;
}

export interface ReferralTracking {
  id: string;
  referrerWallet: string;
  referredWallet: string;
  referralCode: string;
  pointsAwarded: number;
  createdAt: Date;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  walletAddress: string;
  activityType: string;
  pointsAwarded: number;
  description?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class PageAccessService {
  
  /**
   * Get all page access configurations
   */
  async getPageAccessConfigs(): Promise<PageAccessConfig[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (supabase
      .from('page_access_configs') as any)
      .select('*')
      .order('page_path') as { data: any; error: any };

    if (error) throw error;

    return data.map((row: any) => ({
      id: row.id,
      pagePath: row.page_path,
      pageName: row.page_name,
      description: row.description,
      requiredLevel: row.required_level,
      adminOnly: row.admin_only,
      publicAccess: row.public_access,
      isLocked: row.is_locked,
      customMessage: row.custom_message,
      allowPublicAccess: row.allow_public_access,
      requireVerification: row.require_verification,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      updatedBy: row.updated_by
    }));
  }

  /**
   * Get page access configuration for a specific page
   */
  async getPageAccessConfig(pagePath: string): Promise<PageAccessConfig | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (supabase
      .from('page_access_configs') as any)
      .select('*')
      .eq('page_path', pagePath)
      .single() as { data: any; error: any };

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return {
      id: data.id,
      pagePath: data.page_path,
      pageName: data.page_name,
      description: data.description,
      requiredLevel: data.required_level,
      adminOnly: data.admin_only,
      publicAccess: data.public_access,
      isLocked: data.is_locked,
      customMessage: data.custom_message,
      allowPublicAccess: data.allow_public_access,
      requireVerification: data.require_verification,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by
    };
  }

  /**
   * Update page lock status
   */
  async updatePageLock(pagePath: string, isLocked: boolean, updatedBy: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (supabaseAdmin
      .from('page_access_configs') as any)
      .update({
        is_locked: isLocked,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('page_path', pagePath);

    if (error) throw error;
  }

  /**
   * Update page access level
   */
  async updatePageAccessLevel(pagePath: string, requiredLevel: string, updatedBy: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (supabaseAdmin
      .from('page_access_configs') as any)
      .update({
        required_level: requiredLevel,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('page_path', pagePath);

    if (error) throw error;
  }

  /**
   * Update page custom message
   */
  async updatePageCustomMessage(pagePath: string, customMessage: string, updatedBy: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (supabaseAdmin
      .from('page_access_configs') as any)
      .update({
        custom_message: customMessage,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('page_path', pagePath);

    if (error) throw error;
  }

  /**
   * Lock all pages (emergency function)
   */
  async lockAllPages(updatedBy: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (supabaseAdmin
      .from('page_access_configs') as any)
      .update({
        is_locked: true,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .not('page_path', 'in', '("/", "/beta-signup", "/how-it-works")');

    if (error) throw error;
  }

  /**
   * Unlock all pages
   */
  async unlockAllPages(updatedBy: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await (supabaseAdmin
      .from('page_access_configs') as any)
      .update({
        is_locked: false,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }
}

export class UserProfileService {
  
  /**
   * Get user profile by wallet address
   */
  async getUserProfile(walletAddress: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .select('*')
      .eq('wallet_address', walletAddress)
      .single() as { data: any; error: any };

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapUserProfile(data);
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profile: Partial<UserProfile>, walletAddress: string): Promise<UserProfile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const profileData = {
      wallet_address: walletAddress,
      wallet_address_hash: this.hashWalletAddress(walletAddress),
      username: profile.username || '',
      bio: profile.bio,
      profile_picture_url: profile.profilePictureUrl,
      banner_image_url: profile.bannerImageUrl,
      socials: profile.socials || {},
      favorite_collections: profile.favoriteCollections || [],
      description: profile.description,
      referral_code: profile.referralCode || this.generateReferralCode(),
      referred_by: profile.referredBy,
      total_referrals: profile.totalReferrals || 0,
      referral_points: profile.referralPoints || 0,
      activity_points: profile.activityPoints || 0,
      total_points: (profile.referralPoints || 0) + (profile.activityPoints || 0),
      is_verified: profile.isVerified || false,
      verification_level: profile.verificationLevel || 'none',
      is_active: profile.isActive !== false,
      privacy_level: profile.privacyLevel || 'public',
      allow_data_export: profile.allowDataExport !== false,
      allow_analytics: profile.allowAnalytics !== false,
      last_login_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) throw error;

    return this.mapUserProfile(data);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      walletAddress: row.wallet_address,
      username: row.username,
      totalPoints: row.total_points,
      referralPoints: row.referral_points,
      activityPoints: row.activity_points,
      rank: row.rank,
      lastUpdated: new Date(row.last_updated)
    }));
  }

  /**
   * Award points for activity
   */
  async awardActivityPoints(walletAddress: string, activityType: string, points: number, description?: string, metadata?: Record<string, any>): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    // Log the activity
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        wallet_address: walletAddress,
        activity_type: activityType,
        points_awarded: points,
        description: description,
        metadata: metadata || {}
      });

    // Update user profile points
    const { error } = await supabaseAdmin
      .rpc('increment_activity_points', {
        user_wallet: walletAddress,
        points: points
      });

    if (error) throw error;
  }

  /**
   * Award referral points
   */
  async awardReferralPoints(referrerWallet: string, referredWallet: string, points: number = 100): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured');
    }

    // Create referral tracking record
    await supabaseAdmin
      .from('referral_tracking')
      .insert({
        referrer_wallet: referrerWallet,
        referred_wallet: referredWallet,
        referral_code: await this.getReferralCode(referrerWallet),
        points_awarded: points
      });

    // Update referrer's points
    await supabaseAdmin
      .rpc('increment_referral_points', {
        user_wallet: referrerWallet,
        points: points
      });

    // Award activity points to referred user
    await this.awardActivityPoints(referredWallet, 'referral_signup', 50, 'Signed up via referral');
  }

  private mapUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      walletAddress: data.wallet_address,
      walletAddressHash: data.wallet_address_hash,
      username: data.username,
      bio: data.bio,
      profilePictureUrl: data.profile_picture_url,
      bannerImageUrl: data.banner_image_url,
      socials: data.socials || {},
      favoriteCollections: data.favorite_collections || [],
      description: data.description,
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      totalReferrals: data.total_referrals,
      referralPoints: data.referral_points,
      activityPoints: data.activity_points,
      totalPoints: data.total_points,
      rank: data.rank,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      isVerified: data.is_verified,
      verificationLevel: data.verification_level,
      isActive: data.is_active,
      privacyLevel: data.privacy_level,
      allowDataExport: data.allow_data_export,
      allowAnalytics: data.allow_analytics
    };
  }

  private hashWalletAddress(address: string): string {
    // Simple hash for privacy - in production, use proper hashing
    return Buffer.from(address).toString('base64');
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private async getReferralCode(walletAddress: string): Promise<string> {
    const profile = await this.getUserProfile(walletAddress);
    return profile?.referralCode || this.generateReferralCode();
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      throw new Error('Database not configured');
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { available: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    if (username.length < 3 || username.length > 20) {
      return { available: false, error: 'Username must be between 3 and 20 characters' };
    }

    // Check if username exists in database
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Failed to check username availability: ${error.message}`);
    }

    const available = !data; // Username is available if no data is returned
    return { available };
  }
}

// Export singleton instances
export const pageAccessService = new PageAccessService();
export const userProfileService = new UserProfileService();
