# Social Verification System Guide

## Overview
Simple tweet-based social verification system with manual admin review. No expensive Twitter API needed!

## How It Works

### For Users:
1. **Connect Wallet & Create Profile** → Get unique referral code based on your username (e.g., `DUBIE` for username "dubie")
2. **Tweet Referral Code** → Post on Twitter with your code and @onlyanal.fun mention
3. **Submit Tweet URL** → Paste tweet URL in the verification form
4. **Wait for Admin Review** → Admin reviews within 24 hours
5. **Earn Rewards** → Get 100 points once approved!

### For Admins:
1. **Access Admin Dashboard** → Connect admin wallet and navigate to "Social Verification" tab
2. **Review Pending Tweets** → View all pending verification requests
3. **Click "View Tweet on Twitter"** → Verify the tweet contains the referral code and platform mention
4. **Approve or Reject** → Click approve to award 100 points, or reject with optional reason

## Database Setup

Run this SQL script in your Supabase SQL editor:

```sql
-- Run the setup script
\i scripts/setup-social-verification.sql
```

Or manually create the tables:

```sql
-- Create social_verifications table
CREATE TABLE IF NOT EXISTS social_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'discord', 'telegram')),
  tweet_id TEXT,
  tweet_url TEXT,
  referral_code TEXT NOT NULL,
  username TEXT NOT NULL,
  follower_count INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table for tracking points
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_verifications_wallet ON social_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_verifications_platform ON social_verifications(platform);
CREATE INDEX IF NOT EXISTS idx_social_verifications_status ON social_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_activities_wallet ON user_activities(wallet_address);
```

## Features

### Cost Savings
- ✅ **No Twitter API** - Save expensive API fees
- ✅ **Simple Workflow** - No complex authentication
- ✅ **Manual Review** - Better fraud prevention
- ✅ **Quality Control** - Human verification ensures authenticity

### User Benefits
- 🎁 **100 Points** per verified tweet
- 🚀 **Priority Access** to new features
- 🏆 **Build Reputation** in the community
- 📈 **Leaderboard Ranking** based on points

### Admin Tools
- 📊 **Pending Queue** - View all pending verifications
- ✅ **One-Click Approval** - Quick approve/reject actions
- 🔗 **Direct Tweet Links** - Click to view tweet on Twitter
- 📈 **Statistics** - Track verification metrics

## API Endpoints

### User Endpoints

#### Submit Tweet for Verification
```typescript
POST /api/social-verification/twitter
{
  "walletAddress": "86oK6fa5...",
  "tweetUrl": "https://twitter.com/username/status/123...",
  "referralCode": "ABC123"
}

Response:
{
  "success": true,
  "message": "Tweet submitted for verification!",
  "verification": { ... },
  "note": "You will receive 100 points once admin verifies your tweet."
}
```

#### Check Verification Status
```typescript
GET /api/social-verification/twitter?walletAddress=86oK6fa5...

Response:
{
  "verifications": [
    {
      "id": "uuid",
      "verification_status": "pending",
      "created_at": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "total": 1
}
```

### Admin Endpoints

#### Get Pending Verifications
```typescript
GET /api/social-verification/admin?adminWallet=86oK6fa5...&status=pending

Response:
{
  "verifications": [ ... ],
  "total": 5
}
```

#### Approve/Reject Verification
```typescript
POST /api/social-verification/admin
{
  "adminWallet": "86oK6fa5...",
  "verificationId": "uuid",
  "action": "approve", // or "reject"
  "rejectedReason": "Optional rejection reason"
}

Response:
{
  "success": true,
  "message": "Verification approved! User has been awarded 100 points.",
  "verification": { ... }
}
```

## Verification Requirements

### Tweet Must Include:
- ✅ User's referral code
- ✅ @onlyanal.fun mention OR #AnalosNFT hashtag
- ✅ Be a public tweet (not private)

### Example Valid Tweet:
```
Just joined @onlyanal.fun! My referral code: 86OK6FA5 #AnalosNFT #NFTLaunchpad 🚀
```

## Security Features

### Database Security
- 🔒 **Row Level Security (RLS)** - Users can only view their own verifications
- 🛡️ **Service Role Access** - Only admin wallet can approve/reject
- 📝 **Audit Trail** - All actions logged with timestamps

### Fraud Prevention
- ✋ **One Verification Per Wallet** - Prevents duplicate submissions
- 👁️ **Manual Review** - Admin verifies tweet authenticity
- ⏱️ **Timestamp Tracking** - Monitor submission patterns
- 🚫 **Rejection Reasons** - Track why tweets were rejected

## Admin Wallets

Admin wallets are hardcoded in the system for security:
```typescript
const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m'
];
```

## Navigation

### User Menu:
- 🐦 **Social Verification** - Submit tweet for verification
- Requires: Wallet connection

### Admin Menu:
- 🔐 **Social Verification** (Admin Dashboard)
- Requires: Admin wallet + 2FA authentication

## Future Enhancements

Possible improvements for later:
1. **Webhook Integration** - Auto-fetch tweets using webhooks
2. **Discord Verification** - Extend to Discord servers
3. **Telegram Verification** - Add Telegram channel verification
4. **Leaderboard Integration** - Show top verifiers
5. **Bulk Approval** - Approve multiple tweets at once
6. **Screenshot Upload** - Allow users to upload tweet screenshots
7. **Email Notifications** - Notify users when verified/rejected

## Support

For issues or questions:
1. Check database tables are created correctly
2. Verify admin wallet is in ADMIN_WALLETS array
3. Check Supabase connection in `.env.local`
4. Review logs in browser console and admin dashboard

---

**No Twitter API needed!** 🎉 Simple, cost-effective, and secure!
