-- Migration: Create robust notification system
-- This migration creates a clean, focused notification system for video call invites
-- and future chat message notifications

-- Create notification_tokens table (simplified and robust)
CREATE TABLE notification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('expo', 'fcm', 'apns')),
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_info JSONB DEFAULT '{}', -- Store device details like model, OS version, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique token per user per platform
    UNIQUE(user_id, token, platform)
);

-- Create notification_logs table (simplified)
CREATE TABLE notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('video_invite', 'chat_message')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')), -- Web notifications disabled
    token_type TEXT NOT NULL CHECK (token_type IN ('expo', 'fcm', 'apns')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notification_tokens_user_platform ON notification_tokens(user_id, platform, is_active);
CREATE INDEX idx_notification_tokens_active ON notification_tokens(is_active, last_used_at) WHERE is_active = true;
CREATE INDEX idx_notification_logs_user_type ON notification_logs(user_id, notification_type, created_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status, created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_tokens updated_at
CREATE TRIGGER trigger_notification_tokens_updated_at 
    BEFORE UPDATE ON notification_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notification_tokens_updated_at();

-- Enable Row Level Security
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_tokens
CREATE POLICY "Users can manage their own tokens" ON notification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all notification data
CREATE POLICY "Service role can manage all notification tokens" ON notification_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all notification logs" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON notification_tokens TO authenticated;
GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_tokens TO service_role;
GRANT ALL ON notification_logs TO service_role;

-- Create video_call_invites table (for Level 1 functionality)
CREATE TABLE video_call_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_user_name TEXT NOT NULL,
    to_user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for video_call_invites
CREATE INDEX idx_video_call_invites_from_user_id ON video_call_invites(from_user_id);
CREATE INDEX idx_video_call_invites_to_user_id ON video_call_invites(to_user_id);
CREATE INDEX idx_video_call_invites_status ON video_call_invites(status);
CREATE INDEX idx_video_call_invites_expires_at ON video_call_invites(expires_at);
CREATE INDEX idx_video_call_invites_user_pair_status ON video_call_invites(from_user_id, to_user_id, status, expires_at);

-- Enable RLS for video_call_invites
ALTER TABLE video_call_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_call_invites
CREATE POLICY "Users can view their own video call invites" ON video_call_invites
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send video call invites" ON video_call_invites
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can respond to received video call invites" ON video_call_invites
    FOR UPDATE USING (to_user_id = auth.uid()) WITH CHECK (to_user_id = auth.uid());

CREATE POLICY "Users can cancel sent video call invites" ON video_call_invites
    FOR UPDATE USING (from_user_id = auth.uid()) WITH CHECK (from_user_id = auth.uid());

-- Service role can manage all video call invites
CREATE POLICY "Service role can manage all video call invites" ON video_call_invites
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions for video_call_invites
GRANT ALL ON video_call_invites TO authenticated;
GRANT ALL ON video_call_invites TO service_role;

-- Create function to update video_call_invites updated_at
CREATE OR REPLACE FUNCTION update_video_call_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for video_call_invites updated_at
CREATE TRIGGER trigger_video_call_invites_updated_at
    BEFORE UPDATE ON video_call_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_video_call_invites_updated_at();

-- Create function to clean up old inactive tokens
CREATE OR REPLACE FUNCTION cleanup_old_notification_tokens()
RETURNS void AS $$
BEGIN
    -- Remove tokens that haven't been used in 30 days and are inactive
    DELETE FROM notification_tokens 
    WHERE is_active = false 
    AND last_used_at < NOW() - INTERVAL '30 days';
    
    -- Remove old notification logs (keep last 1000 per user)
    DELETE FROM notification_logs 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
            FROM notification_logs
        ) ranked
        WHERE rn > 1000
    );
END;
$$ language 'plpgsql';

-- Log the migration
SELECT 'Robust notification system created successfully' as migration_status;
