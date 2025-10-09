/**
 * Verification Config Manager
 * Allows easy adjustment of social media verification requirements
 * Can be updated without code changes for different phases of the platform
 */

export interface VerificationThresholds {
  // Platform minimums
  twitter: {
    minFollowers: number;
    enabled: boolean;
  };
  telegram: {
    minMembers: number;
    enabled: boolean;
  };
  discord: {
    minServerMembers: number;
    enabled: boolean;
  };
  
  // Scoring system
  scoring: {
    twitterFollowerMultiplier: number;
    telegramMemberMultiplier: number;
    discordMemberMultiplier: number;
    verifiedAccountBonus: number;
    multiplePlatformBonus: number;
  };
  
  // Overall requirements
  requiredScore: number;
  maxVerificationAge: number; // days
}

export class VerificationConfigManager {
  private readonly CONFIG_KEY = 'verification_config';
  private readonly DEFAULT_CONFIG: VerificationThresholds;

  constructor() {
    this.DEFAULT_CONFIG = this.getDefaultConfig();
    this.initializeConfig();
  }

  /**
   * Get default configuration for new collections (lenient)
   */
  private getDefaultConfig(): VerificationThresholds {
    return {
      twitter: {
        minFollowers: 1, // Just 1 follower minimum
        enabled: true
      },
      telegram: {
        minMembers: 1, // Just 1 member minimum
        enabled: true
      },
      discord: {
        minServerMembers: 1, // Just 1 member minimum
        enabled: true
      },
      scoring: {
        twitterFollowerMultiplier: 1.0, // 1 follower = 1 point
        telegramMemberMultiplier: 1.0,  // 1 member = 1 point
        discordMemberMultiplier: 1.0,   // 1 member = 1 point
        verifiedAccountBonus: 10,       // +10 points for verified accounts
        multiplePlatformBonus: 5        // +5 points for multiple platforms
      },
      requiredScore: 10, // Just 10 points required (1 follower + 1 tweet = 10+ points)
      maxVerificationAge: 90 // 90 days before re-verification needed
    };
  }

  /**
   * Initialize configuration in localStorage (SSR-safe)
   */
  private initializeConfig(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      if (!localStorage.getItem(this.CONFIG_KEY)) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.DEFAULT_CONFIG));
        console.log('✅ Verification config initialized with lenient settings');
      }
    }
  }

  /**
   * Get current verification configuration (SSR-safe)
   */
  getConfig(): VerificationThresholds {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.CONFIG_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading verification config:', error);
    }
    return this.DEFAULT_CONFIG;
  }

  /**
   * Update verification configuration (admin function, SSR-safe)
   */
  updateConfig(updates: Partial<VerificationThresholds>): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const currentConfig = this.getConfig();
        const updatedConfig = { ...currentConfig, ...updates };
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(updatedConfig));
        console.log('✅ Verification config updated:', updatedConfig);
      }
    } catch (error) {
      console.error('Error updating verification config:', error);
    }
  }

  /**
   * Reset to default configuration (SSR-safe)
   */
  resetToDefault(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.DEFAULT_CONFIG));
      console.log('✅ Verification config reset to default');
    }
  }

  /**
   * Get preset configurations for different phases
   */
  getPresetConfigs(): Record<string, VerificationThresholds> {
    return {
      // Phase 1: New collections (current - very lenient)
      'new_collections': {
        twitter: { minFollowers: 1, enabled: true },
        telegram: { minMembers: 1, enabled: true },
        discord: { minServerMembers: 1, enabled: true },
        scoring: {
          twitterFollowerMultiplier: 1.0,
          telegramMemberMultiplier: 1.0,
          discordMemberMultiplier: 1.0,
          verifiedAccountBonus: 10,
          multiplePlatformBonus: 5
        },
        requiredScore: 10,
        maxVerificationAge: 90
      },

      // Phase 2: Growing platform (moderate)
      'growing_platform': {
        twitter: { minFollowers: 100, enabled: true },
        telegram: { minMembers: 50, enabled: true },
        discord: { minServerMembers: 100, enabled: true },
        scoring: {
          twitterFollowerMultiplier: 0.1,
          telegramMemberMultiplier: 0.2,
          discordMemberMultiplier: 0.1,
          verifiedAccountBonus: 50,
          multiplePlatformBonus: 25
        },
        requiredScore: 100,
        maxVerificationAge: 60
      },

      // Phase 3: Established platform (strict)
      'established_platform': {
        twitter: { minFollowers: 1000, enabled: true },
        telegram: { minMembers: 500, enabled: true },
        discord: { minServerMembers: 1000, enabled: true },
        scoring: {
          twitterFollowerMultiplier: 0.001,
          telegramMemberMultiplier: 0.01,
          discordMemberMultiplier: 0.005,
          verifiedAccountBonus: 100,
          multiplePlatformBonus: 50
        },
        requiredScore: 500,
        maxVerificationAge: 30
      }
    };
  }

  /**
   * Apply preset configuration
   */
  applyPreset(presetName: string): boolean {
    const presets = this.getPresetConfigs();
    if (presets[presetName]) {
      this.updateConfig(presets[presetName]);
      console.log(`✅ Applied preset configuration: ${presetName}`);
      return true;
    }
    console.error(`❌ Preset not found: ${presetName}`);
    return false;
  }

  /**
   * Get configuration summary for display
   */
  getConfigSummary(): {
    phase: string;
    difficulty: 'Very Easy' | 'Easy' | 'Moderate' | 'Strict';
    requirements: string[];
    estimatedTime: string;
  } {
    const config = this.getConfig();
    const presets = this.getPresetConfigs();
    
    // Determine which preset matches current config
    let phase = 'custom';
    let difficulty: 'Very Easy' | 'Easy' | 'Moderate' | 'Strict' = 'Easy';
    
    if (JSON.stringify(config) === JSON.stringify(presets.new_collections)) {
      phase = 'New Collections';
      difficulty = 'Very Easy';
    } else if (JSON.stringify(config) === JSON.stringify(presets.growing_platform)) {
      phase = 'Growing Platform';
      difficulty = 'Moderate';
    } else if (JSON.stringify(config) === JSON.stringify(presets.established_platform)) {
      phase = 'Established Platform';
      difficulty = 'Strict';
    }

    const requirements: string[] = [];
    if (config.twitter.enabled) {
      requirements.push(`Twitter: ${config.twitter.minFollowers}+ followers`);
    }
    if (config.telegram.enabled) {
      requirements.push(`Telegram: ${config.telegram.minMembers}+ members`);
    }
    if (config.discord.enabled) {
      requirements.push(`Discord: ${config.discord.minServerMembers}+ members`);
    }
    requirements.push(`Total Score: ${config.requiredScore}+ points`);

    const estimatedTime = difficulty === 'Very Easy' ? '1-2 minutes' : 
                         difficulty === 'Easy' ? '5-10 minutes' :
                         difficulty === 'Moderate' ? '15-30 minutes' : '30+ minutes';

    return {
      phase,
      difficulty,
      requirements,
      estimatedTime
    };
  }
}

// Export singleton instance
export const verificationConfigManager = new VerificationConfigManager();
