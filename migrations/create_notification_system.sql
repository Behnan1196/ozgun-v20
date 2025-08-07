-- Migration: Create notification system tables
-- This migration creates tables for managing push notification tokens and logs

-- Create notification_tokens table
CREATE TABLE IF NOT EXISTS notification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type TEXT NOT NULL CHECK (token_type IN ('expo', 'fcm', 'apns')),
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active token per user per platform
    UNIQUE(user_id, platform, token_type)
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    data JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_active ON notification_tokens(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notification_tokens updated_at
CREATE TRIGGER update_notification_tokens_updated_at 
    BEFORE UPDATE ON notification_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_tokens
CREATE POLICY "Users can view their own tokens" ON notification_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" ON notification_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON notification_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" ON notification_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Only system/service role can insert notification logs
CREATE POLICY "Service role can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update notification logs" ON notification_logs
    FOR UPDATE USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_tokens TO authenticated;
GRANT SELECT ON notification_logs TO authenticated;

-- Grant permissions to service role for notification logs
GRANT ALL ON notification_logs TO service_role;

-- Log the migration
SELECT 'Notification system tables created successfully' as migration_status;
