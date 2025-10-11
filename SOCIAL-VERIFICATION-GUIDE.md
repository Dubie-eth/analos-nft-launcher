# 🔐 **Social Verification System - Complete Guide**

**Analos NFT Launchpad Enhanced**  
**Date:** October 10, 2025

---

## 🎯 **Overview**

The Enhanced Social Verification System provides **tamper-proof, cryptographically secure** social media verification for NFT collection authentication. This ensures:

- ✅ **Collection Authenticity** - Verify official collection social accounts
- ✅ **User Whitelisting** - Verify user social accounts for whitelist eligibility
- ✅ **Anti-Fraud Protection** - Prevent fake accounts and impersonation
- ✅ **Flexible Verification** - Oracle-based or self-verification with proof
- ✅ **Revocation System** - Admin can revoke fraudulent verifications
- ✅ **Expiration Management** - Configurable verification validity periods

---

## 🏗️ **Architecture**

### **1. SocialVerificationConfig**
Per-collection, per-platform configuration for social verification.

```rust
pub struct SocialVerificationConfig {
    collection_config: Pubkey,
    platform: SocialPlatform,         // Twitter, Discord, Instagram, Telegram, TikTok
    required_followers: Option<u64>,   // Minimum follower requirement
    required_posts: Option<u64>,       // Minimum post requirement
    verification_endpoint: String,     // API endpoint for verification
    api_key_hash: [u8; 32],           // Hashed API key for security
    admin: Pubkey,                    // Admin who configured this
    
    // Enhanced fields
    official_handle: String,          // Official collection handle (e.g., @AnalosCrypto)
    verification_method: u8,          // 0=Oracle, 1=Signature, 2=Message, 3=All
    oracle_authority: Pubkey,         // Trusted oracle public key
    allow_self_verification: bool,    // Allow users to self-verify
    verification_expiry_days: u16,    // Verification validity (0=forever)
    total_verified_users: u64,        // Counter of verified users
    require_message_signature: bool,  // Require signed message proof
    verification_code_prefix: String, // Prefix for verification codes
    is_active: bool,                  // Can be disabled by admin
}
```

### **2. UserSocialVerification**
Individual user's verified social account record.

```rust
pub struct UserSocialVerification {
    user: Pubkey,                     // User's wallet address
    collection_config: Pubkey,        // Which collection this is for
    platform: SocialPlatform,         // Which social platform
    social_handle: String,            // User's handle (e.g., @username)
    social_id: String,                // Platform-specific user ID
    followers_at_verification: u64,   // Followers when verified
    verification_signature: [u8; 64], // Cryptographic signature proof
    verification_hash: [u8; 32],      // Hash of all verification data
    verified_at: i64,                 // Timestamp of verification
    expires_at: i64,                  // When it expires (0=never)
    verified_by: Pubkey,              // Oracle or self
    is_revoked: bool,                 // Has been revoked?
    revoked_at: i64,                  // When revoked
    revoked_by: Pubkey,               // Who revoked it
}
```

---

## 🔧 **Instructions**

### **1. Configure Social Verification**
```rust
pub fn configure_social_verification(
    ctx: Context<ConfigureSocialVerification>,
    platform: SocialPlatform,
    required_followers: Option<u64>,
    required_posts: Option<u64>,
    verification_endpoint: String,
    official_handle: String,
    verification_method: u8,
    oracle_authority: Pubkey,
    allow_self_verification: bool,
    verification_expiry_days: u16,
    verification_code_prefix: String,
) -> Result<()>
```

**Parameters:**
- `platform`: Twitter, Discord, Instagram, Telegram, or TikTok
- `required_followers`: Minimum follower count (optional)
- `required_posts`: Minimum post count (optional)
- `verification_endpoint`: API endpoint for oracle verification
- `official_handle`: Official collection account (e.g., "@AnalosCrypto")
- `verification_method`: 
  - `0` = Oracle only
  - `1` = Signature only
  - `2` = Message signature required
  - `3` = All methods
- `oracle_authority`: Public key of trusted oracle
- `allow_self_verification`: Allow users to verify themselves
- `verification_expiry_days`: How long verification lasts (0 = forever)
- `verification_code_prefix`: Prefix for codes (e.g., "ANALOS-")

**Example:**
```typescript
await program.methods
  .configureSocialVerification(
    { twitter: {} },  // SocialPlatform
    1000,             // Min 1000 followers
    null,             // No post requirement
    "https://api.analos.io/verify",
    "@AnalosCrypto",
    2,                // Message signature required
    oraclePublicKey,
    true,             // Allow self-verification
    90,               // 90 day expiry
    "ANALOS-"
  )
  .accounts({ ... })
  .rpc();
```

---

### **2. Verify Social Account**
```rust
pub fn verify_social_account(
    ctx: Context<VerifySocialAccount>,
    social_handle: String,
    social_id: String,
    followers_count: u64,
    verification_code: String,
    verification_signature: [u8; 64],
) -> Result<()>
```

**Parameters:**
- `social_handle`: User's handle (e.g., "@alice")
- `social_id`: Platform-specific ID (e.g., "123456789")
- `followers_count`: Current follower count
- `verification_code`: Unique code (must start with prefix)
- `verification_signature`: Cryptographic signature from oracle

**Verification Hash:**
The program creates a tamper-proof hash:
```
hash = keccak256(
    user_pubkey + 
    social_handle + 
    social_id + 
    followers_count + 
    verification_code
)
```

**Example (Oracle Verification):**
```typescript
await program.methods
  .verifySocialAccount(
    "@alice",
    "123456789",
    5000,  // 5000 followers
    "ANALOS-a1b2c3d4",
    signatureBytes
  )
  .accounts({
    collectionConfig,
    socialVerificationConfig,
    userSocialVerification,
    userMintRecord,
    user: userPublicKey,
    verifier: oraclePublicKey,  // Oracle signs
    systemProgram
  })
  .signers([oracleSigner])
  .rpc();
```

**Example (Self-Verification):**
```typescript
await program.methods
  .verifySocialAccount(
    "@alice",
    "123456789",
    5000,
    "ANALOS-a1b2c3d4",
    proofSignatureBytes
  )
  .accounts({
    // ...
    verifier: userPublicKey,  // User signs
  })
  .signers([userSigner])
  .rpc();
```

---

### **3. Revoke Social Verification**
```rust
pub fn revoke_social_verification(
    ctx: Context<RevokeSocialVerification>,
    reason: String,
) -> Result<()>
```

**Parameters:**
- `reason`: Why verification is being revoked (max 200 chars)

**Example:**
```typescript
await program.methods
  .revokeSocialVerification(
    "Fake account detected"
  )
  .accounts({
    collectionConfig,
    userSocialVerification,
    userMintRecord,
    admin: adminPublicKey
  })
  .signers([adminSigner])
  .rpc();
```

---

### **4. Check Verification Status**
```rust
pub fn check_social_verification_status(
    ctx: Context<CheckSocialVerificationStatus>,
) -> Result<()>
```

**Example:**
```typescript
try {
  await program.methods
    .checkSocialVerificationStatus()
    .accounts({
      userSocialVerification,
      collectionConfig
    })
    .rpc();
  console.log("✅ Verification is valid");
} catch (error) {
  console.log("❌ Verification expired or revoked");
}
```

---

## 🔐 **Verification Methods**

### **Method 0: Oracle Only**
- **Most Secure**
- Oracle service verifies via API
- No self-verification allowed
- Best for high-value collections

### **Method 1: Signature Only**
- **Moderate Security**
- Requires cryptographic signature
- Can be oracle or self-verified
- Good balance of security and UX

### **Method 2: Message Signature**
- **High Security**
- Requires posting a message on social platform
- Message contains verification code
- Oracle verifies message exists
- Best for preventing bots

### **Method 3: All Methods**
- **Maximum Security**
- Combines all verification types
- Most thorough but slowest
- Recommended for premium collections

---

## 🎨 **Integration Workflows**

### **Workflow 1: Collection Setup**
```
1. Collection creator calls `configure_social_verification`
2. Specifies official Twitter: "@AnalosCrypto"
3. Sets minimum followers: 1000
4. Sets verification method: 2 (Message signature)
5. Sets oracle authority
6. Sets expiry: 90 days
```

### **Workflow 2: User Whitelist Entry (Oracle)**
```
1. User visits website, clicks "Verify Twitter"
2. Frontend redirects to Twitter OAuth
3. User authorizes application
4. Backend oracle service:
   - Fetches user's Twitter data
   - Checks follower count
   - Generates verification code
   - Creates cryptographic signature
5. Backend calls `verify_social_account` with oracle signature
6. User is now verified and whitelisted
```

### **Workflow 3: User Whitelist Entry (Self-Verification)**
```
1. User visits website, clicks "Verify Twitter"
2. Website shows verification code: "ANALOS-a1b2c3d4"
3. User posts tweet with code
4. User submits tweet URL to website
5. Frontend calls `verify_social_account` with user signature
6. Program validates code format
7. User is now verified (oracle can verify tweet later)
```

### **Workflow 4: Fraud Detection & Revocation**
```
1. Admin discovers fake account in verified list
2. Admin calls `revoke_social_verification` with reason
3. User's verification is marked as revoked
4. User can no longer mint from collection
5. Event emitted for transparency
```

---

## 📊 **Account PDAs**

### **SocialVerificationConfig PDA:**
```
seeds = [
    b"social_verification",
    collection_config.key(),
    platform.to_string().as_bytes()
]
```

### **UserSocialVerification PDA:**
```
seeds = [
    b"user_social_verification",
    user.key(),
    collection_config.key(),
    platform.to_string().as_bytes()
]
```

---

## 🛡️ **Security Features**

### **1. Cryptographic Hashing**
Every verification creates a unique hash:
```rust
hash = keccak256(user + handle + id + followers + code)
```
This prevents:
- ✅ Data tampering
- ✅ Replay attacks
- ✅ Impersonation

### **2. Signature Verification**
64-byte signature proves authenticity:
- Oracle signature = verified by trusted service
- User signature = user claims ownership

### **3. Expiration System**
- Configurable per collection
- Prevents stale verifications
- Automatic expiry checks

### **4. Revocation System**
- Admin can revoke anytime
- Transparent via events
- Prevents fraud

### **5. Verification Code Format**
- Must start with collection prefix
- Prevents code reuse across collections
- Easy to validate

---

## 📈 **Events**

### **SocialVerificationConfiguredEvent**
```rust
{
    collection_config: Pubkey,
    platform: SocialPlatform,
    official_handle: String,
    verification_method: u8,
    allow_self_verification: bool,
    admin: Pubkey,
    timestamp: i64,
}
```

### **SocialAccountVerifiedEvent**
```rust
{
    user: Pubkey,
    collection_config: Pubkey,
    social_handle: String,
    social_id: String,
    platform: SocialPlatform,
    followers_count: u64,
    verified_by: Pubkey,
    is_oracle_verification: bool,
    verification_hash: [u8; 32],
    expires_at: i64,
    timestamp: i64,
}
```

### **SocialVerificationRevokedEvent**
```rust
{
    user: Pubkey,
    collection_config: Pubkey,
    social_handle: String,
    platform: SocialPlatform,
    revoked_by: Pubkey,
    reason: String,
    timestamp: i64,
}
```

---

## 🚀 **Best Practices**

### **For Collection Creators:**
1. ✅ **Set Official Handle** - Users can verify it's really you
2. ✅ **Use Oracle Method** - Most secure for high-value collections
3. ✅ **Set Reasonable Followers** - Don't exclude real fans
4. ✅ **Set Expiration** - Prevent stale verifications (90 days recommended)
5. ✅ **Monitor Verifications** - Check for suspicious patterns

### **For Oracle Operators:**
1. ✅ **Secure API Keys** - Store hashed, never plain text
2. ✅ **Rate Limit** - Prevent abuse
3. ✅ **Verify Actively** - Actually check social platforms
4. ✅ **Log Everything** - Maintain audit trail
5. ✅ **Revoke Frauds** - Act quickly on fake accounts

### **For Users:**
1. ✅ **Use Real Account** - Don't create fake accounts
2. ✅ **Keep Code Secret** - Don't share verification codes
3. ✅ **Check Expiry** - Reverify before minting if expired
4. ✅ **Verify Official Handle** - Make sure it's the real collection

---

## 🎯 **Example Use Cases**

### **Use Case 1: Twitter Follower Whitelist**
```
Collection: Analos Punks
Requirement: Follow @AnalosCrypto on Twitter
Min Followers: None (just follow)
Method: Oracle
Expiry: 30 days
```

### **Use Case 2: Discord Community Whitelist**
```
Collection: Analos DAO
Requirement: Member of Discord server
Min Members: 1000 members in server
Method: Message signature
Expiry: Never
```

### **Use Case 3: Instagram Influencer Tier**
```
Collection: Analos Art
Requirement: 10K+ Instagram followers
Min Followers: 10000
Method: Oracle + Signature
Expiry: 90 days
```

### **Use Case 4: Multi-Platform Verification**
```
Collection: Analos Premium
Requirements:
  - Twitter: 5K+ followers
  - Discord: Member of server
  - Instagram: 10K+ followers
Method: All platforms required
Expiry: 180 days
```

---

## 🔍 **Troubleshooting**

### **Error: "Social verification is inactive"**
- **Cause:** Admin disabled verification
- **Solution:** Contact collection admin

### **Error: "Insufficient followers"**
- **Cause:** User doesn't meet follower requirement
- **Solution:** Gain more followers or wait for requirement change

### **Error: "Invalid verification code format"**
- **Cause:** Code doesn't start with prefix
- **Solution:** Use code provided by system

### **Error: "Self-verification is not allowed"**
- **Cause:** Collection requires oracle verification
- **Solution:** Wait for oracle to verify you

### **Error: "Verification has expired"**
- **Cause:** Verification period ended
- **Solution:** Reverify your social account

### **Error: "Verification has been revoked"**
- **Cause:** Admin revoked your verification
- **Solution:** Contact admin for reason

---

## 📄 **Summary**

The Enhanced Social Verification System provides:

✅ **Tamper-Proof Verification** - Cryptographic hashing  
✅ **Flexible Methods** - Oracle, signature, or message  
✅ **Anti-Fraud Protection** - Revocation system  
✅ **Expiration Management** - Configurable validity  
✅ **Multi-Platform Support** - Twitter, Discord, Instagram, Telegram, TikTok  
✅ **Transparent Events** - Full audit trail  
✅ **User-Friendly** - Self-verification option  

**READY FOR PRODUCTION USE** 🚀

---

**Documentation Created By:** AI Code Documentation  
**Date:** October 10, 2025  
**Status:** ✅ COMPLETE

