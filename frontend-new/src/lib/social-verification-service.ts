/**
 * Social Verification Service
 * Handles verification of social media accounts for whitelist eligibility
 * Supports Twitter/X, Telegram, Discord with webhook and manual verification
 */

export interface SocialPlatform {
  id: 'twitter' | 'telegram' | 'discord';
  name: string;
  icon: string;
  verificationUrl: string;
  apiEndpoint?: string;
}

export interface SocialAccount {
  platform: SocialPlatform['id'];
  username: string;
  userId?: string;
  displayName?: string;
  followerCount?: number;
  isVerified?: boolean;
  profilePicture?: string;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  verifiedAt?: Date;
  expiresAt?: Date;
  verificationMethod: 'webhook' | 'manual' | 'api';
  verificationData?: any;
}

export interface VerificationRequest {
  id: string;
  walletAddress: string;
  socialAccounts: SocialAccount[];
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt?: Date;
  rejectionReason?: string;
  totalScore: number;
  requiredScore: number;
}

export interface SocialVerificationConfig {
  platforms: {
    twitter: {
      enabled: boolean;
      minFollowers: number;
      requireVerification: boolean;
      apiKey?: string;
      apiSecret?: string;
      bearerToken?: string;
    };
    telegram: {
      enabled: boolean;
      minMembers?: number;
      botToken?: string;
    };
    discord: {
      enabled: boolean;
      minServerMembers?: number;
      botToken?: string;
      clientId?: string;
    };
  };
  scoring: {
    twitterFollowerMultiplier: number;
    telegramMemberMultiplier: number;
    discordMemberMultiplier: number;
    verifiedAccountBonus: number;
    multiplePlatformBonus: number;
  };
  manualVerification: {
    enabled: boolean;
    twitterVerificationTweet: string;
    telegramVerificationMessage: string;
    discordVerificationMessage: string;
  };
}

export class SocialVerificationService {
  private verificationRequests: Map<string, VerificationRequest> = new Map();
  private socialAccounts: Map<string, SocialAccount[]> = new Map(); // wallet -> accounts
  private config: SocialVerificationConfig;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeWebhooks();
    console.log('🔐 Social Verification Service initialized');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SocialVerificationConfig {
    return {
      platforms: {
        twitter: {
          enabled: true,
          minFollowers: 1000,
          requireVerification: false,
          // API keys should be in environment variables
          apiKey: process.env.TWITTER_API_KEY,
          apiSecret: process.env.TWITTER_API_SECRET,
          bearerToken: process.env.TWITTER_BEARER_TOKEN
        },
        telegram: {
          enabled: true,
          minMembers: 100,
          botToken: process.env.TELEGRAM_BOT_TOKEN
        },
        discord: {
          enabled: true,
          minServerMembers: 500,
          botToken: process.env.DISCORD_BOT_TOKEN,
          clientId: process.env.DISCORD_CLIENT_ID
        }
      },
      scoring: {
        twitterFollowerMultiplier: 0.001, // 1 follower = 0.001 points
        telegramMemberMultiplier: 0.01,   // 1 member = 0.01 points
        discordMemberMultiplier: 0.005,   // 1 member = 0.005 points
        verifiedAccountBonus: 100,        // +100 points for verified accounts
        multiplePlatformBonus: 50         // +50 points for multiple platforms
      },
      manualVerification: {
        enabled: true,
        twitterVerificationTweet: "🎯 Verifying my NFT collection on LosLauncher! Code: {CODE} #LosLauncher #Analos",
        telegramVerificationMessage: "🎯 Verifying my NFT collection on LosLauncher! Code: {CODE}",
        discordVerificationMessage: "🎯 Verifying my NFT collection on LosLauncher! Code: {CODE}"
      }
    };
  }

  /**
   * Initialize webhook endpoints
   */
  private initializeWebhooks(): void {
    console.log('🔗 Initializing social verification webhooks...');
    // Webhook endpoints would be registered here
    // This would typically be done in the backend API routes
  }

  /**
   * Start verification process for a wallet
   */
  async startVerification(
    walletAddress: string,
    socialAccounts: Omit<SocialAccount, 'verificationStatus' | 'verificationMethod'>[]
  ): Promise<VerificationRequest> {
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const accounts: SocialAccount[] = socialAccounts.map(account => ({
      ...account,
      verificationStatus: 'pending' as const,
      verificationMethod: 'webhook' as const
    }));

    const verificationRequest: VerificationRequest = {
      id: verificationId,
      walletAddress,
      socialAccounts: accounts,
      requestedAt: new Date(),
      status: 'pending',
      totalScore: 0,
      requiredScore: 500 // Default required score
    };

    // Store verification request
    this.verificationRequests.set(verificationId, verificationRequest);
    this.socialAccounts.set(walletAddress, accounts);

    // Start verification process for each platform
    for (const account of accounts) {
      await this.verifySocialAccount(account, verificationRequest);
    }

    console.log(`🔐 Started verification for wallet ${walletAddress}: ${accounts.length} accounts`);
    return verificationRequest;
  }

  /**
   * Verify a social media account
   */
  private async verifySocialAccount(
    account: SocialAccount,
    verificationRequest: VerificationRequest
  ): Promise<void> {
    try {
      switch (account.platform) {
        case 'twitter':
          await this.verifyTwitterAccount(account, verificationRequest);
          break;
        case 'telegram':
          await this.verifyTelegramAccount(account, verificationRequest);
          break;
        case 'discord':
          await this.verifyDiscordAccount(account, verificationRequest);
          break;
      }
    } catch (error) {
      console.error(`❌ Error verifying ${account.platform} account:`, error);
      account.verificationStatus = 'failed';
    }
  }

  /**
   * Verify Twitter/X account
   */
  private async verifyTwitterAccount(
    account: SocialAccount,
    verificationRequest: VerificationRequest
  ): Promise<void> {
    if (!this.config.platforms.twitter.enabled) {
      account.verificationStatus = 'failed';
      return;
    }

    try {
      // Try API verification first
      if (this.config.platforms.twitter.bearerToken) {
        const userData = await this.fetchTwitterUserData(account.username);
        if (userData) {
          account.followerCount = userData.public_metrics?.followers_count || 0;
          account.isVerified = userData.verified || false;
          account.displayName = userData.name;
          account.profilePicture = userData.profile_image_url;
          account.verificationMethod = 'api';
          
          // Check if meets requirements
          if (account.followerCount >= this.config.platforms.twitter.minFollowers) {
            account.verificationStatus = 'verified';
            account.verifiedAt = new Date();
            account.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          } else {
            account.verificationStatus = 'failed';
          }
          return;
        }
      }

      // Fallback to manual verification
      if (this.config.manualVerification.enabled) {
        account.verificationStatus = 'pending';
        account.verificationMethod = 'manual';
        // Generate unique verification code
        const verificationCode = this.generateVerificationCode();
        account.verificationData = {
          verificationCode: verificationCode,
          tweetText: this.config.manualVerification.twitterVerificationTweet.replace('{CODE}', verificationCode),
          messageText: this.config.manualVerification.twitterVerificationTweet.replace('{CODE}', verificationCode),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
      }
    } catch (error) {
      console.error('❌ Twitter verification failed:', error);
      account.verificationStatus = 'failed';
    }
  }

  /**
   * Verify Telegram account
   */
  private async verifyTelegramAccount(
    account: SocialAccount,
    verificationRequest: VerificationRequest
  ): Promise<void> {
    if (!this.config.platforms.telegram.enabled) {
      account.verificationStatus = 'failed';
      return;
    }

    try {
      // Manual verification for Telegram
      if (this.config.manualVerification.enabled) {
        account.verificationStatus = 'pending';
        account.verificationMethod = 'manual';
        const verificationCode = this.generateVerificationCode();
        account.verificationData = {
          verificationCode: verificationCode,
          messageText: this.config.manualVerification.telegramVerificationMessage.replace('{CODE}', verificationCode),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }
    } catch (error) {
      console.error('❌ Telegram verification failed:', error);
      account.verificationStatus = 'failed';
    }
  }

  /**
   * Verify Discord account
   */
  private async verifyDiscordAccount(
    account: SocialAccount,
    verificationRequest: VerificationRequest
  ): Promise<void> {
    if (!this.config.platforms.discord.enabled) {
      account.verificationStatus = 'failed';
      return;
    }

    try {
      // Manual verification for Discord
      if (this.config.manualVerification.enabled) {
        account.verificationStatus = 'pending';
        account.verificationMethod = 'manual';
        const verificationCode = this.generateVerificationCode();
        account.verificationData = {
          verificationCode: verificationCode,
          messageText: this.config.manualVerification.discordVerificationMessage.replace('{CODE}', verificationCode),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }
    } catch (error) {
      console.error('❌ Discord verification failed:', error);
      account.verificationStatus = 'failed';
    }
  }

  /**
   * Fetch Twitter user data via API
   */
  private async fetchTwitterUserData(username: string): Promise<any> {
    if (!this.config.platforms.twitter.bearerToken) return null;

    try {
      const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,verified,profile_image_url`, {
        headers: {
          'Authorization': `Bearer ${this.config.platforms.twitter.bearerToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('❌ Twitter API error:', error);
    }
    return null;
  }

  /**
   * Calculate verification score
   */
  calculateVerificationScore(accounts: SocialAccount[]): number {
    let totalScore = 0;
    let verifiedPlatforms = 0;

    for (const account of accounts) {
      if (account.verificationStatus !== 'verified') continue;

      verifiedPlatforms++;

      switch (account.platform) {
        case 'twitter':
          if (account.followerCount) {
            totalScore += account.followerCount * this.config.scoring.twitterFollowerMultiplier;
          }
          if (account.isVerified) {
            totalScore += this.config.scoring.verifiedAccountBonus;
          }
          break;
        case 'telegram':
          if (account.followerCount) {
            totalScore += account.followerCount * this.config.scoring.telegramMemberMultiplier;
          }
          break;
        case 'discord':
          if (account.followerCount) {
            totalScore += account.followerCount * this.config.scoring.discordMemberMultiplier;
          }
          break;
      }
    }

    // Bonus for multiple platforms
    if (verifiedPlatforms > 1) {
      totalScore += this.config.scoring.multiplePlatformBonus;
    }

    return Math.floor(totalScore);
  }

  /**
   * Check if wallet meets whitelist requirements
   */
  checkWhitelistEligibility(
    walletAddress: string,
    requiredScore: number = 500
  ): {
    eligible: boolean;
    currentScore: number;
    requiredScore: number;
    accounts: SocialAccount[];
    missingRequirements: string[];
  } {
    const accounts = this.socialAccounts.get(walletAddress) || [];
    const currentScore = this.calculateVerificationScore(accounts);
    const missingRequirements: string[] = [];

    // Check if meets minimum score
    if (currentScore < requiredScore) {
      missingRequirements.push(`Need ${requiredScore - currentScore} more verification points`);
    }

    // Check platform requirements
    const verifiedAccounts = accounts.filter(a => a.verificationStatus === 'verified');
    const platforms = verifiedAccounts.map(a => a.platform);

    if (!platforms.includes('twitter') && this.config.platforms.twitter.enabled) {
      missingRequirements.push('Twitter verification required');
    }

    return {
      eligible: currentScore >= requiredScore && missingRequirements.length === 0,
      currentScore,
      requiredScore,
      accounts: verifiedAccounts,
      missingRequirements
    };
  }

  /**
   * Manual verification submission
   */
  async submitManualVerification(
    verificationId: string,
    platform: SocialPlatform['id'],
    verificationData: any
  ): Promise<boolean> {
    const request = this.verificationRequests.get(verificationId);
    if (!request) return false;

    const account = request.socialAccounts.find(a => a.platform === platform);
    if (!account || account.verificationStatus !== 'pending') return false;

    // Verify the manual submission (this would typically involve checking the social media post)
    const isValid = await this.validateManualSubmission(platform, verificationData);
    
    if (isValid) {
      account.verificationStatus = 'verified';
      account.verifiedAt = new Date();
      account.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Recalculate total score
      request.totalScore = this.calculateVerificationScore(request.socialAccounts);
      
      console.log(`✅ Manual verification successful for ${platform}: ${account.username}`);
      return true;
    } else {
      account.verificationStatus = 'failed';
      console.log(`❌ Manual verification failed for ${platform}: ${account.username}`);
      return false;
    }
  }

  /**
   * Validate manual verification submission
   */
  private async validateManualSubmission(
    platform: SocialPlatform['id'],
    verificationData: any
  ): Promise<boolean> {
    // This would typically involve:
    // 1. Checking if the post/tweet exists
    // 2. Verifying the verification code
    // 3. Checking if it's from the correct account
    // For now, we'll simulate this
    return Math.random() > 0.3; // 70% success rate for demo
  }

  /**
   * Generate verification code with emojis
   */
  private generateVerificationCode(): string {
    return `LOS${Math.random().toString(36).substr(2, 6).toUpperCase()}🎯`;
  }

  /**
   * Get verification request
   */
  getVerificationRequest(verificationId: string): VerificationRequest | null {
    return this.verificationRequests.get(verificationId) || null;
  }

  /**
   * Get wallet social accounts
   */
  getWalletSocialAccounts(walletAddress: string): SocialAccount[] {
    return this.socialAccounts.get(walletAddress) || [];
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SocialVerificationConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('✅ Social verification config updated');
  }

  /**
   * Get all verification requests (admin function)
   */
  getAllVerificationRequests(): VerificationRequest[] {
    return Array.from(this.verificationRequests.values());
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalVerifiedAccounts: number;
    averageScore: number;
  } {
    const requests = Array.from(this.verificationRequests.values());
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
    
    const allAccounts = Array.from(this.socialAccounts.values()).flat();
    const verifiedAccounts = allAccounts.filter(a => a.verificationStatus === 'verified');
    
    const averageScore = approvedRequests > 0 
      ? requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.totalScore, 0) / approvedRequests
      : 0;

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalVerifiedAccounts: verifiedAccounts.length,
      averageScore: Math.floor(averageScore)
    };
  }
}

export const socialVerificationService = new SocialVerificationService();
