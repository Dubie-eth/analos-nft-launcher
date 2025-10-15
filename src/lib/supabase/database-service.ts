/**
 * SUPABASE DATABASE SERVICE
 * Secure database operations with encryption and privacy controls
 */

import { supabase, supabaseAdmin, Database, isSupabaseConfigured } from './client';
import { UserProfile, BetaApplication, AccessGrant, DatabaseStats } from '@/lib/database/types';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

type ApplicationRow = Database['public']['Tables']['beta_applications']['Row'];
type ApplicationInsert = Database['public']['Tables']['beta_applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['beta_applications']['Update'];

type AccessGrantRow = Database['public']['Tables']['access_grants']['Row'];
type AccessGrantInsert = Database['public']['Tables']['access_grants']['Insert'];
type AccessGrantUpdate = Database['public']['Tables']['access_grants']['Update'];

export class SupabaseDatabaseService {
  // Encryption helpers
  private async encryptData(data: string): Promise<string> {
    const { data: result, error } = await supabaseAdmin
      .rpc('encrypt_sensitive_data', { data });
    
    if (error) throw error;
    return result;
  }

  private async decryptData(encryptedData: string): Promise<string> {
    const { data: result, error } = await supabaseAdmin
      .rpc('decrypt_sensitive_data', { encrypted_data: encryptedData });
    
    if (error) throw error;
    return result;
  }

  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, accessedBy: string): Promise<UserProfile> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }

    // Encrypt sensitive data before storing
    const encryptedBio = profile.bio ? await this.encryptData(profile.bio) : null;
    
    const userInsert: UserInsert = {
      wallet_address: profile.walletAddress,
      username: profile.username,
      bio: encryptedBio,
      profile_picture_url: profile.profilePicture,
      banner_image_url: profile.bannerImage,
      socials: profile.socials,
      last_login_at: new Date().toISOString(),
      is_verified: profile.isVerified,
      verification_level: profile.verificationLevel
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userInsert)
      .select()
      .single();

    if (error) throw error;

    // Log data access
    await this.logDataAccess(accessedBy, 'write', 'user_profile', data.id, 'Creating new user profile');

    return await this.mapUserRowToProfile(data);
  }

  async getUserProfile(userId: string, accessedBy: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    await this.logDataAccess(accessedBy, 'read', 'user_profile', userId, 'Retrieving user profile');

    return await this.mapUserRowToProfile(data);
  }

  async getUserProfileByWallet(walletAddress: string, accessedBy: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    await this.logDataAccess(accessedBy, 'read', 'user_profile', data.id, 'Retrieving user profile by wallet');

    return await this.mapUserRowToProfile(data);
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>, accessedBy: string): Promise<UserProfile | null> {
    const userUpdate: UserUpdate = {
      username: updates.username,
      bio: updates.bio,
      profile_picture_url: updates.profilePicture,
      banner_image_url: updates.bannerImage,
      socials: updates.socials,
      last_login_at: updates.lastLoginAt?.toISOString(),
      is_verified: updates.isVerified,
      verification_level: updates.verificationLevel,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(userUpdate)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    await this.logDataAccess(accessedBy, 'write', 'user_profile', userId, 'Updating user profile');

    return await this.mapUserRowToProfile(data);
  }

  // Beta Application Operations
  async createBetaApplication(application: Omit<BetaApplication, 'id' | 'appliedAt'>, accessedBy: string): Promise<BetaApplication> {
    const appInsert: ApplicationInsert = {
      user_id: application.userId,
      wallet_address: application.walletAddress,
      username: application.username,
      bio: application.bio,
      socials: application.socials,
      profile_picture_url: application.profilePicture,
      banner_image_url: application.bannerImage,
      status: application.status,
      access_level: application.accessLevel,
      custom_message: application.customMessage,
      locked_page_requested: application.lockedPageRequested,
      applied_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('beta_applications')
      .insert(appInsert)
      .select()
      .single();

    if (error) throw error;

    await this.logDataAccess(accessedBy, 'write', 'application', data.id, 'Creating new beta application');

    return this.mapApplicationRowToApplication(data);
  }

  async getBetaApplication(applicationId: string, accessedBy: string): Promise<BetaApplication | null> {
    const { data, error } = await supabaseAdmin
      .from('beta_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    await this.logDataAccess(accessedBy, 'read', 'application', applicationId, 'Retrieving beta application');

    return this.mapApplicationRowToApplication(data);
  }

  async getAllBetaApplications(accessedBy: string, status?: string): Promise<BetaApplication[]> {
    let query = supabaseAdmin
      .from('beta_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    await this.logDataAccess(accessedBy, 'read', 'application', 'all', 'Retrieving all beta applications');

    return data.map(this.mapApplicationRowToApplication);
  }

  async updateBetaApplication(applicationId: string, updates: Partial<BetaApplication>, accessedBy: string): Promise<BetaApplication | null> {
    const appUpdate: ApplicationUpdate = {
      status: updates.status,
      reviewed_by: updates.reviewedBy,
      review_notes: updates.reviewNotes,
      access_level: updates.accessLevel,
      rejection_reason: updates.rejectionReason,
      reviewed_at: updates.reviewedAt?.toISOString() || new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('beta_applications')
      .update(appUpdate)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    await this.logDataAccess(accessedBy, 'write', 'application', applicationId, 'Updating beta application');

    return this.mapApplicationRowToApplication(data);
  }

  // Access Grant Operations
  async createAccessGrant(grant: Omit<AccessGrant, 'id' | 'grantedAt'>, accessedBy: string): Promise<AccessGrant> {
    const grantInsert: AccessGrantInsert = {
      user_id: grant.userId,
      wallet_address: grant.walletAddress,
      access_level: grant.accessLevel as any,
      granted_by: grant.grantedBy,
      expires_at: grant.expiresAt?.toISOString(),
      is_active: grant.isActive,
      conditions: grant.conditions,
      notes: grant.notes,
      granted_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('access_grants')
      .insert(grantInsert)
      .select()
      .single();

    if (error) throw error;

    await this.logDataAccess(accessedBy, 'write', 'access_grant', data.id, 'Creating new access grant');

    return this.mapAccessGrantRowToAccessGrant(data);
  }

  async getAccessGrants(accessedBy: string, isActive?: boolean): Promise<AccessGrant[]> {
    let query = supabaseAdmin
      .from('access_grants')
      .select('*')
      .order('granted_at', { ascending: false });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) throw error;

    await this.logDataAccess(accessedBy, 'read', 'access_grant', 'all', 'Retrieving access grants');

    return data.map(this.mapAccessGrantRowToAccessGrant);
  }

  // Database Statistics
  async getDatabaseStats(accessedBy: string): Promise<DatabaseStats> {
    await this.logDataAccess(accessedBy, 'read', 'backup', 'stats', 'Retrieving database statistics');

    // Get user count
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get application counts
    const { data: applicationStats } = await supabaseAdmin
      .from('application_stats')
      .select('*');

    // Get access grant count
    const { count: activeAccessGrants } = await supabaseAdmin
      .from('access_grants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get backup count
    const { count: totalBackups } = await supabaseAdmin
      .from('database_backups')
      .select('*', { count: 'exact', head: true });

    // Get last backup
    const { data: lastBackup } = await supabaseAdmin
      .from('database_backups')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const stats = applicationStats?.reduce((acc, stat) => {
      acc.totalApplications += stat.count;
      if (stat.status === 'pending') acc.pendingApplications = stat.count;
      if (stat.status === 'approved') acc.approvedApplications = stat.count;
      if (stat.status === 'rejected') acc.rejectedApplications = stat.count;
      return acc;
    }, {
      totalApplications: 0,
      pendingApplications: 0,
      approvedApplications: 0,
      rejectedApplications: 0
    });

    return {
      totalUsers: totalUsers || 0,
      totalApplications: stats?.totalApplications || 0,
      pendingApplications: stats?.pendingApplications || 0,
      approvedApplications: stats?.approvedApplications || 0,
      rejectedApplications: stats?.rejectedApplications || 0,
      activeAccessGrants: activeAccessGrants || 0,
      totalBackups: totalBackups || 0,
      lastBackupAt: lastBackup?.created_at ? new Date(lastBackup.created_at) : undefined,
      databaseSize: 0 // Would need to query pg_database_size in a real implementation
    };
  }

  // Data Access Logging
  private async logDataAccess(
    accessedBy: string,
    accessType: string,
    resourceType: string,
    resourceId: string,
    reason: string
  ): Promise<void> {
    await supabaseAdmin
      .from('data_access_logs')
      .insert({
        accessed_by: accessedBy,
        access_type: accessType as any,
        resource_type: resourceType as any,
        resource_id: resourceId,
        reason,
        timestamp: new Date().toISOString()
      });
  }

  // Mapping functions
  private async mapUserRowToProfile(row: UserRow): Promise<UserProfile> {
    // Decrypt sensitive data when reading
    let decryptedBio = row.bio;
    if (row.bio) {
      try {
        decryptedBio = await this.decryptData(row.bio);
      } catch (error) {
        // If decryption fails, it might be unencrypted data (for backward compatibility)
        decryptedBio = row.bio;
      }
    }

    return {
      id: row.id,
      walletAddress: row.wallet_address,
      username: row.username,
      bio: decryptedBio || undefined,
      profilePicture: row.profile_picture_url || undefined,
      bannerImage: row.banner_image_url || undefined,
      socials: row.socials,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      isVerified: row.is_verified,
      verificationLevel: row.verification_level
    };
  }

  private mapApplicationRowToApplication(row: ApplicationRow): BetaApplication {
    return {
      id: row.id,
      userId: row.user_id || undefined,
      walletAddress: row.wallet_address,
      username: row.username,
      bio: row.bio || undefined,
      socials: row.socials,
      profilePicture: row.profile_picture_url || undefined,
      bannerImage: row.banner_image_url || undefined,
      status: row.status,
      appliedAt: new Date(row.applied_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      reviewedBy: row.reviewed_by || undefined,
      reviewNotes: row.review_notes || undefined,
      accessLevel: row.access_level,
      rejectionReason: row.rejection_reason || undefined,
      customMessage: row.custom_message || undefined,
      lockedPageRequested: row.locked_page_requested || undefined
    };
  }

  private mapAccessGrantRowToAccessGrant(row: AccessGrantRow): AccessGrant {
    return {
      id: row.id,
      userId: row.user_id || undefined,
      walletAddress: row.wallet_address,
      accessLevel: row.access_level,
      grantedBy: row.granted_by,
      grantedAt: new Date(row.granted_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: row.is_active,
      conditions: row.conditions || undefined,
      notes: row.notes || undefined
    };
  }

  // Export user data
  async exportUserData(userId: string, accessedBy: string, exportType: 'full' | 'profile_only' = 'profile_only'): Promise<any> {
    const user = await this.getUserProfile(userId, accessedBy);
    if (!user) return null;

    await this.logDataAccess(accessedBy, 'export', 'user_profile', userId, `Exporting ${exportType} user data`);

    const exportData: any = {
      profile: {
        id: user.id,
        username: user.username,
        bio: exportType === 'full' ? user.bio : undefined,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        socials: user.socials,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        verificationLevel: user.verificationLevel
      }
    };

    if (exportType === 'full') {
      // Include additional data for full export
      const applications = await this.getAllBetaApplications(accessedBy);
      const grants = await this.getAccessGrants(accessedBy);

      exportData.applications = applications.filter(a => a.userId === userId);
      exportData.accessGrants = grants.filter(g => g.userId === userId);
    }

    return exportData;
  }

  // Delete user data
  async deleteUserData(userId: string, accessedBy: string, reason: string): Promise<boolean> {
    try {
      await this.logDataAccess(accessedBy, 'delete', 'user_profile', userId, `Deleting user data: ${reason}`);

      // Delete user and all related data (cascading deletes will handle related records)
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  }
}

// Singleton instance
export const supabaseDatabaseService = new SupabaseDatabaseService();
