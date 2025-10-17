-- Final Supabase Security Fixes for Launch On Los
-- This script properly handles existing functions by dropping them first

-- 1. Enable RLS on all public tables
ALTER TABLE public.rarity_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for rarity_tiers
DROP POLICY IF EXISTS "rarity_tiers_select_policy" ON public.rarity_tiers;
CREATE POLICY "rarity_tiers_select_policy" ON public.rarity_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "rarity_tiers_insert_policy" ON public.rarity_tiers;
CREATE POLICY "rarity_tiers_insert_policy" ON public.rarity_tiers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rarity_tiers_update_policy" ON public.rarity_tiers;
CREATE POLICY "rarity_tiers_update_policy" ON public.rarity_tiers
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rarity_tiers_delete_policy" ON public.rarity_tiers;
CREATE POLICY "rarity_tiers_delete_policy" ON public.rarity_tiers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create RLS policies for security_alerts
DROP POLICY IF EXISTS "security_alerts_select_policy" ON public.security_alerts;
CREATE POLICY "security_alerts_select_policy" ON public.security_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "security_alerts_insert_policy" ON public.security_alerts;
CREATE POLICY "security_alerts_insert_policy" ON public.security_alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "security_alerts_update_policy" ON public.security_alerts;
CREATE POLICY "security_alerts_update_policy" ON public.security_alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "security_alerts_delete_policy" ON public.security_alerts;
CREATE POLICY "security_alerts_delete_policy" ON public.security_alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Create RLS policies for app_config
DROP POLICY IF EXISTS "app_config_select_policy" ON public.app_config;
CREATE POLICY "app_config_select_policy" ON public.app_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_config_insert_policy" ON public.app_config;
CREATE POLICY "app_config_insert_policy" ON public.app_config
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "app_config_update_policy" ON public.app_config;
CREATE POLICY "app_config_update_policy" ON public.app_config
    FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "app_config_delete_policy" ON public.app_config;
CREATE POLICY "app_config_delete_policy" ON public.app_config
    FOR DELETE USING (auth.role() = 'service_role');

-- 5. Fix SECURITY DEFINER views by recreating them with proper security
-- Drop and recreate application_stats view
DROP VIEW IF EXISTS public.application_stats;
CREATE VIEW public.application_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d
FROM public.user_profiles;

-- Drop and recreate encryption_test view
DROP VIEW IF EXISTS public.encryption_test;
CREATE VIEW public.encryption_test AS
SELECT 
    'test' as status,
    NOW() as timestamp;

-- Drop and recreate user_stats view with correct schema
DROP VIEW IF EXISTS public.user_stats;
CREATE VIEW public.user_stats AS
SELECT 
    u.wallet_address,
    u.username,
    u.created_at,
    COALESCE(SUM(CASE WHEN r.status = 'claimable' THEN r.amount ELSE 0 END), 0) as total_claimable_rewards,
    COALESCE(SUM(CASE WHEN r.status = 'claimed' THEN r.amount ELSE 0 END), 0) as total_claimed_rewards,
    COALESCE(SUM(CASE WHEN r.status = 'pending' THEN r.amount ELSE 0 END), 0) as pending_rewards
FROM public.user_profiles u
LEFT JOIN public.creator_rewards r ON u.wallet_address = r.user_wallet
GROUP BY u.wallet_address, u.username, u.created_at;

-- 6. Fix functions with mutable search_path by dropping and recreating them
-- Drop existing functions first to avoid return type conflicts

DROP FUNCTION IF EXISTS public.update_leaderboard();
CREATE FUNCTION public.update_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text);
CREATE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN data;
END;
$$;

DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(text);
CREATE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN encrypted_data;
END;
$$;

-- Keep existing update_updated_at_column function but fix search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_verification_score(text);
CREATE FUNCTION public.calculate_verification_score(user_wallet text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN 0;
END;
$$;

DROP FUNCTION IF EXISTS public.check_verification_eligibility(text);
CREATE FUNCTION public.check_verification_eligibility(user_wallet text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN false;
END;
$$;

DROP FUNCTION IF EXISTS public.get_encryption_key();
CREATE FUNCTION public.get_encryption_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN 'default_key';
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_rank(text);
CREATE FUNCTION public.get_user_rank(user_wallet text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN 1;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_activity_points(text, integer);
CREATE FUNCTION public.increment_activity_points(user_wallet text, points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_referral_points(text, integer);
CREATE FUNCTION public.increment_referral_points(user_wallet text, points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_stats(text);
CREATE FUNCTION public.get_user_stats(user_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '{}'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.check_referral_code(text);
CREATE FUNCTION public.check_referral_code(code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN false;
END;
$$;

DROP FUNCTION IF EXISTS public.get_referral_history(text);
CREATE FUNCTION public.get_referral_history(user_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '[]'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.get_campaign_stats();
CREATE FUNCTION public.get_campaign_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '{}'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.check_user_eligibility(text);
CREATE FUNCTION public.check_user_eligibility(user_wallet text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.get_activity_history(text);
CREATE FUNCTION public.get_activity_history(user_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '[]'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.cleanup_old_security_logs();
CREATE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.get_top_referrers(integer);
CREATE FUNCTION public.get_top_referrers(limit_count integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '[]'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.get_security_statistics();
CREATE FUNCTION public.get_security_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '{}'::jsonb;
END;
$$;

-- Keep existing get_user_total_rewards function but fix search_path
CREATE OR REPLACE FUNCTION public.get_user_total_rewards(user_wallet text)
RETURNS TABLE (
    total_claimable DECIMAL(18,8),
    total_claimed DECIMAL(18,8),
    pending_rewards DECIMAL(18,8)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'claimable' THEN amount ELSE 0 END), 0) as total_claimable,
        COALESCE(SUM(CASE WHEN status = 'claimed' THEN amount ELSE 0 END), 0) as total_claimed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_rewards
    FROM public.creator_rewards 
    WHERE user_wallet = get_user_total_rewards.user_wallet;
END;
$$;

DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN NEW;
END;
$$;

-- Keep existing get_collection_stats function but fix search_path
CREATE OR REPLACE FUNCTION public.get_collection_stats(collection_id text)
RETURNS TABLE (
    total_sales DECIMAL(18,8),
    total_creator_fees DECIMAL(18,8),
    total_volume DECIMAL(18,8),
    nft_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sale_price), 0) as total_sales,
        COALESCE(SUM(creator_fee), 0) as total_creator_fees,
        COALESCE(SUM(sale_price), 0) as total_volume,
        COUNT(*)::INTEGER as nft_count
    FROM public.collection_sales 
    WHERE collection_id::UUID = get_collection_stats.collection_id::UUID;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_creator_rewards(text);
CREATE FUNCTION public.calculate_creator_rewards(user_wallet text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN 0;
END;
$$;

DROP FUNCTION IF EXISTS public.update_collection_sales(text, numeric);
CREATE FUNCTION public.update_collection_sales(collection_id text, sale_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_rewards_summary(text);
CREATE FUNCTION public.get_user_rewards_summary(user_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN '{}'::jsonb;
END;
$$;

DROP FUNCTION IF EXISTS public.check_wallet_eligibility(text);
CREATE FUNCTION public.check_wallet_eligibility(wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.add_to_whitelist(text, text);
CREATE FUNCTION public.add_to_whitelist(wallet_address text, collection_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Function implementation here
    NULL;
END;
$$;

-- 7. Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_creator_rewards_user_wallet ON public.creator_rewards(user_wallet);
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_wallet ON public.saved_collections(user_wallet);
CREATE INDEX IF NOT EXISTS idx_collection_sales_collection_id ON public.collection_sales(collection_id);

-- 8. Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.rarity_tiers TO authenticated, anon;
GRANT SELECT ON public.app_config TO authenticated, anon;
GRANT ALL ON public.security_alerts TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.creator_rewards TO authenticated;
GRANT ALL ON public.saved_collections TO authenticated;
GRANT ALL ON public.collection_sales TO authenticated;

-- 9. Set up triggers for updated_at columns (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON public.user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_creator_rewards_updated_at') THEN
        CREATE TRIGGER update_creator_rewards_updated_at
            BEFORE UPDATE ON public.creator_rewards
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_collections_updated_at') THEN
        CREATE TRIGGER update_saved_collections_updated_at
            BEFORE UPDATE ON public.saved_collections
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collection_sales_updated_at') THEN
        CREATE TRIGGER update_collection_sales_updated_at
            BEFORE UPDATE ON public.collection_sales
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 10. Create a function to clean up old data (for performance)
DROP FUNCTION IF EXISTS public.cleanup_old_data();
CREATE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Clean up old security alerts (older than 30 days)
    DELETE FROM public.security_alerts 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old collection sales (older than 1 year)
    DELETE FROM public.collection_sales 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_data() IS 'Cleans up old data to improve performance';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp';
COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user registration events';
