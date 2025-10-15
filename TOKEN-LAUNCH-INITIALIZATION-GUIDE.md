# 🚀 Token Launch Program Initialization Guide

## ✅ **Program Details**

**Program ID:** `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw`

**Authority:** `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`

**Status:** DEPLOYED ✅ | VERIFIED ✅ | NOT INITIALIZED ⏳

---

## 📋 **Initialization Parameters**

When you initialize at **www.onlyanal.fun/admin**, you'll need to provide:

### **Required Fields:**

1. **Token Name** (String)
   - Example: "Los Bros Token"
   - Max length: 32 characters

2. **Token Symbol** (String)
   - Example: "LOSBROS"
   - Max length: 10 characters

3. **Total Supply** (u64)
   - Example: 1,000,000,000 tokens
   - In base units (multiply by 10^decimals)
   - Recommended: 1B - 10B tokens

4. **Initial Price** (u64 lamports)
   - Starting price per token in $LOS lamports
   - Example: 100 lamports = 0.0000001 LOS per token
   - Recommended: Start low for better bonding curve

5. **Bonding Target** (u64)
   - How much $LOS to raise before migrating to DLMM
   - Example: 100 SOL = 100,000,000,000 lamports
   - Recommended: 50-200 LOS

6. **Creator Prebuy Percentage** (u8)
   - Percentage of tokens creator gets upfront
   - Example: 5 (= 5%)
   - Recommended: 2-10%
   - Goes to creator wallet for marketing/development

7. **Metadata URI** (String)
   - IPFS or Arweave link to token metadata
   - Example: "https://arweave.net/..."
   - Include: logo, description, social links
   - Max length: 200 characters

---

## 🎯 **Recommended Values for Testing**

### **Test Launch Configuration:**

```json
{
    "name": "Test Token",
    "symbol": "TEST",
    "total_supply": 1000000000, // 1 billion tokens
    "initial_price": 100, // 0.0000001 LOS per token
    "bonding_target": 10000000000, // 10 LOS
    "creator_prebuy_percentage": 5, // 5%
    "metadata_uri": "https://example.com/metadata.json"
}
```

### **Production Launch Configuration:**

```json
{
    "name": "Los Bros Token",
    "symbol": "LOSBROS",
    "total_supply": 5000000000, // 5 billion tokens
    "initial_price": 50, // Very low starting price
    "bonding_target": 100000000000, // 100 LOS
    "creator_prebuy_percentage": 2, // 2% (100M tokens)
    "metadata_uri": "https://arweave.net/your-metadata"
}
```

---

## 💡 **Bonding Curve Explanation**

### **How It Works:**

```
START: 
├─ Initial Price: 50 lamports/token
├─ Total Supply: 5B tokens
└─ Bonding Target: 100 LOS

DURING BONDING:
├─ User buys 1M tokens
├─ Price increases by ~0.02%
├─ Next buyer pays slightly more
└─ Price keeps increasing with each buy

PRICE CURVE:
├─ 0% sold: 50 lamports
├─ 25% sold: 75 lamports
├─ 50% sold: 125 lamports
├─ 75% sold: 250 lamports
└─ 100% sold: 500 lamports

COMPLETION (100 LOS raised):
├─ Migrate to DLMM
├─ Create liquidity pool
├─ Lock LP tokens
└─ Free market trading begins
```

### **Fee Structure:**

```
Every token purchase:
├─ 8.9% total fees
│   ├─ 2.5% → Platform wallet
│   ├─ 1.5% → Buyback wallet ($LOL)
│   ├─ 1.0% → Dev wallet
│   ├─ 2.0% → Creator prebuy escrow
│   └─ 1.9% → Pool creation escrow
└─ 91.1% → Bonding curve (for DLMM migration)
```

---

## 🔐 **Important Notes**

### **Authority Wallet:**
- Must have enough $LOS for transaction
- Should be the deployer wallet: `4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`
- This wallet will be the program authority

### **Creator Prebuy:**
- Gets immediate allocation
- Can sell on bonding curve
- Or hold for after graduation

### **After Initialization:**
- Cannot change token supply
- Cannot change bonding target
- CAN pause/unpause trading
- CAN update metadata URI

---

## ✅ **Initialization Checklist**

Before clicking "Initialize":

- [ ] Wallet connected (`4ea9ktn5Ngb3dUjBBKYe7n87iztyQht8MVxn6EBtEQ4q`)
- [ ] Wallet has at least 0.5 LOS for fees
- [ ] Token name chosen (max 32 chars)
- [ ] Token symbol chosen (max 10 chars)
- [ ] Total supply decided (1B - 10B recommended)
- [ ] Initial price set (start low!)
- [ ] Bonding target set (50-200 LOS)
- [ ] Creator prebuy % set (2-10%)
- [ ] Metadata URI ready (optional for testing)

---

## 🚨 **Troubleshooting**

### **If initialization fails:**

1. **Check Program ID**
   - Should be: `Eydws6TzESGgBZyEHy5BYF8sSDcsRXC4tBF9JaVqWCRw`

2. **Check Wallet Balance**
   - Need at least 0.5 LOS

3. **Check RPC Connection**
   - Should be: `https://rpc.analos.io`

4. **Check Authority**
   - Must be program deployer wallet

### **Common Errors:**

**"Already Initialized"**
- Program can only be initialized once
- Check if it's already done

**"Insufficient Funds"**
- Add more LOS to wallet

**"Invalid Parameters"**
- Check all values are within limits
- Token name/symbol not too long
- Supply/price/target are positive numbers

---

## 📊 **After Initialization**

Once initialized, you can:

1. **Buy Tokens**
   - Test the bonding curve
   - Price increases with each purchase

2. **Monitor Progress**
   - Check tokens sold
   - Check $LOS raised
   - Watch bonding curve progress

3. **Claim Creator Prebuy**
   - Get your allocated tokens
   - Available immediately

4. **Manage Settings**
   - Pause/unpause trading
   - Update metadata
   - Monitor fees collected

---

## 🎯 **Ready to Initialize!**

Go to: **https://www.onlyanal.fun/admin**

1. Connect wallet (deployer wallet)
2. Find "Token Launch" section
3. Click "Initialize Program"
4. Fill in parameters
5. Click "Initialize"
6. Confirm transaction
7. Wait for confirmation
8. Success! 🎉

---

## 📝 **Post-Initialization Tasks**

After successful init:

1. ✅ Test buy function
2. ✅ Verify bonding curve works
3. ✅ Check fee distribution
4. ✅ Test creator prebuy claim
5. ✅ Add DLMM migration logic
6. ✅ Deploy NFT Launchpad
7. ✅ Complete ecosystem integration

---

**Let's do this!** 🚀

