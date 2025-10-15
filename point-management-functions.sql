-- POINT MANAGEMENT RPC FUNCTIONS
-- Functions for managing user points and leaderboard

-- Function to increment activity points
CREATE OR REPLACE FUNCTION increment_activity_points(user_wallet TEXT, points INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        activity_points = activity_points + points,
        total_points = referral_points + activity_points + points,
        updated_at = NOW()
    WHERE wallet_address = user_wallet;
    
    -- If user doesn't exist, create them
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
            wallet_address, 
            wallet_address_hash, 
            username, 
            activity_points, 
            total_points,
            referral_code
        ) VALUES (
            user_wallet, 
            encode(sha256(user_wallet::bytea), 'hex'), 
            'User_' || substring(user_wallet, 1, 8), 
            points, 
            points,
            upper(substring(md5(random()::text), 1, 6))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment referral points
CREATE OR REPLACE FUNCTION increment_referral_points(user_wallet TEXT, points INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        referral_points = referral_points + points,
        total_points = referral_points + points + activity_points,
        total_referrals = total_referrals + 1,
        updated_at = NOW()
    WHERE wallet_address = user_wallet;
    
    -- If user doesn't exist, create them
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
            wallet_address, 
            wallet_address_hash, 
            username, 
            referral_points, 
            total_points,
            total_referrals,
            referral_code
        ) VALUES (
            user_wallet, 
            encode(sha256(user_wallet::bytea), 'hex'), 
            'User_' || substring(user_wallet, 1, 8), 
            points, 
            points,
            1,
            upper(substring(md5(random()::text), 1, 6))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(user_wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank INTO user_rank
    FROM leaderboard 
    WHERE wallet_address = user_wallet;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top referrers
CREATE OR REPLACE FUNCTION get_top_referrers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    wallet_address TEXT,
    username TEXT,
    total_referrals INTEGER,
    referral_points INTEGER,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.wallet_address,
        l.username,
        up.total_referrals,
        l.referral_points,
        l.rank
    FROM leaderboard l
    JOIN user_profiles up ON l.wallet_address = up.wallet_address
    ORDER BY l.referral_points DESC, up.total_referrals DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_wallet TEXT)
RETURNS TABLE (
    total_points INTEGER,
    referral_points INTEGER,
    activity_points INTEGER,
    total_referrals INTEGER,
    rank INTEGER,
    referral_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.total_points,
        up.referral_points,
        up.activity_points,
        up.total_referrals,
        COALESCE(l.rank, 0) as rank,
        up.referral_code
    FROM user_profiles up
    LEFT JOIN leaderboard l ON up.wallet_address = l.wallet_address
    WHERE up.wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if referral code exists
CREATE OR REPLACE FUNCTION check_referral_code(code TEXT)
RETURNS TEXT AS $$
DECLARE
    referrer_wallet TEXT;
BEGIN
    SELECT wallet_address INTO referrer_wallet
    FROM user_profiles 
    WHERE referral_code = UPPER(code);
    
    RETURN COALESCE(referrer_wallet, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral history
CREATE OR REPLACE FUNCTION get_referral_history(user_wallet TEXT)
RETURNS TABLE (
    referred_wallet TEXT,
    referral_code TEXT,
    points_awarded INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.referred_wallet,
        rt.referral_code,
        rt.points_awarded,
        rt.created_at
    FROM referral_tracking rt
    WHERE rt.referrer_wallet = user_wallet
    AND rt.is_active = true
    ORDER BY rt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get activity history
CREATE OR REPLACE FUNCTION get_activity_history(user_wallet TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    activity_type TEXT,
    points_awarded INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.activity_type,
        al.points_awarded,
        al.description,
        al.created_at
    FROM activity_logs al
    WHERE al.wallet_address = user_wallet
    ORDER BY al.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_activity_points(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_referral_points(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_referrers(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_stats(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_referral_code(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_referral_history(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_history(TEXT, INTEGER) TO authenticated;
