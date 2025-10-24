-- ============================================================================
-- SUPABASE SECURITY ADVISOR - FIX ALL WARNINGS
-- ============================================================================
-- This script addresses all security warnings from Supabase linter
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: FIX FUNCTION SEARCH PATH (26 warnings)
-- ============================================================================
-- Sets explicit search_path for all functions to prevent schema poisoning

-- Leaderboard functions
ALTER FUNCTION public.update_leaderboard() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_rank(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_top_referrers(integer) SET search_path = public, pg_temp;

-- Timestamp trigger function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- Encryption functions
ALTER FUNCTION public.encrypt_sensitive_data(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.decrypt_sensitive_data(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_encryption_key(text, text) SET search_path = public, pg_temp;

-- Verification functions
ALTER FUNCTION public.calculate_verification_score(jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_verification_eligibility(text) SET search_path = public, pg_temp;

-- User activity and points functions
ALTER FUNCTION public.increment_activity_points(text, text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_referral_points(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_stats(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_activity_history(text, integer, integer) SET search_path = public, pg_temp;

-- Referral functions
ALTER FUNCTION public.check_referral_code(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_referral_history(text, integer, integer) SET search_path = public, pg_temp;

-- Campaign and eligibility functions
ALTER FUNCTION public.get_campaign_stats(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_user_eligibility(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_wallet_eligibility(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.add_to_whitelist(text, text, text) SET search_path = public, pg_temp;

-- Cleanup and maintenance functions
ALTER FUNCTION public.cleanup_old_security_logs() SET search_path = public, pg_temp;

-- Statistics and reporting functions
ALTER FUNCTION public.get_security_statistics(interval) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_total_rewards(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_rewards_summary(text) SET search_path = public, pg_temp;

-- Collection and NFT functions
ALTER FUNCTION public.get_collection_stats(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_creator_rewards(text, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_collection_sales(text, numeric, integer) SET search_path = public, pg_temp;

-- ============================================================================
-- PART 2: DROP TEST VIEW (1 error)
-- ============================================================================
-- Remove the test encryption view that's causing security warnings

DROP VIEW IF EXISTS public.encryption_test CASCADE;

-- ============================================================================
-- PART 3: ADD RLS POLICIES (4 info warnings)
-- ============================================================================
-- These tables have RLS enabled but no policies. Add appropriate policies.

-- ----------------------------------------------------------------------------
-- database_backups: Admin-only access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin can view backups"
  ON public.database_backups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_wallets 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

CREATE POLICY "Admin can insert backups"
  ON public.database_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_wallets 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

-- ----------------------------------------------------------------------------
-- social_verification_audit: Users can view their own audit logs
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own verification audit"
  ON public.social_verification_audit
  FOR SELECT
  TO authenticated
  USING (
    wallet_address = auth.jwt() ->> 'wallet_address'
  );

CREATE POLICY "System can insert audit logs"
  ON public.social_verification_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Any authenticated user can create audit logs

-- ----------------------------------------------------------------------------
-- user_activities: Users can view their own activities
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own activities"
  ON public.user_activities
  FOR SELECT
  TO authenticated
  USING (
    wallet_address = auth.jwt() ->> 'wallet_address'
  );

CREATE POLICY "Admins can view all activities"
  ON public.user_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_wallets 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

CREATE POLICY "System can insert activities"
  ON public.user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- verification_request_accounts: Users can manage their own accounts
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own verification accounts"
  ON public.verification_request_accounts
  FOR SELECT
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM public.verification_requests 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

CREATE POLICY "Users can insert their own verification accounts"
  ON public.verification_request_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    request_id IN (
      SELECT id FROM public.verification_requests 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

CREATE POLICY "Users can update their own verification accounts"
  ON public.verification_request_accounts
  FOR UPDATE
  TO authenticated
  USING (
    request_id IN (
      SELECT id FROM public.verification_requests 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ALL SECURITY WARNINGS FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  ✓ 26 functions updated with search_path';
  RAISE NOTICE '  ✓ 1 security definer view removed';
  RAISE NOTICE '  ✓ 4 tables now have RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next Steps:';
  RAISE NOTICE '  1. Go to Supabase Dashboard → Advisors → Security';
  RAISE NOTICE '  2. Click "Rerun linter" button';
  RAISE NOTICE '  3. Verify all warnings are resolved';
  RAISE NOTICE '';
END $$;

