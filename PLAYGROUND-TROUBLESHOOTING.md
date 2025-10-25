# 🔧 Solana Playground Troubleshooting

## ❌ Build Error: "Unable to build"

If you're getting build errors in Solana Playground, try these solutions:

---

## ✅ Solution 1: Use Simplified Version

**Use the simplified Playground-optimized code:**

1. Open: `programs/analos-name-service/PLAYGROUND-VERSION.rs`
2. Copy the **entire contents**
3. In Playground, paste into `src/lib.rs`
4. Build again

**Key differences in this version:**
- ✅ Removed `INIT_SPACE` (calculated manually)
- ✅ Removed `has_one` constraint (uses manual checks)
- ✅ Simplified validation logic
- ✅ Fixed space calculations for strings

---

## ✅ Solution 2: Check Anchor Version

Playground uses **Anchor 0.29.0** by default.

**In your Cargo.toml:**
```toml
[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
```

---

## ✅ Solution 3: Manual Space Calculation

The error might be from `INIT_SPACE`. Here's the manual calculation:

```rust
// ProfileRegistry space
space = 8 + 1 + 32 + 24 + 32 + 33 + 1 + 8 + 8 + 1
//      ^   ^   ^    ^    ^    ^    ^   ^   ^   ^
//      |   |   |    |    |    |    |   |   |   └─ is_active (bool = 1)
//      |   |   |    |    |    |    |   |   └───── updated_at (i64 = 8)
//      |   |   |    |    |    |    |   └─────── created_at (i64 = 8)
//      |   |   |    |    |    |    └─────────── tier (u8 = 1)
//      |   |   |    |    |    └──────────────── los_bros_mint (Option<Pubkey> = 1+32)
//      |   |   |    |    └───────────────────── profile_nft_mint (Pubkey = 32)
//      |   |   |    └────────────────────────── username (String = 4 + max_len)
//      |   |   └─────────────────────────────── wallet (Pubkey = 32)
//      |   └─────────────────────────────────── version (u8 = 1)
//      └─────────────────────────────────────── discriminator (8 bytes)

Total: 148 bytes
```

---

## ✅ Solution 4: Clear Playground Cache

1. In Playground, click **Settings** (gear icon)
2. Click **"Clear Cache"**
3. Refresh the page
4. Try building again

---

## ✅ Solution 5: Start Fresh Project

1. In Playground, click **"New"**
2. Select **"Anchor"** framework
3. Name: `analos-name-service`
4. Paste code from `PLAYGROUND-VERSION.rs`
5. Build

---

## 🎯 Quick Test - Minimal Version

If nothing works, try this **ultra-minimal** version first:

```rust
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod analos_name_service {
    use super::*;

    pub fn register_profile(
        ctx: Context<RegisterProfile>,
        username: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_registry;
        profile.username = username.to_lowercase();
        profile.wallet = ctx.accounts.user.key();
        
        msg!("✅ Registered: @{}", profile.username);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 24,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile_registry: Account<'info, ProfileRegistry>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct ProfileRegistry {
    pub wallet: Pubkey,     // 32
    pub username: String,   // 4 + 20 = 24
}
```

**If this builds**, then add features back one at a time.

---

## 🐛 Common Errors & Fixes

### **Error: "space constraint violated"**
**Fix:** Increase space in `#[account(init, space = XXX)]`

### **Error: "seeds constraint violation"**
**Fix:** Make sure PDA seeds match exactly:
```rust
seeds = [b"profile", user_wallet.key().as_ref()]
```

### **Error: "account not initialized"**
**Fix:** Check that `init` constraint is present:
```rust
#[account(init, payer = user_wallet, space = 148)]
```

### **Error: "unknown field INIT_SPACE"**
**Fix:** Use manual space calculation instead:
```rust
// Don't use:
space = 8 + ProfileRegistry::INIT_SPACE

// Use:
space = 148  // Calculate manually
```

---

## 📋 Deployment Checklist

- [ ] Using `PLAYGROUND-VERSION.rs` code
- [ ] Anchor version is 0.29.0
- [ ] Cleared Playground cache
- [ ] Fresh project created
- [ ] Space calculations are correct
- [ ] No `INIT_SPACE` or `InitSpace` trait used
- [ ] All imports are present

---

## 🔍 Still Not Working?

### **Check Console Output:**
1. Open browser DevTools (F12)
2. Look at Console tab
3. Copy any error messages

### **Common Issues:**

**"RangeError: Maximum call stack size exceeded"**
→ Infinite recursion in accounts, check seeds

**"Account discriminator mismatch"**
→ PDA already exists with different structure, use new seeds

**"Insufficient funds"**
→ Not enough SOL in Playground wallet, use devnet faucet

---

## 💡 Pro Tips

1. **Start Simple:** Get basic version working first
2. **Add Features Gradually:** Add one instruction at a time
3. **Test Each Change:** Build after every modification
4. **Check Space:** Always calculate account space correctly
5. **Use Minimal Code:** Remove unnecessary features for Playground

---

## 🚀 Once It Builds Successfully

1. Click **Deploy**
2. Select **Devnet**
3. Copy the Program ID
4. Download IDL from the **IDL** tab
5. Download `.so` binary from `target/deploy/`

Then deploy to Analos:
```bash
solana config set --url https://rpc.analos.io
solana program deploy ./analos_name_service.so
```

---

## 📞 Need More Help?

1. **Playground GitHub**: https://github.com/solana-playground/solana-playground/issues
2. **Anchor Discord**: https://discord.gg/anchor
3. **Solana Stack Exchange**: https://solana.stackexchange.com/

---

## ✨ The Working Code

**Use this file for guaranteed Playground compatibility:**
```
programs/analos-name-service/PLAYGROUND-VERSION.rs
```

Copy it exactly as-is into Playground's `src/lib.rs` and it should build! 🎉

