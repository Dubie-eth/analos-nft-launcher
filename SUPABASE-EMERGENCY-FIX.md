# 🚨 SUPABASE EMERGENCY FIX GUIDE

## **CRITICAL ISSUE IDENTIFIED**
Your Supabase API keys are missing or invalid in Vercel, causing:
- ❌ 401 Unauthorized errors
- ❌ Profile saving failures  
- ❌ Admin page locking not working
- ❌ All database operations failing

## 🔧 **IMMEDIATE FIX STEPS**

### **Step 1: Get Your Supabase Keys**

1. **Go to your Supabase Dashboard**:
   - Visit: `https://supabase.com/dashboard`
   - Select your project: `cdbcrfmlhwgtgngkuibk`

2. **Navigate to API Settings**:
   - Go to: Settings → API
   - You'll see your project URL and API keys

3. **Copy These Two Keys**:
   ```
   Project URL: https://cdbcrfmlhwgtgngkuibk.supabase.co
   anon public: eyJ... (starts with eyJ)
   service_role secret: eyJ... (starts with eyJ)
   ```

### **Step 2: Update Vercel Environment Variables**

1. **Go to Vercel Dashboard**:
   - Visit: `https://vercel.com/dashboard`
   - Select your project: `analos-nft-frontend-minimal`

2. **Navigate to Environment Variables**:
   - Go to: Settings → Environment Variables

3. **Add/Update These Variables**:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://cdbcrfmlhwgtgngkuibk.supabase.co`
   - Environment: Production, Preview, Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your_anon_key_here` (replace with actual key)
   - Environment: Production, Preview, Development

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `your_service_role_key_here` (replace with actual key)
   - Environment: Production, Preview, Development

### **Step 3: Redeploy Your Application**

**Option A: Automatic Redeploy**
- After saving environment variables, Vercel will automatically redeploy

**Option B: Manual Redeploy**
- Go to Deployments tab
- Click "Redeploy" on the latest deployment

**Option C: Trigger with Code Push**
```bash
git commit --allow-empty -m "Trigger redeploy for Supabase fix"
git push origin master
```

## 🧪 **VERIFICATION STEPS**

After redeployment, test these features:

1. **Profile Saving**:
   - Go to `/profile`
   - Set username: "testuser123"
   - Upload profile picture
   - Click "Save Changes"
   - ✅ Should show "Profile saved successfully!"

2. **Admin Page Locking**:
   - Go to `/admin`
   - Try "Lock All Pages" button
   - ✅ Should work without 401 errors

3. **Console Check**:
   - Open browser console
   - ✅ No more 401 Unauthorized errors
   - ✅ No "Invalid API key" messages

## 🔍 **TROUBLESHOOTING**

### **If Still Getting 401 Errors:**

1. **Check Key Format**:
   - Keys should start with `eyJ`
   - No extra spaces or characters
   - Copy-paste directly from Supabase

2. **Verify Environment**:
   - Make sure variables are set for "Production"
   - Check that variable names are exactly correct
   - No typos in variable names

3. **Force Redeploy**:
   - Delete and recreate environment variables
   - Trigger new deployment

### **If Profile Still Not Saving:**

1. **Check Database Schema**:
   - Make sure you've run the SQL schemas in Supabase
   - Verify tables exist: `user_profiles`, `beta_applications`, etc.

2. **Check RLS Policies**:
   - Ensure Row Level Security is properly configured
   - Service role key should bypass RLS

## 📞 **NEED HELP?**

If you're still having issues:

1. **Share your Supabase project URL** (without keys)
2. **Check if tables exist** in Supabase dashboard
3. **Verify RLS policies** are set up correctly
4. **Test with a simple database query** first

---

## ⚡ **QUICK REFERENCE**

**Environment Variables Needed:**
```
NEXT_PUBLIC_SUPABASE_URL=https://cdbcrfmlhwgtgngkuibk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Test Commands:**
- Profile save: `/profile` → Set username → Save
- Admin functions: `/admin` → Try page locking
- Console check: Look for 401 errors

**Success Indicators:**
- ✅ No 401 errors in console
- ✅ Profile saves successfully
- ✅ Admin functions work
- ✅ Database operations succeed
