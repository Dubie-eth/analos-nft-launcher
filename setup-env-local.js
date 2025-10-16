#!/usr/bin/env node

/**
 * SETUP ENVIRONMENT VARIABLES
 * Creates .env.local file with proper Supabase configuration
 */

const fs = require('fs');
const path = require('path');

const envContent = `# SUPABASE CONFIGURATION
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
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file successfully!');
  console.log('');
  console.log('🔑 NEXT STEPS:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/cdbcrfmlhwgtgngkuibk');
  console.log('2. Go to Settings → API');
  console.log('3. Copy your "anon public" key and replace "your_supabase_anon_key_here"');
  console.log('4. Copy your "service_role" key and replace "your_supabase_service_role_key_here"');
  console.log('5. Save the .env.local file');
  console.log('');
  console.log('⚠️  IMPORTANT: Never commit .env.local to git!');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  process.exit(1);
}
