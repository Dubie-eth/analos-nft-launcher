-- SUPABASE DATABASE SCHEMA FOR ANALOS NFT LAUNCHPAD
-- Secure user profiles, applications, and access management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE verification_level AS ENUM ('none', 'basic', 'enhanced', 'verified');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');
CREATE TYPE access_level AS ENUM ('public', 'beta_user', 'premium_user', 'creator', 'admin');
CREATE TYPE activity_type AS ENUM ('read', 'write', 'delete', 'export');
CREATE TYPE resource_type AS ENUM ('user_profile', 'application', 'access_grant', 'backup');

-- Users table (encrypted sensitive data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    wallet_address_hash TEXT GENERATED ALWAYS AS (encode(digest(wallet_address, 'sha256'), 'hex')) STORED,
    username TEXT NOT NULL,
    bio TEXT, -- Will be encrypted
    profile_picture_url TEXT,
    banner_image_url TEXT,
    socials JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level verification_level DEFAULT 'none',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Privacy controls
    privacy_level TEXT DEFAULT 'private',
    allow_data_export BOOLEAN DEFAULT TRUE,
    allow_analytics BOOLEAN DEFAULT TRUE
);

-- Beta applications table
CREATE TABLE beta_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    username TEXT NOT NULL,
    bio TEXT, -- Will be encrypted
    socials JSONB DEFAULT '{}',
    profile_picture_url TEXT,
    banner_image_url TEXT,
    status application_status DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    review_notes TEXT,
    access_level access_level DEFAULT 'beta_user',
    rejection_reason TEXT,
    custom_message TEXT,
    locked_page_requested TEXT,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    application_data JSONB DEFAULT '{}'
);

-- Access grants table
CREATE TABLE access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    access_level access_level NOT NULL,
    granted_by TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Conditions
    conditions JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT
);

-- User activities table (audit trail)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    activity TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Activity categorization
    activity_type TEXT,
    resource_id TEXT,
    resource_type resource_type
);

-- Data access logs (privacy audit trail)
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accessed_by TEXT NOT NULL,
    access_type activity_type NOT NULL,
    resource_type resource_type NOT NULL,
    resource_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    reason TEXT NOT NULL,
    authorized_by TEXT,
    
    -- Additional context
    session_id TEXT,
    request_id TEXT
);

-- Database backups table
CREATE TABLE database_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'full', 'incremental', 'user_profiles', 'applications', 'access_grants'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    
    -- Backup metadata
    backup_data JSONB DEFAULT '{}',
    created_by TEXT NOT NULL
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL, -- 'super_admin', 'admin', 'moderator', 'support'
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_wallet_hash ON users(wallet_address_hash);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_verification_level ON users(verification_level);

CREATE INDEX idx_applications_status ON beta_applications(status);
CREATE INDEX idx_applications_applied_at ON beta_applications(applied_at);
CREATE INDEX idx_applications_wallet_address ON beta_applications(wallet_address);
CREATE INDEX idx_applications_reviewed_by ON beta_applications(reviewed_by);

CREATE INDEX idx_access_grants_user_id ON access_grants(user_id);
CREATE INDEX idx_access_grants_wallet_address ON access_grants(wallet_address);
CREATE INDEX idx_access_grants_active ON access_grants(is_active);
CREATE INDEX idx_access_grants_expires_at ON access_grants(expires_at);

CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_wallet_address ON user_activities(wallet_address);
CREATE INDEX idx_activities_timestamp ON user_activities(timestamp);
CREATE INDEX idx_activities_type ON user_activities(activity_type);

CREATE INDEX idx_access_logs_accessed_by ON data_access_logs(accessed_by);
CREATE INDEX idx_access_logs_timestamp ON data_access_logs(timestamp);
CREATE INDEX idx_access_logs_resource_type ON data_access_logs(resource_type);

CREATE INDEX idx_backups_type ON database_backups(type);
CREATE INDEX idx_backups_created_at ON database_backups(created_at);
CREATE INDEX idx_backups_status ON database_backups(status);

CREATE INDEX idx_admin_users_wallet_address ON admin_users(wallet_address);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_active = TRUE
        )
    );

-- RLS Policies for applications table
CREATE POLICY "Users can view their own applications" ON beta_applications
    FOR SELECT USING (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Users can create applications" ON beta_applications
    FOR INSERT WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

CREATE POLICY "Admins can view all applications" ON beta_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can update applications" ON beta_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE wallet_address = auth.jwt() ->> 'wallet_address' 
            AND is_active = TRUE
        )
    );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    IF data IS NULL OR data = '' THEN
        RETURN data;
    END IF;
    
    -- Use pgcrypto to encrypt with application secret
    RETURN encode(encrypt(data::bytea, current_setting('app.encryption_key'), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN encrypted_data;
    END IF;
    
    -- Use pgcrypto to decrypt with application secret
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), current_setting('app.encryption_key'), 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user (replace with your actual wallet address)
INSERT INTO admin_users (wallet_address, username, role, permissions) VALUES
(
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    'Main Admin',
    'super_admin',
    '{
        "canViewProfiles": true,
        "canEditProfiles": true,
        "canDeleteProfiles": true,
        "canViewApplications": true,
        "canApproveApplications": true,
        "canRejectApplications": true,
        "canGrantAccess": true,
        "canRevokeAccess": true,
        "canViewBackups": true,
        "canCreateBackups": true,
        "canExportData": true,
        "canViewLogs": true,
        "canManageAdmins": true
    }'::jsonb
);

-- Create a view for application statistics
CREATE VIEW application_stats AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (reviewed_at - applied_at))/3600) as avg_review_time_hours
FROM beta_applications
WHERE applied_at >= NOW() - INTERVAL '30 days'
GROUP BY status;

-- Create a view for user statistics
CREATE VIEW user_stats AS
SELECT 
    verification_level,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month
FROM users
GROUP BY verification_level;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE users IS 'Encrypted user profiles with privacy controls';
COMMENT ON TABLE beta_applications IS 'Beta access applications with review workflow';
COMMENT ON TABLE access_grants IS 'User access permissions and grants';
COMMENT ON TABLE user_activities IS 'Audit trail of user actions';
COMMENT ON TABLE data_access_logs IS 'Privacy audit trail for data access';
COMMENT ON TABLE database_backups IS 'Automated backup tracking';
COMMENT ON TABLE admin_users IS 'Admin user management with role-based permissions';
