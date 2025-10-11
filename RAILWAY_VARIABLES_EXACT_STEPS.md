# 🚂 **RAILWAY VARIABLES - EXACT COPY-PASTE GUIDE**

**Time Required:** 5 minutes  
**Difficulty:** Very Easy (just copy-paste!)

---

## 🎯 **STEP-BY-STEP (WITH EXACT VALUES):**

### **Step 1: Open Railway Dashboard**

Click this link:
👉 https://railway.com/project/c7543ba4-ada3-469a-927f-48e337b8edf2/service/93f5795b-c13c-490e-9ea2-ce2cebbcf071

---

### **Step 2: Click "Variables" Tab**

Look for tabs at the top:
- Settings
- **Variables** ← Click this one
- Metrics
- Deployments

---

### **Step 3: Add Variable #1**

Click **"New Variable"** button

**Variable Name:** (copy-paste this)
```
PRICE_ORACLE_AUTOMATION_ENABLED
```

**Value:** (copy-paste this)
```
true
```

Click **"Add"** or **"Save"**

---

### **Step 4: Add Variable #2**

Click **"New Variable"** again

**Variable Name:**
```
PRICE_ORACLE_PROGRAM_ID
```

**Value:**
```
ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
```

Click **"Add"**

---

### **Step 5: Add Variable #3** (Your Keypair)

Click **"New Variable"**

**Variable Name:**
```
PRICE_ORACLE_AUTHORITY_SECRET_KEY
```

**Value:**
```
[paste your keypair array from secure backup]
```

**Example format:**
```
[82,204,132,209,87,176,71,21,67,...]
```

Click **"Add"**

---

### **Step 6: Add Variable #4**

Click **"New Variable"**

**Variable Name:**
```
PRICE_ORACLE_CHECK_INTERVAL
```

**Value:**
```
60000
```

Click **"Add"**

---

### **Step 7: Add Variable #5**

Click **"New Variable"**

**Variable Name:**
```
PRICE_ORACLE_UPDATE_THRESHOLD
```

**Value:**
```
1.0
```

Click **"Add"**

---

### **Step 8: Add Variable #6**

Click **"New Variable"**

**Variable Name:**
```
PRICE_ORACLE_COOLDOWN
```

**Value:**
```
300000
```

Click **"Add"**

---

### **Step 9: Add Variable #7**

Click **"New Variable"**

**Variable Name:**
```
KEYPAIR_ROTATION_ENABLED
```

**Value:**
```
true
```

Click **"Add"**

---

### **Step 10: Add Variable #8** (Generate Encryption Key)

**First, generate a random encryption key:**

**Copy this command and run in PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

**Example output:**
```
aB3dE5fG7hI9jK2lM4nO6pQ8rS0tU1vW3xY5zA7bC9dE2fG4hI6jK8
```

**Then in Railway:**

Click **"New Variable"**

**Variable Name:**
```
KEYPAIR_ENCRYPTION_KEY
```

**Value:**
```
[paste the random string you just generated]
```

Click **"Add"**

---

### **Step 11: Wait for Deployment**

Railway will automatically:
1. Detect new variables
2. Start deploying (2-3 minutes)
3. Show deployment progress

**Watch for:** "Deployment successful" message

---

### **Step 12: Verify in Logs**

Click **"Deployments"** tab → Click latest deployment → Click **"View Logs"**

**Look for these success messages:**
```
🤖 Price Oracle Automation Configuration:
   Enabled: true
✅ Authority keypair loaded from environment variable
🔐 2FA Service initialized
✅ Keypair Rotation Service initialized
🚀 Price Oracle automation started automatically
```

If you see all these: **SUCCESS!** ✅

---

## ✅ **VERIFICATION:**

After Railway deploys, test these URLs:

### **Test 1: Automation Status**
```
https://analos-nft-backend-minimal-production.up.railway.app/api/oracle/automation/status
```

Should show:
```json
{
  "success": true,
  "data": {
    "running": true,
    ...
  }
}
```

### **Test 2: Health Check**
```
https://analos-nft-backend-minimal-production.up.railway.app/health
```

Should show:
```json
{
  "status": "healthy",
  ...
}
```

---

## 🎊 **THAT'S IT!**

8 simple copy-pastes and you're done!

**After adding variables:**
- ✅ Price oracle updates automatically
- ✅ Keypair rotation ready with 2FA
- ✅ Enterprise security enabled
- ✅ 100% OPERATIONAL!

---

**Total Time:** 5 minutes  
**Difficulty:** Very Easy  
**Result:** Enterprise-grade security! 🔐🚀

