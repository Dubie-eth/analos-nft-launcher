# 🎯 Username Uniqueness System

## Core Rule
**Each username can only exist ONCE on the blockchain in our Profile NFT collection.**

## How It Works

### ✅ Registration (Minting)
1. User types a username (e.g., `@dubie`)
2. System checks database for existing username
3. If available, user can mint
4. After successful mint, username is registered to that NFT mint address and wallet

### ❌ Duplicate Prevention
- Username is normalized (lowercase, trimmed)
- Database enforces uniqueness constraint
- Double-check right before minting to prevent race conditions
- Reserved usernames blocked: `admin`, `analos`, `system`, `official`, `support`, `help`, `api`, `root`

### 🔄 Username Release (When NFT is Burned or Transferred)
If a Profile NFT is burned, the username becomes available again:

```typescript
// Release username after burn
await fetch('/api/profile-nft/check-username?username=dubie&mint=ABC123...', {
  method: 'DELETE'
});
```

---

## Implementation Details

### Database Table: `profile_nfts`
```sql
CREATE TABLE profile_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,  -- ✅ UNIQUE CONSTRAINT
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique index on username (enforces one username per blockchain)
CREATE UNIQUE INDEX idx_profile_nfts_username ON profile_nfts(username);
```

### API Endpoints

#### `GET /api/profile-nft/check-username?username={username}`
**Check if username is available**

Response:
```json
{
  "success": true,
  "available": true,
  "username": "dubie",
  "message": "Username @dubie is available!"
}
```

Or if taken:
```json
{
  "success": true,
  "available": false,
  "username": "dubie",
  "takenBy": {
    "owner": "86oK6fa5...",
    "mint": "ABC123..."
  },
  "message": "Username @dubie is already taken"
}
```

#### `POST /api/profile-nft/check-username`
**Register a username after successful mint**

Request:
```json
{
  "username": "dubie",
  "mint": "ABC123...",
  "owner": "86oK6fa5..."
}
```

Response:
```json
{
  "success": true,
  "message": "Username @dubie registered successfully"
}
```

#### `DELETE /api/profile-nft/check-username?username={username}&mint={mint}`
**Release a username (when NFT is burned)**

Response:
```json
{
  "success": true,
  "message": "Username @dubie is now available"
}
```

---

## User Flow

### 🎭 Minting a Profile NFT

1. **User types username:**
   ```
   Input: @dubie
   ```

2. **Real-time availability check:**
   ```
   ✅ Username @dubie is available!
   💰 Price: 2673 LOS (or FREE if whitelisted)
   ```

3. **User clicks "Mint Profile NFT":**
   - System double-checks username is still available
   - System checks if wallet already used free mint
   - If all checks pass, transaction is prepared

4. **After successful mint:**
   - Username is registered in database
   - NFT appears in "My Profile NFTs" tab
   - Username is now permanently locked (until NFT is burned)

### 🔥 Burning/Transferring a Profile NFT

**When a Profile NFT is burned or transferred:**

Option 1: **Automatic Release** (Future Enhancement)
- Blockchain listener detects burn event
- Automatically calls DELETE endpoint
- Username becomes available again

Option 2: **Manual Release** (Current)
- Admin or user calls DELETE endpoint
- Username is released immediately

---

## Edge Cases Handled

### ✅ Race Conditions
**Problem:** Two users try to mint the same username at the exact same time.

**Solution:**
1. Database unique constraint prevents duplicates at DB level
2. Double-check right before minting
3. First transaction to commit wins

### ✅ Server Restarts
**Problem:** In-memory cache is lost on server restart.

**Solution:**
- Database is source of truth
- Cache is only used as fallback
- All checks query database first

### ✅ Case Sensitivity
**Problem:** User tries `@DUBIE`, `@Dubie`, `@dubie`

**Solution:**
- All usernames normalized to lowercase
- `@DUBIE` and `@dubie` are treated as the same

### ✅ Whitespace
**Problem:** User adds spaces: `@dubie ` or ` @dubie`

**Solution:**
- Usernames are trimmed before checking
- `" @dubie "` becomes `"dubie"`

---

## Security Features

### 🛡️ Reserved Usernames
These usernames cannot be minted by regular users:
- `@admin`
- `@analos`
- `@system`
- `@official`
- `@support`
- `@help`
- `@api`
- `@root`

### 🔒 Validation Rules
- **Min length:** 1 character
- **Max length:** 50 characters
- **Allowed characters:** Letters, numbers, underscores, hyphens
- **No special characters:** No emojis, symbols (except _ and -)

---

## Future Enhancements

### 📡 Blockchain Listener
Monitor Profile NFT burns and transfers:
```typescript
// Pseudo-code
connection.onAccountChange(PROFILE_NFT_PROGRAM, async (accountInfo) => {
  if (accountInfo.isBurned) {
    await releaseUsername(accountInfo.username, accountInfo.mint);
  }
});
```

### 📊 Username Analytics
Track popular username patterns:
- Most common username lengths
- Most popular prefixes/suffixes
- Trending username themes

### 💎 Premium Usernames
Special pricing for short/premium usernames:
- 1-3 characters: 10,000 LOS
- 4-5 characters: 5,000 LOS
- 6+ characters: 2,673 LOS (standard)

### 🎁 Username Reservations
Allow users to reserve usernames before launch:
```typescript
await reserveUsername({
  username: 'dubie',
  wallet: '86oK6fa5...',
  reservationFee: 100 // LOS
});
```

---

## Testing

### ✅ Test Cases

1. **Test 1: Mint username for first time**
   - Expected: Success ✅

2. **Test 2: Try to mint same username again**
   - Expected: Error - "Username already taken" ❌

3. **Test 3: Burn NFT, then mint same username**
   - Expected: Success ✅

4. **Test 4: Case sensitivity**
   - `@Dubie` and `@dubie` should conflict ✅

5. **Test 5: Reserved usernames**
   - `@admin` should be blocked ❌

6. **Test 6: Race condition**
   - Two users mint `@dubie` simultaneously
   - One succeeds, one fails ✅

---

## Deployment Checklist

### Supabase Setup
- [x] Create `profile_nfts` table
- [x] Add unique constraint on `username` column
- [x] Add unique index on `username`
- [x] Set up RLS policies (if needed)

### Environment Variables
- [x] `SUPABASE_URL` configured
- [x] `SUPABASE_SERVICE_ROLE_KEY` configured (server-side)

### API Routes
- [x] `GET /api/profile-nft/check-username` (check availability)
- [x] `POST /api/profile-nft/check-username` (register username)
- [x] `DELETE /api/profile-nft/check-username` (release username)

### Frontend Integration
- [x] Real-time username checking in mint form
- [x] Double-check before minting
- [x] Register username after successful mint
- [ ] Burn NFT → Release username flow (future)

---

## Summary

✅ **ONE USERNAME = ONE NFT**  
✅ **Database-backed (persistent)**  
✅ **Race condition protected**  
✅ **Case-insensitive**  
✅ **Reserved usernames blocked**  
✅ **Username becomes available after burn**  

🎯 **Production Ready!**

