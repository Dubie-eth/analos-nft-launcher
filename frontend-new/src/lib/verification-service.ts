/**
 * Verification Service - Handles social media verification and verified collection badges
 * Creates trust through social media connection without endorsing content
 */

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  verificationUrl: string;
  isRequired: boolean;
  description: string;
}

export interface VerificationStatus {
  isVerified: boolean;
  verifiedPlatforms: string[];
  verificationDate: string;
  verificationId: string;
  badgeUrl: string;
}

export interface CollectionVerification {
  collectionId: string;
  collectionName: string;
  ownerWallet: string;
  verificationStatus: VerificationStatus;
  socialLinks: Record<string, string>;
  badgeDisplay: {
    showBadge: boolean;
    badgePosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    badgeSize: 'small' | 'medium' | 'large';
  };
}

export interface VerificationRequirements {
  minimumPlatforms: number;
  requiredPlatforms: string[];
  optionalPlatforms: string[];
  verificationPeriod: number; // days before re-verification needed
}

export class VerificationService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://analos-nft-launcher-production-f3da.up.railway.app';
  }

  /**
   * Get available social platforms for verification
   */
  getSocialPlatforms(): SocialPlatform[] {
    return [
      {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: '𝕏',
        color: '#000000',
        verificationUrl: 'https://twitter.com',
        isRequired: false,
        description: 'Connect your X (Twitter) account'
      },
      {
        id: 'discord',
        name: 'Discord',
        icon: '🎮',
        color: '#5865F2',
        verificationUrl: 'https://discord.com',
        isRequired: false,
        description: 'Connect your Discord server'
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: '✈️',
        color: '#0088CC',
        verificationUrl: 'https://telegram.org',
        isRequired: false,
        description: 'Connect your Telegram channel'
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        color: '#E4405F',
        verificationUrl: 'https://instagram.com',
        isRequired: false,
        description: 'Connect your Instagram account'
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: '📺',
        color: '#FF0000',
        verificationUrl: 'https://youtube.com',
        isRequired: false,
        description: 'Connect your YouTube channel'
      },
      {
        id: 'website',
        name: 'Website',
        icon: '🌐',
        color: '#4285F4',
        verificationUrl: '',
        isRequired: false,
        description: 'Connect your official website'
      }
    ];
  }

  /**
   * Get verification requirements
   */
  getVerificationRequirements(): VerificationRequirements {
    return {
      minimumPlatforms: 1, // At least one social platform required
      requiredPlatforms: [], // No specific platforms required
      optionalPlatforms: ['twitter', 'discord', 'telegram', 'instagram', 'youtube', 'website'],
      verificationPeriod: 0 // Permanent verification - no re-verification needed
    };
  }

  /**
   * Start verification process for a collection
   */
  async startVerification(
    collectionId: string,
    ownerWallet: string,
    platform: 'twitter' | 'discord' | 'telegram' | 'instagram' | 'tiktok',
    accountHandle: string
  ): Promise<{
    verificationId: string;
    verificationCode: string;
    verificationUrl: string;
    expiresAt: string;
    instructions: string;
  }> {
    const url = `${this.backendUrl.replace(/\/$/, '')}/api/verification/start`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionId,
        ownerWallet,
        platform,
        accountHandle,
        socialLinks: {}, // Will be populated later
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start verification');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Complete verification by providing proof
   */
  async completeVerification(
    verificationId: string,
    proofData: {
      platform: string;
      proofType: 'post' | 'bio' | 'website' | 'custom';
      proofContent: string;
      proofUrl?: string;
    }[]
  ): Promise<VerificationStatus> {
    const url = `${this.backendUrl.replace(/\/$/, '')}/api/verification/complete`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verificationId,
        proofData,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete verification');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get verification status for a collection
   */
  async getVerificationStatus(collectionId: string): Promise<CollectionVerification | null> {
    const url = `${this.backendUrl.replace(/\/$/, '')}/api/verification/status/${collectionId}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No verification found
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get verification status');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update collection badge settings
   */
  async updateBadgeSettings(
    collectionId: string,
    badgeDisplay: CollectionVerification['badgeDisplay']
  ): Promise<void> {
    const url = `${this.backendUrl.replace(/\/$/, '')}/api/verification/badge-settings`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionId,
        badgeDisplay
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update badge settings');
    }
  }

  /**
   * Generate verification badge URL
   */
  generateBadgeUrl(verificationStatus: VerificationStatus, size: string = 'medium'): string {
    const baseUrl = `${this.backendUrl}/api/verification/badge`;
    const params = new URLSearchParams({
      id: verificationStatus.verificationId,
      size: size,
      platforms: verificationStatus.verifiedPlatforms.join(',')
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Validate social media links
   */
  validateSocialLinks(links: Record<string, string>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const platforms = this.getSocialPlatforms();

    // Check if at least one platform is provided
    const providedPlatforms = Object.keys(links).filter(key => links[key]?.trim());
    if (providedPlatforms.length === 0) {
      errors.push('At least one social media platform must be connected');
    }

    // Validate each provided link
    Object.entries(links).forEach(([platform, url]) => {
      if (!url?.trim()) return;

      const platformConfig = platforms.find(p => p.id === platform);
      if (!platformConfig) {
        errors.push(`Unknown platform: ${platform}`);
        return;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid URL for ${platformConfig.name}: ${url}`);
        return;
      }

      // Platform-specific validation
      switch (platform) {
        case 'twitter':
          if (!url.includes('twitter.com') && !url.includes('x.com')) {
            warnings.push(`Twitter URL should be from twitter.com or x.com`);
          }
          break;
        case 'discord':
          if (!url.includes('discord.gg') && !url.includes('discord.com')) {
            warnings.push(`Discord URL should be an invite link or profile link`);
          }
          break;
        case 'telegram':
          if (!url.includes('t.me') && !url.includes('telegram.me')) {
            warnings.push(`Telegram URL should be from t.me or telegram.me`);
          }
          break;
        case 'instagram':
          if (!url.includes('instagram.com')) {
            warnings.push(`Instagram URL should be from instagram.com`);
          }
          break;
        case 'youtube':
          if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            warnings.push(`YouTube URL should be from youtube.com or youtu.be`);
          }
          break;
        case 'website':
          if (!url.startsWith('https://')) {
            warnings.push(`Website URL should use HTTPS for security`);
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get verification badge HTML for embedding
   */
  getBadgeHTML(
    verificationStatus: VerificationStatus,
    options: {
      size?: 'small' | 'medium' | 'large';
      position?: 'inline' | 'float-right' | 'float-left';
      showText?: boolean;
    } = {}
  ): string {
    const { size = 'medium', position = 'inline', showText = true } = options;
    
    const badgeUrl = this.generateBadgeUrl(verificationStatus, size);
    const sizeClasses = {
      small: 'w-6 h-6',
      medium: 'w-8 h-8',
      large: 'w-12 h-12'
    };
    
    const positionClasses = {
      inline: '',
      'float-right': 'float-right ml-2',
      'float-left': 'float-left mr-2'
    };

    const text = showText ? 'Verified Collection' : '';

    return `
      <div class="verified-badge ${positionClasses[position]}" title="Verified Collection - Social Media Connected">
        <img src="${badgeUrl}" alt="Verified Collection" class="${sizeClasses[size]} inline-block" />
        ${text ? `<span class="text-xs text-gray-600 ml-1">${text}</span>` : ''}
      </div>
    `;
  }

  /**
   * Check if verification is expired
   * Verification is permanent and only expires if wallet changes
   */
  isVerificationExpired(verificationDate: string): boolean {
    // Verification never expires - it's permanent once verified
    return false;
  }

  /**
   * Get verification disclaimer text
   */
  getVerificationDisclaimer(): string {
    return "✅ This verified badge indicates that the collection creator has connected at least one social media account and verified ownership with their wallet. Verification is permanent unless the wallet changes. This does not constitute an endorsement of the collection or its content by LosLauncher. Please conduct your own research before making any purchases.";
  }

  /**
   * Check if wallet has changed for a collection
   * This would trigger re-verification
   */
  async checkWalletChange(collectionId: string, currentWallet: string): Promise<boolean> {
    try {
      const verification = await this.getVerificationStatus(collectionId);
      if (!verification) {
        return false; // No verification exists
      }
      
      // Check if the wallet has changed
      return verification.ownerWallet.toLowerCase() !== currentWallet.toLowerCase();
    } catch (error) {
      console.error('❌ Error checking wallet change:', error);
      return false;
    }
  }
}

export const verificationService = new VerificationService();
