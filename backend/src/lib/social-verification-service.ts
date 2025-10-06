/**
 * Social Verification Service
 * Handles social media account verification for whitelist eligibility
 */

export interface SocialAccount {
  platform: 'twitter' | 'telegram' | 'discord';
  username: string;
  userId?: string;
  displayName?: string;
  followerCount?: number;
  isVerified?: boolean;
  profilePicture?: string;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  verificationData?: {
    verificationCode: string;
    expiresAt: Date;
  };
  verifiedAt?: Date;
  expiresAt?: Date;
}

export interface VerificationRequest {
  id: string;
  walletAddress: string;
  socialAccounts: SocialAccount[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

class SocialVerificationService {
  private verificationRequests: Map<string, VerificationRequest> = new Map();
  private walletAccounts: Map<string, SocialAccount[]> = new Map();

  /**
   * Start verification process for a wallet
   */
  async startVerification(walletAddress: string, socialAccounts: Omit<SocialAccount, 'verificationStatus' | 'verificationData'>[]): Promise<VerificationRequest> {
    const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const accounts: SocialAccount[] = socialAccounts.map(account => ({
      ...account,
      verificationStatus: 'pending' as const,
      verificationData: {
        verificationCode: this.generateVerificationCode(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    }));

    const request: VerificationRequest = {
      id: verificationId,
      walletAddress,
      socialAccounts: accounts,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.verificationRequests.set(verificationId, request);
    this.walletAccounts.set(walletAddress, accounts);

    console.log(`🔍 Started verification for wallet ${walletAddress} with ${accounts.length} accounts`);
    
    return request;
  }

  /**
   * Get all verification requests (for debugging)
   */
  getAllVerificationRequests(): VerificationRequest[] {
    return Array.from(this.verificationRequests.values());
  }

  /**
   * Get social accounts for a wallet
   */
  getWalletSocialAccounts(walletAddress: string): SocialAccount[] {
    return this.walletAccounts.get(walletAddress) || [];
  }

  /**
   * Check whitelist eligibility based on social accounts
   */
  checkWhitelistEligibility(walletAddress: string): {
    eligible: boolean;
    requirements: {
      minimumFollowers: number;
      verifiedAccountRequired: boolean;
      platformsRequired: string[];
    };
    currentStatus: {
      totalFollowers: number;
      verifiedAccounts: number;
      platformsVerified: string[];
    };
  } {
    const accounts = this.getWalletSocialAccounts(walletAddress);
    const verifiedAccounts = accounts.filter(acc => acc.verificationStatus === 'verified');
    
    const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followerCount || 0), 0);
    const verifiedCount = verifiedAccounts.length;
    const platformsVerified = verifiedAccounts.map(acc => acc.platform);

    const requirements = {
      minimumFollowers: 1000,
      verifiedAccountRequired: true,
      platformsRequired: ['twitter'] // At least Twitter required
    };

    const eligible = 
      totalFollowers >= requirements.minimumFollowers &&
      verifiedCount >= (requirements.verifiedAccountRequired ? 1 : 0) &&
      requirements.platformsRequired.every(platform => platformsVerified.includes(platform as any));

    return {
      eligible,
      requirements,
      currentStatus: {
        totalFollowers,
        verifiedAccounts: verifiedCount,
        platformsVerified
      }
    };
  }

  /**
   * Submit manual verification (for testing)
   */
  async submitManualVerification(verificationId: string, platform: string, verificationData: any): Promise<boolean> {
    const request = this.verificationRequests.get(verificationId);
    if (!request) return false;

    const account = request.socialAccounts.find(acc => acc.platform === platform);
    if (!account) return false;

    // Simulate verification success
    account.verificationStatus = 'verified';
    account.verifiedAt = new Date();
    account.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    account.verificationData = undefined;

    request.updatedAt = new Date();
    request.status = request.socialAccounts.every(acc => acc.verificationStatus === 'verified') 
      ? 'completed' 
      : 'pending';

    console.log(`✅ Manual verification submitted for ${platform} in request ${verificationId}`);
    return true;
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    totalRequests: number;
    completedRequests: number;
    pendingRequests: number;
    failedRequests: number;
    totalAccounts: number;
    verifiedAccounts: number;
  } {
    const requests = Array.from(this.verificationRequests.values());
    const allAccounts = requests.flatMap(req => req.socialAccounts);
    const verifiedAccounts = allAccounts.filter(acc => acc.verificationStatus === 'verified');

    return {
      totalRequests: requests.length,
      completedRequests: requests.filter(req => req.status === 'completed').length,
      pendingRequests: requests.filter(req => req.status === 'pending').length,
      failedRequests: requests.filter(req => req.status === 'failed').length,
      totalAccounts: allAccounts.length,
      verifiedAccounts: verifiedAccounts.length
    };
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Clean up expired verification requests
   */
  cleanupExpiredRequests(): void {
    const now = new Date();
    for (const [id, request] of this.verificationRequests.entries()) {
      const hasExpired = request.socialAccounts.some(acc => 
        acc.verificationData?.expiresAt && acc.verificationData.expiresAt < now
      );
      
      if (hasExpired) {
        this.verificationRequests.delete(id);
        this.walletAccounts.delete(request.walletAddress);
        console.log(`🧹 Cleaned up expired verification request: ${id}`);
      }
    }
  }
}

export const socialVerificationService = new SocialVerificationService();

// Clean up expired requests every hour
setInterval(() => {
  socialVerificationService.cleanupExpiredRequests();
}, 60 * 60 * 1000);
