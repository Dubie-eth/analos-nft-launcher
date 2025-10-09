# New Analos NFT Launchpad Program Configuration

## 🆕 New Program Details

**Program ID:** `FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo`

## 📋 Integration Steps

### 1. Environment Variables
Add these to your `.env` file in the `backend` directory:

```env
NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
ADMIN_PRIVATE_KEY=[82,204,132,209,87,176,71,21,67,147,2,207,56,92,240,77,86,253,104,104,122,39,75,43,211,37,84,87,89,111,14,211,160,184,235,251,245,32,50,10,128,139,75,189,56,55,81,140,39,76,169,93,106,182,94,49,137,191,255,239,252,66,111,7]
CORS_ORIGIN=https://analos-nft-launcher-9cxc.vercel.app
```

Also add to `frontend-new/.env.local`:

```env
NEXT_PUBLIC_NFT_LAUNCHPAD_PROGRAM_ID=FS2aWrQnDcVioFnskRjnD1aXzb9DXEHd3SSMUyxHDgUo
```

### 2. Services to Update

- `backend/src/analos-program-service.ts` - Create new service for your program
- `frontend-new/src/lib/analos-program-client.ts` - Frontend client for program interactions
- `frontend-new/src/lib/direct-nft-mint.ts` - Update to use new program

### 3. Features Your New Program Should Support

Based on what you've built, please share:
- Does it support collection creation?
- Does it handle minting with custom metadata?
- Does it support whitelist/phases?
- Does it support payment in $LOS token?
- What instructions/methods does it expose?

## 🤔 Questions Before Integration

1. **Program Structure**: Can you share the program's IDL (Interface Definition Language) or the instruction set?
2. **Account Structure**: What accounts does the program use (collection accounts, NFT accounts, etc.)?
3. **Minting Flow**: What's the complete flow for minting an NFT with your program?
4. **Payment Handling**: How does it handle payment collection and burning?

## 📦 What We'll Keep

✅ All existing UI/UX
✅ Admin dashboard
✅ Access control system
✅ Analytics and tracking
✅ Verification system
✅ Partner management
✅ Collections page
✅ Marketplace
✅ Profile page

## 🔄 What We'll Adapt

🔄 Minting logic to use new program
🔄 Transaction building
🔄 Program-specific account derivation
🔄 Metadata creation flow

