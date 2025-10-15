/**
 * DATABASE SERVICE
 * Secure database operations with encryption and privacy controls
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {
  UserProfile,
  BetaApplication,
  AccessGrant,
  UserActivity,
  DatabaseBackup,
  DatabaseStats,
  DataAccessLog,
  AdminUser,
  AdminPermissions,
  PrivacyLevel
} from './types';

// Encryption configuration
const ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

class DatabaseService {
  private dataDir: string;
  private isInitialized: boolean = false;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
  }

  // Initialize database
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize database files if they don't exist
      await this.initializeDatabaseFiles();
      
      this.isInitialized = true;
      console.log('✅ Database service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async initializeDatabaseFiles(): Promise<void> {
    const files = [
      'users.json',
      'applications.json', 
      'access_grants.json',
      'user_activities.json',
      'admin_users.json',
      'backups.json',
      'access_logs.json'
    ];

    for (const file of files) {
      const filePath = path.join(this.dataDir, file);
      try {
        await fs.access(filePath);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
      }
    }
  }

  // Encryption utilities
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Hash sensitive data for privacy
  private hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Log data access for audit trail
  private async logDataAccess(
    accessedBy: string,
    accessType: string,
    resourceType: string,
    resourceId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const logEntry: DataAccessLog = {
      id: crypto.randomUUID(),
      accessedBy,
      accessType: accessType as any,
      resourceType: resourceType as any,
      resourceId,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      reason
    };

    await this.appendToFile('access_logs.json', logEntry);
  }

  // Generic file operations
  private async readFile<T>(filename: string): Promise<T[]> {
    const filePath = path.join(this.dataDir, filename);
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    
    // Decrypt sensitive data if needed
    if (filename === 'users.json' || filename === 'applications.json') {
      return parsed.map((item: any) => this.decryptUserData(item));
    }
    
    return parsed;
  }

  private async writeFile<T>(filename: string, data: T[]): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    
    // Encrypt sensitive data if needed
    let processedData = data;
    if (filename === 'users.json' || filename === 'applications.json') {
      processedData = data.map((item: any) => this.encryptUserData(item));
    }
    
    await fs.writeFile(filePath, JSON.stringify(processedData, null, 2));
  }

  private async appendToFile<T>(filename: string, item: T): Promise<void> {
    const existingData = await this.readFile<T>(filename);
    existingData.push(item);
    await this.writeFile(filename, existingData);
  }

  // User data encryption/decryption
  private encryptUserData(user: any): any {
    if (!user) return user;
    
    const encrypted = { ...user };
    
    // Encrypt sensitive fields
    if (encrypted.bio) {
      encrypted.bio = this.encrypt(encrypted.bio);
    }
    
    // Hash wallet address for privacy
    if (encrypted.walletAddress) {
      encrypted.walletAddressHash = this.hashSensitiveData(encrypted.walletAddress);
    }
    
    return encrypted;
  }

  private decryptUserData(user: any): any {
    if (!user) return user;
    
    const decrypted = { ...user };
    
    // Decrypt sensitive fields
    if (decrypted.bio) {
      try {
        decrypted.bio = this.decrypt(decrypted.bio);
      } catch {
        // If decryption fails, it might be unencrypted data
      }
    }
    
    return decrypted;
  }

  // User Profile Operations
  async createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, accessedBy: string): Promise<UserProfile> {
    await this.logDataAccess(accessedBy, 'write', 'user_profile', 'new', 'Creating new user profile');
    
    const userProfile: UserProfile = {
      id: crypto.randomUUID(),
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.appendToFile('users.json', userProfile);
    return userProfile;
  }

  async getUserProfile(userId: string, accessedBy: string): Promise<UserProfile | null> {
    const users = await this.readFile<UserProfile>('users.json');
    const user = users.find(u => u.id === userId);
    
    if (user) {
      await this.logDataAccess(accessedBy, 'read', 'user_profile', userId, 'Retrieving user profile');
    }
    
    return user || null;
  }

  async getUserProfileByWallet(walletAddress: string, accessedBy: string): Promise<UserProfile | null> {
    const users = await this.readFile<UserProfile>('users.json');
    const user = users.find(u => u.walletAddress === walletAddress);
    
    if (user) {
      await this.logDataAccess(accessedBy, 'read', 'user_profile', user.id, 'Retrieving user profile by wallet');
    }
    
    return user || null;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>, accessedBy: string): Promise<UserProfile | null> {
    const users = await this.readFile<UserProfile>('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    await this.writeFile('users.json', users);
    await this.logDataAccess(accessedBy, 'write', 'user_profile', userId, 'Updating user profile');
    
    return users[userIndex];
  }

  // Beta Application Operations
  async createBetaApplication(application: Omit<BetaApplication, 'id' | 'appliedAt'>, accessedBy: string): Promise<BetaApplication> {
    await this.logDataAccess(accessedBy, 'write', 'application', 'new', 'Creating new beta application');
    
    const betaApplication: BetaApplication = {
      id: crypto.randomUUID(),
      ...application,
      appliedAt: new Date()
    };

    await this.appendToFile('applications.json', betaApplication);
    return betaApplication;
  }

  async getBetaApplication(applicationId: string, accessedBy: string): Promise<BetaApplication | null> {
    const applications = await this.readFile<BetaApplication>('applications.json');
    const application = applications.find(a => a.id === applicationId);
    
    if (application) {
      await this.logDataAccess(accessedBy, 'read', 'application', applicationId, 'Retrieving beta application');
    }
    
    return application || null;
  }

  async getAllBetaApplications(accessedBy: string, status?: string): Promise<BetaApplication[]> {
    const applications = await this.readFile<BetaApplication>('applications.json');
    await this.logDataAccess(accessedBy, 'read', 'application', 'all', 'Retrieving all beta applications');
    
    if (status) {
      return applications.filter(a => a.status === status);
    }
    
    return applications;
  }

  async updateBetaApplication(applicationId: string, updates: Partial<BetaApplication>, accessedBy: string): Promise<BetaApplication | null> {
    const applications = await this.readFile<BetaApplication>('applications.json');
    const appIndex = applications.findIndex(a => a.id === applicationId);
    
    if (appIndex === -1) return null;
    
    applications[appIndex] = {
      ...applications[appIndex],
      ...updates,
      reviewedAt: updates.status ? new Date() : applications[appIndex].reviewedAt
    };
    
    await this.writeFile('applications.json', applications);
    await this.logDataAccess(accessedBy, 'write', 'application', applicationId, 'Updating beta application');
    
    return applications[appIndex];
  }

  // Access Grant Operations
  async createAccessGrant(grant: Omit<AccessGrant, 'id' | 'grantedAt'>, accessedBy: string): Promise<AccessGrant> {
    await this.logDataAccess(accessedBy, 'write', 'access_grant', 'new', 'Creating new access grant');
    
    const accessGrant: AccessGrant = {
      id: crypto.randomUUID(),
      ...grant,
      grantedAt: new Date()
    };

    await this.appendToFile('access_grants.json', accessGrant);
    return accessGrant;
  }

  async getAccessGrants(accessedBy: string, isActive?: boolean): Promise<AccessGrant[]> {
    const grants = await this.readFile<AccessGrant>('access_grants.json');
    await this.logDataAccess(accessedBy, 'read', 'access_grant', 'all', 'Retrieving access grants');
    
    if (isActive !== undefined) {
      return grants.filter(g => g.isActive === isActive);
    }
    
    return grants;
  }

  // Database Statistics
  async getDatabaseStats(accessedBy: string): Promise<DatabaseStats> {
    await this.logDataAccess(accessedBy, 'read', 'backup', 'stats', 'Retrieving database statistics');
    
    const users = await this.readFile<UserProfile>('users.json');
    const applications = await this.readFile<BetaApplication>('applications.json');
    const grants = await this.readFile<AccessGrant>('access_grants.json');
    const backups = await this.readFile<DatabaseBackup>('backups.json');

    return {
      totalUsers: users.length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(a => a.status === 'pending').length,
      approvedApplications: applications.filter(a => a.status === 'approved').length,
      rejectedApplications: applications.filter(a => a.status === 'rejected').length,
      activeAccessGrants: grants.filter(g => g.isActive).length,
      totalBackups: backups.length,
      lastBackupAt: backups.length > 0 ? backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : undefined,
      databaseSize: await this.getDatabaseSize()
    };
  }

  private async getDatabaseSize(): Promise<number> {
    let totalSize = 0;
    const files = await fs.readdir(this.dataDir);
    
    for (const file of files) {
      const stats = await fs.stat(path.join(this.dataDir, file));
      totalSize += stats.size;
    }
    
    return totalSize;
  }

  // Backup Operations
  async createBackup(backupType: DatabaseBackup['type'], accessedBy: string): Promise<DatabaseBackup> {
    await this.logDataAccess(accessedBy, 'write', 'backup', 'new', `Creating ${backupType} backup`);
    
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${backupType}-${timestamp}.json`;
    const filePath = path.join(this.dataDir, 'backups', fileName);
    
    // Create backups directory if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    const backup: DatabaseBackup = {
      id: backupId,
      type: backupType,
      createdAt: new Date(),
      filePath,
      fileSize: 0,
      checksum: '',
      status: 'pending'
    };

    try {
      // Create backup based on type
      let backupData: any = {};
      
      switch (backupType) {
        case 'full':
          backupData = {
            users: await this.readFile('users.json'),
            applications: await this.readFile('applications.json'),
            access_grants: await this.readFile('access_grants.json'),
            user_activities: await this.readFile('user_activities.json')
          };
          break;
        case 'user_profiles':
          backupData = await this.readFile('users.json');
          break;
        case 'applications':
          backupData = await this.readFile('applications.json');
          break;
        case 'access_grants':
          backupData = await this.readFile('access_grants.json');
          break;
      }
      
      const backupContent = JSON.stringify(backupData, null, 2);
      await fs.writeFile(filePath, backupContent);
      
      const stats = await fs.stat(filePath);
      backup.fileSize = stats.size;
      backup.checksum = crypto.createHash('sha256').update(backupContent).digest('hex');
      backup.status = 'completed';
      
    } catch (error) {
      backup.status = 'failed';
      backup.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await this.appendToFile('backups.json', backup);
    return backup;
  }

  // Data Export (with privacy controls)
  async exportUserData(userId: string, accessedBy: string, exportType: 'full' | 'profile_only' = 'profile_only'): Promise<any> {
    await this.logDataAccess(accessedBy, 'export', 'user_profile', userId, `Exporting ${exportType} user data`);
    
    const user = await this.getUserProfile(userId, accessedBy);
    if (!user) return null;
    
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
      const applications = await this.readFile<BetaApplication>('applications.json');
      const grants = await this.readFile<AccessGrant>('access_grants.json');
      
      exportData.applications = applications.filter(a => a.userId === userId);
      exportData.accessGrants = grants.filter(g => g.userId === userId);
    }
    
    return exportData;
  }

  // Privacy and Security
  async getUserAccessLogs(userId: string, accessedBy: string): Promise<DataAccessLog[]> {
    await this.logDataAccess(accessedBy, 'read', 'access_logs', userId, 'Retrieving user access logs');
    
    const logs = await this.readFile<DataAccessLog>('access_logs.json');
    return logs.filter(log => 
      log.resourceId === userId || 
      log.accessedBy === userId
    );
  }

  async deleteUserData(userId: string, accessedBy: string, reason: string): Promise<boolean> {
    await this.logDataAccess(accessedBy, 'delete', 'user_profile', userId, `Deleting user data: ${reason}`);
    
    try {
      // Remove from all collections
      const users = await this.readFile<UserProfile>('users.json');
      const applications = await this.readFile<BetaApplication>('applications.json');
      const grants = await this.readFile<AccessGrant>('access_grants.json');
      
      const filteredUsers = users.filter(u => u.id !== userId);
      const filteredApplications = applications.filter(a => a.userId !== userId);
      const filteredGrants = grants.filter(g => g.userId !== userId);
      
      await this.writeFile('users.json', filteredUsers);
      await this.writeFile('applications.json', filteredApplications);
      await this.writeFile('access_grants.json', filteredGrants);
      
      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();

// Initialize on import
databaseService.initialize().catch(console.error);
