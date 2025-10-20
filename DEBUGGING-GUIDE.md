# 🐛 Access Control Debugging Guide

## Quick Start

### 1. **Open the Debug Panel**
- **Keyboard Shortcut**: Press `Ctrl + Shift + D` anywhere in your app
- **Click**: Click the purple "🐛 Debug" button in the bottom-right corner

This panel shows real-time information about:
- ✅ Database connection status
- 👤 Wallet connection status  
- 👑 Admin access status
- 📄 Current page configuration
- 🔐 Access control decisions

---

## Common Issues & Solutions

### ❌ Issue 1: "Supabase NOT Configured"

**Symptoms:**
- Database status shows red ❌
- Pages don't lock/unlock properly
- Admin features don't work

**Solution:**
1. Create a `.env.local` file in your project root
2. Copy the contents from `env-template.txt`
3. Replace placeholder values with your actual Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```
4. Restart your dev server: `npm run dev`

**Where to get Supabase credentials:**
- Go to: https://supabase.com/dashboard
- Select your project
- Go to Settings → API
- Copy the URL and keys

---

### 🔄 Issue 2: Infinite Loading / Stuck on Access Check

**What was fixed:**
- Added retry limit (max 3 attempts) for wallet `publicKey` loading
- Added 5-second timeout for graceful degradation
- Page now allows access if checks take too long

**What you'll see in console:**
```
⏳ Wallet connected but publicKey not yet available, waiting... (retry 1/3)
⏳ Wallet connected but publicKey not yet available, waiting... (retry 2/3)
⏳ Wallet connected but publicKey not yet available, waiting... (retry 3/3)
⚠️ Max retries reached waiting for publicKey. Allowing access with degraded auth.
```

---

### 👑 Issue 3: Admin Access Not Working

**Check in Debug Panel:**
1. Open debug panel (`Ctrl + Shift + D`)
2. Look at "Admin Status" section
3. Verify your wallet address is in "Configured Admin Wallets"

**Current Admin Wallets:**
```
1. 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
2. 89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m
```

**To add more admin wallets:**
1. Edit `src/config/access-control.ts`
2. Update the `ADMIN_WALLETS` array:
   ```typescript
   export const ADMIN_WALLETS = [
     '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
     '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
     'YOUR_NEW_ADMIN_WALLET_HERE'
   ];
   ```

---

### 🔒 Issue 4: Pages Not Locking/Unlocking

**Possible causes:**

#### A) Database not configured
- **Check**: Debug panel shows "Supabase NOT Configured"
- **Fix**: See Issue 1 above

#### B) Using static config instead of database
- PageAccessGuard uses **static config first** (from `access-control.ts`)
- Then checks **database config** for overrides
- If database fails, it falls back to static config

**To lock/unlock pages:**
1. Go to `/admin` page (must be admin wallet)
2. Navigate to "Page Management" tab
3. Click lock/unlock buttons for individual pages
4. Or use emergency "Lock All Pages" / "Unlock All Pages" buttons

---

### 🚫 Issue 5: Page Not Found in Config

**Symptoms:**
- Debug panel shows "Page not found in config!"
- Redirected to home page
- Console shows: `🚫 Page /your-page not found in access config`

**Solution:**
1. Edit `src/config/access-control.ts`
2. Add your page to the `PAGE_ACCESS` array:
   ```typescript
   {
     path: '/your-page',
     name: 'Your Page Name',
     description: 'Description of your page',
     requiredLevel: 'public', // or 'beta_user', 'premium_user', 'admin'
     publicAccess: true, // or false
     requiresWallet: false, // or true
     isLocked: false // or true
   }
   ```

---

## Console Logging

The access control system logs detailed information to the browser console:

### Key Log Messages:

**Admin Detection:**
```
🔍 Admin check: publicKey=86oK6fa5..., isAdmin=true, ADMIN_WALLETS=[...]
🔓 Admin wallet detected (...), granting access to /admin
```

**Wallet Loading:**
```
⏳ Wallet connected but publicKey not yet available, waiting... (retry 1/3)
```

**Page Access:**
```
✅ Page /collections is accessible
🔒 Page /staking requires wallet connection
🚫 Page /premium is locked in database, redirecting to beta signup
```

**Database Errors:**
```
⚠️ Database access check failed, continuing anyway: [error]
❌ SUPABASE NOT CONFIGURED! Please create a .env.local file
📋 See env-template.txt for the required environment variables
```

---

## Testing Checklist

### ✅ Basic Access Control
- [ ] Public pages (/, /how-it-works, /faq) load without wallet
- [ ] Protected pages redirect to beta signup when not connected
- [ ] Admin wallet bypasses all restrictions
- [ ] Non-admin wallet respects page locks

### ✅ Database Integration
- [ ] Supabase configured (check debug panel)
- [ ] Pages can be locked/unlocked from admin panel
- [ ] Lock status persists across page reloads
- [ ] Emergency lock/unlock all pages works

### ✅ Wallet Integration
- [ ] Wallet connection updates access in real-time
- [ ] Wallet disconnect triggers re-check
- [ ] publicKey loads within 3 retries
- [ ] Admin wallet detected correctly

### ✅ Error Handling
- [ ] Graceful degradation when database fails
- [ ] Timeout protection (5 seconds)
- [ ] Retry limit prevents infinite loops
- [ ] Clear error messages in console

---

## Advanced Debugging

### View Full Access Check Flow:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter logs by typing: `Admin check` or `Page`
4. Navigate to different pages
5. Watch the access decision process

### Monitor Network Requests:

1. Open DevTools → Network tab
2. Filter by: `page-access`
3. Check if database requests are succeeding
4. Look for 401/403/500 errors

### Check Cookies:

Admin access level is stored in cookies for middleware enforcement:

1. DevTools → Application → Cookies
2. Look for: `analos-user-access-level`
3. Should be `admin` for admin wallets

---

## Files Modified in This Debug Session

1. **`src/components/PageAccessGuard.tsx`**
   - ✅ Fixed infinite loop with retry limit
   - ✅ Added better error logging
   - ✅ Added Supabase configuration check

2. **`src/components/DebugAccessInfo.tsx`** (NEW)
   - ✅ Real-time debug panel
   - ✅ Press Ctrl+Shift+D to toggle
   - ✅ Shows all access control state

3. **`src/app/layout.tsx`**
   - ✅ Added DebugAccessInfo component
   - ✅ Always available in bottom-right corner

---

## Need More Help?

### Check These Files:
- **Access Config**: `src/config/access-control.ts`
- **Page Guard**: `src/components/PageAccessGuard.tsx`
- **Database Service**: `src/lib/database/page-access-service.ts`
- **Supabase Client**: `src/lib/supabase/client.ts`

### Environment Variables:
- **Template**: `env-template.txt`
- **Your Config**: `.env.local` (create this!)

### Database Tables:
- `page_access_configs` - Page lock status and settings
- `user_profiles` - User access levels
- `access_grants` - Manual access grants

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Check environment variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Summary of Fixes

✅ **Fixed infinite loop** - Retry limit prevents endless waiting
✅ **Added timeout protection** - 5-second failsafe
✅ **Better error messages** - Clear console logs
✅ **Debug panel** - Visual debugging tool
✅ **Graceful degradation** - Works even if database fails

---

**Press `Ctrl + Shift + D` now to see the debug panel in action!** 🐛

