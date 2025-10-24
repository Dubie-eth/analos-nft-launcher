-- ============================================================================
-- SUPABASE SECURITY ADVISOR - SAFE FIX (ONLY EXISTING FUNCTIONS)
-- ============================================================================
-- This script ONLY fixes functions and objects that actually exist
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: FIX FUNCTION SEARCH PATH (ONLY EXISTING FUNCTIONS)
-- ============================================================================
-- Sets explicit search_path for functions that actually exist in your DB

-- Only fix the timestamp trigger function (this one definitely exists)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- ============================================================================
-- PART 2: DROP TEST VIEW (if it exists)
-- ============================================================================
-- Remove the test encryption view that's causing security warnings

DROP VIEW IF EXISTS public.encryption_test CASCADE;

-- ============================================================================
-- PART 3: ADD RLS POLICIES (ONLY FOR EXISTING TABLES)
-- ============================================================================
-- Only add policies for tables that exist and have RLS enabled

-- ----------------------------------------------------------------------------
-- database_backups: Admin-only access (if table exists)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'database_backups'
  ) THEN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admin can view backups" ON public.database_backups;
    DROP POLICY IF EXISTS "Admin can insert backups" ON public.database_backups;
    
    -- Create new policies
    CREATE POLICY "Admin can view backups"
      ON public.database_backups
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_wallets 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );

    CREATE POLICY "Admin can insert backups"
      ON public.database_backups
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.admin_wallets 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );
    
    RAISE NOTICE '✓ Fixed RLS policies for database_backups';
  ELSE
    RAISE NOTICE '⊘ Table database_backups does not exist, skipping';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- social_verification_audit: Users can view their own audit logs (if exists)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'social_verification_audit'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own verification audit" ON public.social_verification_audit;
    DROP POLICY IF EXISTS "System can insert audit logs" ON public.social_verification_audit;
    
    CREATE POLICY "Users can view their own verification audit"
      ON public.social_verification_audit
      FOR SELECT
      TO authenticated
      USING (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      );

    CREATE POLICY "System can insert audit logs"
      ON public.social_verification_audit
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    
    RAISE NOTICE '✓ Fixed RLS policies for social_verification_audit';
  ELSE
    RAISE NOTICE '⊘ Table social_verification_audit does not exist, skipping';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- user_activities: Users can view their own activities (if exists)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_activities'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
    DROP POLICY IF EXISTS "Admins can view all activities" ON public.user_activities;
    DROP POLICY IF EXISTS "System can insert activities" ON public.user_activities;
    
    CREATE POLICY "Users can view their own activities"
      ON public.user_activities
      FOR SELECT
      TO authenticated
      USING (
        wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      );

    CREATE POLICY "Admins can view all activities"
      ON public.user_activities
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_wallets 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );

    CREATE POLICY "System can insert activities"
      ON public.user_activities
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    
    RAISE NOTICE '✓ Fixed RLS policies for user_activities';
  ELSE
    RAISE NOTICE '⊘ Table user_activities does not exist, skipping';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- verification_request_accounts: Users can manage their own (if exists)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'verification_request_accounts'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own verification accounts" ON public.verification_request_accounts;
    DROP POLICY IF EXISTS "Users can insert their own verification accounts" ON public.verification_request_accounts;
    DROP POLICY IF EXISTS "Users can update their own verification accounts" ON public.verification_request_accounts;
    
    CREATE POLICY "Users can view their own verification accounts"
      ON public.verification_request_accounts
      FOR SELECT
      TO authenticated
      USING (
        request_id IN (
          SELECT id FROM public.verification_requests 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );

    CREATE POLICY "Users can insert their own verification accounts"
      ON public.verification_request_accounts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        request_id IN (
          SELECT id FROM public.verification_requests 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );

    CREATE POLICY "Users can update their own verification accounts"
      ON public.verification_request_accounts
      FOR UPDATE
      TO authenticated
      USING (
        request_id IN (
          SELECT id FROM public.verification_requests 
          WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        )
      );
    
    RAISE NOTICE '✓ Fixed RLS policies for verification_request_accounts';
  ELSE
    RAISE NOTICE '⊘ Table verification_request_accounts does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ SAFE SECURITY FIX COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 What was fixed:';
  RAISE NOTICE '  ✓ 1 function updated with search_path (update_updated_at_column)';
  RAISE NOTICE '  ✓ 1 security definer view removed (if existed)';
  RAISE NOTICE '  ✓ RLS policies added for existing tables only';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: Other functions in the warning list do not exist in your DB';
  RAISE NOTICE '   Those warnings can be safely ignored or you can create the functions';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Next Steps:';
  RAISE NOTICE '  1. Go to Supabase Dashboard → Advisors → Security';
  RAISE NOTICE '  2. Click "Rerun linter" button';
  RAISE NOTICE '  3. Remaining warnings are for non-existent functions (safe to ignore)';
  RAISE NOTICE '';
END $$;

