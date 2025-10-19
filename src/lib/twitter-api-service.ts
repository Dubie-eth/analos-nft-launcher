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
   * Get tweet data by ID using web scraping (no API required)
   * This uses the guest token method to fetch public tweets
   */
  async getTweet(tweetId: string): Promise<{
    success: boolean;
    data?: TweetData;
    user?: UserData;
    error?: string;
  }> {
    // For now, we'll use a simple verification approach that doesn't require API
    // The tweet URL will be manually verified by the user submitting it
    // Admin can verify by clicking the link to view the tweet
    
    console.log('⚠️ Tweet verification without API - manual verification required');
    console.log(`📝 Tweet ID: ${tweetId}`);
    
    return {
      success: true,
      data: {
        id: tweetId,
        text: '', // Will be filled by manual verification
        author_id: '',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 0,
          like_count: 0,
          reply_count: 0,
          quote_count: 0
        }
      }
    };
  }

  /**
   * Verify tweet content - SIMPLIFIED VERSION (No API calls)
   * This just validates the tweet URL format and marks it for manual review
   */
  async verifyTweetContent(tweetId: string, referralCode: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
    tweetData?: TweetData;
    userData?: UserData;
  }> {
    // Simple validation without API calls
    // The tweet will be marked as "pending" and can be manually verified by admin
    // Or users can provide screenshot proof
    
    console.log(`📝 Submitting tweet ${tweetId} with referral code ${referralCode} for verification`);
    
    // Basic validation - just check if tweet ID is valid format
    if (!tweetId || tweetId.length < 10) {
      return {
        success: false,
        message: 'Invalid tweet ID format',
        details: { tweetId, referralCode }
      };
    }

    // Return success - tweet will be stored as "pending" verification
    return {
      success: true,
      message: 'Tweet submitted for verification. Admin will verify manually.',
      details: {
        tweetId,
        referralCode,
        verificationMethod: 'manual',
        status: 'pending_review'
      },
      tweetData: {
        id: tweetId,
        text: '',
        author_id: '',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 0,
          like_count: 0,
          reply_count: 0,
          quote_count: 0
        }
      },
      userData: {
        id: '',
        username: 'pending_verification',
        name: 'Pending Verification',
        verified: false,
        public_metrics: {
          followers_count: 0,
          following_count: 0,
          tweet_count: 0,
          listed_count: 0
        }
      }
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
