-- Fix RLS policies for notification system
-- This migration adds proper RLS policies for API access

-- Add policy for service role to access notification_tokens
CREATE POLICY "Service role can manage notification tokens" ON notification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Add policy for anon role to insert/update notification tokens (for API endpoints)
CREATE POLICY "API can manage notification tokens" ON notification_tokens
    FOR ALL USING (auth.role() = 'anon');

-- Add policy for authenticated users to manage their own tokens
CREATE POLICY "Users can manage their own notification tokens" ON notification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Add policy for service role to access notification_logs  
CREATE POLICY "Service role can manage notification logs" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Add policy for anon role to insert notification logs (for webhook)
CREATE POLICY "API can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Grant additional permissions
GRANT ALL ON notification_tokens TO anon;
GRANT ALL ON notification_tokens TO service_role;
GRANT ALL ON notification_logs TO anon;
GRANT ALL ON notification_logs TO service_role;

-- Log the migration
SELECT 'Notification RLS policies fixed successfully' as migration_status;
