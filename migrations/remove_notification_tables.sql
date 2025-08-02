-- Migration: Remove notification-related tables
-- This migration removes all tables and data related to the notification system

-- Drop notification-related tables if they exist
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS web_push_subscriptions CASCADE;

-- Drop any related indexes
DROP INDEX IF EXISTS idx_device_tokens_user_id;
DROP INDEX IF EXISTS idx_device_tokens_token;
DROP INDEX IF EXISTS idx_notification_logs_user_id;
DROP INDEX IF EXISTS idx_notification_logs_created_at;
DROP INDEX IF EXISTS idx_web_push_subscriptions_user_id;
DROP INDEX IF EXISTS idx_web_push_subscriptions_endpoint;

-- Drop any related triggers
DROP TRIGGER IF EXISTS update_device_tokens_updated_at ON device_tokens;
DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs;
DROP TRIGGER IF EXISTS update_web_push_subscriptions_updated_at ON web_push_subscriptions;

-- Drop any related functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Log the migration
SELECT 'Notification tables removed successfully' as migration_status; 