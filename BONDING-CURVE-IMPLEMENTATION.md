# 🎯 **Bonding Curve Implementation & Creator Allocation**

## **Overview**

The Analos NFT Launchpad now features a **complete bonding curve system** where creators can allocate a portion of their mint funds to a bonding curve reserve. This provides **transparent, on-chain liquidity** for NFT trading.

---

## 🏗️ **Bonding Curve Structure**

### **What is a Bonding Curve?**

A bonding curve is a mathematical curve that defines the relationship between an NFT's price and its supply. As more NFTs are bought, the price increases along the curve. As NFTs are sold back, the price decreases.

### **Formula**

```
Price = BasePrice + (CurrentSupply × Slope)
```

**Where:**
- `BasePrice` = Initial floor price (e.g., 1 SOL)
- `CurrentSupply` = Number of NFTs currently minted
- `Slope` = Price increase per NFT minted (e.g., 0.001 SOL)

### **Example:**
```
BasePrice = 1 SOL
Slope = 0.001 SOL

NFT #1: 1 SOL
NFT #100: 1.1 SOL
NFT #1000: 2 SOL
NFT #10000: 11 SOL
```

---

## 💰 **Creator Bonding Curve Allocation**

### **How It Works:**

1. **Creator Sets Allocation Percentage** (0% - 50%)
   ```rust
   pub fn set_creator_bonding_curve_allocation(
       ctx: Context<SetCreatorBondingCurveAllocation>,
       allocation_percentage: u16, // 0-5000 (0%-50%)
   ) -> Result<()>
   ```

2. **Automatic Allocation During Minting:**
   ```
   User Mints NFT (100 SOL)
       ↓
   Platform Fees: 5 SOL (distributed immediately)
       ↓
   Creator Payment: 95 SOL
       ↓
   Creator chooses 20% BC allocation:
       - Bonding Curve Reserve: 19 SOL
       - Creator Withdrawable: 76 SOL
   ```

3. **Transparent Tracking:**
   - `escrow_wallet.creator_funds` = Withdrawable funds
   - `escrow_wallet.bonding_curve_reserve` = BC reserve
   - `escrow_wallet.creator_bc_allocation_bps` = Allocation %

---

## 📊 **EscrowWallet Structure**

```rust
pub struct EscrowWallet {
    pub collection_config: Pubkey,
    pub authority: Pubkey,
    pub creator_funds: u64,              // Withdrawable by creator
    pub bonding_curve_reserve: u64,      // Reserved for BC
    pub total_withdrawn: u64,            // Historical withdrawals
    pub total_deposited: u64,            // Historical deposits
    pub creator_share_percentage: u16,   // Creator's share of mint price
    pub bonding_curve_enabled: bool,     // BC active/inactive
    pub last_updated: i64,               // Last update timestamp
    pub funds_locked: bool,              // Fund lock status
    pub unlocked_amount: u64,            // Available if locked
    pub lock_until: i64,                 // Lock expiration
    pub creator_bc_allocation_bps: u16,  // % to BC (0-5000 = 0%-50%)
}
```

---

## 🎨 **Creator Control**

### **1. Set Bonding Curve Allocation:**
```typescript
// Set 25% of creator funds to bonding curve
await program.methods
    .setCreatorBondingCurveAllocation(2500) // 25% = 2500 basis points
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        authority: creatorPublicKey,
    })
    .signers([creator])
    .rpc();
```

### **2. View Current Allocation:**
```typescript
const escrowWallet = await program.account.escrowWallet.fetch(escrowWalletPDA);
console.log(`Creator Funds: ${escrowWallet.creatorFunds / 1e9} SOL`);
console.log(`BC Reserve: ${escrowWallet.bondingCurveReserve / 1e9} SOL`);
console.log(`BC Allocation: ${escrowWallet.creatorBcAllocationBps / 100}%`);
```

### **3. Withdraw Creator Funds:**
```typescript
// Withdraw available creator funds (not BC reserve)
await program.methods
    .withdrawCreatorFunds(new BN(10 * 1e9)) // 10 SOL
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        creator: creatorPublicKey,
        authority: authorityPublicKey,
    })
    .signers([creator, authority])
    .rpc();
```

---

## 🔒 **Security Features**

### **1. Maximum Allocation Cap:**
- Creators can allocate **up to 50%** of their funds to BC
- Prevents over-allocation that could hurt creator liquidity

### **2. Transparent Tracking:**
- All allocations are **on-chain and verifiable**
- Events emitted for every allocation change
- Minters can see exactly where funds go

### **3. Separate Balances:**
- Creator withdrawable funds are **separate** from BC reserve
- BC reserve cannot be withdrawn directly by creator
- Only used for bonding curve buys/sells

### **4. Community Takeover Compatible:**
- BC allocation can be changed by new authority after CTO
- BC reserve remains intact during authority transfers

---

## 📈 **Bonding Curve Buy/Sell Flow**

### **Buying from Bonding Curve:**
```
User wants to buy NFT from BC
    ↓
Calculate current price from curve
    ↓
User pays to escrow wallet
    ↓
NFT transferred to user
    ↓
BC reserve increases
    ↓
Price increases for next buy
```

### **Selling to Bonding Curve:**
```
User wants to sell NFT to BC
    ↓
Calculate current sell price (slightly lower than buy)
    ↓
NFT burned or returned to escrow
    ↓
User receives payment from BC reserve
    ↓
BC reserve decreases
    ↓
Price decreases for next sell
```

---

## 🎯 **Use Cases**

### **1. High BC Allocation (30-50%):**
- **Best for:** Community-focused projects
- **Benefits:** Strong floor price, high liquidity
- **Trade-off:** Less immediate creator revenue

### **2. Medium BC Allocation (15-30%):**
- **Best for:** Balanced approach
- **Benefits:** Good liquidity + creator revenue
- **Trade-off:** Moderate trade-offs

### **3. Low BC Allocation (0-15%):**
- **Best for:** Creator-focused projects
- **Benefits:** Maximum creator revenue
- **Trade-off:** Lower floor price protection

---

## 📊 **Transparency Dashboard**

All bonding curve data is **publicly visible**:

```typescript
// Fetch all BC data
const escrowWallet = await program.account.escrowWallet.fetch(escrowWalletPDA);

console.log("=== BONDING CURVE TRANSPARENCY ===");
console.log(`Total Creator Funds: ${escrowWallet.creatorFunds / 1e9} SOL`);
console.log(`BC Reserve: ${escrowWallet.bondingCurveReserve / 1e9} SOL`);
console.log(`BC Allocation: ${escrowWallet.creatorBcAllocationBps / 100}%`);
console.log(`Total Deposited: ${escrowWallet.totalDeposited / 1e9} SOL`);
console.log(`Total Withdrawn: ${escrowWallet.totalWithdrawn / 1e9} SOL`);
console.log(`BC Enabled: ${escrowWallet.bondingCurveEnabled}`);
```

---

## 🚀 **Events Emitted**

### **CreatorBondingCurveAllocationSetEvent:**
```rust
#[event]
pub struct CreatorBondingCurveAllocationSetEvent {
    pub collection_config: Pubkey,
    pub creator: Pubkey,
    pub allocation_percentage: u16,
    pub timestamp: i64,
}
```

**Emitted when:** Creator sets or updates BC allocation percentage

---

## 🔧 **Integration Example**

### **Complete Flow:**

```typescript
// 1. Creator initializes collection
await program.methods
    .initializeCollection(maxSupply, price, threshold, name, symbol, uri)
    .accounts({...})
    .rpc();

// 2. Creator sets BC allocation to 25%
await program.methods
    .setCreatorBondingCurveAllocation(2500)
    .accounts({
        collectionConfig: collectionConfigPDA,
        escrowWallet: escrowWalletPDA,
        authority: creator.publicKey,
    })
    .signers([creator])
    .rpc();

// 3. Users mint NFTs
// - 95 SOL goes to escrow
// - 25% of 95 = 23.75 SOL to BC reserve
// - 75% of 95 = 71.25 SOL to creator funds

// 4. Creator withdraws available funds
await program.methods
    .withdrawCreatorFunds(new BN(71.25 * 1e9))
    .accounts({...})
    .rpc();

// 5. BC reserve stays for trading liquidity
// Users can now buy/sell NFTs against the curve
```

---

## ✅ **Benefits**

### **For Creators:**
- ✅ **Flexible allocation** (0%-50%)
- ✅ **Transparent tracking** of all funds
- ✅ **Can change allocation** anytime
- ✅ **Withdraw available funds** anytime

### **For Minters:**
- ✅ **See exactly where funds go**
- ✅ **Guaranteed floor price** from BC
- ✅ **On-chain liquidity** for trading
- ✅ **Protection from creator rug pulls**

### **For Platform:**
- ✅ **Sustainable fee model**
- ✅ **Automatic fee distribution**
- ✅ **Transparent operations**
- ✅ **Community takeover support**

---

## 🎯 **Summary**

The bonding curve system provides:
1. **Creators** can allocate 0%-50% of mint funds to BC
2. **Automatic allocation** during each mint
3. **Transparent tracking** on-chain
4. **Separate balances** for creator vs BC
5. **Community takeover** compatible
6. **Publicly verifiable** allocations

**This ensures fairness, transparency, and sustainable liquidity for all NFT collections!** 🚀
