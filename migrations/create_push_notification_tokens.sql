-- Create push_notification_tokens table for mobile app tokens
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'expo', -- 'expo', 'fcm', 'apns'
    platform TEXT NOT NULL, -- 'ios', 'android'
    device_name TEXT,
    model_name TEXT,
    os_version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active token per user per platform
    UNIQUE(user_id, platform, token_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active 
ON push_notification_tokens(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_tokens_type_active 
ON push_notification_tokens(token_type, is_active) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own push tokens" 
ON push_notification_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- Allow coordinators/admins to read all tokens for notifications
CREATE POLICY "Coordinators can read all push tokens" 
ON push_notification_tokens 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('coordinator', 'admin')
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_notification_tokens;
CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_notification_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_push_token_updated_at();

-- Grant permissions
GRANT ALL ON push_notification_tokens TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;