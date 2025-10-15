/**
 * DATABASE TYPES AND INTERFACES
 * Secure user profile and application management
 */

export interface UserProfile {
  id: string;
  walletAddress: string;
  username: string;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
    [key: string]: string | undefined; // Custom social platforms
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isVerified: boolean;
  verificationLevel: 'none' | 'basic' | 'enhanced' | 'verified';
}

export interface BetaApplication {
  id: string;
  userId: string;
  walletAddress: string;
  username: string;
  bio?: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
    github?: string;
    [key: string]: string | undefined;
  };
  profilePicture?: string;
  bannerImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  accessLevel: 'beta_user' | 'premium_user' | 'creator';
  rejectionReason?: string;
  customMessage?: string;
  lockedPageRequested?: string;
}

export interface AccessGrant {
  id: string;
  userId: string;
  walletAddress: string;
  accessLevel: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  conditions?: {
    tokenThreshold?: number;
    nftCollections?: string[];
    verificationRequired?: boolean;
  };
  notes?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  walletAddress: string;
  activity: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DatabaseBackup {
  id: string;
  type: 'full' | 'incremental' | 'user_profiles' | 'applications' | 'access_grants';
  createdAt: Date;
  filePath: string;
  fileSize: number;
  checksum: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface DatabaseStats {
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeAccessGrants: number;
  totalBackups: number;
  lastBackupAt?: Date;
  databaseSize: number;
}

// Privacy and security levels
export enum PrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SENSITIVE = 'sensitive',
  CONFIDENTIAL = 'confidential'
}

export interface DataAccessLog {
  id: string;
  accessedBy: string;
  accessType: 'read' | 'write' | 'delete' | 'export';
  resourceType: 'user_profile' | 'application' | 'access_grant' | 'backup';
  resourceId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  reason: string;
  authorizedBy?: string;
}

// Admin permissions
export interface AdminPermissions {
  canViewProfiles: boolean;
  canEditProfiles: boolean;
  canDeleteProfiles: boolean;
  canViewApplications: boolean;
  canApproveApplications: boolean;
  canRejectApplications: boolean;
  canGrantAccess: boolean;
  canRevokeAccess: boolean;
  canViewBackups: boolean;
  canCreateBackups: boolean;
  canExportData: boolean;
  canViewLogs: boolean;
  canManageAdmins: boolean;
}

export interface AdminUser {
  id: string;
  walletAddress: string;
  username: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: AdminPermissions;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  createdBy?: string;
}
