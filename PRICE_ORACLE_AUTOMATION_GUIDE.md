# 🤖 **AUTOMATED PRICE ORACLE UPDATES - COMPLETE GUIDE**

**Feature:** Automatically update the Price Oracle when LOS price changes by 1% or more  
**Status:** ✅ **FULLY IMPLEMENTED**  
**Date:** October 11, 2025

---

## 🎯 **WHAT IT DOES:**

The automated Price Oracle system:
- 🔍 **Monitors** LOS token price from multiple sources (CoinGecko, Jupiter, CMC)
- 📊 **Calculates** price change percentage
- ⚡ **Updates** oracle automatically when threshold is met (default: 1%)
- ⏰ **Respects** cooldown period to prevent too-frequent updates
- 🛡️ **Handles** errors gracefully with automatic stop after 5 failures
- 📝 **Logs** all activities for monitoring

---

## 📁 **FILES CREATED:**

### **Backend:**
1. **`backend/src/services/price-oracle-automation.ts`**
   - Main automation service
   - Price monitoring logic
   - Oracle update logic
   
2. **`backend/src/routes/price-oracle-automation.ts`**
   - API endpoints for control
   - Status, start, stop, config

### **Frontend:**
3. **`frontend-minimal/src/components/PriceOracleAutomation.tsx`**
   - Admin UI component
   - Start/stop controls
   - Configuration management
   - Real-time status display

---

## 🚀 **SETUP INSTRUCTIONS:**

### **Step 1: Configure Backend**

Add to your `backend/.env`:

```env
# Price Oracle Automation
PRICE_ORACLE_AUTOMATION_ENABLED=true
PRICE_ORACLE_PROGRAM_ID=ztA5VFYMy29tgWpkAioro4HTfXQTgwpPinv9uSEdCMn
PRICE_ORACLE_AUTHORITY_KEYPAIR=your-keypair-path.json
PRICE_ORACLE_CHECK_INTERVAL=60000
PRICE_ORACLE_UPDATE_THRESHOLD=1.0
PRICE_ORACLE_COOLDOWN=300000
```

### **Step 2: Initialize in Backend**

In your `backend/src/server.ts` or main file:

```typescript
import { initializePriceOracleAutomation } from './services/price-oracle-automation';
import priceOracleAutomationRoutes from './routes/price-oracle-automation';
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Load authority keypair
const authorityKeypairPath = process.env.PRICE_ORACLE_AUTHORITY_KEYPAIR!;
const authorityKeypair = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync(authorityKeypairPath, 'utf-8')))
);

// Initialize automation
const automation = initializePriceOracleAutomation({
  enabled: process.env.PRICE_ORACLE_AUTOMATION_ENABLED === 'true',
  checkIntervalMs: parseInt(process.env.PRICE_ORACLE_CHECK_INTERVAL || '60000'),
  updateThresholdPercent: parseFloat(process.env.PRICE_ORACLE_UPDATE_THRESHOLD || '1.0'),
  programId: process.env.PRICE_ORACLE_PROGRAM_ID!,
  authorityKeypair,
  rpcUrl: 'https://rpc.analos.io',
  minTimeBetweenUpdates: parseInt(process.env.PRICE_ORACLE_COOLDOWN || '300000'),
});

// Add routes
app.use('/api/oracle/automation', priceOracleAutomationRoutes);

// Auto-start if enabled
if (process.env.PRICE_ORACLE_AUTOMATION_ENABLED === 'true') {
  automation.start();
}
```

### **Step 3: Add to Admin Dashboard**

In `frontend-minimal/src/app/admin/page.tsx`:

```typescript
import PriceOracleAutomation from '@/components/PriceOracleAutomation';

// Add to tabs array:
{ id: 'price-automation', label: 'Price Automation', icon: '🤖' }

// Add to tab content:
{activeTab === 'price-automation' && (
  <div>
    <PriceOracleAutomation />
  </div>
)}
```

---

## 🎛️ **HOW TO USE:**

### **Starting Automation:**

1. Navigate to Admin Dashboard
2. Click "🤖 Price Automation" tab
3. Review current configuration
4. Click "▶️ Start Automation"
5. Automation begins monitoring

### **Stopping Automation:**

1. Go to Price Automation tab
2. Click "⏸️ Stop Automation"
3. Automation stops immediately

### **Changing Configuration:**

1. Go to Price Automation tab
2. Adjust settings:
   - Check Interval: 30-3600 seconds
   - Update Threshold: 0.1-100%
   - Cooldown: 60-3600 seconds
3. Click "💾 Save Configuration"
4. Automation restarts with new settings

---

## 📊 **DEFAULT CONFIGURATION:**

| Setting | Default Value | Description |
|---------|---------------|-------------|
| **Check Interval** | 60 seconds | How often to check price |
| **Update Threshold** | 1.0% | Minimum change to trigger update |
| **Cooldown** | 300 seconds (5 min) | Minimum time between updates |
| **Max Errors** | 5 consecutive | Auto-stop after this many errors |

---

## 🔍 **PRICE SOURCES:**

The system fetches prices from multiple sources for redundancy:

### **1. CoinGecko API:**
- **URL:** `https://api.coingecko.com/api/v3/simple/price`
- **Free:** Yes
- **Rate Limit:** 10-50 calls/minute

### **2. Jupiter Aggregator:**
- **URL:** `https://price.jup.ag/v4/price`
- **Free:** Yes
- **Real-time:** Yes

### **3. CoinMarketCap:**
- **URL:** `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`
- **Free:** Limited (requires API key)
- **Rate Limit:** Based on plan

**Note:** The system tries sources in order until one succeeds.

---

## 📈 **HOW IT WORKS:**

### **Monitoring Loop:**

```
1. Fetch current LOS price from sources
2. Compare with last known price
3. Calculate percentage change
4. If change >= threshold AND cooldown expired:
   a. Build oracle update transaction
   b. Sign with authority keypair
   c. Send to blockchain
   d. Wait for confirmation
   e. Update tracking variables
5. Wait for check interval
6. Repeat
```

### **Example Scenario:**

```
Initial Price: $0.10
Check Interval: 60s
Threshold: 1%
Cooldown: 5 minutes

Time 0:00 - Price: $0.10 → Store initial price
Time 1:00 - Price: $0.10 → No change (0%)
Time 2:00 - Price: $0.101 → Change = 1.0% ✅
            → Update oracle to $0.101
            → Cooldown starts
Time 3:00 - Price: $0.103 → Change = 1.98%, but cooldown active
            → Skip update
Time 7:00 - Price: $0.103 → Cooldown expired, change = 1.98% ✅
            → Update oracle to $0.103
```

---

## ⚠️ **IMPORTANT NOTES:**

### **Security:**

1. **Authority Keypair:**
   - Store securely on backend
   - Never expose in frontend
   - Use environment variables
   - Consider using a dedicated automation wallet

2. **API Keys:**
   - Some price sources require API keys
   - Store in environment variables
   - Don't commit to git

3. **Rate Limiting:**
   - Respect API rate limits
   - Adjust check interval if needed
   - System tries multiple sources

### **Costs:**

1. **Transaction Fees:**
   - Each update costs ~0.00001 SOL
   - With 1% threshold and active markets: ~10-50 updates/day
   - Daily cost: ~0.0005 SOL ($0.02 at $40/SOL)

2. **API Costs:**
   - CoinGecko: Free
   - Jupiter: Free
   - CMC: Free tier available

### **Monitoring:**

1. **Check Logs:**
   - Backend logs show all activity
   - Successful updates logged
   - Errors logged with details

2. **Status Dashboard:**
   - Real-time status in admin UI
   - Shows consecutive errors
   - Shows next check time

3. **Alerts:**
   - System auto-stops after 5 errors
   - Check backend logs for issues

---

## 🐛 **TROUBLESHOOTING:**

### **Automation Won't Start:**

**Problem:** "Automation not initialized"  
**Solution:** Check backend initialization code

**Problem:** "Already running"  
**Solution:** Stop first, then start

**Problem:** "Disabled in config"  
**Solution:** Set `PRICE_ORACLE_AUTOMATION_ENABLED=true`

### **Updates Not Happening:**

**Problem:** Price not changing enough  
**Solution:** Lower threshold or wait for bigger moves

**Problem:** Cooldown active  
**Solution:** Reduce cooldown period or wait

**Problem:** All price sources failing  
**Solution:** Check API connectivity, add API keys

### **Errors:**

**Problem:** "Transaction failed"  
**Solution:** Check authority wallet has SOL for fees

**Problem:** "Program error"  
**Solution:** Verify program ID and instruction format

**Problem:** "Consecutive errors = 5, stopping"  
**Solution:** Check logs, fix issue, restart manually

---

## 🔧 **ADVANCED CONFIGURATION:**

### **Adding Custom Price Sources:**

In `price-oracle-automation.ts`, add to `priceSources` array:

```typescript
{
  name: 'Custom Exchange',
  url: 'https://api.customexchange.com/price/LOS',
  parseResponse: (data) => {
    // Parse your custom API response
    return data?.price || null;
  },
}
```

### **Custom Update Logic:**

Modify `checkAndUpdatePrice()` method to add custom logic:

```typescript
// Example: Only update during certain hours
const currentHour = new Date().getHours();
if (currentHour < 9 || currentHour > 17) {
  console.log('⏰ Outside trading hours, skipping update');
  return;
}
```

### **Notification Integration:**

Add notifications when price updates:

```typescript
// After successful update
await sendDiscordNotification(
  `🤖 Price Oracle updated! New price: $${newPrice.toFixed(6)}`
);
```

---

## 📊 **MONITORING & ANALYTICS:**

### **Key Metrics to Track:**

1. **Update Frequency:**
   - How often is oracle updated?
   - Are thresholds appropriate?

2. **Error Rate:**
   - How many errors occur?
   - Which price source is most reliable?

3. **Price Accuracy:**
   - Is oracle price close to market price?
   - Any significant delays?

4. **Cost:**
   - How much SOL spent on updates?
   - Is it cost-effective?

### **Logging:**

All activities are logged with timestamps:
- ✅ Price checks
- ✅ Updates triggered
- ✅ Transactions sent
- ⚠️ Errors encountered
- ℹ️ Configuration changes

---

## 🎯 **BEST PRACTICES:**

1. **Start Conservative:**
   - Begin with 1% threshold
   - Adjust based on market volatility

2. **Monitor Regularly:**
   - Check logs daily
   - Review update frequency
   - Adjust config as needed

3. **Set Reasonable Cooldown:**
   - 5 minutes prevents spam
   - Shorter for volatile markets
   - Longer for stable markets

4. **Redundant Price Sources:**
   - Use multiple sources
   - Add more if available
   - Consider paid APIs for reliability

5. **Error Handling:**
   - System stops after errors
   - Investigate and fix
   - Restart manually

6. **Cost Management:**
   - Monitor SOL balance
   - Set alerts for low balance
   - Consider update costs

---

## 🚀 **FUTURE ENHANCEMENTS:**

Potential improvements:

1. **Smart Scheduling:**
   - Only update during trading hours
   - More frequent during high volatility

2. **Multi-Oracle Support:**
   - Update multiple oracles
   - Different configs per oracle

3. **Advanced Algorithms:**
   - Time-weighted average price (TWAP)
   - Volume-weighted average price (VWAP)
   - Moving averages

4. **Notifications:**
   - Discord/Telegram alerts
   - Email notifications
   - Webhook integrations

5. **Analytics Dashboard:**
   - Historical price chart
   - Update frequency graph
   - Cost analysis

---

## ✅ **SYSTEM STATUS:**

- ✅ **Backend Service:** Fully implemented
- ✅ **API Endpoints:** Complete
- ✅ **Frontend UI:** Ready
- ✅ **Documentation:** Complete
- ⏳ **Deployment:** Needs backend setup

---

## 📝 **QUICK START CHECKLIST:**

```
□ 1. Add environment variables to backend
□ 2. Save authority keypair to secure location
□ 3. Add initialization code to backend
□ 4. Deploy backend with automation
□ 5. Add PriceOracleAutomation component to admin
□ 6. Navigate to admin dashboard
□ 7. Configure settings (check interval, threshold)
□ 8. Click "Start Automation"
□ 9. Monitor status dashboard
□ 10. Check logs for successful updates
```

---

## 🎉 **YOU'RE DONE!**

The automated Price Oracle system is now:
- ✅ Fully implemented
- ✅ Ready for deployment
- ✅ Documented completely
- ✅ Configurable via UI

**Set it up once, and it runs forever!** 🤖💰

---

**Questions?** Check the code comments or create an issue!

