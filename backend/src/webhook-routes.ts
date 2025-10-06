/**
 * Webhook Routes for Social Verification
 * Handles incoming webhooks from social media platforms
 */

import { Request, Response } from 'express';
import { socialVerificationService } from './lib/social-verification-service';

export interface TwitterWebhookPayload {
  for_user_id: string;
  user_has_blocked: boolean;
  tweet_create_events?: Array<{
    id: string;
    text: string;
    user: {
      id: string;
      screen_name: string;
      name: string;
      followers_count: number;
      verified: boolean;
      profile_image_url: string;
    };
  }>;
}

export interface TelegramWebhookPayload {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name: string;
      last_name?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    text?: string;
    date: number;
  };
}

export interface DiscordWebhookPayload {
  id: string;
  type: number;
  data: {
    content: string;
    author: {
      id: string;
      username: string;
      discriminator: string;
      avatar?: string;
      verified?: boolean;
    };
    guild_id?: string;
    channel_id: string;
  };
}

/**
 * Twitter/X Webhook Handler
 */
export const handleTwitterWebhook = async (req: Request, res: Response) => {
  try {
    const payload: TwitterWebhookPayload = req.body;
    
    console.log('🐦 Twitter webhook received:', JSON.stringify(payload, null, 2));

    // Verify webhook signature (implement proper verification)
    const signature = req.headers['x-twitter-webhooks-signature'] as string;
    if (!verifyTwitterSignature(signature, JSON.stringify(payload))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process tweet creation events
    if (payload.tweet_create_events) {
      for (const event of payload.tweet_create_events) {
        await processTwitterTweet(event);
      }
    }

    // Handle challenge-response for webhook setup
    if (req.query.crc_token) {
      const challengeResponse = generateTwitterChallengeResponse(req.query.crc_token as string);
      return res.status(200).json({ response_token: challengeResponse });
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Twitter webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Telegram Webhook Handler
 */
export const handleTelegramWebhook = async (req: Request, res: Response) => {
  try {
    const payload: TelegramWebhookPayload = req.body;
    
    console.log('✈️ Telegram webhook received:', JSON.stringify(payload, null, 2));

    // Process messages
    if (payload.message) {
      await processTelegramMessage(payload.message);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Discord Webhook Handler
 */
export const handleDiscordWebhook = async (req: Request, res: Response) => {
  try {
    const payload: DiscordWebhookPayload = req.body;
    
    console.log('💬 Discord webhook received:', JSON.stringify(payload, null, 2));

    // Verify webhook signature
    const signature = req.headers['x-signature-ed25519'] as string;
    const timestamp = req.headers['x-signature-timestamp'] as string;
    
    if (!verifyDiscordSignature(signature, timestamp, JSON.stringify(payload))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process message events
    if (payload.type === 0) { // MESSAGE_CREATE
      await processDiscordMessage(payload.data);
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('❌ Discord webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Process Twitter tweet for verification
 */
async function processTwitterTweet(event: {
  text: string;
  user: {
    id: string;
    screen_name: string;
    name: string;
    followers_count: number;
    verified: boolean;
    profile_image_url: string;
  };
}) {
  try {
    const { text, user } = event;
    
    // Check if tweet contains verification code
    const verificationCodeMatch = text.match(/Code:\s*([A-Z0-9]{8})/);
    if (!verificationCodeMatch) return;

    const verificationCode = verificationCodeMatch[1];
    console.log(`🔍 Found verification code in tweet: ${verificationCode}`);

    // Find pending verification with this code
    const requests = socialVerificationService.getAllVerificationRequests();
    for (const request of requests) {
      const twitterAccount = request.socialAccounts.find(
        (a: any) => a.platform === 'twitter' && 
             a.verificationData?.verificationCode === verificationCode
      );

      if (twitterAccount && twitterAccount.verificationStatus === 'pending') {
        // Update account with real data
        twitterAccount.followerCount = user.followers_count;
        twitterAccount.isVerified = user.verified;
        twitterAccount.displayName = user.name;
        twitterAccount.profilePicture = user.profile_image_url;
        twitterAccount.verificationStatus = 'verified';
        twitterAccount.verifiedAt = new Date();
        twitterAccount.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        console.log(`✅ Twitter verification completed for @${user.screen_name}`);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error processing Twitter tweet:', error);
  }
}

/**
 * Process Telegram message for verification
 */
async function processTelegramMessage(message: {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  text?: string;
  date: number;
}) {
  try {
    const { text, from, chat } = message;
    
    // Check if message contains verification code
    const verificationCodeMatch = text?.match(/Code:\s*([A-Z0-9]{8})/);
    if (!verificationCodeMatch) return;

    const verificationCode = verificationCodeMatch[1];
    console.log(`🔍 Found verification code in Telegram message: ${verificationCode}`);

    // Find pending verification with this code
    const requests = socialVerificationService.getAllVerificationRequests();
    for (const request of requests) {
      const telegramAccount = request.socialAccounts.find(
        (a: any) => a.platform === 'telegram' && 
             a.verificationData?.verificationCode === verificationCode
      );

      if (telegramAccount && telegramAccount.verificationStatus === 'pending') {
        // Update account with real data
        telegramAccount.userId = from.id.toString();
        telegramAccount.displayName = `${from.first_name} ${from.last_name || ''}`.trim();
        telegramAccount.verificationStatus = 'verified';
        telegramAccount.verifiedAt = new Date();
        telegramAccount.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        console.log(`✅ Telegram verification completed for @${from.username || from.first_name}`);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error processing Telegram message:', error);
  }
}

/**
 * Process Discord message for verification
 */
async function processDiscordMessage(messageData: {
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    verified?: boolean;
  };
}) {
  try {
    const { content, author } = messageData;
    
    // Check if message contains verification code
    const verificationCodeMatch = content?.match(/Code:\s*([A-Z0-9]{8})/);
    if (!verificationCodeMatch) return;

    const verificationCode = verificationCodeMatch[1];
    console.log(`🔍 Found verification code in Discord message: ${verificationCode}`);

    // Find pending verification with this code
    const requests = socialVerificationService.getAllVerificationRequests();
    for (const request of requests) {
      const discordAccount = request.socialAccounts.find(
        (a: any) => a.platform === 'discord' && 
             a.verificationData?.verificationCode === verificationCode
      );

      if (discordAccount && discordAccount.verificationStatus === 'pending') {
        // Update account with real data
        discordAccount.userId = author.id;
        discordAccount.displayName = author.username;
        discordAccount.isVerified = author.verified || false;
        discordAccount.profilePicture = author.avatar ? 
          `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png` : undefined;
        discordAccount.verificationStatus = 'verified';
        discordAccount.verifiedAt = new Date();
        discordAccount.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        console.log(`✅ Discord verification completed for ${author.username}#${author.discriminator}`);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error processing Discord message:', error);
  }
}

/**
 * Verify Twitter webhook signature
 */
function verifyTwitterSignature(signature: string, payload: string): boolean {
  // Implement proper Twitter signature verification
  // This is a simplified version - implement proper HMAC verification
  return !!(signature && signature.length > 0);
}

/**
 * Generate Twitter challenge response
 */
function generateTwitterChallengeResponse(crcToken: string): string {
  const crypto = require('crypto');
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  
  if (!consumerSecret) {
    throw new Error('Twitter consumer secret not configured');
  }

  return crypto
    .createHmac('sha256', consumerSecret)
    .update(crcToken)
    .digest('base64');
}

/**
 * Verify Discord webhook signature
 */
function verifyDiscordSignature(signature: string, timestamp: string, payload: string): boolean {
  // Implement proper Discord signature verification
  // This is a simplified version - implement proper Ed25519 verification
  return !!(signature && timestamp && signature.length > 0);
}

/**
 * Social Verification API Routes
 */
export const socialVerificationRoutes = {
  // Start verification process
  startVerification: async (req: Request, res: Response) => {
    try {
      const { walletAddress, socialAccounts } = req.body;
      
      if (!walletAddress || !socialAccounts || !Array.isArray(socialAccounts)) {
        return res.status(400).json({ error: 'Invalid request data' });
      }

      const verificationRequest = await socialVerificationService.startVerification(
        walletAddress,
        socialAccounts
      );

      res.status(200).json({
        success: true,
        verificationId: verificationRequest.id,
        status: verificationRequest.status
      });
    } catch (error) {
      console.error('❌ Error starting verification:', error);
      res.status(500).json({ error: 'Failed to start verification' });
    }
  },

  // Get verification status
  getVerificationStatus: async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      const accounts = socialVerificationService.getWalletSocialAccounts(walletAddress);
      const eligibility = socialVerificationService.checkWhitelistEligibility(walletAddress);

      res.status(200).json({
        success: true,
        accounts,
        eligibility
      });
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      res.status(500).json({ error: 'Failed to get verification status' });
    }
  },

  // Submit manual verification
  submitManualVerification: async (req: Request, res: Response) => {
    try {
      const { verificationId, platform, verificationData } = req.body;
      
      const success = await socialVerificationService.submitManualVerification(
        verificationId,
        platform,
        verificationData
      );

      res.status(200).json({
        success,
        message: success ? 'Verification submitted successfully' : 'Verification failed'
      });
    } catch (error) {
      console.error('❌ Error submitting manual verification:', error);
      res.status(500).json({ error: 'Failed to submit verification' });
    }
  },

  // Get verification statistics (admin)
  getVerificationStats: async (req: Request, res: Response) => {
    try {
      const stats = socialVerificationService.getVerificationStats();
      
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('❌ Error getting verification stats:', error);
      res.status(500).json({ error: 'Failed to get verification stats' });
    }
  }
};
