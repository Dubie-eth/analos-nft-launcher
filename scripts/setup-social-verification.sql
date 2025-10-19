-- Social Verification Database Schema
-- Run this script in your Supabase SQL editor to create the necessary tables

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

-- Create user_activities table for tracking points and rewards
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_verifications_wallet ON social_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_social_verifications_platform ON social_verifications(platform);
CREATE INDEX IF NOT EXISTS idx_social_verifications_status ON social_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_social_verifications_tweet_id ON social_verifications(tweet_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_wallet ON user_activities(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- Enable Row Level Security (RLS)
ALTER TABLE social_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for social_verifications
CREATE POLICY "Users can view their own verifications" ON social_verifications
  FOR SELECT USING (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own verifications" ON social_verifications
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Service role can update verifications" ON social_verifications
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create RLS policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid()::text = wallet_address OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert activities" ON user_activities
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_social_verifications_updated_at 
  BEFORE UPDATE ON social_verifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate total points for a user
CREATE OR REPLACE FUNCTION get_user_total_points(user_wallet TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points_earned) 
     FROM user_activities 
     WHERE wallet_address = user_wallet), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to check verification eligibility
CREATE OR REPLACE FUNCTION check_verification_eligibility(wallet_addr TEXT)
RETURNS TABLE(
  can_verify BOOLEAN,
  existing_verifications INTEGER,
  total_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM social_verifications WHERE wallet_address = wallet_addr AND verification_status = 'verified') = 0 AS can_verify,
    (SELECT COUNT(*) FROM social_verifications WHERE wallet_address = wallet_addr)::INTEGER AS existing_verifications,
    get_user_total_points(wallet_addr) AS total_points;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
-- INSERT INTO social_verifications (wallet_address, platform, tweet_id, referral_code, username, verification_status) 
-- VALUES ('sample_wallet_123', 'twitter', '1234567890', 'ABC123', 'testuser', 'verified');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON social_verifications TO anon, authenticated;
GRANT ALL ON user_activities TO anon, authenticated;
