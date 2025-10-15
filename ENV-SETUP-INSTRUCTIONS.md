# ENVIRONMENT SETUP INSTRUCTIONS

## Create .env.local file in minimal-repo directory

Copy this content into a new file called `.env.local`:

```bash
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=https://cdbcrfmlhwgtgngkuibk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# DATABASE ENCRYPTION (32-character key for data encryption)
DATABASE_ENCRYPTION_KEY=LaunchOnLos2024SecureKey32Char!

# SECURITY
JWT_SECRET=LaunchOnLos_JWT_Secret_Key_2024_Secure
ENCRYPTION_SECRET=LaunchOnLos_Encryption_Secret_2024

# ADMIN WALLETS
ADMIN_WALLETS=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW

# BACKUP CONFIGURATION
BACKUP_ENCRYPTION_KEY=LaunchOnLos_Backup_Key_2024_Secure
BACKUP_STORAGE_PATH=./data/backups

# ANALOS CONFIGURATION
NEXT_PUBLIC_ANALOS_RPC_URL=https://rpc.analos.io
NEXT_PUBLIC_ANALOS_EXPLORER_URL=https://explorer.analos.io

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# LOGGING
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

## Steps:
1. Open your minimal-repo folder
2. Create a new file called `.env.local`
3. Copy the content above into the file
4. Save the file

This will configure your Supabase connection and security settings.
