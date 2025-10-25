# 🎯 Analos Name Service (ANS)

**On-chain username registry for Analos blockchain - Like SNS for Solana**

## 🌟 What is ANS?

Analos Name Service (ANS) is a **decentralized username registry** built on Anchor framework for the Analos blockchain. It provides:

- ✅ **Blockchain-enforced username uniqueness** (zero collisions possible)
- ✅ **SNS-style PDAs** (deterministic address lookup)
- ✅ **Atomic registration** (username + profile NFT in one transaction)
- ✅ **Transferable usernames** (trade/sell your identity)
- ✅ **Composable** (other programs can verify identities)

## 🏗️ Architecture

### **Dual PDA System:**

1. **Profile Registry PDA**
   - Seeds: `[b"profile", wallet_pubkey]`
   - One per wallet
   - Stores profile NFT mint, Los Bros mint, tier

2. **Username Registry PDA**
   - Seeds: `[b"username", username_bytes]`
   - One per username (globally unique)
   - Points to profile registry owner

### **Username Rules:**
- 3-20 characters
- Alphanumeric + underscore only
- Must start with a letter
- Case-insensitive (stored lowercase)

## 🚀 Deployment

### **1. Deploy via Solana Playground**

See `SOLANA-PLAYGROUND-DEPLOYMENT.md` for full guide.

Quick steps:
1. Open https://beta.solpg.io/
2. Paste `src/lib.rs` code
3. Build & Deploy
4. Download IDL and binary

### **2. Deploy to Analos Mainnet**

```bash
solana config set --url https://rpc.analos.io
solana program deploy ./target/deploy/analos_name_service.so
```

## 📋 Instructions

### **register_profile**
Register a new username and create profile registry.

```rust
pub fn register_profile(
    ctx: Context<RegisterProfile>,
    username: String,
    profile_nft_mint: Pubkey,
    los_bros_mint: Option<Pubkey>,
    tier: u8,
) -> Result<()>
```

**Accounts:**
- `user_wallet` - Signer, payer
- `profile_registry` - PDA to create
- `username_registry` - PDA to create
- `system_program` - System program

**Errors:**
- `UsernameAlreadyTaken` - Username is not available
- `InvalidUsernameFormat` - Invalid characters or length
- `UsernameMustStartWithLetter` - Username starts with non-letter

### **update_profile**
Update Los Bros mint or tier.

```rust
pub fn update_profile(
    ctx: Context<UpdateProfile>,
    los_bros_mint: Option<Pubkey>,
    new_tier: Option<u8>,
) -> Result<()>
```

### **burn_profile**
Deactivate profile and release username.

```rust
pub fn burn_profile(ctx: Context<BurnProfile>) -> Result<()>
```

### **transfer_username**
Transfer username to new wallet (requires both signatures).

```rust
pub fn transfer_username(ctx: Context<TransferUsername>) -> Result<()>
```

## 🧪 Testing

Test script for Solana Playground:

```typescript
import * as anchor from "@coral-xyz/anchor";

describe("analos-name-service", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AnalosNameService;

  it("Registers username", async () => {
    const username = "testuser";
    const [profilePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const [usernamePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("username"), Buffer.from(username.toLowerCase())],
      program.programId
    );

    await program.methods
      .registerProfile(username, anchor.web3.Keypair.generate().publicKey, null, 1)
      .accounts({
        userWallet: provider.wallet.publicKey,
        profileRegistry: profilePDA,
        usernameRegistry: usernamePDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const profile = await program.account.profileRegistry.fetch(profilePDA);
    console.log("✅ Registered:", profile.username);
  });
});
```

## 🔗 Integration

### **JavaScript SDK Example:**

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { ANS_PROGRAM_ID } from './config';

// Find PDAs
const [profilePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), walletPubkey.toBuffer()],
  ANS_PROGRAM_ID
);

const [usernamePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("username"), Buffer.from(username.toLowerCase())],
  ANS_PROGRAM_ID
);

// Check username availability
const usernameAccount = await program.account.usernameRegistry.fetch(usernamePDA);
if (usernameAccount.isAvailable) {
  console.log("Username available!");
}
```

## 💰 Cost Breakdown

- **Deployment**: ~8-10 SOL (one-time)
- **Per Registration**: ~0.004 SOL (rent, reclaimable)
- **Update**: ~0.00001 SOL (transaction fee)

## 📊 Account Sizes

- `ProfileRegistry`: ~139 bytes
- `UsernameRegistry`: ~106 bytes

## 🎯 Use Cases

1. **Profile NFT Minting** - Register username atomically with NFT
2. **Identity Verification** - Other programs can check username ownership
3. **Social Features** - Display human-readable names instead of addresses
4. **Username Trading** - Transfer valuable usernames to new owners

## 🔒 Security Features

- ✅ Atomic registration (no race conditions)
- ✅ Ownership verification via PDAs
- ✅ Transfer requires both signatures
- ✅ Burnt profiles release usernames
- ✅ Version field for upgradability

## 📞 Support

- **Docs**: See `SOLANA-PLAYGROUND-DEPLOYMENT.md`
- **Analos RPC**: https://docs.analos.io/developers/rpc
- **Anchor**: https://www.anchor-lang.com/

---

**Built with ❤️ for the Analos ecosystem** 🚀

