// Social verification service for Discord and Telegram
export interface VerificationResult {
  success: boolean;
  isMember: boolean;
  platform: 'discord' | 'telegram';
  error?: string;
}

export class VerificationService {
  /**
   * Verify Discord server membership
   */
  static async verifyDiscordMembership(
    userId: string,
    serverId: string,
    accessToken: string
  ): Promise<VerificationResult> {
    try {
      const response = await fetch('/api/verify/discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          serverId,
          accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          isMember: false,
          platform: 'discord',
          error: data.error || 'Discord verification failed',
        };
      }

      return {
        success: true,
        isMember: data.isMember,
        platform: 'discord',
      };
    } catch (error) {
      console.error('Discord verification error:', error);
      return {
        success: false,
        isMember: false,
        platform: 'discord',
        error: 'Network error during Discord verification',
      };
    }
  }

  /**
   * Verify Telegram group membership
   */
  static async verifyTelegramMembership(
    userId: string,
    groupId: string,
    botToken: string
  ): Promise<VerificationResult> {
    try {
      const response = await fetch('/api/verify/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          groupId,
          botToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          isMember: false,
          platform: 'telegram',
          error: data.error || 'Telegram verification failed',
        };
      }

      return {
        success: true,
        isMember: data.isMember,
        platform: 'telegram',
      };
    } catch (error) {
      console.error('Telegram verification error:', error);
      return {
        success: false,
        isMember: false,
        platform: 'telegram',
        error: 'Network error during Telegram verification',
      };
    }
  }

  /**
   * Verify all required social platforms for whitelist
   */
  static async verifyAllSocialRequirements(
    requirements: {
      discord?: { serverId: string; accessToken: string };
      telegram?: { groupId: string; botToken: string };
    },
    userInfo: {
      discordUserId?: string;
      telegramUserId?: string;
    }
  ): Promise<{
    discord?: VerificationResult;
    telegram?: VerificationResult;
    allVerified: boolean;
  }> {
    const results: any = {};
    let allVerified = true;

    // Verify Discord if required
    if (requirements.discord && userInfo.discordUserId) {
      results.discord = await this.verifyDiscordMembership(
        userInfo.discordUserId,
        requirements.discord.serverId,
        requirements.discord.accessToken
      );
      if (!results.discord.isMember) allVerified = false;
    }

    // Verify Telegram if required
    if (requirements.telegram && userInfo.telegramUserId) {
      results.telegram = await this.verifyTelegramMembership(
        userInfo.telegramUserId,
        requirements.telegram.groupId,
        requirements.telegram.botToken
      );
      if (!results.telegram.isMember) allVerified = false;
    }

    return {
      ...results,
      allVerified,
    };
  }
}

// Helper function to get Discord OAuth URL
export function getDiscordOAuthUrl(clientId: string, redirectUri: string, scopes: string[] = ['guilds', 'identify']): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
  });
  
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

// Helper function to get Telegram Bot URL for group setup
export function getTelegramBotSetupUrl(botUsername: string, groupId: string): string {
  return `https://t.me/${botUsername}?startgroup=${groupId}`;
}
