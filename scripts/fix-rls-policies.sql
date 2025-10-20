-- FIX RLS POLICIES FOR USER_PROFILES TABLE
-- Run this in Supabase SQL Editor to fix the 500 error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create more permissive policies for testing
CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Alternative: Create specific policies
-- CREATE POLICY "Public can view user profiles" ON public.user_profiles
--   FOR SELECT USING (true);

-- CREATE POLICY "Public can insert user profiles" ON public.user_profiles
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Public can update user profiles" ON public.user_profiles
--   FOR UPDATE USING (true);
