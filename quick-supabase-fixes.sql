-- Quick Supabase Security Fixes
-- Run this first to address the most critical issues

-- 1. Enable RLS on critical tables
ALTER TABLE public.rarity_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 2. Create basic RLS policies
-- Allow public read access to rarity_tiers and app_config
CREATE POLICY "rarity_tiers_public_read" ON public.rarity_tiers
    FOR SELECT USING (true);

CREATE POLICY "app_config_public_read" ON public.app_config
    FOR SELECT USING (true);

-- Restrict security_alerts to authenticated users only
CREATE POLICY "security_alerts_auth_only" ON public.security_alerts
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Fix the most critical functions with proper search_path
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Handle new user logic here
    RETURN NEW;
END;
$$;

-- 4. Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- 5. Grant basic permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.rarity_tiers TO authenticated, anon;
GRANT SELECT ON public.app_config TO authenticated, anon;
GRANT ALL ON public.security_alerts TO authenticated;
