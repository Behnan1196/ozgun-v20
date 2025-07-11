-- Run this in Supabase SQL Editor to check web_push_subscriptions table status

-- Check if table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'web_push_subscriptions' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'web_push_subscriptions';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'web_push_subscriptions';

-- Check if there are any existing subscriptions
SELECT 
    COUNT(*) as subscription_count,
    COUNT(DISTINCT user_id) as unique_users
FROM public.web_push_subscriptions; 