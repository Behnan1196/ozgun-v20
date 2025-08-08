-- Add settings columns to user_profiles table (SAFE VERSION)
-- This migration adds the missing columns for user settings functionality
-- Fixed: Removed problematic avatar_url index that could exceed size limits

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column';
    ELSE
        RAISE NOTICE 'avatar_url column already exists';
    END IF;
END $$;

-- Add theme column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'theme') THEN
        ALTER TABLE user_profiles ADD COLUMN theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));
        RAISE NOTICE 'Added theme column';
    ELSE
        RAISE NOTICE 'theme column already exists';
    END IF;
END $$;

-- Add language column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'language') THEN
        ALTER TABLE user_profiles ADD COLUMN language TEXT DEFAULT 'tr';
        RAISE NOTICE 'Added language column';
    ELSE
        RAISE NOTICE 'language column already exists';
    END IF;
END $$;

-- Add notifications_enabled column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE user_profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added notifications_enabled column';
    ELSE
        RAISE NOTICE 'notifications_enabled column already exists';
    END IF;
END $$;

-- Add email_notifications column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'email_notifications') THEN
        ALTER TABLE user_profiles ADD COLUMN email_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added email_notifications column';
    ELSE
        RAISE NOTICE 'email_notifications column already exists';
    END IF;
END $$;

-- Note: No index on avatar_url due to potential large size (base64 images can exceed 8KB index limit)
-- Avatar URLs are typically queried by user ID which already has an index

-- Show the updated table structure
SELECT 'User settings columns migration completed successfully' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('avatar_url', 'theme', 'language', 'notifications_enabled', 'email_notifications')
ORDER BY column_name;
