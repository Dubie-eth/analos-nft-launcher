# 🔑 Pinata Configuration Guide

## Your Pinata Credentials

**API Key:** `53c9ee15d73bbf7306d5`
**API Secret:** `a62d4e623efea582eabe018ba5b2b3ff8b8969aa79cbf9e69b7284fba958a002`
**JWT:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI5YmIxYTljOS1iNThiLTQxYmItOGE0ZS1hYmJjNGRhZmEyNzkiLCJlbWFpbCI6ImR1c3RpbmRkNDIxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1M2M5ZWUxNWQ3M2JiZjczMDZkNSIsInNjb3BlZEtleVNlY3JldCI6ImE2MmQ0ZTYyM2VmZWE1ODJlYWJlMDE4YmE1YjJiM2ZmOGI4OTY5YWE3OWNiZjllNjliNzI4NGZiYTk1OGEwMDIiLCJleHAiOjE3OTA5MTA1NzR9.CAuseeRcJQaqPO3N6T55-rEJ3_H4OI8--zNiHdm5nlM`

## 🚀 Setup Instructions

### ✅ SECURE Server-Side Configuration (Recommended)
Create a `.env.local` file in your `frontend-new` folder:

```bash
# Pinata IPFS Configuration (Server-side - SECURE)
PINATA_API_KEY=53c9ee15d73bbf7306d5
PINATA_SECRET_KEY=a62d4e623efea582eabe018ba5b2b3ff8b8969aa79cbf9e69b7284fba958a002

# Optional: GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=your_github_username/your_repo_name

# Backend Configuration
NEXT_PUBLIC_BACKEND_URL=https://analos-nft-launcher-backend-production.up.railway.app
```

### ⚠️ IMPORTANT: Security Update
**DO NOT USE** the old client-side environment variables:
- ❌ `NEXT_PUBLIC_PINATA_API_KEY` (exposes keys in browser)
- ❌ `NEXT_PUBLIC_PINATA_SECRET_KEY` (exposes secrets in browser)

**USE** the new server-side variables:
- ✅ `PINATA_API_KEY` (server-side only)
- ✅ `PINATA_SECRET_KEY` (server-side only)

## 🎯 Available Hosting Options

### 🌐 Pinata IPFS (Recommended)
- **Pros:** Decentralized, permanent, fast access
- **Cons:** Requires API keys
- **Best for:** Production NFT collections

### 📁 GitHub
- **Pros:** Version control, free, familiar interface
- **Cons:** Not truly decentralized
- **Best for:** Development and testing

### 💾 Local Fallback
- **Pros:** No setup required
- **Cons:** Uses placeholder images
- **Best for:** Testing functionality

## 🔒 Security Notes

- **Never commit** your `.env.local` file to Git
- **Store credentials** in a secure password manager
- **Rotate keys** periodically for security
- **Use environment variables** for production deployments

## 🧪 Testing Your Setup

1. Go to Collection Builder
2. Upload trait folders
3. Select Pinata as hosting provider
4. Build your collection
5. Check console logs for upload success

## 🆘 Troubleshooting

### "Pinata upload failed" errors:
- Verify your API keys are correct
- Check your Pinata account has sufficient quota
- Ensure your internet connection is stable

### "Credentials not available" warnings:
- Add credentials to `.env.local` file
- Or enter them directly in the Collection Builder UI
- Restart your development server after adding environment variables

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your Pinata account status
3. Test with a small collection first
4. Contact support if problems persist
