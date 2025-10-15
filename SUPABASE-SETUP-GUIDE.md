# 🗄️ Supabase Database Setup Guide

## **Step 1: Create Your Supabase Project**

1. **Complete the current form** on the Supabase dashboard:
   - ✅ **Organization**: "launch on los" (already selected)
   - ✅ **Project name**: "Launch On Los" (perfect!)
   - ✅ **Compute size**: "MICRO" (fine for now, upgrade later)
   - 🔐 **Database password**: Click "Generate a password" and **SAVE IT SECURELY**
   - ✅ **Region**: "Americas" (good for US users)

2. **Click "Create project"** - this takes 2-3 minutes

## **Step 2: Get Your Project Credentials**

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xyz.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...` - **KEEP THIS SECRET!**)

## **Step 3: Set Up Environment Variables**

Create a `.env.local` file in your `minimal-repo` directory:

```bash
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DATABASE ENCRYPTION (generate a 32-character random string)
DATABASE_ENCRYPTION_KEY=your_32_character_encryption_key_here

# SECURITY
JWT_SECRET=your_jwt_secret_for_admin_sessions
ENCRYPTION_SECRET=your_encryption_secret_for_sensitive_data

# ADMIN WALLETS
ADMIN_WALLETS=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW

# BACKUP CONFIGURATION
BACKUP_ENCRYPTION_KEY=your_backup_encryption_key
BACKUP_STORAGE_PATH=./data/backups
```

## **Step 4: Set Up Database Schema**

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` (created in your project)
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- ✅ User profiles table with encryption
- ✅ Beta applications table
- ✅ Access grants table
- ✅ Admin users table
- ✅ Activity logs table
- ✅ Row Level Security (RLS) policies
- ✅ Encryption functions
- ✅ Default admin user (your wallet)

## **Step 5: Install Supabase Dependencies**

Run these commands in your `minimal-repo` directory:

```bash
npm install @supabase/supabase-js
```

## **Step 6: Configure Database Encryption**

1. Go to **Settings** → **Database**
2. Set the encryption key:
   ```sql
   ALTER DATABASE postgres SET app.encryption_key = 'your_32_character_encryption_key_here';
   ```

## **Step 7: Test Your Setup**

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to your admin dashboard: `http://localhost:3000/admin`

3. Navigate to the **Database Manager** tab

4. You should see:
   - ✅ Database statistics
   - ✅ User profiles
   - ✅ Beta applications
   - ✅ Backup functionality

## **Step 8: Security Configuration**

### **Row Level Security (RLS)**
The schema includes RLS policies that ensure:
- Users can only see their own data
- Admins can see all data
- Sensitive operations are logged

### **Data Encryption**
- User bios are encrypted at rest
- Wallet addresses are hashed for privacy
- All data access is logged for audit

### **Admin Permissions**
Your wallet (`86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW`) is set as super admin with full permissions.

## **Step 9: Production Deployment**

### **Environment Variables for Production**
Add these to your Vercel deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_ENCRYPTION_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_jwt_secret_for_admin_sessions
ENCRYPTION_SECRET=your_encryption_secret_for_sensitive_data
ADMIN_WALLETS=86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW
```

### **Backup Strategy**
- Automated daily backups
- Encrypted backup storage
- Point-in-time recovery
- Cross-region replication (optional)

## **Database Features**

### **🔒 Security Features**
- Row Level Security (RLS) policies
- Data encryption at rest
- Audit logging for all access
- Admin role-based permissions
- Rate limiting protection

### **📊 Analytics & Monitoring**
- User statistics views
- Application review metrics
- Database performance monitoring
- Access pattern analysis

### **🔄 Backup & Recovery**
- Automated daily backups
- Point-in-time recovery
- Data export functionality
- Backup integrity verification

### **👥 User Management**
- Encrypted user profiles
- Social media integration
- Profile picture & banner support
- Verification levels
- Privacy controls

### **📝 Application Workflow**
- Beta access applications
- Admin review system
- Status tracking
- Custom messages
- Locked page requests

## **Troubleshooting**

### **Common Issues:**

1. **"Invalid API key"**
   - Check your environment variables
   - Ensure no extra spaces or quotes

2. **"RLS policy violation"**
   - Verify admin wallet is in admin_users table
   - Check RLS policies are enabled

3. **"Encryption key not set"**
   - Set the encryption key in database settings
   - Restart your application

4. **"Connection timeout"**
   - Check Supabase project status
   - Verify network connectivity

### **Support:**
- Supabase Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

## **Next Steps**

Once your database is set up:

1. ✅ Test the beta signup flow
2. ✅ Create test user profiles
3. ✅ Review applications in admin dashboard
4. ✅ Set up automated backups
5. ✅ Configure monitoring alerts
6. ✅ Test data export functionality

Your database is now ready for production use with enterprise-grade security! 🚀
