# 📝 Update Metadata Program ID

After deploying the metadata program, update this file:

**File:** `frontend-minimal/src/lib/metadata-service.ts`

**Find this line:**
```typescript
PROGRAM_ID: 'META11111111111111111111111111111111111111', // UPDATE AFTER DEPLOYMENT
```

**Replace with your deployed program ID:**
```typescript
PROGRAM_ID: 'YOUR_ACTUAL_PROGRAM_ID_HERE', // From deployment Step 1.6
```

**Then commit and push:**
```bash
git add .
git commit -m "Update metadata program ID with deployed address"
git push origin master
```

