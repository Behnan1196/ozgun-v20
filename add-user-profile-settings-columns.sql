-- Add User Profile Settings Columns
-- Date: December 26, 2024
-- Purpose: Add columns to support user settings functionality

-- Add avatar_url column for profile pictures
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add theme preference column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'system' 
CHECK (theme IN ('light', 'dark', 'system'));

-- Add language preference column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'tr' 
CHECK (language IN ('tr', 'en'));

-- Add notification preference columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add updated_at timestamp if not exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have default values
UPDATE user_profiles 
SET 
    theme = 'system',
    language = 'tr',
    notifications_enabled = true,
    email_notifications = true,
    updated_at = CURRENT_TIMESTAMP
WHERE theme IS NULL 
   OR language IS NULL 
   OR notifications_enabled IS NULL 
   OR email_notifications IS NULL;

-- Add comments to columns
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL or base64 data for user profile picture';
COMMENT ON COLUMN user_profiles.theme IS 'User theme preference: light, dark, or system';
COMMENT ON COLUMN user_profiles.language IS 'User language preference: tr (Turkish) or en (English)';
COMMENT ON COLUMN user_profiles.notifications_enabled IS 'Enable/disable general notifications';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN user_profiles.updated_at IS 'Timestamp of last profile update'; 