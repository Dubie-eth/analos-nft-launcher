# Unique Username System

## Overview
Usernames on the platform are **globally unique** - just like coin names. There can only be ONE "dubie" username across the entire platform, regardless of case.

## Username Rules

### Format Requirements:
- **Length:** 3-20 characters
- **Start:** Must begin with a letter or number
- **Characters:** Only letters, numbers, underscores (_), and hyphens (-)
- **End:** Cannot end with underscore or hyphen
- **Consecutive:** No consecutive special characters (e.g., `user__name` or `user--name`)

### Examples:
✅ **Valid:**
- `dubie`
- `analos_nft`
- `user-123`
- `NFT_Collector`

❌ **Invalid:**
- `du` (too short)
- `_dubie` (starts with underscore)
- `dubie_` (ends with underscore)
- `user__name` (consecutive underscores)
- `admin` (reserved username)

## Reserved Usernames
The following usernames are reserved and cannot be used:
- `admin`, `administrator`, `root`, `system`
- `analos`, `onlyanal`, `official`
- `support`, `help`, `api`
- `www`, `mail`, `ftp`, `localhost`
- `test`, `dev`, `staging`, `production`
- `null`, `undefined`, `true`, `false`

## Case-Insensitive Uniqueness

All usernames are stored in **lowercase** and checked case-insensitively:
- If someone claims `dubie`, then `Dubie`, `DUBIE`, `DuBiE` are ALL unavailable
- This prevents confusion and impersonation
- Stored as: `dubie` (normalized to lowercase)

## API Endpoints

### 1. Check Username Availability

```typescript
GET /api/user-profiles/validate-username/[username]

Response (Available):
{
  "available": true,
  "valid": true,
  "message": "Username 'dubie' is available!"
}

Response (Taken):
{
  "available": false,
  "valid": true,
  "message": "Username 'dubie' is already taken",
  "takenBy": "86oK6fa5..."
}

Response (Invalid Format):
{
  "available": false,
  "valid": false,
  "message": "Username must be at least 3 characters long"
}
```

### 2. Reserve/Claim Username

```typescript
POST /api/user-profiles/validate-username/[username]
{
  "walletAddress": "86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW"
}

Response (Success):
{
  "success": true,
  "message": "Username 'dubie' has been reserved!",
  "username": "dubie",
  "profile": { ... }
}

Response (Already Taken):
{
  "success": false,
  "message": "Username 'dubie' is already taken"
}
Status: 409 Conflict
```

### 3. Update Profile with Username Check

```typescript
PUT /api/user-profiles/[walletAddress]
{
  "username": "dubie",
  "bio": "NFT Collector",
  ...
}

Response (Success):
{
  "id": "uuid",
  "username": "dubie",
  ...
}

Response (Username Taken):
{
  "error": "Username 'dubie' is already taken. Please choose a different username."
}
Status: 409 Conflict
```

## Database Schema

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,  -- Lowercase, unique index
  ...
);

-- Create unique index for case-insensitive lookups
CREATE UNIQUE INDEX idx_username_lower ON user_profiles (LOWER(username));
```

## Implementation in UI

### Beta Signup / Profile Manager
```tsx
// Real-time username validation
const checkUsername = async (username: string) => {
  const response = await fetch(`/api/user-profiles/validate-username/${username}`);
  const data = await response.json();
  
  if (!data.available) {
    setError(data.message);
  } else {
    setSuccess(data.message);
  }
};

// Save profile with username check
const saveProfile = async () => {
  try {
    const response = await fetch(`/api/user-profiles/${walletAddress}`, {
      method: 'PUT',
      body: JSON.stringify({ username, bio, ... })
    });
    
    if (response.status === 409) {
      // Username already taken
      const data = await response.json();
      alert(data.error);
    }
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};
```

## Benefits

### 1. **Prevents Impersonation**
- Only one person can be "dubie"
- No confusion between `dubie`, `Dubie`, `DUBIE`

### 2. **Brand Protection**
- Reserved usernames protect platform and common terms
- Prevents squatting on official accounts

### 3. **User Experience**
- Clear feedback when username is taken
- Real-time validation before submission
- Helpful error messages

### 4. **Same as Coin Names**
- Consistent rules across platform
- Users understand the system
- Prevents namespace collisions

## Error Handling

### Frontend
```tsx
try {
  await saveProfile();
} catch (error) {
  if (error.status === 409) {
    // Username taken - show friendly message
    showError("That username is already taken. Please try another!");
  } else {
    // Other error
    showError("Failed to save profile. Please try again.");
  }
}
```

### Backend
```typescript
// Check uniqueness before saving
const existingUser = await supabaseAdmin
  .from('user_profiles')
  .select('username, wallet_address')
  .ilike('username', normalizedUsername)
  .single();

if (existingUser && existingUser.wallet_address !== walletAddress) {
  return NextResponse.json(
    { error: `Username "${normalizedUsername}" is already taken` },
    { status: 409 }
  );
}
```

## Testing

### Test Cases:
1. ✅ Create username "dubie" - should succeed
2. ✅ Try to create "Dubie" - should fail (already taken)
3. ✅ Try to create "DUBIE" - should fail (already taken)
4. ✅ Try to create "admin" - should fail (reserved)
5. ✅ Try to create "du" - should fail (too short)
6. ✅ Try to create "_dubie" - should fail (invalid format)
7. ✅ Try to create "dubie_123" - should succeed (if available)

## Future Enhancements

### Possible Improvements:
1. **Username History** - Track username changes
2. **Username Verification Badge** - Special badge for verified users
3. **Username Marketplace** - Trade/sell usernames (like ENS domains)
4. **Username Suggestions** - Suggest available alternatives
5. **Username Analytics** - Track popular username patterns

---

**Key Takeaway:** One username = One owner. No duplicates, no confusion! 🎯
