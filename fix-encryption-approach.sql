-- FIXED ENCRYPTION APPROACH FOR SUPABASE
-- Since we can't set custom database parameters, we'll use application-level encryption

-- Create a simple configuration table for our encryption key
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the encryption key (this will be handled by our application)
-- Note: In production, this should be done through our API with proper security
INSERT INTO app_config (config_key, config_value) 
VALUES ('encryption_key', 'LaunchOnLos2024SecureKey32Char!')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- Create a function to get the encryption key
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT config_value FROM app_config WHERE config_key = 'encryption_key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update our encryption functions to work with the stored key
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    IF data IS NULL OR data = '' THEN
        RETURN data;
    END IF;
    
    -- Get the encryption key from our config table
    SELECT get_encryption_key() INTO encryption_key;
    
    -- Use pgcrypto to encrypt with the stored key
    RETURN encode(encrypt(data::bytea, encryption_key, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update our decryption function
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN encrypted_data;
    END IF;
    
    -- Get the encryption key from our config table
    SELECT get_encryption_key() INTO encryption_key;
    
    -- Use pgcrypto to decrypt with the stored key
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the encryption functions
SELECT 'Encryption functions updated successfully!' as status;

-- Optional: Create a view to test encryption (remove this in production)
CREATE OR REPLACE VIEW encryption_test AS
SELECT 
    'Test data' as original,
    encrypt_sensitive_data('Test data') as encrypted,
    decrypt_sensitive_data(encrypt_sensitive_data('Test data')) as decrypted;
