# Environment Variables Audit

## Essential Variables (Keep These)
```bash
# Core Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Solana RPC
NEXT_PUBLIC_RPC_URL

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_API_KEY
NEXT_PUBLIC_PINATA_SECRET_KEY

# Security
DATABASE_ENCRYPTION_KEY
NEXT_PUBLIC_SECURITY_EMAIL

# Basic App Info
NEXT_PUBLIC_WEBSITE_URL
NODE_ENV
```

## Feature Flags (Optional - Can Remove If Not Using)
```bash
NEXT_PUBLIC_NEW_LANDING
NEXT_PUBLIC_ENHANCED_PROFILE
NEXT_PUBLIC_SOCIAL_FEATURES
NEXT_PUBLIC_LEADERBOARD
NEXT_PUBLIC_BETA_ONBOARDING
NEXT_PUBLIC_ADVANCED_ANALYTICS
NEXT_PUBLIC_MOBILE_OPTIMIZATIONS
```

## Customer Service (Optional)
```bash
NEXT_PUBLIC_CUSTOMER_SERVICE_ENDPOINT
NEXT_PUBLIC_ENABLE_CUSTOMER_SERVICE
NEXT_PUBLIC_TELEGRAM_HANDLE
```

## Recommendation
Keep only the **Essential Variables** for now. You can always add feature flags back when you need them for specific marketing campaigns.

This reduces your environment variables from ~15+ to just 10 essential ones.
