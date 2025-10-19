/**
 * TWITTER API SERVICE
 * Handles Twitter API v2 integration for tweet verification
 */

interface TwitterApiConfig {
  bearerToken: string;
  apiVersion: string;
}

interface TweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

interface UserData {
  id: string;
  username: string;
  name: string;
  verified: boolean;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

interface TwitterApiResponse {
  data?: TweetData;
  includes?: {
    users: UserData[];
  };
  errors?: Array<{
    detail: string;
    title: string;
  }>;
  meta?: {
    result_count: number;
  };
}

class TwitterApiService {
  private config: TwitterApiConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      apiVersion: 'v2'
    };
    this.baseUrl = `https://api.twitter.com/${this.config.apiVersion}`;
  }

  /**
   * Check if Twitter API is configured
   */
  isConfigured(): boolean {
    return !!this.config.bearerToken;
  }

  /**
   * Get tweet data by ID
   */
  async getTweet(tweetId: string): Promise<{
    success: boolean;
    data?: TweetData;
    user?: UserData;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twitter API not configured. Please set TWITTER_BEARER_TOKEN environment variable.'
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/${tweetId}?tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=verified,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Twitter API error: ${response.status} - ${errorData.detail || response.statusText}`
        };
      }

      const data: TwitterApiResponse = await response.json();

      if (data.errors && data.errors.length > 0) {
        return {
          success: false,
          error: `Twitter API error: ${data.errors[0].title} - ${data.errors[0].detail}`
        };
      }

      const user = data.includes?.users?.[0];

      return {
        success: true,
        data: data.data,
        user: user
      };

    } catch (error) {
      console.error('Twitter API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verify tweet content contains referral code and platform mention
   */
  async verifyTweetContent(tweetId: string, referralCode: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
    tweetData?: TweetData;
    userData?: UserData;
  }> {
    const tweetResult = await this.getTweet(tweetId);

    if (!tweetResult.success) {
      return {
        success: false,
        message: tweetResult.error || 'Failed to fetch tweet',
        details: { tweetId, referralCode }
      };
    }

    const { data: tweet, user } = tweetResult;

    if (!tweet || !user) {
      return {
        success: false,
        message: 'Tweet or user data not found',
        details: { tweetId, referralCode }
      };
    }

    // Check if tweet contains referral code
    const tweetTextLower = tweet.text.toLowerCase();
    const referralCodeLower = referralCode.toLowerCase();

    if (!tweetTextLower.includes(referralCodeLower)) {
      return {
        success: false,
        message: 'Tweet does not contain the specified referral code',
        details: {
          expectedCode: referralCode,
          tweetText: tweet.text,
          tweetId
        },
        tweetData: tweet,
        userData: user
      };
    }

    // Check if tweet mentions the platform
    const platformMentions = [
      '@onlyanal.fun',
      '#analosnft',
      '#nftlaunchpad',
      'onlyanal',
      'analos nft',
      'analos'
    ];

    const hasPlatformMention = platformMentions.some(mention => 
      tweetTextLower.includes(mention.toLowerCase())
    );

    if (!hasPlatformMention) {
      return {
        success: false,
        message: 'Tweet must mention @onlyanal.fun or include #AnalosNFT hashtag',
        details: {
          tweetText: tweet.text,
          requiredMentions: platformMentions,
          tweetId
        },
        tweetData: tweet,
        userData: user
      };
    }

    // Check if tweet is recent (within last 30 days)
    const tweetDate = new Date(tweet.created_at);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (tweetDate < thirtyDaysAgo) {
      return {
        success: false,
        message: 'Tweet must be posted within the last 30 days',
        details: {
          tweetDate: tweet.created_at,
          tweetId
        },
        tweetData: tweet,
        userData: user
      };
    }

    // Check if user account is legitimate (basic checks)
    const isLegitimateAccount = (
      user.public_metrics.followers_count >= 10 || // At least 10 followers
      user.verified || // Verified account
      user.public_metrics.tweet_count >= 50 // At least 50 tweets
    );

    if (!isLegitimateAccount) {
      return {
        success: false,
        message: 'Account does not meet minimum verification requirements',
        details: {
          followersCount: user.public_metrics.followers_count,
          tweetCount: user.public_metrics.tweet_count,
          isVerified: user.verified,
          username: user.username
        },
        tweetData: tweet,
        userData: user
      };
    }

    return {
      success: true,
      message: 'Tweet verification successful',
      details: {
        tweetId,
        referralCode,
        username: user.username,
        followersCount: user.public_metrics.followers_count,
        engagement: tweet.public_metrics,
        tweetDate: tweet.created_at
      },
      tweetData: tweet,
      userData: user
    };
  }

  /**
   * Search for tweets by query (for advanced verification)
   */
  async searchTweets(query: string, maxResults: number = 10): Promise<{
    success: boolean;
    tweets?: TweetData[];
    users?: UserData[];
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twitter API not configured'
      };
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=verified,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Twitter API error: ${response.status} - ${errorData.detail || response.statusText}`
        };
      }

      const data: TwitterApiResponse = await response.json();

      return {
        success: true,
        tweets: data.data ? [data.data] : [],
        users: data.includes?.users || []
      };

    } catch (error) {
      console.error('Twitter search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const twitterApiService = new TwitterApiService();

// Export types
export type { TweetData, UserData, TwitterApiResponse };
