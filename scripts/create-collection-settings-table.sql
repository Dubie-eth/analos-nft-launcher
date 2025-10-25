-- Create collection_settings table for founder-managed collection configuration
CREATE TABLE IF NOT EXISTS collection_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id TEXT NOT NULL UNIQUE,
    
    -- Social media links
    socials JSONB DEFAULT '{
        "twitter": "https://x.com/launchonlos",
        "telegram": "https://t.me/launchonlos", 
        "website": "https://launchonlos.fun"
    }'::jsonb,
    
    -- Media assets
    media JSONB DEFAULT '{
        "logo_url": null,
        "banner_url": null
    }'::jsonb,
    
    -- Verification status
    verification JSONB DEFAULT '{
        "is_verified": true,
        "verified_by": "founder",
        "verified_at": null
    }'::jsonb,
    
    -- Whitelist phase configuration
    whitelist_phases JSONB DEFAULT '{
        "team": {"active": true, "mint_limit": 10, "requires_lol": 0},
        "community": {"active": true, "mint_limit": 3, "requires_lol": 1000000},
        "early": {"active": true, "mint_limit": 1, "requires_lol": 100000},
        "public": {"active": true, "mint_limit": 2, "requires_lol": 0}
    }'::jsonb,
    
    -- NFT reveal settings
    reveal_settings JSONB DEFAULT '{
        "auto_reveal": true,
        "reveal_delay_hours": 0,
        "placeholder_image": null
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT,
    
    -- Constraints
    CONSTRAINT valid_collection_id CHECK (collection_id ~ '^[a-z0-9-]+$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collection_settings_collection_id ON collection_settings(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_settings_updated_at ON collection_settings(updated_at);

-- Insert default settings for Los Bros collection
INSERT INTO collection_settings (collection_id, updated_by) 
VALUES ('los-bros', '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW')
ON CONFLICT (collection_id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE collection_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Allow public read access to collection settings
CREATE POLICY "Allow public read access to collection settings" ON collection_settings
    FOR SELECT USING (true);

-- 2. Only allow collection founder to insert/update settings
CREATE POLICY "Allow founder to manage collection settings" ON collection_settings
    FOR ALL USING (
        updated_by = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
        OR auth.uid()::text = '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'
    );

-- Grant permissions
GRANT SELECT ON collection_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON collection_settings TO authenticated;

-- Add helpful comments
COMMENT ON TABLE collection_settings IS 'Collection configuration managed by collection founders';
COMMENT ON COLUMN collection_settings.collection_id IS 'Unique identifier for the collection (e.g., los-bros)';
COMMENT ON COLUMN collection_settings.socials IS 'Social media links (twitter, telegram, website, discord)';
COMMENT ON COLUMN collection_settings.media IS 'Collection media assets (logo_url, banner_url)';
COMMENT ON COLUMN collection_settings.verification IS 'Verification status and metadata';
COMMENT ON COLUMN collection_settings.whitelist_phases IS 'Whitelist phase configuration (active, mint_limit, requires_lol)';
COMMENT ON COLUMN collection_settings.reveal_settings IS 'NFT reveal configuration (auto_reveal, delay, placeholder)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collection_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_collection_settings_updated_at_trigger ON collection_settings;
CREATE TRIGGER update_collection_settings_updated_at_trigger
    BEFORE UPDATE ON collection_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_settings_updated_at();

-- Verification queries
SELECT 'Collection settings table created successfully' as status;

-- Show the default Los Bros settings
SELECT 
    collection_id,
    socials,
    verification,
    whitelist_phases,
    created_at
FROM collection_settings 
WHERE collection_id = 'los-bros';
