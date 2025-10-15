# 🔐 Social Verification System Setup Guide

## Step 1: Add Social Verification Tables to Supabase

1. **Go to your Supabase SQL Editor**: https://supabase.com/dashboard/project/cdbcrfmlhwgtgngkuibk/sql

2. **Create a new query** and copy the entire contents of `social-verification-schema.sql`

3. **Paste and run the SQL** - this will create:
   - ✅ Social verification configuration tables
   - ✅ User social accounts tables  
   - ✅ Verification request tracking
   - ✅ Audit logging for verification actions
   - ✅ Scoring functions for different platforms
   - ✅ Default configurations for your collection

## Step 2: Test the Integration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Go to**: http://localhost:3000/admin

3. **Navigate to "Social Verification" tab**

4. **You should see**:
   - ✅ Verification Requests tab
   - ✅ Social Accounts tab  
   - ✅ Configurations tab
   - ✅ Eligibility Check tab

## Step 3: Test the Features

### Test Verification Request Creation:
1. Go to a user-facing page that uses social verification
2. Try adding social accounts
3. Check the "Verification Requests" tab in admin

### Test Manual Verification:
1. Go to "Social Accounts" tab
2. Find a pending account
3. Click "Verify Account" button
4. Check the verification status updates

### Test Eligibility Check:
1. Go to "Check Eligibility" tab
2. Enter a wallet address
3. Click "Check Eligibility"
4. View the detailed results

## What's Now Available:

### 🔐 **Social Verification Features:**
- **Multi-platform support**: Twitter, Telegram, Discord, Instagram, YouTube, TikTok, GitHub
- **Scoring system**: Different points based on platform and follower count
- **Manual verification**: Admin can verify accounts manually
- **Audit trail**: Track all verification actions
- **Eligibility checking**: Real-time whitelist eligibility
- **Configuration management**: Set up verification rules per platform

### 📊 **Admin Dashboard Integration:**
- **Verification Requests**: View all pending/completed requests
- **Social Accounts**: Manage individual social accounts
- **Configurations**: Configure verification rules per platform
- **Eligibility Checker**: Check any wallet's verification status

### 🛡️ **Security Features:**
- **Encrypted data**: Sensitive information is encrypted
- **Audit logging**: Track all verification actions
- **Admin controls**: Only admins can verify/revoke accounts
- **Row-level security**: Users can only see their own data

## Collection Configuration:

Your collection (`ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6`) is pre-configured with:
- **Twitter**: @launchonlos, 10 points required, 100 min followers
- **Telegram**: @launchonlos, 10 points required, 50 min followers  
- **Discord**: @launchonlos, 10 points required, 25 min followers

## Next Steps:

1. **Run the SQL schema** in Supabase
2. **Test the admin dashboard** social verification tab
3. **Configure additional platforms** if needed
4. **Set up webhook verification** for automated verification (optional)

Your social verification system is now fully integrated with your Supabase database! 🎉
