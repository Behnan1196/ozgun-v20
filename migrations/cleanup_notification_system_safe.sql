-- Migration: Safe cleanup of existing notification system
-- This migration safely removes any existing notification-related objects
-- and ensures a clean slate for the new robust notification system

-- First, check what exists and clean it up safely
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop any existing notification-related tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%notification%') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop any existing device/token tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND (
        tablename LIKE '%device_token%' OR 
        tablename LIKE '%web_push%' OR 
        tablename LIKE '%push_token%' OR 
        tablename = 'user_push_tokens'
    )) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop user_activity table (was used by old notification system for activity tracking)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        DROP TABLE IF EXISTS user_activity CASCADE;
        RAISE NOTICE 'Dropped user_activity table (was used by old notification system)';
    END IF;
    
    -- Keep video_call_invites table as it's part of the new system
    -- But ensure it has the correct structure by dropping and recreating it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'video_call_invites') THEN
        DROP TABLE IF EXISTS video_call_invites CASCADE;
        RAISE NOTICE 'Dropped existing video_call_invites table (will be recreated with correct structure)';
    END IF;
    
    -- Drop only our custom functions (avoid system functions)
    FOR r IN (
        SELECT proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND (proname LIKE '%notification%' OR proname = 'update_updated_at_column')
        AND proname NOT LIKE 'pg_%'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.proname;
    END LOOP;
    
    RAISE NOTICE 'Notification system cleanup completed successfully';
END $$;

-- Log the cleanup
SELECT 'Safe notification system cleanup completed' as cleanup_status;
