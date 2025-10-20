-- =====================================================
-- CLEANUP SCRIPT FOR REDUNDANT SQL SCRIPTS
-- =====================================================
-- This script helps identify which scripts you can safely delete
-- from your Supabase SQL Editor.
-- =====================================================

-- This is just a reference script - you'll need to manually delete
-- the redundant scripts from your Supabase SQL Editor interface.

/*
REDUNDANT SCRIPTS TO DELETE:
============================

1. "User Profiles Table" (both instances)
   - Replaced by: "Complete Database Setup"

2. "User profiles with RLS and indexes"
   - Replaced by: "Complete Database Setup"

3. "User profiles and RLS setup"
   - Replaced by: "Complete Database Setup"

4. "User Profiles & NFT Minting Schema" (if it's missing the mint_number column)
   - Replaced by: "Complete Database Setup"

5. Any other duplicate user profile scripts
   - Replaced by: "Complete Database Setup"

SCRIPTS TO KEEP:
===============

1. "Complete Database Setup" (the new comprehensive script)
   - This is your new single source of truth

2. "Relax RLS for user_profiles" (for quick RLS fixes)
   - Keep for emergency RLS adjustments

3. "RLS and Security Hardening for Launch" (for production security)
   - Keep for production deployment

4. "Supabase Security and Performance Fixes" (for maintenance)
   - Keep for ongoing maintenance

5. "Page Access Configurations"
   - Keep if it has specific page access logic

6. "Add logo and banner URL columns to saved_collections"
   - Keep if it has specific column additions

7. "Exclusive NFT Collection & Whitelist Schema"
   - Keep if it has whitelist functionality

8. "Saved Collections & Creator Rewards"
   - Keep if it has rewards logic

RECOMMENDED ACTIONS:
===================

1. Copy the "Complete Database Setup" script to your Supabase SQL Editor
2. Delete the redundant scripts listed above
3. Test the new script in a development environment first
4. Keep the specialized scripts that have unique functionality
5. Update any scripts that reference old table structures

This will reduce your 12 scripts down to about 6-8 focused, non-redundant scripts.
*/

SELECT 'Use this as a reference for cleaning up your SQL scripts' as message;
