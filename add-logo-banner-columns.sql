-- Add logo_url and banner_url columns to saved_collections table
-- This migration adds the missing columns that the API is trying to use

-- Add logo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_collections' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.saved_collections ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Add banner_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'saved_collections' 
        AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE public.saved_collections ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- Add comments for the new columns
COMMENT ON COLUMN public.saved_collections.logo_url IS 'URL of the collection logo image';
COMMENT ON COLUMN public.saved_collections.banner_url IS 'URL of the collection banner image';

-- Success message
SELECT 'Logo and banner URL columns added successfully to saved_collections table!' as status;
