# 🔐 SUPABASE KEY ROTATION GUIDE

## ⚠️ CRITICAL SECURITY UPDATE

Your Supabase Service Role Key was previously exposed in documentation files. **You MUST rotate this key immediately** to prevent unauthorized access to your database.

---

## 📋 **STEP-BY-STEP KEY ROTATION**

### **Step 1: Access Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your project: `cdbcrfmlhwgtgngkuibk`

### **Step 2: Navigate to API Settings**

1. In the left sidebar, click **"Settings"** (gear icon)
2. Click **"API"** from the settings menu
3. You'll see your API credentials

### **Step 3: Identify Current Keys**

You should see:
- **Project URL**: `https://cdbcrfmlhwgtgngkuibk.supabase.co`
- **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (starts with eyJ)
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (starts with eyJ)

### **Step 4: Generate New Service Role Key**

1. Scroll down to the **"Service Role Key"** section
2. Click **"Reset"** or **"Generate New Key"** button
3. **IMPORTANT**: Copy the new key immediately (you won't be able to see it again)
4. Save it securely in a password manager

### **Step 5: Keep Anon Key (No Need to Change)**

- The **Anon/Public Key** is safe to keep as-is
- This key has Row Level Security (RLS) protections
- Only rotate if you believe it's been misused

---

## 🔧 **UPDATE YOUR ENVIRONMENT VARIABLES**

### **Local Development (.env.local)**

1. Open your `minimal-repo/.env.local` file
2. Update with your new keys:

```bash
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=https://cdbcrfmlhwgtgngkuibk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_NEW_service_role_key_here

# DATABASE ENCRYPTION (32-character key)
DATABASE_ENCRYPTION_KEY=LaunchOnLos2024SecureKey32Char!

# SECURITY
ADMIN_WALLETS=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW,89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m

# RPC
NEXT_PUBLIC_RPC_URL=https://rpc.analos.io
```

3. Save the file

### **Vercel Deployment (Production)**

See the **VERCEL-ENVIRONMENT-SETUP.md** file for detailed Vercel instructions.

---

## ✅ **VERIFY THE UPDATE**

### **Test Local Development**

```bash
cd minimal-repo
npm run dev
```

1. Open http://localhost:3000
2. Try connecting your wallet
3. Check browser console for any Supabase errors
4. Try accessing admin dashboard

### **Test Database Connection**

```bash
node test-supabase-connection.js
```

Expected output:
```
✅ Supabase connection successful!
✅ Found X users in database
```

---

## 🚨 **IMPORTANT SECURITY NOTES**

### **What Happens After Rotation**

- ✅ New Service Role Key will work immediately
- ❌ Old Service Role Key will be REVOKED
- ⚠️ Any deployments using old key will FAIL
- 🔄 You MUST update ALL environments

### **Environments to Update**

- [ ] Local development (.env.local)
- [ ] Vercel Production
- [ ] Vercel Preview
- [ ] Any CI/CD pipelines
- [ ] Team members' local environments

### **Do NOT Share**

- ❌ Never commit .env.local to git
- ❌ Never share Service Role Key in chat/email
- ❌ Never store in documentation files
- ✅ Use password manager or secret management service

---

## 📝 **ROTATION CHECKLIST**

- [ ] Generated new Service Role Key in Supabase
- [ ] Updated local .env.local file
- [ ] Updated Vercel environment variables
- [ ] Redeployed Vercel application
- [ ] Tested local development
- [ ] Tested production deployment
- [ ] Notified team members (if any)
- [ ] Deleted old keys from password manager
- [ ] Confirmed old key is revoked

---

## 🆘 **TROUBLESHOOTING**

### **Error: "Invalid JWT"**

- You're using the old (revoked) key
- Update environment variables with new key
- Restart your development server

### **Error: "Row Level Security Policy Violation"**

- You're using Anon key where Service Role key is needed
- Check you're using SUPABASE_SERVICE_ROLE_KEY (not ANON_KEY)

### **Still Having Issues?**

1. Clear browser cache and cookies
2. Restart development server: `npm run dev`
3. Redeploy to Vercel
4. Check Supabase Dashboard → API for correct keys

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check Supabase Dashboard → API section
2. Verify keys are correct (no extra spaces/characters)
3. Ensure .env.local is in the correct directory
4. Check Vercel deployment logs for errors

---

**Security Level**: 🔴 CRITICAL - Complete immediately
**Estimated Time**: 10-15 minutes
**Last Updated**: $(date)

