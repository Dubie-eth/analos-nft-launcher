# 🚂 **RAILWAY ENVIRONMENT VARIABLES - COMPLETE LIST**

**For:** Analos NFT Launchpad Backend  
**Railway Project:** https://railway.com/project/c7543ba4-ada3-469a-927f-48e337b8edf2

---

## 📋 **ALL ENVIRONMENT VARIABLES TO ADD:**

### **🤖 Price Oracle Automation (6 variables):**

```env
PRICE_ORACLE_AUTOMATION_ENABLED=true
PRICE_ORACLE_PROGRAM_ID=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
PRICE_ORACLE_AUTHORITY_SECRET_KEY=[your keypair array from secure backup]
PRICE_ORACLE_CHECK_INTERVAL=60000
PRICE_ORACLE_UPDATE_THRESHOLD=1.0
PRICE_ORACLE_COOLDOWN=300000
```

### **🔐 Keypair Rotation + 2FA (2 variables):**

```env
KEYPAIR_ROTATION_ENABLED=true
KEYPAIR_ENCRYPTION_KEY=change-this-to-a-random-32-char-string-minimum-for-production-security
```

---

## 🎯 **TOTAL: 8 ENVIRONMENT VARIABLES**

Copy-paste ready for Railway:

| # | Variable Name | Value |
|---|---------------|-------|
| 1 | `PRICE_ORACLE_AUTOMATION_ENABLED` | `true` |
| 2 | `PRICE_ORACLE_PROGRAM_ID` | `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn` |
| 3 | `PRICE_ORACLE_AUTHORITY_SECRET_KEY` | `[your keypair]` |
| 4 | `PRICE_ORACLE_CHECK_INTERVAL` | `60000` |
| 5 | `PRICE_ORACLE_UPDATE_THRESHOLD` | `1.0` |
| 6 | `PRICE_ORACLE_COOLDOWN` | `300000` |
| 7 | `KEYPAIR_ROTATION_ENABLED` | `true` |
| 8 | `KEYPAIR_ENCRYPTION_KEY` | `your-32-char-secret-here` |

---

## 🔑 **GENERATE ENCRYPTION KEY:**

For `KEYPAIR_ENCRYPTION_KEY`, generate a random 32+ character string:

**Option 1: PowerShell**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

**Option 2: Node.js**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Option 3: Manual**
```
Example: aB3dE5fG7hI9jK2lM4nO6pQ8rS0tU1vW3xY5zA7bC9dE2
(Just make sure it's random and 32+ characters!)
```

---

## ✅ **AFTER ADDING VARIABLES:**

Railway will auto-deploy. Check logs for:

```
🔐 2FA Service initialized
   Issuer: Analos NFT Launchpad
✅ Keypair Rotation Service initialized
   Backup Directory: ./keypair-backups
🔐 Keypair Rotation API mounted at /api/admin/keypair

🤖 Price Oracle Automation Configuration:
   Enabled: true
✅ Authority keypair loaded from environment variable
   Public Key: [your public key]
🚀 Price Oracle automation started automatically
🤖 Price Oracle Automation API mounted at /api/oracle/automation
```

---

## 🧪 **TESTING:**

### **Test 1: Check APIs are Live**
```bash
# Test 2FA endpoint
curl https://analos-nft-backend-minimal-production.up.railway.app/api/admin/keypair/2fa/setup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test"}'

# Should return QR code data
```

### **Test 2: Check Automation**
```bash
curl https://analos-nft-backend-minimal-production.up.railway.app/api/oracle/automation/status

# Should return running status
```

### **Test 3: Use Admin Dashboard**
1. Visit: https://analosnftfrontendminimal.vercel.app/admin
2. Connect wallet
3. Click "🔐 Keypair Security" tab
4. Should see 4-step wizard
5. Click "Setup 2FA"
6. QR code appears
7. Success! ✅

---

## 🎊 **THAT'S IT!**

Once you add these 8 variables:
- ✅ Automated price oracle active
- ✅ Keypair rotation with 2FA ready
- ✅ Enterprise-grade security enabled
- ✅ Admin dashboard fully functional

**Add the variables and watch the magic happen!** 🚀🔐

---

**Deployment happening now... waiting for Railway and Vercel! ⏳**

