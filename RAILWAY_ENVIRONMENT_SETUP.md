# 🚂 **RAILWAY ENVIRONMENT VARIABLES SETUP**

**For:** Automated Price Oracle System  
**Service:** Backend on Railway  
**Status:** Ready to configure!

---

## 🎯 **QUICK SETUP (3 MINUTES)**

### **Step 1: Go to Railway Dashboard**
1. Open: https://railway.com/project/c7543ba4-ada3-469a-927f-48e337b8edf2/service/93f5795b-c13c-490e-9ea2-ce2cebbcf071
2. Click on your backend service
3. Click "Variables" tab

### **Step 2: Add These Variables**

Click "New Variable" and add each of these:

```env
PRICE_ORACLE_AUTOMATION_ENABLED=true
PRICE_ORACLE_PROGRAM_ID=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
PRICE_ORACLE_CHECK_INTERVAL=60000
PRICE_ORACLE_UPDATE_THRESHOLD=1.0
PRICE_ORACLE_COOLDOWN=300000
```

### **Step 3: Add Authority Keypair**

**Option A: From File** (If you have the keypair JSON)
```env
PRICE_ORACLE_AUTHORITY_SECRET_KEY=[1,2,3,4,5,6,7,8,...]
```
Copy the entire array from your keypair file.

**Option B: From Solana CLI**
```bash
# Get your keypair
cat ~/.config/solana/id.json

# Copy the entire array [1,2,3,...]
# Paste as PRICE_ORACLE_AUTHORITY_SECRET_KEY value
```

### **Step 4: Deploy**
- Railway will automatically redeploy
- Wait 2-3 minutes for deployment
- Check logs for: "🤖 Price Oracle automation initialized"

---

## 📋 **COMPLETE VARIABLE LIST:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `PRICE_ORACLE_AUTOMATION_ENABLED` | `true` | Enable automation |
| `PRICE_ORACLE_PROGRAM_ID` | `ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn` | Price Oracle program |
| `PRICE_ORACLE_AUTHORITY_SECRET_KEY` | `[1,2,3,...]` | Your authority keypair array |
| `PRICE_ORACLE_CHECK_INTERVAL` | `60000` | Check every 60 seconds |
| `PRICE_ORACLE_UPDATE_THRESHOLD` | `1.0` | Update when 1% change |
| `PRICE_ORACLE_COOLDOWN` | `300000` | 5 minute cooldown |

---

## 🔑 **HOW TO GET YOUR AUTHORITY KEYPAIR:**

### **If you deployed the Price Oracle:**

Your authority is the wallet you used to deploy. Get the keypair:

#### **From Solana CLI:**
```bash
cat ~/.config/solana/id.json
```

#### **From Custom Keypair File:**
```bash
cat /path/to/your-keypair.json
```

#### **From Anchor Deploy:**
```bash
# Usually in:
cat ~/.config/solana/id.json
# Or target/deploy/your-program-keypair.json
```

### **Format:**
Should be a JSON array like:
```json
[178,23,45,67,89,...]
```

---

## ✅ **VERIFICATION:**

After adding variables and deploying:

### **1. Check Railway Logs:**
Look for these messages:
```
🤖 Price Oracle Automation Configuration:
   Enabled: true
   Program ID: ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
   Check Interval: 60 seconds
   Update Threshold: 1%
   Cooldown: 300 seconds
✅ Authority keypair loaded from environment variable
   Public Key: YOUR_PUBLIC_KEY_HERE
✅ Price Oracle automation initialized
🚀 Price Oracle automation started automatically
🤖 Price Oracle Automation API mounted at /api/oracle/automation
```

### **2. Test API Endpoint:**
```bash
curl https://analos-nft-backend-minimal-production.up.railway.app/api/oracle/automation/status
```

Should return:
```json
{
  "success": true,
  "data": {
    "running": true,
    "enabled": true,
    "lastKnownPrice": 0,
    "checkIntervalSeconds": 60,
    ...
  }
}
```

### **3. Check Frontend:**
1. Go to: https://analosnftfrontendminimal.vercel.app/admin
2. Connect wallet
3. Click "🤖 Price Automation" tab
4. Should show status dashboard

---

## 🎛️ **CONFIGURATION OPTIONS:**

### **Check Interval:**
- **60000** (1 minute) - Default, good for most cases
- **30000** (30 seconds) - More frequent, higher costs
- **300000** (5 minutes) - Less frequent, lower costs

### **Update Threshold:**
- **1.0** (1%) - Default, good balance
- **0.5** (0.5%) - More sensitive, more updates
- **5.0** (5%) - Less sensitive, fewer updates

### **Cooldown:**
- **300000** (5 minutes) - Default, prevents spam
- **600000** (10 minutes) - Longer cooldown
- **180000** (3 minutes) - Shorter cooldown

---

## 💰 **COST ESTIMATES:**

### **Transaction Costs:**
- **Per Update:** ~0.00001 SOL (~$0.0004)
- **Daily (avg):** ~20 updates = ~0.0002 SOL (~$0.008)
- **Monthly:** ~600 updates = ~0.006 SOL (~$0.24)

### **Varies Based On:**
- Market volatility (more volatile = more updates)
- Update threshold (lower threshold = more updates)
- Cooldown period (shorter cooldown = more updates)

**Very affordable!** Less than $3/year even with high volatility! 💰

---

## 🛡️ **SECURITY:**

### **Best Practices:**

1. **Use Dedicated Wallet:**
   - Create a new wallet just for automation
   - Give it Price Oracle authority
   - Fund with minimal SOL (~0.01)

2. **Monitor Balance:**
   - Check wallet SOL balance regularly
   - Set up alerts for low balance
   - Refill when needed

3. **Secure Keypair:**
   - Never commit to git
   - Use Railway secrets
   - Limit access

4. **Monitor Logs:**
   - Check for errors daily
   - Review update frequency
   - Adjust config as needed

---

## 🆘 **TROUBLESHOOTING:**

### **Automation Not Starting:**

**Check Railway Logs for:**
```
⚠️ No authority keypair configured
```
**Fix:** Add `PRICE_ORACLE_AUTHORITY_SECRET_KEY`

---

**Check for:**
```
ℹ️ Price Oracle automation is disabled
```
**Fix:** Set `PRICE_ORACLE_AUTOMATION_ENABLED=true`

---

### **Updates Not Happening:**

**Check Logs for:**
```
⚠️ Could not fetch price from any source
```
**Fix:** Price API might be down, wait and it will retry

---

**Check for:**
```
ℹ️ Change below threshold
```
**Normal:** Price hasn't changed enough

---

**Check for:**
```
⏳ Cooldown active
```
**Normal:** Waiting for cooldown to expire

---

### **Transaction Errors:**

**Check for:**
```
❌ Transaction failed: insufficient funds
```
**Fix:** Add more SOL to authority wallet

---

**Check for:**
```
❌ Transaction failed: InvalidAccountData
```
**Fix:** Oracle might not be initialized yet - initialize first

---

## 📊 **MONITORING:**

### **What to Monitor:**

1. **Update Frequency:**
   - How often is oracle updating?
   - Is it too frequent or not enough?
   - Adjust threshold accordingly

2. **Error Rate:**
   - Any consistent errors?
   - Which price source is failing?
   - System auto-stops after 5 errors

3. **Price Accuracy:**
   - Is oracle price close to market?
   - Any significant delays?
   - Check price source reliability

4. **Cost:**
   - How much SOL being used?
   - Track monthly costs
   - Adjust frequency if too expensive

---

## 🎯 **READY TO DEPLOY!**

### **Deployment Checklist:**

```
□ Copy authority keypair array
□ Add all environment variables to Railway
□ Verify variables are saved
□ Trigger deployment or wait for auto-deploy
□ Check Railway logs for success messages
□ Test API endpoint: /api/oracle/automation/status
□ Visit frontend admin dashboard
□ Click "Price Automation" tab
□ Verify status shows correctly
□ Monitor for first price update
```

---

## 🎊 **YOU'RE DONE!**

Once you add the variables to Railway:
1. ✅ Backend will auto-deploy
2. ✅ Automation will auto-start (if enabled)
3. ✅ Price monitoring begins immediately
4. ✅ Oracle updates automatically when needed
5. ✅ You can monitor from admin dashboard

**Set it up once, it runs forever!** 🤖💰

---

## 📞 **NEXT STEPS:**

1. **Add variables to Railway** (Now)
2. **Wait for deployment** (2-3 min)
3. **Check logs** (Verify success)
4. **Test from admin UI** (Optional)
5. **Monitor and enjoy!** 🎉

**Your Price Oracle is about to become fully automated!** 🚀

