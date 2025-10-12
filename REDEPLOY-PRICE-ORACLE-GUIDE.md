# 🚀 Redeploy Price Oracle with Correct Program ID

## ✅ **What We Fixed in Source Code**

We've updated the Price Oracle program source code to use the correct program ID:

### **Files Updated:**

1. **`programs/analos-price-oracle/src/lib.rs`:**
   ```rust
   // BEFORE (WRONG)
   declare_id!("v9RBPUoi4tVRpxrwv4xuS5LgGXsSXdRvcbw5PkeCt62");
   
   // AFTER (CORRECT)
   declare_id!("5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD");
   ```

2. **`Anchor.toml`:**
   ```toml
   # BEFORE (WRONG)
   analos_price_oracle = "v9RBPUoi4tVRpxrwv4xuS5LgGXsSXdRvcbw5PkeCt62"
   
   # AFTER (CORRECT)
   analos_price_oracle = "5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD"
   ```

3. **`programs/analos-price-oracle/security.txt`:**
   ```txt
   # Already had the correct ID:
   Program ID: 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD
   ```

---

## 🎯 **Two Options for Redeployment**

### **Option 1: Deploy to Existing Program ID** ⭐ **Recommended**

Since the program is already deployed at `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD`, we can:

1. **Update the deployed program** with the corrected source code
2. **Keep the same program ID** (no frontend changes needed)
3. **Everything stays consistent**

### **Option 2: Deploy New Program**

Deploy to a completely new program ID, but this would require updating all references.

---

## 🚀 **Deployment Steps (Option 1 - Recommended)**

### **Prerequisites:**
- Solana CLI installed
- Anchor framework installed
- Authority wallet with program upgrade permissions

### **Step 1: Build the Program**
```bash
# Navigate to project root
cd /path/to/analos-nft-launchpad

# Build the Price Oracle program
anchor build --program-name analos_price_oracle
```

### **Step 2: Deploy/Upgrade**
```bash
# Deploy to existing program ID
solana program deploy target/deploy/analos_price_oracle.so \
  --program-id 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD \
  --url https://rpc.analos.io \
  --keypair ~/.config/analos/id.json
```

### **Step 3: Verify Deployment**
```bash
# Check program info
solana program show 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD \
  --url https://rpc.analos.io
```

---

## 📊 **Current Status**

### **✅ Source Code Fixed:**
- ✅ Program ID updated in `lib.rs`
- ✅ Program ID updated in `Anchor.toml`
- ✅ Security.txt already correct
- ✅ Frontend config updated to match

### **⏳ Ready for Deployment:**
- ⏳ Need to build and deploy the program
- ⏳ Need Solana CLI and Anchor installed
- ⏳ Need authority wallet for deployment

---

## 🔧 **Alternative: Use Existing Deployment**

Since we've already updated the frontend to use the correct program ID (`5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD`), and the program is already deployed at that address, we could:

1. **Test the current deployment** - it might already work
2. **The program ID mismatch was the main issue**
3. **Now that frontend uses correct ID, it should work**

---

## 🎯 **Quick Test**

Before redeploying, let's test if the current deployment works now that we've fixed the frontend:

1. **Wait for Vercel deployment** (should be done now)
2. **Try Price Oracle initialization again**
3. **If it works, no redeployment needed!**

---

## 📋 **Deployment Checklist**

### **If Redeployment Needed:**
- [ ] Install Solana CLI
- [ ] Install Anchor framework
- [ ] Ensure authority wallet has upgrade permissions
- [ ] Build program: `anchor build --program-name analos_price_oracle`
- [ ] Deploy: `solana program deploy target/deploy/analos_price_oracle.so --program-id 5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD --url https://rpc.analos.io`
- [ ] Verify deployment
- [ ] Test initialization

### **If Current Deployment Works:**
- [ ] Test frontend initialization
- [ ] Verify no more program ID mismatch errors
- [ ] Oracle works correctly

---

## 🔗 **Important Notes**

### **Program Upgrade Permissions:**
The authority wallet must have upgrade permissions for the existing program. If not, you'll need to:

1. **Deploy as new program** (different ID)
2. **Update all references** (frontend, backend, etc.)
3. **Update documentation**

### **Testing:**
After any deployment:
1. **Run test script:** `npx ts-node tests/test-price-oracle-init.ts`
2. **Check explorer:** https://explorer.analos.io/address/5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD
3. **Try initialization** via admin panel

---

## 🎉 **Expected Result**

After successful deployment/upgrade:

```bash
✅ Program deployed successfully
✅ Program ID matches source code
✅ Frontend uses correct program ID
✅ No more DeclaredProgramIdMismatch errors
✅ Price Oracle initialization works
```

---

## 🚨 **If Deployment Fails**

### **Common Issues:**
1. **No upgrade permissions** - Deploy as new program
2. **Build errors** - Check Solana/Anchor installation
3. **Network issues** - Check Analos RPC connectivity

### **Fallback Plan:**
If redeployment fails, the current fix (updating frontend to use correct program ID) might be sufficient.

---

## 📱 **Quick Decision**

**Try this first:**
1. Wait for Vercel deployment to complete
2. Test Price Oracle initialization
3. If it works → No redeployment needed! ✅
4. If it still fails → Redeploy program

**Most likely scenario:** The program ID fix in the frontend is all that's needed! 🎯

---

**Next Step:** Test the current deployment with the fixed frontend configuration.
