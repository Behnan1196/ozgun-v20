-- Migration: Complete cleanup of existing notification system
-- This migration removes all existing notification tables, functions, triggers, and policies
-- to prepare for the new robust notification system

-- Drop existing notification tables and all their dependencies (IF EXISTS prevents errors)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_tokens CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS web_push_subscriptions CASCADE;

-- Drop any related indexes
DROP INDEX IF EXISTS idx_notification_tokens_user_id;
DROP INDEX IF EXISTS idx_notification_tokens_active;
DROP INDEX IF EXISTS idx_notification_logs_user_id;
DROP INDEX IF EXISTS idx_notification_logs_created_at;
DROP INDEX IF EXISTS idx_notification_logs_status;
DROP INDEX IF EXISTS idx_device_tokens_user_id;
DROP INDEX IF EXISTS idx_device_tokens_token;
DROP INDEX IF EXISTS idx_web_push_subscriptions_user_id;
DROP INDEX IF EXISTS idx_web_push_subscriptions_endpoint;

-- Drop any related triggers
DROP TRIGGER IF EXISTS update_notification_tokens_updated_at ON notification_tokens;
DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs;
DROP TRIGGER IF EXISTS update_device_tokens_updated_at ON device_tokens;
DROP TRIGGER IF EXISTS update_web_push_subscriptions_updated_at ON web_push_subscriptions;

-- Drop any related functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop any notification-related policies (only if tables exist)
DO $$ 
BEGIN
    -- Drop policies only if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_tokens') THEN
        DROP POLICY IF EXISTS "Users can view their own tokens" ON notification_tokens;
        DROP POLICY IF EXISTS "Users can insert their own tokens" ON notification_tokens;
        DROP POLICY IF EXISTS "Users can update their own tokens" ON notification_tokens;
        DROP POLICY IF EXISTS "Users can delete their own tokens" ON notification_tokens;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
        DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
        DROP POLICY IF EXISTS "Service role can insert notification logs" ON notification_logs;
        DROP POLICY IF EXISTS "Service role can update notification logs" ON notification_logs;
    END IF;
END $$;

-- Log the cleanup
SELECT 'Old notification system completely cleaned up' as cleanup_status;
